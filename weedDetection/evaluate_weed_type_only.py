"""
What if the model stopped trying to answer the crop question?

WHY ASK
-------
On 540 real photographs (fetch_wild_test.py), the crop class scores 23.3% for
the shipped model and 0.0% for both retrained ones. Thirty real photographs of
sorghum, and the retrained models identify none of them.

That is not a tuning problem. Crop was taught from seedlings on one farm in one
season, and a real photograph of sorghum is usually a mature plant with a seed
head. Worse, the crop class is only ever right for sorghum: wheat, rice and
maize get called grass_weed 70-76% of the time, which in the app becomes advice
to spray the farmer's own field.

But the app already knows which crops the farmer grows - state.crops.crops[],
collected at onboarding. The crop question does not need to be answered from
the photograph at all. The photograph only needs to answer the question the
farmer is actually asking, which is which herbicide to buy: is this a grass or a
broadleaf.

So: take the existing models, ignore the crop output entirely, and score only
grass against broadleaf. If that is much better than the three-way score, the
crop class is costing accuracy on the question that matters, and the honest
design is to stop asking the model for it.

This needs no retraining - it is the same weights read differently - so it is
worth knowing before spending another run on it.

MEASURED RESULT, 15 September 2026
----------------------------------
Ignoring the crop output helps everywhere, and it helps most where it matters.

                             three-way    grass-vs-broadleaf
  shipped, wild-inat (390)      79.0%          82.1%
      grass                     92.8%          95.6%
      broadleaf                 67.1%          70.5%
  cap 200, wild-inat (390)      81.5%          82.6%
      grass                     79.4%          81.7%
      broadleaf                 83.3%          83.3%
  cap 200, rice-weeds (800)     79.0%          79.2%
  shipped, rice-weeds (800)     70.6%          73.0%
  cap 200, sorghum-test         95.2%          99.3%
      grass                     91.8%         100.0%

On the home collection grass goes to 100% for every model once crop is out of
the way. The crop class was not merely failing at its own job, it was eating
correct grass answers - sorghum is a grass, so every grass weed had to beat a
class built from photographs of a grass.

Against the shipped model, read this way, cap 200 wins or ties on all three
sets and is far better balanced: 81.7/83.3 against 95.6/70.5 on real
photographs, and 79.2% against 73.0% on the held-out collection.

WHAT FOLLOWS
The crop question should not be asked of the photograph. It scores 0-23% on
real images, it cannot generalise past sorghum (wheat, rice and maize are
called grass_weed 70-76% of the time), and removing it improves the question
the farmer is actually asking. The app knows the farmer's crops already.

For a farmer growing a broadleaf crop - cotton, chilli, pulses, most
vegetables - a grass in the field is a weed, full stop, and the answer is
clean. For a cereal - wheat, rice, maize, sorghum - a grass may well be the
crop, and the app has to say so rather than guess. That is honest, it is
actionable, and it needs no data we do not have.

Usage:
  .venv/Scripts/python.exe evaluate_weed_type_only.py
"""

import os
import sys

os.environ.setdefault('TF_CPP_MIN_LOG_LEVEL', '3')

import numpy as np  # noqa: E402
import tensorflow as tf  # noqa: E402

import evaluate_weed_model as base  # noqa: E402

MODELS = [
    ('shipped (sorghum only)', 'model/sorghum/best.keras'),
    ('+MH-Weed16 cap 500', 'model/india3_holdout/best.keras'),
    ('+MH-Weed16 cap 200', 'model/india3_balanced/best.keras'),
    # Trained on public photographs from ~1,400 people, none of whom appear in
    # the wild-inat set below. That disjointness is the reason this row can be
    # read: every earlier row was trained on one or two campaigns and scored
    # against a third, which rewards a shared style rather than the plant.
    ('+public photos (inat)', 'model/inat/best.keras'),
]

# Sets that contain both weed types. The crop images are excluded here by
# construction: with no crop class there is no correct answer for them, and
# that is the whole point - the app answers that part from what the farmer
# already told it.
SET_NAMES = ['wild-inat', 'rice-weeds-ood', 'sorghum-test']


def weed_type_only(probs, classes):
    """Argmax over grass and broadleaf, ignoring crop entirely."""
    gi = classes.index('grass_weed')
    bi = classes.index('broadleaf_weed')
    return np.where(probs[:, gi] > probs[:, bi], gi, bi)


def main():
    print('Scoring grass against broadleaf only, crop output ignored.')
    print('Crop images are dropped from each set - with no crop class there is')
    print('no correct answer for them, which is the point.')

    for label, path in MODELS:
        full = os.path.join(base.HERE, path)
        if not os.path.exists(full):
            print('\n%s: not present, skipped' % label)
            continue
        base.adopt_model_classes(full)
        classes = base.CLASSES
        model = tf.keras.models.load_model(full)

        print()
        print('=' * 62)
        print('%s   [%s]' % (label, ', '.join(classes)))
        for sname in SET_NAMES:
            pairs = [p for p in base.SETS[sname]() if p[1] != 'crop']
            if not pairs:
                continue
            probs = base.predict_all(model, [p for p, _ in pairs])

            three = [classes[i] for i in probs.argmax(axis=1)]
            two = [classes[i] for i in weed_type_only(probs, classes)]
            truth = [t for _, t in pairs]

            def acc(pred):
                return 100.0 * sum(1 for p, t in zip(pred, truth) if p == t) / len(truth)

            def rec(pred, cls):
                idx = [i for i, t in enumerate(truth) if t == cls]
                if not idx:
                    return None
                return 100.0 * sum(1 for i in idx if pred[i] == cls) / len(idx)

            print('  %-16s (%4d imgs)  three-way %5.1f%%   grass-vs-broadleaf %5.1f%%'
                  % (sname, len(pairs), acc(three), acc(two)))
            for cls in ('grass_weed', 'broadleaf_weed'):
                a, b = rec(three, cls), rec(two, cls)
                if a is not None:
                    print('      %-16s %5.1f%%  ->  %5.1f%%' % (cls, a, b))


if __name__ == '__main__':
    main()
