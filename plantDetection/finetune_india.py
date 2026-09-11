"""
Trains the disease model on the crops Indian smallholders actually grow.

WHAT CHANGED AND WHY
--------------------
The deployed model knows 38 PlantVillage classes, of which 16 are apple, grape,
cherry, peach, blueberry, raspberry and strawberry - and none of which are
wheat or rice. Measured on field photographs it gets 28% right, and the
retrained version of the same class set reached 58%. Neither number matters
much, because a farmer here photographs wheat and the model has no wheat class
to give back. It answers "tomato" instead, confidently.

So this is not another tuning pass. The label space itself is wrong, and this
replaces it: orchard and berry crops out, rice and wheat in. 32 classes over 9
crops. See classes_india.py for the list and the licence of every source.

WHERE THE DATA COMES FROM
-------------------------
  PlantVillage   lab photographs, the 22 kept classes
  PlantDoc       field photographs, whichever kept classes it covers
  Rice           two Mendeley sets, both CC BY 4.0 - one supplies four diseases,
                 the other the healthy class the first one lacks
  Wheat          Zenodo, CC BY 4.0, photographed in real growth conditions

LEAKAGE
-------
Two hazards, both handled here rather than discovered later in a number that
looks too good.

  Augmented copies. One rice source ships 8,258 augmented images beside 2,508
  raw ones. An augmented copy of a photograph that is also in the training set
  is not a test of anything, so augmented directories are skipped entirely and
  only raw photographs are used.

  Near-duplicate frames. The rice and wheat sets have no published train/test
  split, so one is made here, stratified by class and fixed by seed. Splitting
  by file is the best available - these sources do not record which photographs
  came from the same plant, so some correlation between the halves is possible
  and the rice and wheat figures should be read as slightly optimistic. The
  PlantDoc figures do not have this problem; its split is published.

THE OUTPUT CONTRACT
-------------------
Adding and removing classes moves every index. The hosted service maps index to
name through class_labels.json, so the model and that file must be deployed
together - shipping one without the other mislabels every prediction silently.
This writes class_labels_india.json beside the model for exactly that reason,
rather than overwriting the existing file.

Input stays 0-1, as the current service already sends. EfficientNetV2 wants
0-255 and a Rescaling layer at the front does the conversion, so app.py needs
no change beyond the labels file and the input size.

Usage:
  .venv/Scripts/python.exe finetune_india.py
  .venv/Scripts/python.exe finetune_india.py --size 224 --epochs 10   # quicker
"""

import argparse
import json
import os
import random
import sys

os.environ.setdefault('TF_CPP_MIN_LOG_LEVEL', '3')

import tensorflow as tf  # noqa: E402
from tensorflow import keras  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)

PLANTVILLAGE = os.path.join(ROOT, 'data', 'plantvillage dataset', 'color')
PLANTDOC = os.path.join(ROOT, 'weedDetection', 'data', 'plantdoc', 'plantdoc_files')
RICE1 = os.path.join(ROOT, 'data', 'indian_crops', 'Rice Leaf Disease Images')
RICE2 = os.path.join(ROOT, 'data', 'indian_crops', 'rice2')
WHEAT = os.path.join(ROOT, 'data', 'indian_crops', 'wheat')
OUT_DIR = os.path.join(HERE, 'model', 'india')

SEED = 1337
IMAGE_EXT = ('.jpg', '.jpeg', '.png')
TEST_FRACTION = 0.15
VALID_FRACTION = 0.15

sys.path.insert(0, HERE)
from classes_india import (  # noqa: E402
    KEEP_PLANTVILLAGE, RICE_CLASSES, RICE2_CLASSES, WHEAT_CLASSES, class_order,
)
from finetune_field import PLANTDOC_TO_CLASS  # noqa: E402

ARCHES = {
    'B0': keras.applications.EfficientNetV2B0,
    'B1': keras.applications.EfficientNetV2B1,
    'B2': keras.applications.EfficientNetV2B2,
}

