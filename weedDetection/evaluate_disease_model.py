"""
Measures the plant disease model against real field photographs.

WHY THIS EXISTS
---------------
The disease model is a MobileNetV2 trained on PlantVillage: single leaves,
detached, laid on a plain background under even studio light. Testing it on
PlantVillage's own held-out split reports how well it learned that setup, and
it scores very highly there. It says nothing about a photograph taken in a
field on a phone, which is the only kind the app will ever receive.

PlantDoc is the honest test. Same crops and diseases, but photographed in situ
- leaves still on the plant, cluttered backgrounds, real light, at whatever
angle the photographer stood. It was collected specifically to show how far
PlantVillage-trained models fall when they meet the real world.

The model runs on a hosted service rather than locally, so this posts each
image to the same endpoint the app calls. It therefore also tests the endpoint,
the upload path and the response format, not only the weights.

WHAT IT REPORTS
---------------
Three numbers, because "accuracy" alone hides what matters to a farmer:

  crop accuracy      did it identify the plant at all
  disease accuracy   did it get the specific diagnosis right
  confidently wrong  wrong answers given above the confidence floor - the
                     dangerous ones, since these reach the farmer as advice

It also reports what the app's 60% confidence floor actually buys: how many
answers it suppresses, and how many of those were wrong anyway.

Usage:
  .venv/Scripts/python.exe evaluate_disease_model.py --limit 40
  .venv/Scripts/python.exe evaluate_disease_model.py            # all ~230
  .venv/Scripts/python.exe evaluate_disease_model.py --each
"""

import argparse
import json
import os
import random
import sys
import time
import urllib.error
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
PLANTDOC_TEST = os.path.join(HERE, 'data', 'plantdoc', 'plantdoc_files', 'test')

SPACE_URL = os.environ.get(
    'HF_SPACE_URL',
    'https://karishma-devs-smartkisan-plant-disease.hf.space',
)

# The floor the app applies. Below this it asks for a clearer photo instead of
# naming a disease and a treatment. See scanImage in src/services/api.js.
MIN_CONFIDENCE = 60

# PlantDoc folder -> the exact PlantVillage class the model should return.
#
# Compared against the response's `class_name` rather than its prettified
# `disease` field. The pretty names are not stable against the dataset labels:
# the model answers "Gray Leaf Spot" where PlantVillage calls the class
# "Cercospora_leaf_spot Gray_leaf_spot", so a first pass scored every one of
# those as wrong when they were right. class_name is the label the model was
# trained on and matches PlantVillage exactly, so there is nothing to guess.
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
    'grape leaf black rot':       'Grape___Black_rot',
    'grape leaf':                 'Grape___healthy',
}


def crop_of(class_name):
    """The crop half of a PlantVillage label."""
    return class_name.split('___')[0] if class_name else ''


def normalise(text):
    """Loose comparison: the two datasets punctuate the same disease differently."""
    if text is None:
        return ''
    return ''.join(ch for ch in str(text).lower() if ch.isalnum())


def post_image(path, timeout=90):
    """Multipart upload, matching what the app sends."""
    boundary = '----SmartKisanEval' + str(random.randint(10 ** 8, 10 ** 9))
    with open(path, 'rb') as fh:
        payload = fh.read()

    body = b''.join([
        f'--{boundary}\r\n'.encode(),
        b'Content-Disposition: form-data; name="file"; filename="leaf.jpg"\r\n',
        b'Content-Type: image/jpeg\r\n\r\n',
        payload,
        f'\r\n--{boundary}--\r\n'.encode(),
    ])

    req = urllib.request.Request(
        f'{SPACE_URL}/predict',
        data=body,
        headers={'Content-Type': f'multipart/form-data; boundary={boundary}'},
        method='POST',
    )

    # A long run trips over transient DNS failures on this connection - the
    # first pass lost 129 of 236 images to getaddrinfo, which would have been
    # read as the model failing rather than the network. Retried with a short
    # backoff so the measurement reflects the model.
    last = None
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                return json.loads(resp.read().decode())
        except Exception as e:
            last = e
            time.sleep(1.5 * (attempt + 1))
    raise last


