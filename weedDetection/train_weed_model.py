"""
Trains the GOG (Green-on-Green) weed classifier and exports a TFLite model.

Mirrors plantDetection/train_model.py deliberately: same MobileNetV2 backbone,
same 224px input, same two-phase schedule and the same .keras + .tflite export.
That keeps one inference path in the app and one deployment pattern for the
HuggingFace Space.

Two things differ from the plant-disease pipeline, both forced by the data:

1. DeepWeeds ships as a flat image folder plus labels.csv, not folder-per-class,
   so the split is built here from the CSV rather than with
   image_dataset_from_directory.

2. DeepWeeds is 52% "Negative" (9,106 of 17,509 images). Left alone, a model
   scores 52% by predicting Negative for everything, so class weights are
   applied. For a spraying rig the Negative class is worth keeping rather than
   discarding — not spraying is a real decision — but it must not dominate.

Usage:
    .venv/Scripts/python.exe train_weed_model.py
    .venv/Scripts/python.exe train_weed_model.py --epochs1 2 --epochs2 2   # smoke test
"""

import argparse
import csv
import json
import os
import random

import numpy as np
import tensorflow as tf
from tensorflow import keras

HERE = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(HERE, 'data')
IMAGES_DIR = os.path.join(DATA_DIR, 'images')
LABELS_CSV = os.path.join(DATA_DIR, 'labels.csv')
OUTPUT_DIR = os.environ.get('SMARTKISAN_WEED_OUTPUT_DIR') or os.path.join(HERE, 'model')

IMG_SIZE = 224
BATCH_SIZE = 32
VALID_FRACTION = 0.2
SEED = 1337


def load_rows():
    """Read labels.csv into (filename, species) pairs, keeping only files present."""
    if not os.path.exists(LABELS_CSV):
        raise SystemExit(f'Missing {LABELS_CSV}')
    if not os.path.isdir(IMAGES_DIR):
        raise SystemExit(
            f'Missing {IMAGES_DIR}. Download images.zip from the DeepWeeds repo '
            'and extract it there.'
        )

    rows, missing = [], 0
    with open(LABELS_CSV, newline='', encoding='utf-8') as fh:
        for row in csv.DictReader(fh):
            path = os.path.join(IMAGES_DIR, row['Filename'])
            if os.path.exists(path):
                rows.append((path, row['Species']))
            else:
                missing += 1

    if missing:
        print(f'  note: {missing} rows in labels.csv have no image file, skipped')
    if not rows:
        raise SystemExit('No images matched labels.csv — check the extraction path.')
    return rows


def stratified_split(rows, valid_fraction, seed):
    """Split per-class so every species keeps its proportion in both sets.

    A plain random split would be acceptable at this size, but the classes are
    uneven enough (52% Negative vs ~6% each species) that stratifying removes a
    real source of run-to-run variance in the validation score.
    """
    by_class = {}
    for path, species in rows:
        by_class.setdefault(species, []).append(path)

    rng = random.Random(seed)
    train, valid = [], []
    for species, paths in sorted(by_class.items()):
        paths = sorted(paths)
        rng.shuffle(paths)
        cut = int(len(paths) * valid_fraction)
        valid += [(p, species) for p in paths[:cut]]
        train += [(p, species) for p in paths[cut:]]

    rng.shuffle(train)
    rng.shuffle(valid)
    return train, valid


def build_dataset(pairs, class_names, training):
    """Decode + resize on the fly; augmentation only on the training split."""
    index = {name: i for i, name in enumerate(class_names)}
    paths = [p for p, _ in pairs]
    labels = [index[s] for _, s in pairs]

    ds = tf.data.Dataset.from_tensor_slices((paths, labels))
    if training:
        ds = ds.shuffle(len(paths), seed=SEED, reshuffle_each_iteration=True)

    def decode(path, label):
        img = tf.io.decode_jpeg(tf.io.read_file(path), channels=3)
        img = tf.image.resize(img, (IMG_SIZE, IMG_SIZE))
        return img, tf.one_hot(label, len(class_names))

    ds = ds.map(decode, num_parallel_calls=tf.data.AUTOTUNE)

    if training:
        # Weeds have no canonical orientation and field light varies widely, so
        # flips plus mild brightness/contrast jitter are safe. No vertical crop
        # distortion — that would change apparent leaf shape, which is the
        # signal being learned.
        def augment(img, label):
            img = tf.image.random_flip_left_right(img)
            img = tf.image.random_flip_up_down(img)
            img = tf.image.random_brightness(img, 0.2 * 255)
            img = tf.image.random_contrast(img, 0.8, 1.2)
            return tf.clip_by_value(img, 0.0, 255.0), label

        ds = ds.map(augment, num_parallel_calls=tf.data.AUTOTUNE)

    # MobileNetV2 expects inputs scaled to [-1, 1].
    ds = ds.map(
        lambda x, y: (keras.applications.mobilenet_v2.preprocess_input(x), y),
        num_parallel_calls=tf.data.AUTOTUNE,
    )
    return ds.batch(BATCH_SIZE).prefetch(tf.data.AUTOTUNE)


