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
On the held-out set, 658 images: 85.9% exact disease, 98.0% crop.

    rice      94.9%      tomato   43.5%
    wheat     90.8%      maize    65.4%
    capsicum  82.4%      potato   50.0%
    squash   100.0%      soybean  75.0%

Read the spread, not the average. The headline is carried by rice and wheat,
which have the most data and whose test split was made here rather than
published.

Compared like for like - the same 142 PlantDoc images, which is the only fair
comparison because the orchard images left the test set with their classes:

    deployed MobileNetV2       38 classes   29.6% disease   55.6% crop
    field-tuned MobileNetV2    38 classes   55.6%           84.5%
    EfficientNetV2B0 @288      38 classes   50.7%           81.0%
    this model                 32 classes   57.0%           91.5%

Naming the disease on the crops that were always there is barely changed. What
improved sharply is knowing which plant it is, 84.5% to 91.5%, which is what
dropping sixteen distractor classes buys. The real gain is absent from that
table: wheat and rice could not be diagnosed at all before and now run at 90%+.

REBALANCING DID NOT FIX THE WEAK CROPS
--------------------------------------
Tomato, maize and potato fail by confusing diseases WITHIN the right crop - the
model knows it is looking at a tomato. Of 39 tomato errors, 33 were tomato
diseases mistaken for other tomato diseases; maize was 9 out of 9, almost all
Northern Leaf Blight against Gray Leaf Spot; potato was early blight against
late blight 8 times out of 11.

The obvious suspect was starvation: rice was capped at 500 images per class and
tomato at 120, while PlantVillage holds 1,000-2,100 unused images for exactly
the failing tomato and potato classes. A run with tomato raised to 400 and rice
cut to 250 did not help - tomato fell to 37.7%, potato held at 31.2%, maize
gained a little. That run is kept in model/india_rebalanced.

It is weak evidence: the run finished only 9 of 18 epochs and shared the CPU
with another training for part of it. But it points the same way as everything
else in this project. The PlantVillage images are laboratory photographs, and
the test is field photographs; more laboratory data does not teach a model to
tell two blights apart on a phone camera in a field.

What would help is field photographs of these specific crops. Two suitable
CC BY 4.0 collections exist - Ghana farm images of maize and tomato
(data.mendeley.com/datasets/bwh3zbpkpv) and Indonesian field potato
(data.mendeley.com/datasets/ptz377bwb8) - and neither can be fetched without a
browser session or Kaggle credentials.

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

# Potato, photographed on farms in Central Java with ordinary smartphones
# (Mendeley ptz377bwb8, CC BY 4.0). This is the only field imagery available for
# the early-blight-against-late-blight distinction, which is where potato fails:
# eight of its eleven errors are those two classes mistaken for each other.
#
# CAVEAT ON THE FUNGI FOLDER. The paper describes it as early blight
# (Alternaria solani) together with at least one other fungal disease
# characterised by powdery patches - so mapping the whole folder to early blight
# puts some wrong labels into the very class being repaired.
#
# It is used anyway, because the alternative is worse. Taking only Phytophthora
# and Healthy would add late-blight examples and no early-blight ones, pushing
# the model further towards the answer it already over-gives. The test set keeps
# its clean PlantVillage and PlantDoc labels, so if potato improves the noise was
# tolerable and if it does not, that shows too.
#
# The other four folders - bacteria, nematode, pest, virus - have no class here
# and are skipped rather than forced into one.
POTATO_FIELD_CLASSES = {
    'Fungi':       'Potato___Early_blight',
    'Phytopthora': 'Potato___Late_blight',   # the dataset's own spelling
    'Phytophthora': 'Potato___Late_blight',
    'Healthy':     'Potato___healthy',
}

WHEAT_CLASSES = {
    'BrownRust':  'Wheat___Brown_rust',
    'YellowRust': 'Wheat___Yellow_rust',
    'Septoria':   'Wheat___Septoria',
    'Mildew':     'Wheat___Powdery_mildew',
    'Healthy':    'Wheat___healthy',
}


# CCMT: farm photographs from Ghana, expert-validated (Kaggle
# irakozekelly/crop-pest-and-disease-dataset, CC BY 4.0). Maize and tomato only;
# its cashew and cassava crops are not grown by our users.
#
# Keyed on (crop, folder) rather than folder alone, because maize and tomato
# both have folders called 'healthy' and 'leaf blight'. Matching on the folder
# name by itself would pour maize images into the tomato classes.
#
# Deliberately omitted:
#   tomato 'leaf blight'      does not say early or late blight, and that is
#                             exactly the distinction being repaired - a guess
#                             here would do more harm than the images do good
#   tomato 'verticillium wilt'
#   maize  'streak virus', 'fall armyworm', 'grasshopper', 'leaf beetle'
#                             pests and a virus with no class in this model
CCMT_CLASSES = {
    ('maize', 'leaf blight'):        'Corn_(maize)___Northern_Leaf_Blight',
    ('maize', 'leaf spot'):          'Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot',
    ('maize', 'healthy'):            'Corn_(maize)___healthy',
    ('tomato', 'healthy'):           'Tomato___healthy',
    ('tomato', 'septoria leaf spot'): 'Tomato___Septoria_leaf_spot',
    ('tomato', 'leaf curl'):         'Tomato___Tomato_Yellow_Leaf_Curl_Virus',
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
    names |= set(POTATO_FIELD_CLASSES.values())
    names |= set(CCMT_CLASSES.values())
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