# Directory names that mean "these images were generated, not photographed".
AUGMENTED_HINTS = ('augment', 'aug_', '_aug', 'generated', 'synthetic')


def is_augmented(path):
    low = path.lower().replace('\\', '/')
    return any(h in low for h in AUGMENTED_HINTS)


def scan_folder_tree(root, mapping, skip_augmented=True):
    """Walk a directory tree, mapping folder names onto our class names."""
    if not os.path.isdir(root):
        return []
    pairs = []
    for dirpath, _dirnames, filenames in os.walk(root):
        if skip_augmented and is_augmented(dirpath):
            continue
        folder = os.path.basename(dirpath)
        cls = mapping.get(folder)
        if not cls:
            continue
        for name in sorted(filenames):
            if name.lower().endswith(IMAGE_EXT):
                pairs.append((os.path.join(dirpath, name), cls))
    return pairs


def scan_plantvillage(cap):
    if not os.path.isdir(PLANTVILLAGE):
        sys.exit(f'PlantVillage not found at {PLANTVILLAGE}')
    keep = set(KEEP_PLANTVILLAGE)
    rng = random.Random(SEED)
    pairs = []
    for folder in sorted(os.listdir(PLANTVILLAGE)):
        if folder not in keep:
            continue
        d = os.path.join(PLANTVILLAGE, folder)
        names = sorted(n for n in os.listdir(d) if n.lower().endswith(IMAGE_EXT))
        rng.shuffle(names)
        pairs += [(os.path.join(d, n), folder) for n in names[:cap]]
    return pairs


def scan_plantdoc(split):
    keep = set(KEEP_PLANTVILLAGE)
    root = os.path.join(PLANTDOC, split)
    if not os.path.isdir(root):
        return []
    pairs = []
    for folder in sorted(os.listdir(root)):
        cls = PLANTDOC_TO_CLASS.get(folder)
        # Only the classes that survived the cut; PlantDoc's apple and grape
        # folders have nowhere to go now.
        if not cls or cls not in keep:
            continue
        d = os.path.join(root, folder)
        for name in sorted(os.listdir(d)):
            if name.lower().endswith(IMAGE_EXT):
                pairs.append((os.path.join(d, name), cls))
    return pairs


def three_way_split(pairs, test_frac, valid_frac, seed):
    """Stratified split into train / valid / test, deterministic by seed."""
    by_class = {}
    for path, cls in pairs:
        by_class.setdefault(cls, []).append(path)
    rng = random.Random(seed)
    train, valid, test = [], [], []
    for cls, paths in sorted(by_class.items()):
        paths = sorted(paths)
        rng.shuffle(paths)
        n = len(paths)
        n_test = int(n * test_frac)
        n_valid = int(n * valid_frac)
        test += [(p, cls) for p in paths[:n_test]]
        valid += [(p, cls) for p in paths[n_test:n_test + n_valid]]
        train += [(p, cls) for p in paths[n_test + n_valid:]]
    for part in (train, valid, test):
        rng.shuffle(part)
    return train, valid, test


