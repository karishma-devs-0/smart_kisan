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

# PlantDoc folder -> the crop and disease the model should return.
#
# `None` disease means a healthy leaf. Classes PlantDoc has that the model was
# never trained on are mapped to None/None and skipped, rather than counted as
# failures - the model cannot be marked down for a class that does not exist in
# its output space.
PLANTDOC_TO_TRUTH = {
    'Apple Scab Leaf':            ('Apple', 'Apple scab'),
    'Apple leaf':                 ('Apple', None),
    'Apple rust leaf':            ('Apple', 'Cedar apple rust'),
    'Bell_pepper leaf':           ('Pepper', None),
    'Bell_pepper leaf spot':      ('Pepper', 'Bacterial spot'),
    'Blueberry leaf':             ('Blueberry', None),
    'Cherry leaf':                ('Cherry', None),
    'Corn Gray leaf spot':        ('Corn', 'Cercospora leaf spot Gray leaf spot'),
    'Corn leaf blight':           ('Corn', 'Northern Leaf Blight'),
    'Corn rust leaf':             ('Corn', 'Common rust'),
    'Peach leaf':                 ('Peach', None),
    'Potato leaf early blight':   ('Potato', 'Early blight'),
    'Potato leaf late blight':    ('Potato', 'Late blight'),
    'Raspberry leaf':             ('Raspberry', None),
    'Soyabean leaf':              ('Soybean', None),
    'Squash Powdery mildew leaf': ('Squash', 'Powdery mildew'),
    'Strawberry leaf':            ('Strawberry', None),
    'Tomato Early blight leaf':   ('Tomato', 'Early blight'),
    'Tomato Septoria leaf spot':  ('Tomato', 'Septoria leaf spot'),
    'Tomato leaf bacterial spot': ('Tomato', 'Bacterial spot'),
    'Tomato leaf late blight':    ('Tomato', 'Late blight'),
    'Tomato leaf mosaic virus':   ('Tomato', 'Tomato mosaic virus'),
    'Tomato leaf yellow virus':   ('Tomato', 'Tomato Yellow Leaf Curl Virus'),
    'Tomato leaf':                ('Tomato', None),
    'Tomato mold leaf':           ('Tomato', 'Leaf Mold'),
    'grape leaf black rot':       ('Grape', 'Black rot'),
    'grape leaf':                 ('Grape', None),
}


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
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode())


def collect(limit_per_class=None):
    if not os.path.isdir(PLANTDOC_TEST):
        sys.exit(f'PlantDoc test split not found at {PLANTDOC_TEST}')

    items = []
    for folder in sorted(os.listdir(PLANTDOC_TEST)):
        truth = PLANTDOC_TO_TRUTH.get(folder)
        if not truth:
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
            items.append((os.path.join(d, n), truth[0], truth[1], folder))
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

    for i, (path, crop, disease, folder) in enumerate(items, 1):
        try:
            r = post_image(path)
        except Exception as e:
            failures += 1
            print(f'  [{i}/{len(items)}] request failed for '
                  f'{os.path.basename(path)}: {e}')
            continue

        got_crop = r.get('crop')
        got_disease = None if r.get('is_healthy') else r.get('disease')
        conf = float(r.get('confidence') or 0)

        crop_ok = normalise(got_crop) == normalise(crop)
        disease_ok = normalise(got_disease) == normalise(disease)
        crop_hits += crop_ok
        disease_hits += disease_ok

        if conf < MIN_CONFIDENCE:
            below_floor += 1
            if not disease_ok:
                below_floor_wrong += 1
        elif not disease_ok:
            confidently_wrong.append((folder, got_crop, got_disease, conf))

        rows.append((folder, os.path.basename(path), crop, disease,
                     got_crop, got_disease, conf, crop_ok, disease_ok))

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
        by_folder.setdefault(r[0], []).append(r[8])
    for folder in sorted(by_folder):
        hits = by_folder[folder]
        print(f'    {folder:30s} {100 * sum(hits) / len(hits):5.1f}%  '
              f'({sum(hits)}/{len(hits)})')

    if confidently_wrong:
        print('\n  most confident mistakes:')
        for folder, gc, gd, conf in sorted(confidently_wrong,
                                           key=lambda x: -x[3])[:10]:
            print(f'    {folder:30s} -> {gc} / {gd}  at {conf:.1f}%')

    if args.each:
        print('\n  every image:')
        for (folder, name, crop, dis, gc, gd, conf, ck, dk) in rows:
            print(f'    {"ok  " if dk else "MISS"} {name:34s} '
                  f'true={crop}/{dis}  pred={gc}/{gd}  {conf:.1f}%')


if __name__ == '__main__':
    main()
