"""
SmartKisan Plant Disease Detection — Local Training Script
Trains MobileNetV2 on the PlantVillage dataset and exports TFLite model.
"""

import os
import json
import shutil
import random
import numpy as np

# ── Config ────────────────────────────────────────────────────────────────────

DATASET_DIR = os.environ.get('SMARTKISAN_DATASET_DIR') or os.path.join(os.path.dirname(__file__), '..', 'data', 'plantvillage dataset', 'color')
OUTPUT_DIR = os.environ.get('SMARTKISAN_OUTPUT_DIR') or os.path.join(os.path.dirname(__file__), 'huggingface')
SPLIT_DIR = os.environ.get('SMARTKISAN_SPLIT_DIR') or os.path.join(os.path.dirname(__file__), '_split')

IMG_SIZE = 224
BATCH_SIZE = 32
PHASE1_EPOCHS = 10
PHASE2_EPOCHS = 15
SPLIT_RATIO = 0.8  # 80% train, 20% valid

# ── Step 1: Auto-split dataset ────────────────────────────────────────────────

def split_dataset():
    """Split the flat color/ folder into train/ and valid/ subfolders."""
    train_dir = os.path.join(SPLIT_DIR, 'train')
    valid_dir = os.path.join(SPLIT_DIR, 'valid')

    if os.path.exists(train_dir) and os.path.exists(valid_dir):
        # Check if split already done
        train_classes = len(os.listdir(train_dir))
        if train_classes >= 38:
            print(f'Split already exists ({train_classes} classes). Skipping.')
            return train_dir, valid_dir

    print('Splitting dataset into train/valid (80/20)...')
    os.makedirs(train_dir, exist_ok=True)
    os.makedirs(valid_dir, exist_ok=True)

    classes = sorted(os.listdir(DATASET_DIR))
    total_files = 0

    for cls in classes:
        cls_path = os.path.join(DATASET_DIR, cls)
        if not os.path.isdir(cls_path):
            continue

        images = [f for f in os.listdir(cls_path) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
        random.shuffle(images)
        split_idx = int(len(images) * SPLIT_RATIO)

        train_imgs = images[:split_idx]
        valid_imgs = images[split_idx:]

        # Create class dirs
        os.makedirs(os.path.join(train_dir, cls), exist_ok=True)
        os.makedirs(os.path.join(valid_dir, cls), exist_ok=True)

        # Copy files (symlink would be faster but Windows compat)
        for img in train_imgs:
            src = os.path.join(cls_path, img)
            dst = os.path.join(train_dir, cls, img)
            if not os.path.exists(dst):
                shutil.copy2(src, dst)

        for img in valid_imgs:
            src = os.path.join(cls_path, img)
            dst = os.path.join(valid_dir, cls, img)
            if not os.path.exists(dst):
                shutil.copy2(src, dst)

        total_files += len(images)
        print(f'  {cls}: {len(train_imgs)} train, {len(valid_imgs)} valid')

    print(f'Done — {total_files} images split across {len(classes)} classes.\n')
    return train_dir, valid_dir


# ── Step 2: Train ─────────────────────────────────────────────────────────────

def train():
    # Import TF here so split can run without it if needed
    import tensorflow as tf
    from tensorflow import keras
    from tensorflow.keras import layers
    from tensorflow.keras.applications import MobileNetV2
    from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau

    print(f'TensorFlow {tf.__version__}')
    gpus = tf.config.list_physical_devices('GPU')
    print(f'GPUs: {gpus}\n')

    # Allow GPU memory growth
    for gpu in gpus:
        tf.config.experimental.set_memory_growth(gpu, True)

    # Split dataset
    train_dir, valid_dir = split_dataset()

    # Modern tf.data pipeline — keeps the GPU fed (~5-8x faster than ImageDataGenerator)
    AUTOTUNE = tf.data.AUTOTUNE

    raw_train = keras.utils.image_dataset_from_directory(
        train_dir, image_size=(IMG_SIZE, IMG_SIZE),
        batch_size=BATCH_SIZE, label_mode='categorical', shuffle=True,
    )
    raw_valid = keras.utils.image_dataset_from_directory(
        valid_dir, image_size=(IMG_SIZE, IMG_SIZE),
        batch_size=BATCH_SIZE, label_mode='categorical', shuffle=False,
    )

    class_names = raw_train.class_names
    NUM_CLASSES = len(class_names)
    n_train_batches = int(raw_train.cardinality())
    n_valid_batches = int(raw_valid.cardinality())
    print(f'\n{NUM_CLASSES} classes, ~{n_train_batches * BATCH_SIZE} train, ~{n_valid_batches * BATCH_SIZE} valid\n')

    # Augmentation runs on GPU as a Keras layer pipeline
    augmentation = keras.Sequential([
        layers.RandomFlip('horizontal'),
        layers.RandomRotation(0.06),       # ~±20°
        layers.RandomZoom(0.2),
        layers.RandomTranslation(0.2, 0.2),
    ], name='augmentation')

    def prep_train(images, labels):
        images = tf.cast(images, tf.float32) / 255.0
        images = augmentation(images, training=True)
        return images, labels

    def prep_valid(images, labels):
        return tf.cast(images, tf.float32) / 255.0, labels

    train_ds = raw_train.map(prep_train, num_parallel_calls=AUTOTUNE).prefetch(AUTOTUNE)
    valid_ds = raw_valid.map(prep_valid, num_parallel_calls=AUTOTUNE).prefetch(AUTOTUNE)

    # ── Build model ───────────────────────────────────────────────────────────
    base_model = MobileNetV2(
        input_shape=(IMG_SIZE, IMG_SIZE, 3),
        include_top=False,
        weights='imagenet',
    )
    base_model.trainable = False

    model = keras.Sequential([
        base_model,
        layers.GlobalAveragePooling2D(),
        layers.Dropout(0.3),
        layers.Dense(256, activation='relu'),
        layers.Dropout(0.3),
        layers.Dense(NUM_CLASSES, activation='softmax'),
    ])

    callbacks = [
        EarlyStopping(monitor='val_loss', patience=5, restore_best_weights=True),
        ReduceLROnPlateau(monitor='val_loss', factor=0.2, patience=3, min_lr=1e-6),
    ]

    # ── Phase 1: Feature extraction ──────────────────────────────────────────
    print('═' * 60)
    print('Phase 1: Training with frozen base model...')
    print('═' * 60)

    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=0.001),
        loss='categorical_crossentropy',
        metrics=['accuracy'],
    )
    model.fit(train_ds, epochs=PHASE1_EPOCHS, validation_data=valid_ds, callbacks=callbacks)

    # ── Phase 2: Fine-tuning ─────────────────────────────────────────────────
    print('\n' + '═' * 60)
    print('Phase 2: Fine-tuning last 30 layers...')
    print('═' * 60)

    base_model.trainable = True
    for layer in base_model.layers[:-30]:
        layer.trainable = False

    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=1e-4),
        loss='categorical_crossentropy',
        metrics=['accuracy'],
    )
    model.fit(train_ds, epochs=PHASE2_EPOCHS, validation_data=valid_ds, callbacks=callbacks)

    # ── Evaluate ──────────────────────────────────────────────────────────────
    val_loss, val_acc = model.evaluate(valid_ds)
    print(f'\nFinal validation accuracy: {val_acc*100:.1f}%')

    # ── Save class labels ─────────────────────────────────────────────────────
    index_to_class = {i: name for i, name in enumerate(class_names)}
    labels_path = os.path.join(OUTPUT_DIR, 'class_labels.json')
    with open(labels_path, 'w') as f:
        json.dump(index_to_class, f, indent=2)
    print(f'Saved class labels: {labels_path}')

    # ── Convert to TFLite ─────────────────────────────────────────────────────
    print('\nConverting to TFLite...')
    converter = tf.lite.TFLiteConverter.from_keras_model(model)
    converter.optimizations = [tf.lite.Optimize.DEFAULT]
    tflite_model = converter.convert()

    tflite_path = os.path.join(OUTPUT_DIR, 'plant_disease_model.tflite')
    with open(tflite_path, 'wb') as f:
        f.write(tflite_model)

    size_mb = len(tflite_model) / 1024 / 1024
    print(f'Saved TFLite model: {tflite_path} ({size_mb:.1f} MB)')

    # ── Also save Keras model as backup ───────────────────────────────────────
    keras_path = os.path.join(OUTPUT_DIR, 'plant_disease_model.keras')
    model.save(keras_path)
    print(f'Saved Keras model: {keras_path}')

    print('\n' + '═' * 60)
    print(f'DONE — Accuracy: {val_acc*100:.1f}%')
    print(f'Model + labels saved to: {OUTPUT_DIR}')
    print('═' * 60)


if __name__ == '__main__':
    train()
