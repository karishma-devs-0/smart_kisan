"""
The label space for the weed model, and which species belong in it.

WHY FOUR CLASSES RATHER THAN THREE
----------------------------------
The shipped model answers crop / grass_weed / broadleaf_weed. Indian extension
services classify weeds as GRASSES, SEDGES and BROADLEAF, and they do it
because the three take different herbicides. Nutsedge in particular does not
respond to a broadleaf spray at all - it needs something like halosulfuron -
so calling it broadleaf costs the farmer the price of a spray and the season's
damage from the weed he did not actually treat.

The shipped model has no sedge class, and it makes exactly that mistake:

    MISS  grass_weed__nutsedge.jpg   true=grass_weed  pred=broadleaf_weed  84.7%

(that file is mislabelled as grass in the test pack, which is itself a symptom -
a sedge is not a grass either.)

The two collections added in fetch_indian_weeds.py carry ~1,535 sedge images
across three species, so the class is now supportable. Hence:

    crop, grass_weed, sedge_weed, broadleaf_weed

BOTANY VERSUS AGRONOMY
----------------------
These are grouped the way a farmer buying herbicide needs them grouped, which
is not always the way a botanist would group them.

Commelina benghalensis (kena / dayflower) is a monocot, but every Indian weed
guide lists it under broadleaf, because it behaves like one in the field and is
treated like one. It is a broadleaf here, and it appears in BOTH new
collections, which makes it a useful check on whether the model generalises
across them.

Sedges are Cyperaceae only. "Nutsedge" is a sedge, not a grass, despite the
name and despite where it sits in our own test pack.

WHAT IS STILL MISSING, STATED PLAINLY
-------------------------------------
crop is sorghum and nothing else. Neither new collection contains a crop class,
so a wheat, rice or cotton plant is not something this model has ever been
shown. The crop-versus-weed half of the answer therefore remains validated for
sorghum alone, and sorghum is itself a grass, which is the hardest possible
case. The weed-type half - grass, sedge or broadleaf - is what these datasets
genuinely improve, and it is also the half that decides which chemical is
bought.

Anything not listed here is dropped rather than guessed at.
"""


def normalise(name):
    """Folder name for a published class name.

    fetch_indian_weeds.py names directories with this, and the mappings below
    are keyed through it, so the two cannot drift. They already did once: the
    keys were transcribed by hand with trailing underscores that this function
    strips, which silently dropped all 19,141 MH-Weed16 images and left
    training to proceed on sorghum alone without an error anywhere.
    """
    keep = [c if (c.isalnum() or c in '-_') else '_' for c in name.strip()]
    return ''.join(keep).strip('_').lower()


def _mapped(raw):
    out = {}
    for name, cls in raw.items():
        key = normalise(name)
        if key in out:
            raise ValueError('two published names normalise to %r' % key)
        out[key] = cls
    return out


CROP = 'crop'
GRASS = 'grass_weed'
SEDGE = 'sedge_weed'
BROADLEAF = 'broadleaf_weed'

# Order matters: the model emits these indices, and class_labels.json must
# match it exactly or every answer is mislabelled.
CLASSES = [BROADLEAF, CROP, GRASS, SEDGE]

# ─── SorghumWeedDataset (Tamil Nadu, CC BY 4.0) ─────────────────────────────
# The collection the shipped model was trained on. Kept, but it is now one
# source among three rather than the whole world.
SORGHUM_CLASSES = {
    'Class0_Sorghum': CROP,
    'Class1_Grass': GRASS,
    'Class2_BroadLeafWeed': BROADLEAF,
}

