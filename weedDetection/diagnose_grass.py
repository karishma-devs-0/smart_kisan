"""
Is the grass class weak, or is it only weak when fine detail is gone?

WHY THIS EXISTS
---------------
The shipped model scores 12.8% recall on grass in the CoFly set and that number
has been quoted as "grass is the weak class". Before retraining anything on the
strength of it, the number needs to mean what it appears to mean.

CoFly is a drone at 5 m looking straight down. What separates a grass from a
broadleaf is largely fine detail - parallel venation, blade width, the way a
leaf meets the stem. A broadleaf is separable by its outline alone, which
survives almost any amount of blur. So a model could look catastrophic on grass
in drone imagery and be perfectly sound on the 20-40 cm photograph an app
actually receives, purely because the evidence it needs is not in the drone
pixels.

That would make 12.8% a fact about CoFly rather than a fact about the model,
and retraining to "fix" it would be fixing the wrong thing. The last time a fix
was attempted before the diagnosis - on the disease model - it made tomato
worse.

THE TEST
--------
Take the sorghum test split, which the model scores 97.4% on, and destroy fine
detail in a controlled way: downsample to k x k, then scale back to 224. The
outline survives; the texture does not. Then watch per-class recall as k falls.

  If grass recall collapses far faster than broadleaf recall, the grass signal
  is fine detail, CoFly is measuring resolution rather than competence, and the
  app number is closer to the 97% than to the 13%.

  If both classes degrade together, the CoFly result is a real domain failure
  and grass genuinely needs more training data.

Also reports how much fine detail each test set actually contains, measured as
the variance of the Laplacian, so the claim "CoFly is blurrier" is a number
rather than an assertion.

MEASURED RESULT, 15 September 2026
----------------------------------
The hypothesis is wrong, and that is worth knowing before spending a day on it.

Degrading the sorghum test split (431 images, shipped model):

    k        overall   broadleaf    crop    grass
    224        97.4%       97.9%   98.6%    95.9%
    112        93.7%       99.3%   98.6%    83.7%
     64        87.0%      100.0%   96.4%    65.3%
     48        74.2%       97.9%   89.3%    36.7%
     32        56.8%       91.0%   77.1%     4.1%
     24        45.5%       62.5%   75.0%     0.7%
     16        37.1%       39.6%   73.6%     0.0%

So grass IS a fine-detail class, decisively: broadleaf is still at 91% where
grass has fallen to 4%. Blade venation is the evidence, and it is the first
thing blur destroys.

But that does not explain CoFly, because CoFly is not blurry enough:

    sorghum test      detail 3008.6
    cofly patches     detail 1697.8      <- half as sharp, not a fortieth
    sorghum at k=112  detail  153.5      <- where grass first slips

CoFly holds an order of magnitude more detail than the level at which grass
begins to fail. The 12.8% is therefore a real domain failure, not an artefact
of altitude, and retraining on more varied grass imagery is justified rather
than merely assumed.

The sharper reading: CoFly's grass is johnson grass, and so is much of the
sorghum set's. Same species, 95.9% on one farm and 12.8% on another. That is
not a gap in species coverage - it is viewpoint, camera and context.

Two things follow.

  1. Grass needs training imagery from more than one farm. More images of the
     same farm will not help, exactly as more laboratory photographs did not
     help tomato.

  2. Grass identification needs a close, sharp photograph in a way broadleaf
     identification does not. A farmer shooting from standing height gets a
     usable broadleaf answer and an unusable grass one, and the app currently
     cannot tell the difference. Worth a blur guard that asks for a closer
     photograph rather than guessing - the same reasoning as the confidence
     floor on the disease model.

Usage:
  .venv/Scripts/python.exe diagnose_grass.py
"""

import os
import sys

os.environ.setdefault('TF_CPP_MIN_LOG_LEVEL', '3')

import numpy as np  # noqa: E402
import tensorflow as tf  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
IMG_SIZE = 224
CLASSES = ['broadleaf_weed', 'crop', 'grass_weed']

MODEL = os.path.join(HERE, 'model', 'sorghum', 'best.keras')

SORGHUM_TEST = os.path.join(HERE, 'data', 'sorghum',
                            'SorghumWeedDataset_Classification', 'Test')
FOLDER_TO_CLASS = {
    'Class0_Sorghum': 'crop',
    'Class1_Grass': 'grass_weed',
    'Class2_BroadLeafWeed': 'broadleaf_weed',
}

COFLY = os.path.join(HERE, 'data', 'cofly_patches')
COFLY_TO_CLASS = {
    'johnson_grass': 'grass_weed',
    'purslane': 'broadleaf_weed',
    'field_bindweed': 'broadleaf_weed',
}

# 224 is the model's own input size, so it is the undegraded control.
LEVELS = [224, 112, 64, 48, 32, 24, 16]