def collect(limit_per_class=None):
    if not os.path.isdir(PLANTDOC_TEST):
        sys.exit(f'PlantDoc test split not found at {PLANTDOC_TEST}')

    items = []
    for folder in sorted(os.listdir(PLANTDOC_TEST)):
        expected = PLANTDOC_TO_CLASS.get(folder)
        if not expected:
            print(f'  note: no mapping for "{folder}", skipped')
            continue
        d = os.path.join(PLANTDOC_TEST, folder)
        if not os.path.isdir(d):
            continue
        names = sorted(n for n in os.listdir(d)
                       if n.lower().endswith(('.jpg', '.jpeg', '.png')))
        if limit_per_class:
            names = names[:limit_per_class]
        for n in names:
            items.append((os.path.join(d, n), expected, folder))
    return items


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--limit', type=int, default=None,
                    help='max images per class (keeps a quick run quick)')
    ap.add_argument('--each', action='store_true', help='print every prediction')
    ap.add_argument('--pause', type=float, default=0.3,
                    help='seconds between requests, to be polite to the Space')
    args = ap.parse_args()

    items = collect(args.limit)
    if not items:
        sys.exit('No images to test.')

    print(f'endpoint: {SPACE_URL}')
    print(f'images:   {len(items)} from PlantDoc test (real field photographs)\n')

    # The free Space sleeps; the first call pays the wake-up.
    print('waking the model...', end=' ', flush=True)
    t0 = time.time()
    try:
        urllib.request.urlopen(SPACE_URL, timeout=90).read(1)
        print(f'up in {time.time() - t0:.1f}s\n')
    except Exception as e:
        print(f'\n  could not reach the Space: {e}')
        sys.exit(1)

    crop_hits = disease_hits = 0
    confidently_wrong = []
    below_floor = 0
    below_floor_wrong = 0
    failures = 0
    rows = []

    for i, (path, expected, folder) in enumerate(items, 1):
        try:
            r = post_image(path)
        except Exception as e:
            failures += 1
            print(f'  [{i}/{len(items)}] request failed for '
                  f'{os.path.basename(path)}: {e}')
            continue

        got_class = r.get('class_name') or ''
        conf = float(r.get('confidence') or 0)

        crop_ok = normalise(crop_of(got_class)) == normalise(crop_of(expected))
        disease_ok = normalise(got_class) == normalise(expected)
        crop_hits += crop_ok
        disease_hits += disease_ok

        if conf < MIN_CONFIDENCE:
            below_floor += 1
            if not disease_ok:
                below_floor_wrong += 1
        elif not disease_ok:
            confidently_wrong.append((folder, got_class, conf))

        rows.append((folder, os.path.basename(path), expected, got_class,
                     conf, crop_ok, disease_ok))

        if i % 25 == 0:
            print(f'  {i}/{len(items)}...')
        time.sleep(args.pause)

    tested = len(rows)
    if not tested:
        sys.exit('Every request failed.')

    print(f'\n{"=" * 66}')
    print(f'PlantDoc field photographs — {tested} images'
          + (f' ({failures} requests failed)' if failures else ''))
    print('=' * 66)
    print(f'  crop identified:     {100 * crop_hits / tested:5.1f}%  '
          f'({crop_hits}/{tested})')
    print(f'  disease identified:  {100 * disease_hits / tested:5.1f}%  '
          f'({disease_hits}/{tested})')

    print(f'\n  The app suppresses answers below {MIN_CONFIDENCE}% confidence:')
    print(f'    suppressed:        {below_floor} '
          f'({100 * below_floor / tested:.0f}% of all answers)')
    if below_floor:
        print(f'    of those, wrong:   {below_floor_wrong}/{below_floor} '
              f'({100 * below_floor_wrong / below_floor:.0f}%)')
    print(f'    still wrong above the floor: {len(confidently_wrong)} '
          f'({100 * len(confidently_wrong) / tested:.0f}% of all answers)')
    print('\n  The last line is the one that matters: those reach the farmer as'
          '\n  a confident diagnosis with a treatment to buy.')

    # Per-class recall, so a class the model never gets right is visible rather
    # than averaged away.
    print('\n  by class (disease correct):')
    by_folder = {}
    for r in rows:
        by_folder.setdefault(r[0], []).append(r[6])
    for folder in sorted(by_folder):
        hits = by_folder[folder]
        print(f'    {folder:30s} {100 * sum(hits) / len(hits):5.1f}%  '
              f'({sum(hits)}/{len(hits)})')

    if confidently_wrong:
        print('\n  most confident mistakes:')
        for folder, got, conf in sorted(confidently_wrong,
                                        key=lambda x: -x[2])[:12]:
            print(f'    {folder:30s} -> {got}  at {conf:.1f}%')

    if args.each:
        print('\n  every image:')
        for (folder, name, expected, got, conf, ck, dk) in rows:
            print(f'    {"ok  " if dk else "MISS"} {name:34s} '
                  f'true={expected}  pred={got}  {conf:.1f}%')


if __name__ == '__main__':
    main()
