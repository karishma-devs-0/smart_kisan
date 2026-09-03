"""
Trains the field-monitoring classifiers and exports TFLite models.

Two tasks, matching the modes in WeedDetectionHomeScreen:

  --task gog   Green-on-Green: which weed species is present.
               Source: DeepWeeds (weedDetection/data), 9 classes.

  --task yog   Yellow-on-Green: is the canopy showing chlorosis / stress.
               Source: the PlantVillage split already on disk at
               plantDetection/_split, remapped to healthy / chlorosis /
               other_stress.

Both mirror plantDetection/train_model.py: MobileNetV2 backbone, two-phase
schedule (frozen head, then fine-tune the last 30 layers), .keras + .tflite
export. One inference path in the app, one deployment pattern.

RESUMABILITY
------------
This machine runs with very little free RAM (other applications routinely hold
12+ GB of the 15 GB), and TensorFlow gets killed mid-epoch when it asks for a
spike. Two earlier runs died silently that way and lost everything. So the model
and a small state file are written after EVERY epoch, and a re-run picks up
where it stopped. A kill now costs one epoch, not the whole run.

Usage:
    .venv/Scripts/python.exe train_weed_model.py --task gog
    .venv/Scripts/python.exe train_weed_model.py --task yog
    .venv/Scripts/python.exe train_weed_model.py --task gog --fresh   # ignore state
"""

import argparse
import csv
import gc
import json
import os
import random

import tensorflow as tf
from tensorflow import keras

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)

# ── GOG: DeepWeeds ───────────────────────────────────────────────────────────
GOG_DIR = os.path.join(HERE, 'data')
GOG_IMAGES = os.path.join(GOG_DIR, 'images')
GOG_LABELS = os.path.join(GOG_DIR, 'labels.csv')

# ── YOG: PlantVillage split already present for the disease model ────────────
YOG_TRAIN = os.path.join(REPO, 'plantDetection', '_split', 'train')
YOG_VALID = os.path.join(REPO, 'plantDetection', '_split', 'valid')

# PlantVillage is labelled by disease, not by nutrient status, so it cannot
# teach "nitrogen deficiency" as such. What it can teach is the visual question
# YOG actually asks of a canopy: is this leaf green and healthy, is it yellowing
# (chlorotic), or is it damaged some other way. Classes below are grouped on the
# dominant symptom.
#
# `chlorosis` = diseases whose primary sign is yellowing/mottling rather than
# discrete dark lesions. Citrus greening and the tomato viruses are the textbook
# cases; Esca produces interveinal chlorosis; rust and Northern Leaf Blight
# produce chlorotic flecking around the lesions.
YOG_CHLOROSIS = {
    'Orange___Haunglongbing_(Citrus_greening)',
    'Tomato___Tomato_Yellow_Leaf_Curl_Virus',
    'Tomato___Tomato_mosaic_virus',
    'Grape___Esca_(Black_Measles)',
    'Corn_(maize)___Common_rust_',
    'Corn_(maize)___Northern_Leaf_Blight',
    'Tomato___Spider_mites Two-spotted_spider_mite',
    'Strawberry___Leaf_scorch',
    'Squash___Powdery_mildew',
    'Cherry_(including_sour)___Powdery_mildew',
}

IMG_SIZE = 224
# Other applications routinely leave under 1 GB free on this machine. A decoded
# image is 224*224*3 float32 (~600 KB) and every buffer multiplies that, so all
# of these stay small and fixed rather than AUTOTUNE.
BATCH_SIZE = 8
SHUFFLE_BUFFER = 1024
MAP_WORKERS = 2
PREFETCH = 1
VALID_FRACTION = 0.2
SEED = 1337


# ─── Data loading ────────────────────────────────────────────────────────────

def load_gog():
    """DeepWeeds: flat image folder + labels.csv."""
    if not os.path.isdir(GOG_IMAGES):
        raise SystemExit(f'Missing {GOG_IMAGES} — extract DeepWeeds images.zip there.')

    rows, missing = [], 0
    with open(GOG_LABELS, newline='', encoding='utf-8') as fh:
        for row in csv.DictReader(fh):
            path = os.path.join(GOG_IMAGES, row['Filename'])
            if os.path.exists(path):
                rows.append((path, row['Species']))
            else:
                missing += 1
    if missing:
        print(f'  note: {missing} labelled files absent, skipped')

    class_names = sorted({s for _, s in rows})
    return stratified_split(rows, VALID_FRACTION, SEED), class_names


