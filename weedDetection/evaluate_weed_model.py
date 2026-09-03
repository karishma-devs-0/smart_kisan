"""
Measures a weed model against data it was never trained on.

Validation accuracy printed during training is not the number that matters. It
is measured on images from the same collection, taken by the same people with
the same camera on the same days, so it mostly reports how well the model has
memorised that collection. A model can score 97% there and still be useless on
a photograph a farmer takes.

So this evaluates on three sets, in increasing order of honesty:

  sorghum-test   The authors' own held-out split. Never trained on, but the
                 same collection - this is the optimistic number.

  test_pack      Hand-collected photographs, labelled in the filename.

  internet_test  Photographs pulled from the web of weeds a farmer here would
                 actually meet, none of which resemble the training set's
                 camera or conditions. This is the pessimistic number, and the
                 closest thing available to the real thing.

Reports per-class recall rather than accuracy alone. Accuracy hides the failure
that matters: a model that calls everything a weed scores well on a set that is
two-thirds weeds while being worthless, because the question the farmer asks is
"is this a weed or my crop".

Usage:
  .venv/Scripts/python.exe evaluate_weed_model.py                     # shipped model
  .venv/Scripts/python.exe evaluate_weed_model.py --model model/combined/best.keras
  .venv/Scripts/python.exe evaluate_weed_model.py --only internet_test
"""

import argparse
import os
import sys

os.environ.setdefault('TF_CPP_MIN_LOG_LEVEL', '3')

import numpy as np  # noqa: E402
import tensorflow as tf  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
IMG_SIZE = 224

DEFAULT_MODEL = os.path.join(HERE, 'model', 'sorghum', 'best.keras')

GOG_IMAGES = os.path.join(HERE, 'data', 'images')
GOG_LABELS = os.path.join(HERE, 'data', 'labels.csv')

# The three classes the app uses, in the order the model emits them.
CLASSES = ['broadleaf_weed', 'crop', 'grass_weed']

SORGHUM_FOLDER_TO_CLASS = {
    'Class0_Sorghum': 'crop',
    'Class1_Grass': 'grass_weed',
    'Class2_BroadLeafWeed': 'broadleaf_weed',
}


# ─── Test set collection ────────────────────────────────────────────────────

def sorghum_test():
    """The authors' held-out split."""
    root = os.path.join(HERE, 'data', 'sorghum',
                        'SorghumWeedDataset_Classification', 'Test')
    if not os.path.isdir(root):
        return []
    pairs = []
    for folder in sorted(os.listdir(root)):
        label = SORGHUM_FOLDER_TO_CLASS.get(folder)
        if not label:
            continue
        d = os.path.join(root, folder)
        for name in sorted(os.listdir(d)):
            if name.lower().endswith(('.jpg', '.jpeg', '.png')):
                pairs.append((os.path.join(d, name), label))
    return pairs


def _labelled_folder(folder, strip_prefix=None, split_on=None):
    """Images whose expected class is encoded in the filename."""
    root = os.path.join(HERE, folder)
    if not os.path.isdir(root):
        return []
    pairs = []
    for name in sorted(os.listdir(root)):
        if not name.lower().endswith(('.jpg', '.jpeg', '.png')):
            continue
        stem = os.path.splitext(name)[0]
        if strip_prefix and stem.startswith(strip_prefix):
            stem = stem[len(strip_prefix):]
            # EXPECT_broadleaf_weed_1 -> broadleaf_weed
            stem = stem.rsplit('_', 1)[0]
        elif split_on:
            # broadleaf_weed__bindweed -> broadleaf_weed
            stem = stem.split(split_on)[0]
        if stem in CLASSES:
            pairs.append((os.path.join(root, name), stem))
        else:
            print(f'  skipping {name}: cannot read a class from the name')
    return pairs


# CoFly and DeepWeeds as test sets rather than training data.
#
# The shipped model is trained on sorghum alone, so both of these are entirely
# unseen by it, and between them they are two orders of magnitude larger than
# internet_test. That matters: internet_test holds 15 images, so the difference
# between 86.7% and 73.3% there is two photographs. It is the closest set to
# real use and worth reporting, but it cannot carry a conclusion by itself.
#
# CAVEAT. These are only out-of-distribution for a model that did not train on
# them. Scoring a --sources cofly model against cofly-ood measures memorisation,
# not generalisation. The script warns rather than guessing which is the case.

COFLY_TO_CLASS = {
    'johnson_grass': 'grass_weed',
    'field_bindweed': 'broadleaf_weed',
    'purslane': 'broadleaf_weed',
    # 'background' is bare soil and canopy from 5 m, belonging to no class here.
}

# All eight named DeepWeeds species are broadleaf. It therefore tests one class
# only, and a model that answered "broadleaf" to everything would score 100% on
# it — read it alongside the others, never alone.
DEEPWEEDS_SPECIES = {
    'Chinee apple', 'Lantana', 'Parkinsonia', 'Parthenium',
    'Prickly acacia', 'Rubber vine', 'Siam weed', 'Snake weed',
}


def cofly_ood(cap_per_class=400):
    """In-crop patches from UAV frames — a different camera and viewpoint."""
    root = os.path.join(HERE, 'data', 'cofly_patches')
    if not os.path.isdir(root):
        return []
    import random as _random
    rng = _random.Random(1337)
    pairs = []
    for folder in sorted(os.listdir(root)):
        cls = COFLY_TO_CLASS.get(folder)
        if not cls:
            continue
        d = os.path.join(root, folder)
        names = sorted(n for n in os.listdir(d)
                       if n.lower().endswith(('.jpg', '.jpeg', '.png')))
        rng.shuffle(names)
        for n in names[:cap_per_class]:
            pairs.append((os.path.join(d, n), cls))
    return pairs


