"""
The disease classes SmartKisan actually needs, and where each one's data lives.

WHY THE CLASS LIST CHANGED
--------------------------
The deployed model classifies 38 PlantVillage classes. Sixteen of those are
apple, grape, cherry, peach, blueberry, raspberry and strawberry: temperate
orchard and berry crops that a smallholder in Punjab or Tamil Nadu does not
grow. They were never useful here, and they were actively harmful - wrong
answers landed in them (apple scab read as strawberry leaf scorch, cherry as
apple healthy), so they absorbed probability mass that belonged elsewhere.

Worse, the two crops most of our users actually grow - wheat and rice - had no
classes at all. A farmer photographing wheat got a confident answer about a
tomato, because tomato was the closest thing the model knew.

So: drop the orchard and berry crops, and add rice and wheat from field-
photographed sources.

LICENCES
--------
This is a commercial product, so every source here permits commercial use with
attribution. Anything CC BY-NC was rejected during the search, including a
large Bangladeshi multi-crop set that would otherwise have been a good fit.

  PlantVillage   CC0 / public domain          lab photographs, 38 classes
  PlantDoc       CC BY 4.0                    field photographs, 27 classes
  Rice (Mendeley fwcj7stb8r)   CC BY 4.0      5,932 field photographs
  Rice (Mendeley g7tcwvshff)   CC BY 4.0      adds the healthy class
  Wheat (Zenodo 7307816)       CC BY 4.0      999 field photographs

MEASURED RESULT
---------------
On the held-out set, 658 images:

    all together          85.1% exact disease, 98.2% crop
    rice                  95.2%   (375 images)
    wheat                 89.4%   (141)
    capsicum              82.4%   (17)
    maize                 65.4%   (26)
    tomato                43.5%   (69)
    potato                31.2%   (16)

Read the spread, not the average. The headline is carried by rice and wheat,
which have the most data and whose test split was made here rather than
published. Tomato and potato are no better than before.

Compared like for like - the same 142 PlantDoc images, which is the only fair
comparison because the orchard images left the test set with their classes:

    deployed MobileNetV2       38 classes   29.6% disease   55.6% crop
    field-tuned MobileNetV2    38 classes   55.6%           84.5%
    EfficientNetV2B0 @288      38 classes   50.7%           81.0%
    this model                 32 classes   54.2%           91.5%

So on the crops that were always there, naming the disease is unchanged. What
improved sharply is knowing which plant it is, 84.5% to 91.5%, which is what
dropping sixteen distractor classes buys.

The actual win is not in this table: wheat and rice could not be diagnosed at
all before, and are now around 90%. Those are the crops most of our users grow.

Worth noting against an earlier claim: EfficientNetV2B0 was reported as beating
MobileNetV2 by nearly four points. On the full 38-class set it did, but that
gain sat in the apple and grape classes. On the crops kept here it is behind.

A HEALTHY CLASS FOR EVERY CROP
------------------------------
The first rice source has four disease classes and no healthy one. Training on
it alone would mean every photograph of rice comes back as a disease - the
exact fault just fixed elsewhere, where 42% of healthy plants were being sent
a fungicide recommendation. The second rice source supplies healthy leaves, and
the wheat set has its own healthy class.
"""

# ─── Crops our users grow, kept from PlantVillage ────────────────────────────
# Tomato, potato, chilli/capsicum, maize, soybean and citrus are all grown by
# Indian smallholders. Squash stands in for the gourd family.
KEEP_PLANTVILLAGE = [
    'Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot',
    'Corn_(maize)___Common_rust_',
    'Corn_(maize)___Northern_Leaf_Blight',
    'Corn_(maize)___healthy',
    'Orange___Haunglongbing_(Citrus_greening)',
    'Pepper,_bell___Bacterial_spot',
    'Pepper,_bell___healthy',
    'Potato___Early_blight',
    'Potato___Late_blight',
    'Potato___healthy',
    'Soybean___healthy',
    'Squash___Powdery_mildew',
    'Tomato___Bacterial_spot',
    'Tomato___Early_blight',
    'Tomato___Late_blight',
    'Tomato___Leaf_Mold',
    'Tomato___Septoria_leaf_spot',
    'Tomato___Spider_mites Two-spotted_spider_mite',
    'Tomato___Target_Spot',
    'Tomato___Tomato_Yellow_Leaf_Curl_Virus',
    'Tomato___Tomato_mosaic_virus',
    'Tomato___healthy',
]

# ─── Dropped, and why ────────────────────────────────────────────────────────
# Kept as a list rather than deleted so the decision is reviewable: if the
# product ever targets Himachal or Kashmir orchards, apple and cherry come back.
DROPPED_PLANTVILLAGE = [
    'Apple___Apple_scab', 'Apple___Black_rot', 'Apple___Cedar_apple_rust',
    'Apple___healthy', 'Blueberry___healthy',
    'Cherry_(including_sour)___Powdery_mildew', 'Cherry_(including_sour)___healthy',
    'Grape___Black_rot', 'Grape___Esca_(Black_Measles)',
    'Grape___Leaf_blight_(Isariopsis_Leaf_Spot)', 'Grape___healthy',
    'Peach___Bacterial_spot', 'Peach___healthy',
    'Raspberry___healthy', 'Strawberry___Leaf_scorch', 'Strawberry___healthy',
]

# ─── New crops ───────────────────────────────────────────────────────────────
# Named in the PlantVillage style so the whole label space stays consistent and
# the app's existing crop/disease split on '___' keeps working unchanged.
RICE_CLASSES = {
    'Bacterialblight': 'Rice___Bacterial_leaf_blight',
    'Blast':           'Rice___Blast',
    'Brownspot':       'Rice___Brown_spot',
    'Tungro':          'Rice___Tungro',
}

# The second rice source is extracted into the same folder names as the first
# (see scratchpad/extract_rice2.py), so the mapping is the first one plus the
# healthy class that source exists to provide.
RICE2_CLASSES = dict(RICE_CLASSES, Healthy='Rice___healthy')

WHEAT_CLASSES = {
    'BrownRust':  'Wheat___Brown_rust',
    'YellowRust': 'Wheat___Yellow_rust',
    'Septoria':   'Wheat___Septoria',
    'Mildew':     'Wheat___Powdery_mildew',
    'Healthy':    'Wheat___healthy',
}


def class_order():
    """The full label space, sorted so the order is deterministic.

    Written to a fresh labels file rather than reusing the old one: the indices
    necessarily move when classes are added and removed, and silently shifting
    them under the hosted service would mislabel every prediction.
    """
    names = set(KEEP_PLANTVILLAGE)
    names |= set(RICE_CLASSES.values())
    names |= set(RICE2_CLASSES.values())
    names |= set(WHEAT_CLASSES.values())
    return sorted(names)


if __name__ == '__main__':
    import collections
    order = class_order()
    by_crop = collections.Counter(c.split('___')[0] for c in order)
    print(f'  {len(order)} classes across {len(by_crop)} crops '
          f'(was 38 across 14)\n')
    for crop, n in sorted(by_crop.items(), key=lambda x: (-x[1], x[0])):
        print(f'    {crop:16s} {n}')
    print(f'\n  dropped {len(DROPPED_PLANTVILLAGE)} orchard and berry classes')
    for i, c in enumerate(order):
        print(f'    {i:2d}  {c}')