def _yog_bucket(folder):
    if folder.endswith('___healthy'):
        return 'healthy'
    if folder in YOG_CHLOROSIS:
        return 'chlorosis'
    return 'other_stress'


def _scan_plantvillage(root):
    pairs = []
    for folder in sorted(os.listdir(root)):
        d = os.path.join(root, folder)
        if not os.path.isdir(d):
            continue
        bucket = _yog_bucket(folder)
        for name in os.listdir(d):
            if name.lower().endswith(('.jpg', '.jpeg', '.png')):
                pairs.append((os.path.join(d, name), bucket))
    return pairs


def load_cofly():
    """In-crop Green-on-Green patches produced by prepare_cofly.py.

    This is the only genuinely green-on-green source available: weeds inside a
    cotton canopy, rather than DeepWeeds' rangeland plants against soil. It is
    small (3.4k patches from 201 UAV frames), so it is meant as a fine-tuning
    stage on top of a DeepWeeds-trained backbone, not a standalone dataset.
    """
    root = os.path.join(HERE, 'data', 'cofly_patches')
    if not os.path.isdir(root):
        raise SystemExit(f'Missing {root} — run prepare_cofly.py first.')

    rows = []
    for folder in sorted(os.listdir(root)):
        d = os.path.join(root, folder)
        if not os.path.isdir(d):
            continue
        for name in os.listdir(d):
            if name.lower().endswith(('.jpg', '.jpeg', '.png')):
                rows.append((os.path.join(d, name), folder))

    class_names = sorted({c for _, c in rows})
    return stratified_split(rows, VALID_FRACTION, SEED), class_names


def load_sorghum():
    """SorghumWeedDataset — Tamil Nadu, India (Mendeley, CC BY).

    The best available match for how this app is actually used. Captured
    handheld at 20-40 cm from the plant across morning and afternoon light,
    sunshine, high wind and light rain, during early crop growth — which is
    both when weeding matters and roughly what a farmer photographing a
    suspect plant will produce.

    Contrast with what shipped before: CoFly is drone imagery from 5 m looking
    straight down, a view no handheld photo will ever resemble, and DeepWeeds
    is Australian rangeland.

    Three classes — crop, grass weed, broadleaf weed. Coarser than naming a
    species, and more useful: herbicide selection turns on grass vs broadleaf,
    so this is the distinction that changes what a farmer does. It also avoids
    the tiny-class problem that made field_bindweed meaningless.

    The authors ship a 7:2:1 split, used as-is. Their split is by photograph,
    so unlike the CoFly patches there is no same-frame leak between train and
    validation.
    """
    root = os.path.join(HERE, 'data', 'sorghum', 'SorghumWeedDataset_Classification')
    if not os.path.isdir(root):
        raise SystemExit(f'Missing {root}')

    pretty = {
        'Class0_Sorghum': 'crop',
        'Class1_Grass': 'grass_weed',
        'Class2_BroadLeafWeed': 'broadleaf_weed',
    }

    def scan(split):
        pairs = []
        base = os.path.join(root, split)
        for folder in sorted(os.listdir(base)):
            d = os.path.join(base, folder)
            if not os.path.isdir(d):
                continue
            label = pretty.get(folder, folder)
            for name in os.listdir(d):
                if name.lower().endswith(('.jpg', '.jpeg', '.png')):
                    pairs.append((os.path.join(d, name), label))
        return pairs

    train = scan('Train')
    valid = scan('Validate')
    class_names = sorted({l for _, l in train})

    rng = random.Random(SEED)
    rng.shuffle(train)
    rng.shuffle(valid)
    return (train, valid), class_names