def deepweeds_ood(cap=600):
    """Australian rangeland species, all broadleaf. Tests one class only."""
    if not (os.path.isdir(GOG_IMAGES) and os.path.exists(GOG_LABELS)):
        return []
    import csv as _csv
    import random as _random
    rows = []
    with open(GOG_LABELS, newline='', encoding='utf-8') as fh:
        for row in _csv.DictReader(fh):
            if row['Species'] not in DEEPWEEDS_SPECIES:
                continue
            path = os.path.join(GOG_IMAGES, row['Filename'])
            if os.path.exists(path):
                rows.append((path, 'broadleaf_weed'))
    rng = _random.Random(1337)
    rng.shuffle(rows)
    return rows[:cap]


SETS = {
    'sorghum-test': sorghum_test,
    'test_pack': lambda: _labelled_folder('test_pack', strip_prefix='EXPECT_'),
    'internet_test': lambda: _labelled_folder('internet_test', split_on='__'),
    'cofly-ood': cofly_ood,
    'deepweeds-ood': deepweeds_ood,
}


# ─── Inference ──────────────────────────────────────────────────────────────

def load_image(path):
    raw = tf.io.read_file(path)
    img = tf.image.decode_image(raw, channels=3, expand_animations=False)
    img = tf.image.resize(img, (IMG_SIZE, IMG_SIZE))
    img = tf.cast(img, tf.float32)
    # The same scaling the training pipeline applies, and the same one the app
    # applies before inference (weedInference.js divides by 127.5 and subtracts
    # 1). Feeding raw 0-255 here instead made the model look worse than chance
    # while reporting 99% confidence - the giveaway that the harness was wrong
    # rather than the model.
    return tf.keras.applications.mobilenet_v2.preprocess_input(img)


def predict_all(model, paths, batch=8):
    """Batched so a large test set does not have to fit in memory at once."""
    out = []
    for i in range(0, len(paths), batch):
        chunk = paths[i:i + batch]
        arr = tf.stack([load_image(p) for p in chunk])
        out.append(model.predict(arr, verbose=0))
    return np.concatenate(out) if out else np.zeros((0, len(CLASSES)))


# ─── Reporting ──────────────────────────────────────────────────────────────

def report(name, pairs, probs, class_names, show_each=False):
    if not pairs:
        print(f'\n{name}: no images found, skipped')
        return None

    truth = [lbl for _, lbl in pairs]
    pred = [class_names[i] for i in probs.argmax(axis=1)]
    conf = probs.max(axis=1) * 100

    correct = sum(t == p for t, p in zip(truth, pred))
    acc = 100 * correct / len(pairs)

    print(f'\n{name}  ({len(pairs)} images)')
    print(f'  accuracy: {acc:.1f}%  ({correct}/{len(pairs)})')

    print('  per-class recall:')
    for c in class_names:
        idx = [i for i, t in enumerate(truth) if t == c]
        if not idx:
            print(f'    {c:16s} no examples')
            continue
        hit = sum(pred[i] == c for i in idx)
        print(f'    {c:16s} {100 * hit / len(idx):5.1f}%  ({hit}/{len(idx)})')

    # Where the errors actually go. "Crop called a weed" and "weed called a
    # crop" have very different consequences for a farmer, and accuracy alone
    # cannot tell them apart.
    print('  confusion (row = truth, col = predicted):')
    header = ' ' * 20 + ''.join(f'{c[:12]:>14s}' for c in class_names)
    print(header)
    for c in class_names:
        row = [sum(1 for i, t in enumerate(truth) if t == c and pred[i] == p)
               for p in class_names]
        print(f'    {c:16s}' + ''.join(f'{v:>14d}' for v in row))

    if show_each:
        print('  each image:')
        for (path, t), p, cf in zip(pairs, pred, conf):
            mark = 'ok  ' if t == p else 'MISS'
            print(f'    {mark} {os.path.basename(path):42s} '
                  f'true={t:16s} pred={p:16s} {cf:5.1f}%')

    return acc


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--model', default=DEFAULT_MODEL)
    ap.add_argument('--only', choices=list(SETS), default=None,
                    help='evaluate a single set')
    ap.add_argument('--each', action='store_true',
                    help='print every image and its prediction')
    args = ap.parse_args()

    if not os.path.exists(args.model):
        sys.exit(f'No model at {args.model}')

    print(f'model: {args.model}')
    model = tf.keras.models.load_model(args.model)

    n_out = model.output_shape[-1]
    if n_out != len(CLASSES):
        sys.exit(f'Model emits {n_out} classes, expected {len(CLASSES)}: {CLASSES}')

    chosen = [args.only] if args.only else list(SETS)
    results = {}
    for name in chosen:
        pairs = SETS[name]()
        if not pairs:
            print(f'\n{name}: no images found, skipped')
            continue
        probs = predict_all(model, [p for p, _ in pairs])
        # internet_test is small enough to be worth reading image by image.
        # Listing every image is useful for a handful, unreadable for hundreds.
        results[name] = report(name, pairs, probs, CLASSES,
                               show_each=args.each or len(pairs) <= 20)

    if len(results) > 1:
        print('\nsummary')
        for name, acc in results.items():
            if acc is not None:
                print(f'  {name:16s} {acc:5.1f}%')
        print('\ninternet_test is closest to real use but holds only 15 images,'
              '\nso a few photographs move it a long way. cofly-ood and'
              '\ndeepweeds-ood are far larger and also unseen by a sorghum-only'
              '\nmodel, but each is narrower: CoFly is drone imagery, and every'
              '\nDeepWeeds image is broadleaf, so a model answering "broadleaf"'
              '\nto everything would score 100% there. Read them together.')


if __name__ == '__main__':
    main()