# ─── MH-Weed16 (Maharashtra, CC BY 4.0) ─────────────────────────────────────
# Folder names as fetch_indian_weeds.py writes them: lower-cased, non
# alphanumerics collapsed to underscore.
_RAW_MH_WEED16 = {
    'Asian_Pigeonwings_(Clitoria Ternatea)': BROADLEAF,
    'Bilayat_(Mexicana_Argemone)': BROADLEAF,          # Argemone mexicana
    'Choti_dudhi_(Euphorbia_hirta)': BROADLEAF,
    'Digitaria_SP_(Digitaria Sanguinalis )': GRASS,    # large crabgrass
    'Dwarf_cassia_(Chamaecrista pumila)': BROADLEAF,
    'Gajar_gavat_(Parthenium hysterophorus)': BROADLEAF,
    'Graceful_Sandmart_(Euphorbia hypericifolia)': BROADLEAF,
    'Harali_(Cynodon_dactylon)': GRASS,                # bermuda / doob grass
    'Kena_(Commplina_benghalensio)': BROADLEAF,        # monocot, treated broadleaf
    'Lamber_Quarter_plant(Chenopodium )': BROADLEAF,
    'Lavhala_(Cyperus_Rotundus)': SEDGE,               # purple nutsedge
    'Little_Mallow(Malva parviflora)': BROADLEAF,
    'Moti_dudhi(Euphorbia_geneculata_L)': BROADLEAF,
    'Obscure_morning _glory(Ipomoea obscura)': BROADLEAF,
    'Punarnava _(Boerhaavia diffusa)': BROADLEAF,
    'Sicklepod_(Senna obtusifolia)': BROADLEAF,
}

# ─── Rice field weeds (Bangladesh, CC BY 4.0) ───────────────────────────────
# The rice weed flora of eastern India. Two ferns are dropped rather than
# forced into a class: Pteris vittata is an upland fern that is not a paddy
# weed a farmer sprays, and Marsilea minuta is a genuine paddy weed but is a
# water fern that resembles neither a grass nor a broadleaf closely enough to
# teach either. Neither changes what is bought.
_RAW_RICE_WEED = {
    'Alternanthera philoxeroide': BROADLEAF,
    'Centella asiatica': BROADLEAF,
    'Commelina benghalensis': BROADLEAF,       # also in MH-Weed16
    'Cyperus ochraceus': SEDGE,
    'Fimbristylis littoralis': SEDGE,
    'Ipomoea aquatic': BROADLEAF,
    'Panicum repens': GRASS,                   # torpedo grass
    'Paspalum scrobiculatum': GRASS,
    'Synedrella nodiflora': BROADLEAF,
}

_RAW_DROPPED_RICE = {
    'Marsilea minuta': 'water fern - a real paddy weed, but shaped like neither class',
    'Pteris vittata': 'upland fern - not a field weed a farmer sprays',
}

# Keyed by folder name, derived from the published names by the one function
# that also creates those folders.
MH_WEED16_CLASSES = _mapped(_RAW_MH_WEED16)
RICE_WEED_CLASSES = _mapped(_RAW_RICE_WEED)
DROPPED_RICE = {normalise(k): v for k, v in _RAW_DROPPED_RICE.items()}

# ─── Balance ────────────────────────────────────────────────────────────────
# Broadleaf outnumbers everything roughly 13:1 before capping, almost entirely
# from MH-Weed16's thirteen broadleaf species. Left alone the model would learn
# to answer broadleaf, which is exactly the failure being fixed - the shipped
# model already sends 203 of 234 missed grass images to broadleaf.
#
# Capped per SPECIES rather than per class, so the cap keeps the variety of
# broadleaf species instead of taking everything from whichever folder is read
# first.
PER_SPECIES_CAP = {
    BROADLEAF: 500,
    GRASS: None,      # every grass image is wanted; this is the scarce class
    SEDGE: None,
    CROP: None,
}


def summary():
    """What the label space looks like, for the training log."""
    out = {c: [] for c in CLASSES}
    for src, mapping in (('sorghum', SORGHUM_CLASSES),
                         ('mh_weed16', MH_WEED16_CLASSES),
                         ('rice_weeds', RICE_WEED_CLASSES)):
        for folder, cls in mapping.items():
            out[cls].append('%s/%s' % (src, folder))
    return out


if __name__ == '__main__':
    print('%d classes: %s' % (len(CLASSES), ', '.join(CLASSES)))
    for cls, members in summary().items():
        print('\n%s  (%d source folders)' % (cls, len(members)))
        for m in members:
            print('    ' + m)
    print('\ndropped:')
    for k, why in DROPPED_RICE.items():
        print('    %-20s %s' % (k, why))