# DeepWeeds species, mapped onto the three classes the app uses.
#
# All eight named species are broadleaf; DeepWeeds contains no grass class,
# which is why it cannot be used on its own for a grass-vs-broadleaf model.
#
# Five of the eight are serious weeds in India too, not only Australia:
# parthenium (congress grass) and lantana are among the worst invasives on
# Indian farmland, and siam weed, chinee apple and snake weed are all present.
# That is the argument for including them despite the imagery being Australian
# rangeland - they add broadleaf species a farmer here may actually photograph.
DEEPWEEDS_TO_CLASS = {
    'Parthenium': 'broadleaf_weed',
    'Lantana': 'broadleaf_weed',
    'Siam weed': 'broadleaf_weed',
    'Chinee apple': 'broadleaf_weed',
    'Snake weed': 'broadleaf_weed',
    'Parkinsonia': 'broadleaf_weed',
    'Prickly acacia': 'broadleaf_weed',
    'Rubber vine': 'broadleaf_weed',
    # 'Negative' is rangeland background - soil, grass litter, sky. It is not
    # crop and not a weed, and there is no class for it here, so it is dropped
    # rather than forced into one.
}

# Weeds in the CoFly cotton patches, by growth habit.
COFLY_TO_CLASS = {
    'johnson_grass': 'grass_weed',
    'field_bindweed': 'broadleaf_weed',
    'purslane': 'broadleaf_weed',
    # 'background' is bare soil and cotton canopy shot from 5 m. Excluded: it
    # is not a clean crop close-up and would teach the crop class a drone's
    # viewpoint that no handheld photo produces.
}

# How many images each secondary source may contribute per class.
#
# The point of this cap. Sorghum is the only source that matches how the app is
# used - handheld, 20-40 cm, Indian field - and it has about a thousand images
# per class. DeepWeeds alone has 8,163 broadleaf images shot in dry Australian
# rangeland. Added uncapped, four out of five broadleaf examples would share a
# background nothing else in the set has, and the quickest way for the model to
# fit that is to learn the background rather than the plant. It would then score
# well in validation and fail on a photograph taken in a sorghum field.
#
# Capped, they do what they are here for: broaden what a broadleaf weed can look
# like, without any one capture style deciding the class.
#
# MEASURED RESULT - both extra sources made the model worse. Neither is used.
#
# Scored with evaluate_weed_model.py. The middle column is the held-out split
# of the training collection; the last is photographs sharing no camera or
# field with any of it.
#
#     training set              sorghum-test  internet_test  deepweeds-ood
#                                    (431)          (15)           (600)
#     sorghum only (shipped)         97.4%          86.7%          52.5%
#     + CoFly grass                  97.0%          73.3%          29.3%
#     + CoFly + DeepWeeds            97.7%          53.3%             --
#
# Every addition moved the columns in opposite directions, and the best
# sorghum-test score belongs to the worst real-world model.
#
# The deepweeds-ood column was added because internet_test holds 15 images, so
# the gap between 86.7% and 73.3% there is two photographs — too thin to carry
# a conclusion. On 600 images the same ordering holds and the margin widens:
# adding CoFly pushed the model towards answering "grass", and 398 of 600
# broadleaf images were misread that way against 216 before. The last cell is
# empty because a model trained on DeepWeeds cannot be scored against it.
#
# Why each hurt:
#
#   DeepWeeds contributes broadleaf and nothing else, so every image it adds
#   is evidence for one class while carrying a dry rangeland background found
#   nowhere else in the set. Broadleaf was already at 100% recall. It
#   strengthened the class needing no help and grass recall fell from 75% to
#   25% - five grass weeds called broadleaf.
#
#   CoFly is drone imagery shot straight down from 5 m. No handheld photograph
#   resembles that viewpoint, so it teaches a way of seeing the app will never
#   be given, diluting the handheld signal that actually matters.
#
# What this says about the data, not the training: more images do not help if
# they were captured differently from how the app is used. Sorghum works
# because it is handheld at 20-40 cm in an Indian field, which is what a farmer
# produces. The gap worth filling is more of that - and particularly non-
# sorghum crops, since `crop` currently means sorghum and nothing else. Wheat,
# rice and cotton close-ups would help; another rangeland or drone collection
# would not.
#
# Judge any future change by the last column. Validation accuracy rose while
# the model got worse at its job, because validation is drawn from the same
# collections as training.
SECONDARY_CAP_PER_CLASS = 500

# No extra sources by default: both available ones were measured as harmful.
# Kept selectable so the experiment can be repeated against new data.
DEFAULT_SOURCES = ()


