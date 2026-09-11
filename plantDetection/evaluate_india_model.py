"""
Scores the India-focused disease model on its held-out set.

READ THE SPLIT BEFORE THE NUMBER
--------------------------------
The test set has two halves and they are not equally trustworthy.

  PlantDoc      Its train/test split is published by the dataset authors and
                split by photograph, so nothing in the test half was seen in
                training. This is the number to compare against the old
                model's 58.1%, because it is measured on the same images.

  Rice, wheat   No published split, so one was made by file. These sources do
                not record which photographs came from the same plant or the
                same session, so two near-identical frames could land on
                opposite sides. Read these as the optimistic end.

Reported separately for that reason. A single blended figure would let the
easier half carry the harder one, which is the kind of number that survives a
report and fails a farmer.

Usage:
  .venv/Scripts/python.exe evaluate_india_model.py
  .venv/Scripts/python.exe evaluate_india_model.py --model model/india/india_model.tflite
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
OUT_DIR = os.path.join(HERE, 'model', 'india')

# --dir lets a previous run be scored against its own split. The labels file
# and the test set travel with the model that produced them; pairing a model
# with someone else's split silently measures the wrong thing.

MIN_CONFIDENCE = 70  # the floor the app applies


def crop_of(name):
    return name.split('___')[0] if name else ''


def is_healthy(name):
    return name.endswith('___healthy')


def load_image(path, size):
    img = tf.io.decode_image(tf.io.read_file(path), channels=3,
                             expand_animations=False)
    img = tf.image.resize(img, (size, size))
    # 0-1, the contract the hosted service already uses.
    return tf.cast(img, tf.float32) / 255.0


def predict(model_path, paths, n_classes):
    if model_path.endswith('.tflite'):
        interp = tf.lite.Interpreter(model_path=model_path)
        interp.allocate_tensors()
        inp, out = interp.get_input_details()[0], interp.get_output_details()[0]
        size = int(inp['shape'][1])
        if int(out['shape'][-1]) != n_classes:
            sys.exit(f"Model emits {out['shape'][-1]} classes, expected {n_classes}")
        rows = []
        for p in paths:
            interp.set_tensor(inp['index'],
                              np.expand_dims(load_image(p, size).numpy(), 0)
                              .astype(inp['dtype']))
            interp.invoke()
            rows.append(interp.get_tensor(out['index'])[0])
        return np.stack(rows), size

    model = keras.models.load_model(model_path)
    size = int(model.input_shape[1])
    if model.output_shape[-1] != n_classes:
        sys.exit(f'Model emits {model.output_shape[-1]} classes, expected {n_classes}')
    rows = []
    for i in range(0, len(paths), 16):
        batch = tf.stack([load_image(p, size) for p in paths[i:i + 16]])
        rows.append(model.predict(batch, verbose=0))
    return np.concatenate(rows), size


def block(title, idx, truth, pred, conf, note=''):
    if not idx:
        return None
    n = len(idx)
    exact = sum(pred[i] == truth[i] for i in idx)
    crop_ok = sum(crop_of(pred[i]) == crop_of(truth[i]) for i in idx)
    sick_ok = sum(is_healthy(pred[i]) == is_healthy(truth[i]) for i in idx)

    answered = [i for i in idx if conf[i] >= MIN_CONFIDENCE]
    ans_right = sum(pred[i] == truth[i] for i in answered)
    shown_wrong = len(answered) - ans_right

    n_h = sum(1 for i in idx if is_healthy(truth[i]))
    n_s = n - n_h
    h2s = sum(1 for i in idx if is_healthy(truth[i]) and not is_healthy(pred[i]))
    s2h = sum(1 for i in idx if not is_healthy(truth[i]) and is_healthy(pred[i]))

    print(f'\n  {title}  ({n} images){note}')
    print(f'    exact disease          {100*exact/n:5.1f}%')
    print(f'    correct crop           {100*crop_ok/n:5.1f}%')
    print(f'    diseased or not        {100*sick_ok/n:5.1f}%')
    if answered:
        print(f'    at the {MIN_CONFIDENCE}% floor       answers {100*len(answered)/n:4.1f}% of scans, '
              f'{100*ans_right/len(answered):.1f}% of those right')
        print(f'    wrong answers shown    {100*shown_wrong/n:5.1f}% of all scans')
    if n_h:
        print(f'    healthy called sick    {100*h2s/n_h:5.1f}%  ({h2s}/{n_h})')
    if n_s:
        print(f'    sick called healthy    {100*s2h/n_s:5.1f}%  ({s2h}/{n_s})')
    return 100 * exact / n


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--dir', default=OUT_DIR,
                    help='directory holding class_labels_india.json and test_set.json')
    ap.add_argument('--model', default=None)
    ap.add_argument('--each', action='store_true')
    args = ap.parse_args()

    if args.model is None:
        args.model = os.path.join(args.dir, 'india_model.tflite')
    labels_path = os.path.join(args.dir, 'class_labels_india.json')
    test_path = os.path.join(args.dir, 'test_set.json')
    for p in (args.model, labels_path, test_path):
        if not os.path.exists(p):
            sys.exit(f'Missing {p} - run finetune_india.py first')

    by_index = json.load(open(labels_path))
    order = [by_index[str(i)] for i in range(len(by_index))]
    items = json.load(open(test_path))

    paths = [it['path'] for it in items]
    truth = [it['class'] for it in items]

    print(f'model:  {args.model}')
    probs, size = predict(args.model, paths, len(order))
    print(f'input:  {size}px   classes: {len(order)}')

    pred = [order[i] for i in probs.argmax(axis=1)]
    conf = probs.max(axis=1) * 100

    # Which collection each image came from, so halves with different split
    # quality are never averaged into one figure.
    #
    # Matched against each dataset root rather than one substring: the potato
    # field set lives outside data/indian_crops, and the old two-way test would
    # have counted it as PlantDoc - crediting a split made here to the
    # published one, which is the stronger claim.
    SOURCES = [
        ('plantdoc', 'plantdoc'),
        ('rice/wheat', 'indian_crops'),
        ('potato field', 'potato leaf disease'),
        ('maize/tomato field', 'ccmt'),
    ]

    groups = {name: [] for name, _ in SOURCES}
    unknown = []
    for i, it in enumerate(items):
        low = it['path'].lower().replace(chr(92), '/')
        for name, needle in SOURCES:
            if needle in low:
                groups[name].append(i)
                break
        else:
            unknown.append(i)
    if unknown:
        print('  WARNING %d test images matched no known source; first is %s'
              % (len(unknown), items[unknown[0]]['path']))

    print('\n' + '=' * 64)
    print(f'Held-out test set - {len(items)} images')
    print('=' * 64)

    block('PlantDoc field photographs', groups['plantdoc'], truth, pred, conf,
          '   <- published split, the strongest evidence here')
    block('Rice and wheat', groups['rice/wheat'], truth, pred, conf,
          '   <- split by file, read as optimistic')
    block('Potato, Central Java farms', groups['potato field'], truth, pred,
          conf, '   <- split by file; Early_blight labels are noisy')
    block('Maize and tomato, Ghana farms', groups['maize/tomato field'],
          truth, pred, conf, '   <- split by file')
    block('All together', list(range(len(items))), truth, pred, conf)

    # Per crop, because a farmer only ever cares about the one in front of them.
    print('\n  by crop:')
    crops = {}
    for i in range(len(items)):
        crops.setdefault(crop_of(truth[i]), []).append(i)
    for c in sorted(crops, key=lambda k: -len(crops[k])):
        idx = crops[c]
        hit = sum(pred[i] == truth[i] for i in idx)
        print(f'    {c:18s} {100*hit/len(idx):5.1f}%   ({hit}/{len(idx)})')

    if args.each:
        print('\n  every image:')
        for i in range(len(items)):
            mark = 'ok  ' if pred[i] == truth[i] else 'MISS'
            print(f'    {mark} {os.path.basename(paths[i]):34s} '
                  f'true={truth[i]:44s} pred={pred[i]:44s} {conf[i]:5.1f}%')


if __name__ == '__main__':
    main()