def collect(root, mapping, cap=None):
    pairs = []
    for folder in sorted(os.listdir(root)):
        label = mapping.get(folder)
        if label is None:
            continue
        d = os.path.join(root, folder)
        if not os.path.isdir(d):
            continue
        files = sorted(f for f in os.listdir(d)
                       if f.lower().endswith(('.jpg', '.jpeg', '.png')))
        if cap:
            files = files[:cap]
        pairs += [(os.path.join(d, f), label) for f in files]
    return pairs


def load_raw(path):
    """Decoded and resized to 224, still 0-255. Degradation happens after."""
    raw = tf.io.read_file(path)
    img = tf.image.decode_image(raw, channels=3, expand_animations=False)
    img = tf.image.resize(img, (IMG_SIZE, IMG_SIZE))
    return tf.cast(img, tf.float32)


def degrade(img, k):
    """Throw away detail finer than k x k, keeping the image 224 x 224.

    Down then up, both bilinear. The outline survives; venation and blade edges
    do not. This is what altitude does to a photograph.
    """
    if k >= IMG_SIZE:
        return img
    small = tf.image.resize(img, (k, k), method='area')
    return tf.image.resize(small, (IMG_SIZE, IMG_SIZE), method='bilinear')


def laplacian_var(img):
    """Variance of the Laplacian: a standard, blunt measure of how much fine
    detail an image holds. Blurry images score low."""
    grey = tf.image.rgb_to_grayscale(img)[None, ...]
    kernel = tf.constant([[0., 1., 0.], [1., -4., 1.], [0., 1., 0.]])
    kernel = kernel[:, :, None, None]
    lap = tf.nn.conv2d(grey, kernel, strides=1, padding='VALID')
    return float(tf.math.reduce_variance(lap))


def predict(model, paths, k, batch=16):
    out = []
    for i in range(0, len(paths), batch):
        chunk = paths[i:i + batch]
        arr = tf.stack([degrade(load_raw(p), k) for p in chunk])
        arr = tf.keras.applications.mobilenet_v2.preprocess_input(arr)
        out.append(model.predict(arr, verbose=0))
    return np.concatenate(out)


def recalls(pairs, probs):
    pred = [CLASSES[i] for i in probs.argmax(axis=1)]
    out = {}
    for cls in CLASSES:
        idx = [i for i, (_, lbl) in enumerate(pairs) if lbl == cls]
        if not idx:
            continue
        hit = sum(1 for i in idx if pred[i] == cls)
        out[cls] = 100.0 * hit / len(idx)
    overall = 100.0 * sum(1 for i, (_, lbl) in enumerate(pairs)
                          if pred[i] == lbl) / len(pairs)
    return out, overall


def main():
    if not os.path.exists(MODEL):
        sys.exit('No model at %s' % MODEL)
    if not os.path.isdir(SORGHUM_TEST):
        sys.exit('No sorghum test split at %s' % SORGHUM_TEST)

    model = tf.keras.models.load_model(MODEL)
    pairs = collect(SORGHUM_TEST, FOLDER_TO_CLASS)
    print('sorghum test split: %d images' % len(pairs))
    print('degrading to k x k, then back to 224 - outline survives, texture does not')
    print()
    print('  %-6s %10s %10s %10s %10s' %
          ('k', 'overall', 'broadleaf', 'crop', 'grass'))
    print('  ' + '-' * 50)

    for k in LEVELS:
        probs = predict(model, [p for p, _ in pairs], k)
        per, overall = recalls(pairs, probs)
        print('  %-6d %9.1f%% %9.1f%% %9.1f%% %9.1f%%' %
              (k, overall, per.get('broadleaf_weed', 0),
               per.get('crop', 0), per.get('grass_weed', 0)))

    # How much detail each collection actually holds, so "CoFly is blurrier"
    # is a measurement rather than an assertion.
    print()
    print('fine detail actually present (variance of Laplacian, higher = sharper)')
    sets = [('sorghum test', pairs[:150])]
    if os.path.isdir(COFLY):
        sets.append(('cofly patches', collect(COFLY, COFLY_TO_CLASS, cap=50)))
    for name, ps in sets:
        vals = [laplacian_var(load_raw(p)) for p, _ in ps]
        print('  %-16s %8.1f   (%d images)' % (name, float(np.median(vals)), len(ps)))

    # And what the sorghum images look like once degraded to CoFly's detail
    # level, for comparison against the table above.
    if len(sets) > 1:
        target = float(np.median([laplacian_var(load_raw(p)) for p, _ in sets[1][1]]))
        detail = {k: float(np.median([laplacian_var(degrade(load_raw(p), k))
                                      for p, _ in pairs[:60]]))
                  for k in LEVELS}
        closest = min(LEVELS, key=lambda k: abs(detail[k] - target))
        print()
        print('  sorghum images degraded, against cofly detail of %.1f:' % target)
        for k in LEVELS:
            print('    k=%-4d detail %8.1f%s'
                  % (k, detail[k], '   <-- matches cofly' if k == closest else ''))


if __name__ == '__main__':
    main()