def _capped(rows, cap, seed):
    """Take at most `cap` rows per class, chosen deterministically."""
    by_class = {}
    for path, label in rows:
        by_class.setdefault(label, []).append(path)

    out = []
    rng = random.Random(seed)
    for label, paths in sorted(by_class.items()):
        paths = sorted(paths)
        rng.shuffle(paths)
        out += [(p, label) for p in paths[:cap]]
    return out


def load_combined(sources=DEFAULT_SOURCES):
    """Sorghum, widened with capped broadleaf and grass from other sources.

    Built for the complaint the sorghum-only model draws: it was trained on one
    crop, in one district, over one season, so anything outside that looks
    unfamiliar. Every image here is still ground-level, but they now come from
    three collections rather than one.

    Sorghum is taken whole and keeps the authors' own split, which is by
    photograph - so no frame appears in both halves. The other sources are
    capped (see SECONDARY_CAP_PER_CLASS) and split stratified.

    Measured outcome: with no extra sources this is sorghum alone, which is the
    best model available. Both collections that could be added were tried and
    both made real-world accuracy worse - see SECONDARY_CAP_PER_CLASS for the
    numbers and the reasons. The task is kept so the experiment can be re-run
    when genuinely comparable data exists.

    `crop` also still means sorghum, because sorghum is the only source with
    labelled crop close-ups. The model judges "is this the crop" against
    sorghum seedlings, so wheat, rice and cotton close-ups are the single most
    useful thing left to collect.
    """
    parts = {'sorghum': 0, 'deepweeds': 0, 'cofly': 0}

    # ── Sorghum: the core, used in full, split as published ──
    (s_train, s_valid), _ = load_sorghum()
    parts['sorghum'] = len(s_train) + len(s_valid)

    extra = []

    # ── DeepWeeds: broadleaf species diversity ──
    # Off unless asked for; see SECONDARY_CAP_PER_CLASS for what it did.
    if 'deepweeds' in sources and os.path.isdir(GOG_IMAGES) and os.path.exists(GOG_LABELS):
        rows = []
        with open(GOG_LABELS, newline='', encoding='utf-8') as fh:
            for row in csv.DictReader(fh):
                mapped = DEEPWEEDS_TO_CLASS.get(row['Species'])
                if not mapped:
                    continue
                path = os.path.join(GOG_IMAGES, row['Filename'])
                if os.path.exists(path):
                    rows.append((path, mapped))
        capped = _capped(rows, SECONDARY_CAP_PER_CLASS, SEED)
        parts['deepweeds'] = len(capped)
        extra += capped
    elif 'deepweeds' in sources:
        print('  note: DeepWeeds not present, skipping')

    # ── CoFly: the only in-crop grass weed available ──
    # Grass is the weak class on real photographs, so this is the source worth
    # having: johnson grass inside a crop canopy.
    cofly_root = os.path.join(HERE, 'data', 'cofly_patches')
    if 'cofly' in sources and os.path.isdir(cofly_root):
        rows = []
        for folder in sorted(os.listdir(cofly_root)):
            mapped = COFLY_TO_CLASS.get(folder)
            if not mapped:
                continue
            d = os.path.join(cofly_root, folder)
            for name in sorted(os.listdir(d)):
                if name.lower().endswith(('.jpg', '.jpeg', '.png')):
                    rows.append((os.path.join(d, name), mapped))
        capped = _capped(rows, SECONDARY_CAP_PER_CLASS, SEED)
        parts['cofly'] = len(capped)
        extra += capped
    elif 'cofly' in sources:
        print('  note: CoFly patches not present, skipping')

    e_train, e_valid = stratified_split(extra, VALID_FRACTION, SEED)

    train = s_train + e_train
    valid = s_valid + e_valid

    rng = random.Random(SEED)
    rng.shuffle(train)
    rng.shuffle(valid)

    counts = {}
    for _, label in train:
        counts[label] = counts.get(label, 0) + 1
    print('  sources: ' + ', '.join(f'{k}={v}' for k, v in parts.items() if v))
    print('  train by class: ' + ', '.join(f'{k}={v}' for k, v in sorted(counts.items())))

    class_names = sorted({l for _, l in train})
    return (train, valid), class_names


