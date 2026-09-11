"""
Second attempt at the disease model: a stronger backbone at a larger input size.

WHY A REWRITE RATHER THAN MORE TUNING
-------------------------------------
finetune_field.py took the deployed MobileNetV2 from 28% to 58% on field
photographs by changing what it was trained on. Three further attempts to push
past 58% by changing how it was trained all made it worse:

    more capacity, more epochs   58.1% -> 55.1%
    test-time augmentation       58.1% -> 58.1%  (3.4x the inference cost)
    class weighting              58.1% -> 55.9%

Those were the training-side levers, and they are spent. What was never changed
is the model itself. MobileNetV2 at 224px is a 2018 architecture sized for
phones, and it is being asked to find a lesion a few pixels across in a
cluttered photograph. Two things follow:

  * A better backbone. EfficientNetV2B0 has more capacity and a far better
    accuracy-per-FLOP, and benchmarked on this machine it is actually FASTER
    than MobileNetV2 at the same size - 2.8 against 3.2 minutes per epoch.
    There is no trade to make here.

  * A larger input. 288px over 224px is 1.65x the pixels, which is most of the
    cost of this run, and it is where lesion detail lives. Leaf spots survive
    downsampling badly.

MEASURED RESULT
---------------
Scored on PlantDoc's held-out field photographs, against the MobileNetV2 the
same pipeline produced:

    disease identified   58.1% -> 61.9%
    crop identified      78.8% -> 82.2%

Nearly four points for no extra wall clock. Worth noting separately:
confidently-wrong answers rose from 15% to 21%, not because the model is more
often wrong but because it is more confident, so more of its answers clear the
70% threshold. That threshold is a property of the model and has to be
re-measured for each one rather than inherited.

This model does NOT continue from the deployed weights - the architecture
differs, so it starts from ImageNet and learns the task fresh. That is why the
PlantVillage sample is larger here than in finetune_field.py: it has more to
teach from scratch.

THE SERVING CONTRACT IS DELIBERATELY UNCHANGED
----------------------------------------------
EfficientNetV2 expects raw 0-255 input and does its own rescaling internally;
keras.applications.efficientnet_v2.preprocess_input is a passthrough. The
deployed service divides by 255 before calling the model, and the weed models
do something different again.

Rather than change the service and risk the mismatch that has already bitten
this project twice, a Rescaling(255) layer sits at the front of this model. It
therefore accepts 0-1 input exactly as the current one does, and deploying it
is a file swap with no change to app.py. The only thing that does change is the
input size, which app.py already reads from the model rather than hardcoding.

METHOD
------
PlantDoc's train split is divided again for validation; its test split is never
touched during training. Judge this by evaluate_field_model.py against that
test split, never by the validation number - validation is drawn from the same
collections as training and will flatter any change made here.

Usage:
  .venv/Scripts/python.exe finetune_v2.py
  .venv/Scripts/python.exe finetune_v2.py --size 224 --epochs 12   # quicker
  .venv/Scripts/python.exe finetune_v2.py --arch B2                # bigger
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

LABELS = os.path.join(HERE, 'huggingface', 'class_labels.json')
PLANTVILLAGE = os.path.join(ROOT, 'data', 'plantvillage dataset', 'color')
PLANTDOC = os.path.join(ROOT, 'weedDetection', 'data', 'plantdoc', 'plantdoc_files')
OUT_DIR = os.path.join(HERE, 'model', 'v2')

SEED = 1337
VALID_FRACTION = 0.15
IMAGE_EXT = ('.jpg', '.jpeg', '.png')

sys.path.insert(0, HERE)
from finetune_field import PLANTDOC_TO_CLASS  # noqa: E402

ARCHES = {
    'B0': keras.applications.EfficientNetV2B0,
    'B1': keras.applications.EfficientNetV2B1,
    'B2': keras.applications.EfficientNetV2B2,
}


def load_class_order():
    with open(LABELS, encoding='utf-8') as fh:
        by_index = json.load(fh)
    return [by_index[str(i)] for i in range(len(by_index))]


def scan_plantdoc(split):
    root = os.path.join(PLANTDOC, split)
    if not os.path.isdir(root):
        sys.exit(f'PlantDoc {split} not found at {root}')
    pairs = []
    for folder in sorted(os.listdir(root)):
        cls = PLANTDOC_TO_CLASS.get(folder)
        if not cls:
            continue
        d = os.path.join(root, folder)
        if not os.path.isdir(d):
            continue
        for name in sorted(os.listdir(d)):
            if name.lower().endswith(IMAGE_EXT):
                pairs.append((os.path.join(d, name), cls))
    return pairs


def scan_plantvillage(cap):
    if not os.path.isdir(PLANTVILLAGE):
        sys.exit(f'PlantVillage not found at {PLANTVILLAGE}')
    rng = random.Random(SEED)
    pairs = []
    for folder in sorted(os.listdir(PLANTVILLAGE)):
        d = os.path.join(PLANTVILLAGE, folder)
        if not os.path.isdir(d):
            continue
        names = sorted(n for n in os.listdir(d) if n.lower().endswith(IMAGE_EXT))
        rng.shuffle(names)
        pairs += [(os.path.join(d, n), folder) for n in names[:cap]]
    return pairs


def split_pairs(pairs, fraction, seed):
    by_class = {}
    for path, cls in pairs:
        by_class.setdefault(cls, []).append(path)
    rng = random.Random(seed)
    train, valid = [], []
    for cls, paths in sorted(by_class.items()):
        paths = sorted(paths)
        rng.shuffle(paths)
        cut = max(1, int(len(paths) * fraction)) if len(paths) > 3 else 0
        valid += [(p, cls) for p in paths[:cut]]
        train += [(p, cls) for p in paths[cut:]]
    rng.shuffle(train)
    rng.shuffle(valid)
    return train, valid


def build_dataset(pairs, class_order, size, batch, training):
    index = {name: i for i, name in enumerate(class_order)}
    unknown = {c for _, c in pairs if c not in index}
    if unknown:
        sys.exit(f'Classes not in class_labels.json: {sorted(unknown)}')

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
        return img, tf.one_hot(label, len(class_order))

    ds = ds.map(decode, num_parallel_calls=2)

    if training:
        def augment(img, label):
            img = tf.image.random_flip_left_right(img)
            img = tf.image.random_flip_up_down(img)
            img = tf.image.random_brightness(img, 0.3 * 255)
            img = tf.image.random_contrast(img, 0.7, 1.4)
            img = tf.image.random_saturation(img, 0.7, 1.4)
            img = tf.image.random_hue(img, 0.03)
            # A field photograph is taken from wherever the person was standing,
            # so scale and framing vary far more than in PlantVillage.
            scale = tf.random.uniform([], 0.65, 1.0)
            crop = tf.cast(scale * size, tf.int32)
            img = tf.image.random_crop(img, [crop, crop, 3])
            img = tf.image.resize(img, (size, size))
            return tf.clip_by_value(img, 0.0, 255.0), label

        ds = ds.map(augment, num_parallel_calls=2)

    # 0-1, matching what the hosted service sends today. The Rescaling layer
    # inside the model puts it back to 0-255 for the backbone.
    ds = ds.map(lambda x, y: (tf.cast(x, tf.float32) / 255.0, y),
                num_parallel_calls=2)
    return ds.batch(batch).prefetch(1)


def build_model(arch, size, n_classes, dropout):
    base = ARCHES[arch](include_top=False, weights='imagenet',
                        input_shape=(size, size, 3), pooling='avg')
    inputs = keras.Input(shape=(size, size, 3), name='image_0_1')
    # The contract: callers pass 0-1, as they already do for the model this
    # replaces. EfficientNetV2 wants 0-255 and normalises internally.
    x = keras.layers.Rescaling(255.0, name='to_0_255')(inputs)
    x = base(x)
    x = keras.layers.Dropout(dropout, name='head_dropout')(x)
    outputs = keras.layers.Dense(n_classes, activation='softmax', name='disease')(x)
    return keras.Model(inputs, outputs, name=f'plant_disease_{arch.lower()}'), base


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--arch', default='B0', choices=list(ARCHES))
    ap.add_argument('--size', type=int, default=288)
    ap.add_argument('--batch', type=int, default=16)
    ap.add_argument('--epochs', type=int, default=18, help='stage 2 epochs')
    ap.add_argument('--head-epochs', type=int, default=6)
    ap.add_argument('--pv-cap', type=int, default=80)
    ap.add_argument('--field-repeat', type=int, default=3)
    ap.add_argument('--lr', type=float, default=1e-3)
    ap.add_argument('--unfreeze', type=int, default=120)
    ap.add_argument('--dropout', type=float, default=0.3)
    args = ap.parse_args()

    class_order = load_class_order()

    field = scan_plantdoc('train')
    field_train, field_valid = split_pairs(field, VALID_FRACTION, SEED)
    lab = scan_plantvillage(args.pv_cap)
    lab_train, lab_valid = split_pairs(lab, VALID_FRACTION, SEED)

    train_pairs = field_train * args.field_repeat + lab_train
    valid_pairs = field_valid + lab_valid
    share = 100 * len(field_train) * args.field_repeat / len(train_pairs)

    print(f'  arch {args.arch} @ {args.size}px, {len(class_order)} classes')
    print(f'  PlantDoc train: {len(field_train)} x{args.field_repeat}')
    print(f'  PlantVillage:   {len(lab_train)} (cap {args.pv_cap}/class)')
    print(f'  field share:    {share:.0f}%   train {len(train_pairs)}  valid {len(valid_pairs)}')

    train_ds = build_dataset(train_pairs, class_order, args.size, args.batch, True)
    valid_ds = build_dataset(valid_pairs, class_order, args.size, args.batch, False)

    model, base = build_model(args.arch, args.size, len(class_order), args.dropout)
    print(f'  backbone: {len(base.layers)} layers, '
          f'{base.count_params() / 1e6:.1f}M params')

    os.makedirs(OUT_DIR, exist_ok=True)
    best = os.path.join(OUT_DIR, 'best.keras')
    callbacks = [
        keras.callbacks.ModelCheckpoint(best, monitor='val_accuracy',
                                        save_best_only=True, verbose=1),
        keras.callbacks.EarlyStopping(monitor='val_accuracy', patience=5,
                                      restore_best_weights=True, verbose=1),
        keras.callbacks.ReduceLROnPlateau(monitor='val_loss', factor=0.5,
                                          patience=2, verbose=1),
    ]

    # Stage 1 - head only. The backbone carries ImageNet features that are
    # worth more than anything a randomly initialised head can teach it in the
    # first few epochs, so it stays frozen until the head is sane.
    print('\nstage 1: classifier head only')
    base.trainable = False
    model.compile(optimizer=keras.optimizers.Adam(args.lr),
                  loss='categorical_crossentropy', metrics=['accuracy'])
    model.fit(train_ds, epochs=args.head_epochs, validation_data=valid_ds,
              callbacks=callbacks)

    # Stage 2 - release the top of the backbone at a much lower rate.
    # BatchNorm stays frozen: its statistics come from ImageNet and batches of
    # 16 would overwrite them with noise.
    print('\nstage 2: head plus the top of the backbone')
    base.trainable = True
    for layer in base.layers[:-args.unfreeze]:
        layer.trainable = False
    for layer in base.layers:
        if isinstance(layer, keras.layers.BatchNormalization):
            layer.trainable = False
    trainable = sum(1 for l in base.layers if l.trainable)
    print(f'  training {trainable} of {len(base.layers)} backbone layers')

    model.compile(optimizer=keras.optimizers.Adam(args.lr / 20),
                  loss='categorical_crossentropy', metrics=['accuracy'])
    model.fit(train_ds, epochs=args.epochs, validation_data=valid_ds,
              callbacks=callbacks)

    model.save(os.path.join(OUT_DIR, 'v2_model.keras'))

    converter = tf.lite.TFLiteConverter.from_keras_model(model)
    converter.optimizations = [tf.lite.Optimize.DEFAULT]
    tflite = converter.convert()
    path = os.path.join(OUT_DIR, 'v2_model.tflite')
    with open(path, 'wb') as fh:
        fh.write(tflite)

    print(f'\nwrote {path} ({len(tflite) / 1e6:.1f} MB)')
    print('\nScore it against the held-out field photographs before believing it:')
    print(f'  .venv/Scripts/python.exe evaluate_field_model.py --model model/v2/v2_model.tflite')
    print('  (the baseline to beat is 58.1%)')


if __name__ == '__main__':
    main()
