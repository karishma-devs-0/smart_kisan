"""
Adapts the plant disease model to photographs taken in a field.

THE PROBLEM
-----------
The deployed model was trained on PlantVillage: a single detached leaf, laid on
a plain background, under even studio light. Measured against PlantDoc, which
is the same crops and diseases photographed on the plant in real conditions, it
identifies the correct class 28.8% of the time and is confidently wrong on 57%
of images. Those wrong answers reach a farmer as a diagnosis with a fungicide
to buy.

It is not that the model is bad at plants. It is that it has only ever seen one
kind of photograph, and the app only ever receives the other kind.

THE APPROACH
------------
Standard domain adaptation: keep what the model knows about disease appearance,
and teach it the conditions it will actually meet.

  * Start from the deployed weights rather than from scratch. PlantVillage has
    54,305 images and PlantDoc 2,336; training on the latter alone would forget
    far more than it gained.

  * Train on both, with PlantVillage capped per class and PlantDoc repeated, so
    field photographs are a large share of every batch instead of the 4% they
    would be by raw count. This is the same failure the weed model hit: the
    dominant capture style wins, whatever the intent.

  * Keep all 38 classes. PlantDoc covers 28 of them, and the capped PlantVillage
    sample holds the rest up so they are not forgotten.

  * Augment hard. Field photographs vary in angle, distance, light and
    background in ways PlantVillage never does, and augmentation is the only
    way to simulate some of that from the data available.

METHOD NOTE
-----------
PlantDoc's own train split is divided again into train and validation here, and
its test split is never touched during training. Selecting a checkpoint on the
test set would be choosing the model that best fits the thing being used to
judge it, and the resulting number would mean nothing.

Usage:
  python finetune_field.py                 # full run
  python finetune_field.py --epochs 8
  python finetune_field.py --pv-cap 40     # smaller PlantVillage sample
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

BASE_MODEL = os.path.join(HERE, 'huggingface', 'plant_disease_model.keras')
LABELS = os.path.join(HERE, 'huggingface', 'class_labels.json')
PLANTVILLAGE = os.path.join(ROOT, 'data', 'plantvillage dataset', 'color')
PLANTDOC = os.path.join(ROOT, 'weedDetection', 'data', 'plantdoc', 'plantdoc_files')
OUT_DIR = os.path.join(HERE, 'model', 'field')

IMG_SIZE = 224
BATCH_SIZE = 16
SEED = 1337
VALID_FRACTION = 0.15

# PlantDoc folder -> PlantVillage class. The model's output indices are fixed
# by class_labels.json and must not move: the hosted service maps index to name
# with that file, and the app reads the name.
PLANTDOC_TO_CLASS = {
    'Apple Scab Leaf':            'Apple___Apple_scab',
    'Apple leaf':                 'Apple___healthy',
    'Apple rust leaf':            'Apple___Cedar_apple_rust',
    'Bell_pepper leaf':           'Pepper,_bell___healthy',
    'Bell_pepper leaf spot':      'Pepper,_bell___Bacterial_spot',
    'Blueberry leaf':             'Blueberry___healthy',
    'Cherry leaf':                'Cherry_(including_sour)___healthy',
    'Corn Gray leaf spot':        'Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot',
    'Corn leaf blight':           'Corn_(maize)___Northern_Leaf_Blight',
    'Corn rust leaf':             'Corn_(maize)___Common_rust_',
    'Peach leaf':                 'Peach___healthy',
    'Potato leaf early blight':   'Potato___Early_blight',
    'Potato leaf late blight':    'Potato___Late_blight',
    'Raspberry leaf':             'Raspberry___healthy',
    'Soyabean leaf':              'Soybean___healthy',
    'Squash Powdery mildew leaf': 'Squash___Powdery_mildew',
    'Strawberry leaf':            'Strawberry___healthy',
    'Tomato Early blight leaf':   'Tomato___Early_blight',
    'Tomato Septoria leaf spot':  'Tomato___Septoria_leaf_spot',
    'Tomato leaf bacterial spot': 'Tomato___Bacterial_spot',
    'Tomato leaf late blight':    'Tomato___Late_blight',
    'Tomato leaf mosaic virus':   'Tomato___Tomato_mosaic_virus',
    'Tomato leaf yellow virus':   'Tomato___Tomato_Yellow_Leaf_Curl_Virus',
    'Tomato leaf':                'Tomato___healthy',
    'Tomato mold leaf':           'Tomato___Leaf_Mold',
    'Tomato two spotted spider mites leaf':
                                  'Tomato___Spider_mites Two-spotted_spider_mite',
    'grape leaf black rot':       'Grape___Black_rot',
    'grape leaf':                 'Grape___healthy',
}

IMAGE_EXT = ('.jpg', '.jpeg', '.png')


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
            print(f'  note: no mapping for PlantDoc "{folder}", skipped')
            continue
        d = os.path.join(root, folder)
        if not os.path.isdir(d):
            continue
        for name in sorted(os.listdir(d)):
            if name.lower().endswith(IMAGE_EXT):
                pairs.append((os.path.join(d, name), cls))
    return pairs


def scan_plantvillage(cap):
    """A capped sample per class, so the lab imagery does not swamp the field."""
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
        for n in names[:cap]:
            pairs.append((os.path.join(d, n), folder))
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


def build_dataset(pairs, class_order, training):
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
        img = tf.image.resize(img, (IMG_SIZE, IMG_SIZE))
        return img, tf.one_hot(label, len(class_order))

    ds = ds.map(decode, num_parallel_calls=2)

    if training:
        # Deliberately stronger than the original training used. A field photo
        # differs from a studio one in angle, distance, light and colour cast,
        # and this is the only way to approximate that from the data available.
        # Crops are included here, unlike the weed model: leaf shape is not the
        # signal for disease, lesion appearance is, and a crop that shows part
        # of a leaf is a realistic photograph.
        def augment(img, label):
            img = tf.image.random_flip_left_right(img)
            img = tf.image.random_flip_up_down(img)
            img = tf.image.random_brightness(img, 0.3 * 255)
            img = tf.image.random_contrast(img, 0.7, 1.4)
            img = tf.image.random_saturation(img, 0.7, 1.4)
            img = tf.image.random_hue(img, 0.03)
            # Zoom in on a random 70-100% window, then resize back.
            scale = tf.random.uniform([], 0.7, 1.0)
            size = tf.cast(scale * IMG_SIZE, tf.int32)
            img = tf.image.random_crop(img, [size, size, 3])
            img = tf.image.resize(img, (IMG_SIZE, IMG_SIZE))
            return tf.clip_by_value(img, 0.0, 255.0), label

        ds = ds.map(augment, num_parallel_calls=2)

    # [0, 1], matching train_model.py and the hosted service. Not
    # preprocess_input: this model was never trained that way, and fine-tuning
    # under a different input range than it was trained under would undo the
    # weights being started from.
    ds = ds.map(lambda x, y: (tf.cast(x, tf.float32) / 255.0, y),
                num_parallel_calls=2)
    return ds.batch(BATCH_SIZE).prefetch(1)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--epochs', type=int, default=12)
    ap.add_argument('--pv-cap', type=int, default=60,
                    help='PlantVillage images per class')
    ap.add_argument('--field-repeat', type=int, default=3,
                    help='times each PlantDoc training image is repeated')
    ap.add_argument('--lr', type=float, default=1e-4)
    ap.add_argument('--unfreeze', type=int, default=40,
                    help='trainable layers at the top of the backbone')
    args = ap.parse_args()

    class_order = load_class_order()
    print(f'classes: {len(class_order)}')

    field = scan_plantdoc('train')
    field_train, field_valid = split_pairs(field, VALID_FRACTION, SEED)
    lab = scan_plantvillage(args.pv_cap)
    lab_train, lab_valid = split_pairs(lab, VALID_FRACTION, SEED)

    # Repeating the field images rather than down-sampling the lab ones: the
    # lab sample is already small, and the classes PlantDoc does not cover are
    # only held up by it.
    train_pairs = field_train * args.field_repeat + lab_train
    valid_pairs = field_valid + lab_valid

    field_share = 100 * len(field_train) * args.field_repeat / len(train_pairs)
    print(f'  PlantDoc train: {len(field_train)} x{args.field_repeat}')
    print(f'  PlantVillage:   {len(lab_train)} (cap {args.pv_cap}/class)')
    print(f'  field share of training data: {field_share:.0f}%')
    print(f'  validation:     {len(valid_pairs)}')

    train_ds = build_dataset(train_pairs, class_order, True)
    valid_ds = build_dataset(valid_pairs, class_order, False)

    print(f'\nloading {BASE_MODEL}')
    model = keras.models.load_model(BASE_MODEL)
    if model.output_shape[-1] != len(class_order):
        sys.exit(f'Model emits {model.output_shape[-1]} classes, '
                 f'class_labels.json has {len(class_order)}')

    # The backbone is a single nested Functional layer holding 154 sublayers,
    # so this model has six top-level layers in total. Slicing model.layers to
    # freeze things silently did nothing: everything stayed trainable, and a
    # first attempt fine-tuned the whole network at once, with training
    # accuracy falling through the epoch as the weights were pulled apart. The
    # freezing has to reach inside.
    backbone = model.layers[0]
    if not hasattr(backbone, 'layers'):
        sys.exit('Expected a nested backbone as the first layer')

    model.trainable = True
    for layer in backbone.layers[:-args.unfreeze]:
        layer.trainable = False

    # BatchNorm stays frozen throughout. Its running statistics were estimated
    # over tens of thousands of PlantVillage images; letting batches of 16
    # field photographs overwrite them destroys the very features being kept.
    # This is the standard rule for fine-tuning and matters more than usual
    # here, where the new data is a small fraction of the original.
    for layer in backbone.layers:
        if isinstance(layer, keras.layers.BatchNormalization):
            layer.trainable = False

    trainable = sum(1 for l in backbone.layers if l.trainable)
    print(f'  backbone: training {trainable} of {len(backbone.layers)} layers')

    os.makedirs(OUT_DIR, exist_ok=True)
    best = os.path.join(OUT_DIR, 'best.keras')

    callbacks = [
        keras.callbacks.ModelCheckpoint(best, monitor='val_accuracy',
                                        save_best_only=True, verbose=1),
        keras.callbacks.EarlyStopping(monitor='val_accuracy', patience=4,
                                      restore_best_weights=True, verbose=1),
        keras.callbacks.ReduceLROnPlateau(monitor='val_loss', factor=0.5,
                                          patience=2, verbose=1),
    ]

    # Two stages. The classifier head is the part that has to change most, and
    # it can be moved quickly without risking the backbone. Only once it has
    # settled is the top of the backbone released, at a much lower rate.
    print('\nstage 1: classifier head only')
    for layer in backbone.layers:
        layer.trainable = False
    model.compile(optimizer=keras.optimizers.Adam(args.lr),
                  loss='categorical_crossentropy', metrics=['accuracy'])
    model.fit(train_ds, epochs=max(2, args.epochs // 3),
              validation_data=valid_ds, callbacks=callbacks)

    print('\nstage 2: head plus the top of the backbone')
    for layer in backbone.layers[-args.unfreeze:]:
        if not isinstance(layer, keras.layers.BatchNormalization):
            layer.trainable = True
    # An order of magnitude below the head's rate: these weights are worth
    # keeping and only need nudging.
    model.compile(optimizer=keras.optimizers.Adam(args.lr / 10),
                  loss='categorical_crossentropy', metrics=['accuracy'])
    model.fit(train_ds, epochs=args.epochs, validation_data=valid_ds,
              callbacks=callbacks)

    model.save(os.path.join(OUT_DIR, 'field_model.keras'))

    converter = tf.lite.TFLiteConverter.from_keras_model(model)
    converter.optimizations = [tf.lite.Optimize.DEFAULT]
    tflite = converter.convert()
    tflite_path = os.path.join(OUT_DIR, 'field_model.tflite')
    with open(tflite_path, 'wb') as fh:
        fh.write(tflite)

    print(f'\nwrote {OUT_DIR}')
    print(f'  {tflite_path} ({len(tflite) / 1e6:.1f} MB)')
    print('\nNow score it against the held-out field photographs:')
    print('  python evaluate_field_model.py --model model/field/best.keras')


if __name__ == '__main__':
    main()