def load_yog():
    """PlantVillage, regrouped into healthy / chlorosis / other_stress.

    Reuses the train|valid split already prepared for the disease model, so the
    two models never disagree about which images were held out.
    """
    if not os.path.isdir(YOG_TRAIN):
        raise SystemExit(f'Missing {YOG_TRAIN} — the PlantVillage split is required.')

    train = _scan_plantvillage(YOG_TRAIN)
    valid = _scan_plantvillage(YOG_VALID)
    class_names = sorted({b for _, b in train})

    rng = random.Random(SEED)
    rng.shuffle(train)
    rng.shuffle(valid)
    return (train, valid), class_names


def stratified_split(rows, valid_fraction, seed):
    """Split per class so each keeps its proportion in both sets."""
    by_class = {}
    for path, label in rows:
        by_class.setdefault(label, []).append(path)

    rng = random.Random(seed)
    train, valid = [], []
    for label, paths in sorted(by_class.items()):
        paths = sorted(paths)
        rng.shuffle(paths)
        cut = int(len(paths) * valid_fraction)
        valid += [(p, label) for p in paths[:cut]]
        train += [(p, label) for p in paths[cut:]]

    rng.shuffle(train)
    rng.shuffle(valid)
    return train, valid


# ─── Pipeline ────────────────────────────────────────────────────────────────

def build_dataset(pairs, class_names, training):
    index = {name: i for i, name in enumerate(class_names)}
    paths = [p for p, _ in pairs]
    labels = [index[s] for _, s in pairs]

    ds = tf.data.Dataset.from_tensor_slices((paths, labels))
    if training:
        ds = ds.shuffle(min(SHUFFLE_BUFFER, len(paths)), seed=SEED,
                        reshuffle_each_iteration=True)

    def decode(path, label):
        img = tf.io.decode_image(tf.io.read_file(path), channels=3,
                                 expand_animations=False)
        img = tf.image.resize(img, (IMG_SIZE, IMG_SIZE))
        return img, tf.one_hot(label, len(class_names))

    ds = ds.map(decode, num_parallel_calls=MAP_WORKERS)

    if training:
        # Neither weeds nor leaves have a canonical orientation, and field light
        # varies widely, so flips and mild photometric jitter are safe. No crop
        # or shear: those change apparent leaf shape, which is the signal.
        def augment(img, label):
            img = tf.image.random_flip_left_right(img)
            img = tf.image.random_flip_up_down(img)
            img = tf.image.random_brightness(img, 0.2 * 255)
            img = tf.image.random_contrast(img, 0.8, 1.2)
            return tf.clip_by_value(img, 0.0, 255.0), label

        ds = ds.map(augment, num_parallel_calls=MAP_WORKERS)

    ds = ds.map(lambda x, y: (keras.applications.mobilenet_v2.preprocess_input(x), y),
                num_parallel_calls=MAP_WORKERS)
    return ds.batch(BATCH_SIZE).prefetch(PREFETCH)


def compute_class_weights(pairs, class_names):
    """Inverse frequency. GOG is 52% Negative and YOG is dominated by
    other_stress, so without this both collapse to the majority class."""
    counts = {name: 0 for name in class_names}
    for _, label in pairs:
        counts[label] += 1
    total = sum(counts.values())
    n = len(class_names)
    return {i: (total / (n * counts[name]) if counts[name] else 0.0)
            for i, name in enumerate(class_names)}


def build_model(num_classes, init_from=None):
    """MobileNetV2 + a fresh classification head.

    `init_from` names another trained task whose backbone should be reused
    instead of plain ImageNet weights. That is the point of the CoFly stage:
    ImageNet knows about objects in general, DeepWeeds has already learned what
    weed foliage looks like under field light, and CoFly is only 3.4k patches —
    far too few to learn those features from scratch. Starting from the
    DeepWeeds backbone means CoFly only has to teach the harder, narrower
    thing: separating weed from crop when both are green.

    The head is always new, because the class sets differ (9 rangeland species
    vs 4 in-crop labels).
    """
    if init_from:
        src = os.path.join(HERE, 'model', init_from, 'best.keras')
        if not os.path.exists(src):
            raise SystemExit(f'--init-from {init_from}: {src} not found')
        print(f'  initialising backbone from {init_from} ({src})')
        source_model = keras.models.load_model(src)
        base = source_model.layers[0]
    else:
        base = keras.applications.MobileNetV2(
            input_shape=(IMG_SIZE, IMG_SIZE, 3), include_top=False, weights='imagenet')

    base.trainable = False
    model = keras.Sequential([
        base,
        keras.layers.GlobalAveragePooling2D(),
        keras.layers.Dropout(0.3),
        keras.layers.Dense(num_classes, activation='softmax'),
    ])
    return model, base


