"""
What does knowing the farmer's crop buy us, with no retraining?

THE IDEA
--------
The model's three classes are crop / grass_weed / broadleaf_weed, where "crop"
means sorghum, because sorghum is the only crop it was ever shown. Sorghum is
itself a grass.

So outside a sorghum field, P(crop) is not evidence that the plant is the
farmer's crop. It is evidence that the plant is a GRASS that happens to look
like the one grass the model knows well. For a farmer growing cotton, chilli,
soybean or any other broadleaf crop, a grass in the field is a weed whatever
species it is - so the honest reading of the model's output is:

    P(this is a grass weed) = P(crop) + P(grass_weed)

The app already knows which crops the farmer grows: state.crops.crops[].name,
collected during onboarding and shown on MyCrops. It has simply never been
passed to the weed screen.

This measures whether that reading actually helps, on the test sets already on
disk, before any code in the app changes.

  plain       argmax over the three classes - what the app does today
  crop-aware  for a farmer growing a broadleaf crop: answer grass_weed when
              P(crop) + P(grass_weed) exceeds P(broadleaf_weed)

Only the sets whose crop is genuinely broadleaf are eligible. CoFly is a cotton
field. DeepWeeds is rangeland with no crop at all and every image broadleaf, so
it is included as a check that the rule does not simply turn everything into
grass. The sorghum split is NOT eligible and is reported under the plain rule
only - there the crop really is sorghum and the rule would be wrong by
construction.

MEASURED RESULT, 15 September 2026
----------------------------------
It does not help. Keeping this so the idea is not had twice.

    cofly-ood (684)     plain       66.2%   grass 12.8%   broadleaf 94.0%
                        crop-aware  66.5%   grass 14.1%   broadleaf 93.8%

    deepweeds-ood (600) plain       52.5%                 broadleaf 52.5%
                        crop-aware  51.7%                 broadleaf 51.7%

1.3 points of grass recall, and slightly worse on broadleaf. The reasoning was
sound and the premise was wrong: the grass the model misses does not get called
"crop", it gets called "broadleaf". Of 234 grass images CoFly misses, 203 go to
broadleaf and 1 goes to crop. Folding P(crop) into grass therefore has almost
nothing to fold.

The one failure it does fix is real but rare - barnyard grass called "crop" at
97.6% confidence in internet_test, which is the worst kind of error the app can
make, since it tells a farmer a weed is his crop. Not enough on its own to
justify the plumbing.

What this rules out: no re-reading of the current model's outputs recovers
grass. The model does not know grass off its home farm, and only training data
from other farms will change that. See fetch_indian_weeds.py.

Usage:
  .venv/Scripts/python.exe evaluate_crop_aware.py
"""

import os
import sys

os.environ.setdefault('TF_CPP_MIN_LOG_LEVEL', '3')

import numpy as np  # noqa: E402
import tensorflow as tf  # noqa: E402

import evaluate_weed_model as base  # noqa: E402

CLASSES = base.CLASSES
IDX = {c: i for i, c in enumerate(CLASSES)}


def crop_aware(probs):
    """Re-read the model's output for a farmer growing a broadleaf crop.

    P(crop) means "looks like the one grass I know", so it counts towards
    grass rather than against it. Broadleaf is unaffected: a broadleaf weed in
    a broadleaf crop still has to be told apart on its own evidence.
    """
    grass = probs[:, IDX['grass_weed']] + probs[:, IDX['crop']]
    broad = probs[:, IDX['broadleaf_weed']]
    return np.where(grass > broad, IDX['grass_weed'], IDX['broadleaf_weed'])


def score(pairs, pred_idx):
    pred = [CLASSES[i] for i in pred_idx]
    truth = [lbl for _, lbl in pairs]
    per = {}
    for cls in CLASSES:
        idx = [i for i, t in enumerate(truth) if t == cls]
        if idx:
            per[cls] = 100.0 * sum(1 for i in idx if pred[i] == cls) / len(idx)
    overall = 100.0 * sum(1 for i, t in enumerate(truth) if pred[i] == t) / len(truth)
    return overall, per


def line(tag, overall, per):
    print('    %-12s %7.1f%%   grass %s   broadleaf %s' % (
        tag, overall,
        ('%5.1f%%' % per['grass_weed']) if 'grass_weed' in per else '    -  ',
        ('%5.1f%%' % per['broadleaf_weed']) if 'broadleaf_weed' in per else '    -  '))


def main():
    model_path = sys.argv[1] if len(sys.argv) > 1 else base.DEFAULT_MODEL
    if not os.path.exists(model_path):
        sys.exit('No model at %s' % model_path)
    model = tf.keras.models.load_model(model_path)

    # Whether a crop-aware reading is even legitimate for each set.
    eligible = {
        'sorghum-test': False,   # the crop really is sorghum here
        'test_pack': False,      # mixed provenance, crop unknown
        'internet_test': False,  # mixed provenance, crop unknown
        'cofly-ood': True,       # cotton field, Larissa
        'deepweeds-ood': True,   # rangeland, no crop; all broadleaf
    }

    print('Does knowing the crop help? (model: %s)' % os.path.basename(model_path))
    print()

    for name, fn in base.SETS.items():
        pairs = fn()
        if not pairs:
            continue
        probs = base.predict_all(model, [p for p, _ in pairs])
        print('  %s  (%d images)' % (name, len(pairs)))
        line('plain', *score(pairs, probs.argmax(axis=1)))
        if eligible.get(name):
            line('crop-aware', *score(pairs, crop_aware(probs)))
        else:
            print('    %-12s not applicable - the crop here is not broadleaf'
                  % 'crop-aware')
        print()


if __name__ == '__main__':
    main()
