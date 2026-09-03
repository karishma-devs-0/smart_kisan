"""
Scores a disease model against PlantDoc's held-out field photographs, locally.

The companion to weedDetection/evaluate_disease_model.py, which measures the
deployed service over HTTP. This one loads a .keras file directly, so a
candidate can be judged before it is deployed anywhere.

The two should agree on the same weights. If they do not, the difference is in
the serving path - preprocessing, resizing, the response mapping - rather than
the model, which is worth knowing on its own.

Usage:
  python evaluate_field_model.py                                    # deployed weights
  python evaluate_field_model.py --model model/field/best.keras     # candidate
  python evaluate_field_model.py --split train                      # sanity check
"""

import argparse
import json
import os
import sys

os.environ.setdefault('TF_CPP_MIN_LOG_LEVEL', '3')

import numpy as np  # noqa: E402
import tensorflow as tf  # noqa: E402
from tensorflow import keras  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)

DEFAULT_MODEL = os.path.join(HERE, 'huggingface', 'plant_disease_model.keras')
LABELS = os.path.join(HERE, 'huggingface', 'class_labels.json')
PLANTDOC = os.path.join(ROOT, 'weedDetection', 'data', 'plantdoc', 'plantdoc_files')

IMG_SIZE = 224
MIN_CONFIDENCE = 60  # the floor the app applies

sys.path.insert(0, HERE)
from finetune_field import PLANTDOC_TO_CLASS  # noqa: E402


def load_class_order():
    with open(LABELS, encoding='utf-8') as fh:
        by_index = json.load(fh)
    return [by_index[str(i)] for i in range(len(by_index))]


def collect(split):
    root = os.path.join(PLANTDOC, split)
    if not os.path.isdir(root):
        sys.exit(f'PlantDoc {split} not found at {root}')
    items = []
    for folder in sorted(os.listdir(root)):
        cls = PLANTDOC_TO_CLASS.get(folder)
        if not cls:
            continue
        d = os.path.join(root, folder)
        if not os.path.isdir(d):
            continue
        for name in sorted(os.listdir(d)):
            if name.lower().endswith(('.jpg', '.jpeg', '.png')):
                items.append((os.path.join(d, name), cls, folder))
    return items


def load_image(path):
    img = tf.io.decode_image(tf.io.read_file(path), channels=3,
                             expand_animations=False)
    img = tf.image.resize(img, (IMG_SIZE, IMG_SIZE))
    # This model scales to [0, 1], NOT MobileNetV2's usual [-1, 1]. train_model.py
    # divides by 255 and the hosted service does the same, so anything scoring it
    # has to match or the numbers are meaningless - scoring the deployed weights
    # with preprocess_input reported 16.5% where the truth was 28.8%.
    #
    # Note this differs from the weed models, which do use preprocess_input.
    # The two were written at different times and neither is wrong; they simply
    # have to be fed the way they were trained.
    return tf.cast(img, tf.float32) / 255.0


def crop_of(class_name):
    return class_name.split('___')[0] if class_name else ''


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--model', default=DEFAULT_MODEL)
    ap.add_argument('--split', default='test', choices=['test', 'train'])
    ap.add_argument('--each', action='store_true')
    args = ap.parse_args()

    if not os.path.exists(args.model):
        sys.exit(f'No model at {args.model}')

    class_order = load_class_order()
    items = collect(args.split)
    print(f'model: {args.model}')
    print(f'images: {len(items)} from PlantDoc {args.split}\n')

    model = keras.models.load_model(args.model)
    if model.output_shape[-1] != len(class_order):
        sys.exit(f'Model emits {model.output_shape[-1]} classes, '
                 f'expected {len(class_order)}')

    probs = []
    for i in range(0, len(items), 16):
        batch = tf.stack([load_image(p) for p, _, _ in items[i:i + 16]])
        probs.append(model.predict(batch, verbose=0))
    probs = np.concatenate(probs)

    pred = [class_order[i] for i in probs.argmax(axis=1)]
    conf = probs.max(axis=1) * 100

    exact = sum(p == c for p, (_, c, _) in zip(pred, items))
    crop_ok = sum(crop_of(p) == crop_of(c) for p, (_, c, _) in zip(pred, items))

    n = len(items)
    suppressed = sum(1 for c in conf if c < MIN_CONFIDENCE)
    suppressed_wrong = sum(1 for c, p, (_, t, _) in zip(conf, pred, items)
                           if c < MIN_CONFIDENCE and p != t)
    confident_wrong = sum(1 for c, p, (_, t, _) in zip(conf, pred, items)
                          if c >= MIN_CONFIDENCE and p != t)

    print('=' * 62)
    print(f'PlantDoc {args.split} — {n} field photographs')
    print('=' * 62)
    print(f'  crop identified:     {100 * crop_ok / n:5.1f}%  ({crop_ok}/{n})')
    print(f'  disease identified:  {100 * exact / n:5.1f}%  ({exact}/{n})')
    print(f'\n  at the app\'s {MIN_CONFIDENCE}% floor:')
    print(f'    suppressed:        {suppressed} ({100 * suppressed / n:.0f}%)')
    if suppressed:
        print(f'    of those, wrong:   {suppressed_wrong}/{suppressed} '
              f'({100 * suppressed_wrong / suppressed:.0f}%)')
    print(f'    confidently wrong: {confident_wrong} '
          f'({100 * confident_wrong / n:.0f}% of all answers)')

    by_folder = {}
    for p, (_, t, folder) in zip(pred, items):
        by_folder.setdefault(folder, []).append(p == t)
    print('\n  by class:')
    for folder in sorted(by_folder):
        hits = by_folder[folder]
        print(f'    {folder:38s} {100 * sum(hits) / len(hits):5.1f}%  '
              f'({sum(hits)}/{len(hits)})')

    if args.each:
        print('\n  every image:')
        for p, c, (path, t, _) in zip(pred, conf, items):
            print(f'    {"ok  " if p == t else "MISS"} '
                  f'{os.path.basename(path):34s} true={t:46s} pred={p:46s} {c:5.1f}%')


if __name__ == '__main__':
    main()