# ─── Resumable training ──────────────────────────────────────────────────────

class EpochState(keras.callbacks.Callback):
    """Writes the model and a cursor after every epoch.

    Without this a kill mid-run loses everything — which is exactly what
    happened twice. `save_best_only` is deliberately NOT used here: the point is
    to be able to continue, which needs the latest weights, not the best ones.
    Best weights are tracked separately.
    """

    def __init__(self, out_dir, phase, total_epochs, best_path, state_path):
        super().__init__()
        self.latest = os.path.join(out_dir, 'latest.keras')
        self.best_path = best_path
        self.state_path = state_path
        self.phase = phase
        self.total_epochs = total_epochs
        self.best_acc = _read_state(state_path).get('best_acc', 0.0)

    def on_epoch_end(self, epoch, logs=None):
        logs = logs or {}
        acc = float(logs.get('val_accuracy') or 0.0)
        self.model.save(self.latest)

        if acc > self.best_acc:
            self.best_acc = acc
            self.model.save(self.best_path)

        _write_state(self.state_path, {
            'phase': self.phase,
            'epoch': epoch + 1,
            'total_epochs': self.total_epochs,
            'best_acc': self.best_acc,
            'last_val_acc': acc,
        })
        gc.collect()


def _read_state(path):
    try:
        with open(path, encoding='utf-8') as fh:
            return json.load(fh)
    except Exception:
        return {}


def _write_state(path, state):
    with open(path, 'w', encoding='utf-8') as fh:
        json.dump(state, fh, indent=2)