def compute_class_weights(pairs, class_names):
    """Inverse-frequency weights, so Negative cannot swamp the eight species."""
    counts = {name: 0 for name in class_names}
    for _, species in pairs:
        counts[species] += 1
    total = sum(counts.values())
    n = len(class_names)
    return {
        i: (total / (n * counts[name]) if counts[name] else 0.0)
        for i, name in enumerate(class_names)
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--epochs1', type=int, default=10, help='frozen-backbone epochs')
    parser.add_argument('--epochs2', type=int, default=15, help='fine-tuning epochs')
    parser.add_argument('--limit', type=int, default=0, help='cap images (smoke test)')
    args = parser.parse_args()

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    tf.random.set_seed(SEED)

    rows = load_rows()
    if args.limit:
        random.Random(SEED).shuffle(rows)
        rows = rows[: args.limit]

    class_names = sorted({s for _, s in rows})
    train_pairs, valid_pairs = stratified_split(rows, VALID_FRACTION, SEED)

    print('=' * 60)
    print(f'{len(class_names)} classes, {len(train_pairs)} train, {len(valid_pairs)} valid')
    for name in class_names:
        print(f'   {name:<16} {sum(1 for _, s in rows if s == name):>6}')
    print('=' * 60)

    train_ds = build_dataset(train_pairs, class_names, training=True)
    valid_ds = build_dataset(valid_pairs, class_names, training=False)
    class_weight = compute_class_weights(train_pairs, class_names)

    base_model = keras.applications.MobileNetV2(
        input_shape=(IMG_SIZE, IMG_SIZE, 3), include_top=False, weights='imagenet'
    )
    base_model.trainable = False

    model = keras.Sequential([
        base_model,
        keras.layers.GlobalAveragePooling2D(),
        keras.layers.Dropout(0.3),
        keras.layers.Dense(len(class_names), activation='softmax'),
    ])

    ckpt = os.path.join(OUTPUT_DIR, 'best.keras')
    callbacks = [
        keras.callbacks.ModelCheckpoint(ckpt, save_best_only=True, monitor='val_accuracy'),
        keras.callbacks.EarlyStopping(patience=5, restore_best_weights=True, monitor='val_accuracy'),
    ]

    print('\nPhase 1: frozen backbone')
    model.compile(
        optimizer=keras.optimizers.Adam(1e-3),
        loss='categorical_crossentropy',
        metrics=['accuracy'],
    )
    model.fit(
        train_ds, epochs=args.epochs1, validation_data=valid_ds,
        callbacks=callbacks, class_weight=class_weight,
    )

    print('\nPhase 2: fine-tuning last 30 layers')
    base_model.trainable = True
    for layer in base_model.layers[:-30]:
        layer.trainable = False
    model.compile(
        optimizer=keras.optimizers.Adam(1e-5),
        loss='categorical_crossentropy',
        metrics=['accuracy'],
    )
    model.fit(
        train_ds, epochs=args.epochs2, validation_data=valid_ds,
        callbacks=callbacks, class_weight=class_weight,
    )

    loss, acc = model.evaluate(valid_ds, verbose=0)

    keras_path = os.path.join(OUTPUT_DIR, 'weed_model.keras')
    model.save(keras_path)

    converter = tf.lite.TFLiteConverter.from_keras_model(model)
    converter.optimizations = [tf.lite.Optimize.DEFAULT]
    tflite_path = os.path.join(OUTPUT_DIR, 'weed_model.tflite')
    with open(tflite_path, 'wb') as fh:
        fh.write(converter.convert())

    with open(os.path.join(OUTPUT_DIR, 'class_labels.json'), 'w', encoding='utf-8') as fh:
        json.dump(class_names, fh, indent=2)

    print('\n' + '=' * 60)
    print(f'DONE - validation accuracy: {acc * 100:.1f}%')
    print(f'  {keras_path}')
    print(f'  {tflite_path} ({os.path.getsize(tflite_path) / 1048576:.1f} MB)')
    print('=' * 60)


if __name__ == '__main__':
    main()