def build_dataset(pairs, class_order_, size, batch, training):
    index = {name: i for i, name in enumerate(class_order_)}
    paths = [p for p, _ in pairs]
    labels = [index[c] for _, c in pairs]

    ds = tf.data.Dataset.from_tensor_slices((paths, labels))
    if training:
        ds = ds.shuffle(min(2048, len(paths)), seed=SEED,
                        reshuffle_each_iteration=True)

    def decode(path, label):
        img = tf.io.decode_image(tf.io.read_file(path), channels=3,
                                 expand_animations=False)
        img = tf.image.resize(img, (size, size))
        return img, tf.one_hot(label, len(class_order_))

    ds = ds.map(decode, num_parallel_calls=2)

    if training:
        def augment(img, label):
            img = tf.image.random_flip_left_right(img)
            img = tf.image.random_flip_up_down(img)
            img = tf.image.random_brightness(img, 0.3 * 255)
            img = tf.image.random_contrast(img, 0.7, 1.4)
            img = tf.image.random_saturation(img, 0.7, 1.4)
            img = tf.image.random_hue(img, 0.03)
            scale = tf.random.uniform([], 0.65, 1.0)
            crop = tf.cast(scale * size, tf.int32)
            img = tf.image.random_crop(img, [crop, crop, 3])
            img = tf.image.resize(img, (size, size))
            return tf.clip_by_value(img, 0.0, 255.0), label

        ds = ds.map(augment, num_parallel_calls=2)

    ds = ds.map(lambda x, y: (tf.cast(x, tf.float32) / 255.0, y),
                num_parallel_calls=2)
    return ds.batch(batch).prefetch(1)