def run_phase(model, phase, epochs, train_ds, valid_ds, class_weight,
              out_dir, best_path, state_path, start_epoch):
    remaining = epochs - start_epoch
    if remaining <= 0:
        print(f'  phase {phase}: already complete ({start_epoch}/{epochs})')
        return
    print(f'\nPhase {phase}: epochs {start_epoch + 1}..{epochs}')
    model.fit(
        train_ds,
        epochs=epochs,
        initial_epoch=start_epoch,
        validation_data=valid_ds,
        class_weight=class_weight,
        callbacks=[EpochState(out_dir, phase, epochs, best_path, state_path)],
        verbose=1,
    )


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--task', choices=['gog', 'yog', 'cofly', 'sorghum', 'combined'],
                    required=True)
    ap.add_argument('--sources', default=','.join(DEFAULT_SOURCES),
                    help='comma-separated extra sources for --task combined: '
                         'cofly, deepweeds. Sorghum is always included.')
    ap.add_argument('--epochs1', type=int, default=10)
    ap.add_argument('--epochs2', type=int, default=15)
    ap.add_argument('--limit', type=int, default=0, help='cap images (smoke test)')
    ap.add_argument('--fresh', action='store_true', help='ignore saved state')
    ap.add_argument('--init-from', choices=['gog', 'yog'], default=None,
                    help='reuse a trained backbone instead of ImageNet weights')
    args = ap.parse_args()

    out_dir = os.environ.get('SMARTKISAN_WEED_OUTPUT_DIR') or \
        os.path.join(HERE, 'model', args.task)
    os.makedirs(out_dir, exist_ok=True)
    best_path = os.path.join(out_dir, 'best.keras')
    latest_path = os.path.join(out_dir, 'latest.keras')
    state_path = os.path.join(out_dir, 'state.json')

    if args.fresh:
        for p in (best_path, latest_path, state_path):
            if os.path.exists(p):
                os.remove(p)

    tf.random.set_seed(SEED)

    sources = tuple(x.strip() for x in args.sources.split(',') if x.strip())
    loaders = {'gog': load_gog, 'yog': load_yog, 'cofly': load_cofly,
               'sorghum': load_sorghum,
               'combined': lambda: load_combined(sources)}
    (train_pairs, valid_pairs), class_names = loaders[args.task]()

    if args.limit:
        rng = random.Random(SEED)
        rng.shuffle(train_pairs)
        rng.shuffle(valid_pairs)
        train_pairs = train_pairs[: args.limit]
        valid_pairs = valid_pairs[: max(1, args.limit // 4)]

    print('=' * 62)
    print(f'task={args.task}  {len(class_names)} classes  '
          f'{len(train_pairs)} train  {len(valid_pairs)} valid')
    for name in class_names:
        n = sum(1 for _, l in train_pairs if l == name)
        print(f'   {name:<28} {n:>7}')
    print('=' * 62)

    train_ds = build_dataset(train_pairs, class_names, training=True)
    valid_ds = build_dataset(valid_pairs, class_names, training=False)
    class_weight = compute_class_weights(train_pairs, class_names)

    state = _read_state(state_path)
    resume_phase = state.get('phase', 1)
    resume_epoch = state.get('epoch', 0)

    if os.path.exists(latest_path) and state:
        print(f'resuming: phase {resume_phase}, {resume_epoch} epochs done, '
              f'best val_accuracy {state.get("best_acc", 0):.4f}')
        model = keras.models.load_model(latest_path)
        base = model.layers[0]
    else:
        model, base = build_model(len(class_names), init_from=args.init_from)
        resume_phase, resume_epoch = 1, 0

    # ── Phase 1: frozen backbone ──
    if resume_phase == 1:
        base.trainable = False
        model.compile(optimizer=keras.optimizers.Adam(1e-3),
                      loss='categorical_crossentropy', metrics=['accuracy'])
        run_phase(model, 1, args.epochs1, train_ds, valid_ds, class_weight,
                  out_dir, best_path, state_path, resume_epoch)
        resume_epoch = 0  # phase 2 starts fresh

    # ── Phase 2: fine-tune the last 30 layers ──
    base.trainable = True
    for layer in base.layers[:-30]:
        layer.trainable = False
    model.compile(optimizer=keras.optimizers.Adam(1e-5),
                  loss='categorical_crossentropy', metrics=['accuracy'])
    run_phase(model, 2, args.epochs2, train_ds, valid_ds, class_weight,
              out_dir, best_path, state_path, resume_epoch if resume_phase == 2 else 0)

    # ── Export the best weights, not the last ──
    if os.path.exists(best_path):
        model = keras.models.load_model(best_path)

    loss, acc = model.evaluate(valid_ds, verbose=0)

    # Per-class recall. Overall accuracy hides a class the model never gets
    # right — with GOG at 52% Negative, or CoFly's field_bindweed at 50 patches
    # from 14 frames, the headline number can look respectable while a class is
    # effectively unlearned. A spray decision needs that visible.
    n = len(class_names)
    hits = [0] * n
    totals = [0] * n
    for batch_x, batch_y in valid_ds:
        preds = model.predict(batch_x, verbose=0).argmax(axis=1)
        truth = batch_y.numpy().argmax(axis=1)
        for t, p in zip(truth, preds):
            totals[t] += 1
            if t == p:
                hits[t] += 1

    print('\n  per-class recall on the validation split:')
    for i, name in enumerate(class_names):
        if totals[i]:
            pct = 100 * hits[i] / totals[i]
            flag = '   <-- unreliable' if pct < 50 else ''
            print(f'    {name:<18} {pct:5.1f}%  ({hits[i]}/{totals[i]}){flag}')
        else:
            print(f'    {name:<18}    n/a  (no validation samples)')

    keras_out = os.path.join(out_dir, f'{args.task}_model.keras')
    model.save(keras_out)

    converter = tf.lite.TFLiteConverter.from_keras_model(model)
    converter.optimizations = [tf.lite.Optimize.DEFAULT]
    tflite_out = os.path.join(out_dir, f'{args.task}_model.tflite')
    with open(tflite_out, 'wb') as fh:
        fh.write(converter.convert())

    with open(os.path.join(out_dir, 'class_labels.json'), 'w', encoding='utf-8') as fh:
        json.dump(class_names, fh, indent=2)

    print('\n' + '=' * 62)
    print(f'DONE [{args.task}] - validation accuracy: {acc * 100:.1f}%')
    print(f'  {tflite_out} ({os.path.getsize(tflite_out) / 1048576:.1f} MB)')
    print('=' * 62)


if __name__ == '__main__':
    main()