def build_model(arch, size, n_classes, dropout):
    base = ARCHES[arch](include_top=False, weights='imagenet',
                        input_shape=(size, size, 3), pooling='avg')
    inputs = keras.Input(shape=(size, size, 3), name='image_0_1')
    x = keras.layers.Rescaling(255.0, name='to_0_255')(inputs)
    x = base(x)
    x = keras.layers.Dropout(dropout, name='head_dropout')(x)
    outputs = keras.layers.Dense(n_classes, activation='softmax', name='disease')(x)
    return keras.Model(inputs, outputs, name='plant_disease_india'), base


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--arch', default='B0', choices=list(ARCHES))
    ap.add_argument('--size', type=int, default=288)
    ap.add_argument('--batch', type=int, default=16)
    ap.add_argument('--epochs', type=int, default=18)
    ap.add_argument('--head-epochs', type=int, default=6)
    ap.add_argument('--pv-cap', type=int, default=120)
    ap.add_argument('--rice-cap', type=int, default=500)
    ap.add_argument('--field-repeat', type=int, default=3)
    ap.add_argument('--lr', type=float, default=1e-3)
    ap.add_argument('--unfreeze', type=int, default=120)
    ap.add_argument('--dropout', type=float, default=0.3)
    args = ap.parse_args()

    order = class_order()
    os.makedirs(OUT_DIR, exist_ok=True)

    # ── Gather ───────────────────────────────────────────────────────────────
    pv = scan_plantvillage(args.pv_cap)
    pd_train = scan_plantdoc('train')
    pd_test = scan_plantdoc('test')

    rice1 = scan_folder_tree(RICE1, RICE_CLASSES)
    rice2 = scan_folder_tree(RICE2, RICE2_CLASSES)
    wheat = scan_folder_tree(WHEAT, WHEAT_CLASSES)

    # The rice sources are large and would otherwise dominate a 32-class model
    # whose other crops have a few hundred images each.
    rice = rice1 + rice2
    if args.rice_cap:
        by_cls = {}
        for p, c in rice:
            by_cls.setdefault(c, []).append(p)
        rng = random.Random(SEED)
        capped = []
        for c, ps in sorted(by_cls.items()):
            ps = sorted(ps)
            rng.shuffle(ps)
            capped += [(p, c) for p in ps[:args.rice_cap]]
        rice = capped

    print(f'  classes: {len(order)} over '
          f'{len({c.split("___")[0] for c in order})} crops')
    print(f'  PlantVillage (lab):  {len(pv)}')
    print(f'  PlantDoc (field):    {len(pd_train)} train / {len(pd_test)} test')
    print(f'  Rice (field):        {len(rice)}  [{len(rice1)} + {len(rice2)} before cap]')
    print(f'  Wheat (field):       {len(wheat)}')

    if not rice or not wheat:
        sys.exit('Rice or wheat data missing - download has not finished.')

    # ── Split ────────────────────────────────────────────────────────────────
    # PlantDoc keeps its published split. Everything else is split here.
    rice_tr, rice_va, rice_te = three_way_split(rice, TEST_FRACTION, VALID_FRACTION, SEED)
    wheat_tr, wheat_va, wheat_te = three_way_split(wheat, TEST_FRACTION, VALID_FRACTION, SEED)
    pv_tr, pv_va, _ = three_way_split(pv, 0.0, VALID_FRACTION, SEED)
    pd_tr, pd_va, _ = three_way_split(pd_train, 0.0, VALID_FRACTION, SEED)

    # Field photographs are repeated so they are not drowned by the lab set,
    # which is the mistake that kept the earlier model scoring well in
    # validation and badly in a field.
    field_train = pd_tr + rice_tr + wheat_tr
    train_pairs = field_train * args.field_repeat + pv_tr
    valid_pairs = pd_va + rice_va + wheat_va + pv_va
    test_pairs = pd_test + rice_te + wheat_te

    share = 100 * len(field_train) * args.field_repeat / len(train_pairs)
    print(f'\n  train {len(train_pairs)}  (field {share:.0f}%)'
          f'   valid {len(valid_pairs)}   test {len(test_pairs)}')

    missing = sorted({c for _, c in train_pairs} ^ set(order))
    if missing:
        print(f'  WARNING classes with no training data: {missing}')

    json.dump({str(i): n for i, n in enumerate(order)},
              open(os.path.join(OUT_DIR, 'class_labels_india.json'), 'w'), indent=1)
    json.dump([{'path': p, 'class': c} for p, c in test_pairs],
              open(os.path.join(OUT_DIR, 'test_set.json'), 'w'))
    print(f'  wrote class_labels_india.json and test_set.json')

    train_ds = build_dataset(train_pairs, order, args.size, args.batch, True)
    valid_ds = build_dataset(valid_pairs, order, args.size, args.batch, False)

    model, base = build_model(args.arch, args.size, len(order), args.dropout)

    best = os.path.join(OUT_DIR, 'best.keras')
    callbacks = [
        keras.callbacks.ModelCheckpoint(best, monitor='val_accuracy',
                                        save_best_only=True, verbose=1),
        keras.callbacks.EarlyStopping(monitor='val_accuracy', patience=5,
                                      restore_best_weights=True, verbose=1),
        keras.callbacks.ReduceLROnPlateau(monitor='val_loss', factor=0.5,
                                          patience=2, verbose=1),
    ]

    print('\nstage 1: classifier head only')
    base.trainable = False
    model.compile(optimizer=keras.optimizers.Adam(args.lr),
                  loss='categorical_crossentropy', metrics=['accuracy'])
    model.fit(train_ds, epochs=args.head_epochs, validation_data=valid_ds,
              callbacks=callbacks)

    print('\nstage 2: head plus the top of the backbone')
    base.trainable = True
    for layer in base.layers[:-args.unfreeze]:
        layer.trainable = False
    for layer in base.layers:
        if isinstance(layer, keras.layers.BatchNormalization):
            layer.trainable = False
    model.compile(optimizer=keras.optimizers.Adam(args.lr / 20),
                  loss='categorical_crossentropy', metrics=['accuracy'])
    model.fit(train_ds, epochs=args.epochs, validation_data=valid_ds,
              callbacks=callbacks)

    model.save(os.path.join(OUT_DIR, 'india_model.keras'))
    converter = tf.lite.TFLiteConverter.from_keras_model(model)
    converter.optimizations = [tf.lite.Optimize.DEFAULT]
    tflite = converter.convert()
    path = os.path.join(OUT_DIR, 'india_model.tflite')
    with open(path, 'wb') as fh:
        fh.write(tflite)

    print(f'\nwrote {path} ({len(tflite) / 1e6:.1f} MB)')
    print('\nScore it on the held-out set before believing any of it:')
    print('  .venv/Scripts/python.exe evaluate_india_model.py')


if __name__ == '__main__':
    main()
