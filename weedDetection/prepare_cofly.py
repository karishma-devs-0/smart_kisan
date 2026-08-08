"""
Turns CoFly-WeedDB into folder-per-class patches for GOG training.

CoFly ships 201 UAV frames (1280x720) over a cotton field with per-pixel masks:

    0 background (soil + cotton crop)   94.99% of pixels, 201/201 images
    1 Johnson grass                      0.78%              38
    2 Field bindweed                     0.15%              14
    3 Purslane                           4.08%             165

This matters because it is genuinely Green-on-Green — weeds inside a growing
crop canopy — which DeepWeeds is not. DeepWeeds is rangeland: individual weeds
against soil and scrub, closer to green-on-brown. A model trained only on
DeepWeeds has never had to separate weed from crop when both are green.

Segmentation is converted to classification by tiling: a sliding window is
labelled with the weed class covering the largest share of its centre, provided
that share clears MIN_WEED_FRACTION. Tiles with no weed become `background`.
Centre-weighted rather than whole-tile, so a weed clipped at the very edge does
not label a tile that is mostly crop.

Background hugely outnumbers weeds, so background tiles are subsampled to
BACKGROUND_RATIO times the largest weed class. Keeping every one of them would
recreate the imbalance that already forces class weights in training.

Usage:
    .venv/Scripts/python.exe prepare_cofly.py
"""

import io
import os
import random
import zipfile
from collections import Counter

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ZIP_PATH = os.path.join(HERE, 'data', 'cofly', 'CoFly-WeedDB.zip')
OUT_DIR = os.path.join(HERE, 'data', 'cofly_patches')

CLASS_NAMES = {
    0: 'background',
    1: 'johnson_grass',
    2: 'field_bindweed',
    3: 'purslane',
}

PATCH = 224          # matches the model input, so no rescaling at train time
STRIDE = 112         # 50% overlap: more samples from a 201-image set
CENTRE = 112         # centre box used for labelling
MIN_WEED_FRACTION = 0.04   # a tile must be at least 4% weed in its centre
BACKGROUND_RATIO = 1.5
SEED = 1337


def centre_box(arr):
    h, w = arr.shape
    y0 = (h - CENTRE) // 2
    x0 = (w - CENTRE) // 2
    return arr[y0:y0 + CENTRE, x0:x0 + CENTRE]


def label_for(mask_tile):
    """Dominant weed class in the tile centre, or 0 for background."""
    centre = centre_box(mask_tile)
    counts = Counter(centre.flatten().tolist())
    counts.pop(0, None)
    if not counts:
        return 0
    cls, n = counts.most_common(1)[0]
    if n / centre.size < MIN_WEED_FRACTION:
        return 0
    return cls


def main():
    if not os.path.exists(ZIP_PATH):
        raise SystemExit(f'Missing {ZIP_PATH}')

    rng = random.Random(SEED)
    z = zipfile.ZipFile(ZIP_PATH)

    images = {
        os.path.basename(e): e
        for e in z.namelist()
        if e.startswith('CoFly-WeedDB/images/') and e.endswith('.png')
    }
    labels = {
        os.path.basename(e): e
        for e in z.namelist()
        if e.startswith('CoFly-WeedDB/labels_1d/') and e.endswith('.png')
    }

    paired = sorted(set(images) & set(labels))
    print(f'  {len(paired)} image/mask pairs')

    weed_tiles = []       # (class, PIL.Image)
    background_tiles = []

    for i, name in enumerate(paired, 1):
        img = Image.open(io.BytesIO(z.read(images[name]))).convert('RGB')
        mask = np.array(Image.open(io.BytesIO(z.read(labels[name]))))
        w, h = img.size

        for top in range(0, h - PATCH + 1, STRIDE):
            for left in range(0, w - PATCH + 1, STRIDE):
                mtile = mask[top:top + PATCH, left:left + PATCH]
                cls = label_for(mtile)
                tile = img.crop((left, top, left + PATCH, top + PATCH))
                (background_tiles if cls == 0 else weed_tiles).append((cls, tile))

        if i % 40 == 0:
            print(f'   {i}/{len(paired)} frames  '
                  f'weed={len(weed_tiles)} bg={len(background_tiles)}')

    per_class = Counter(c for c, _ in weed_tiles)
    largest = max(per_class.values()) if per_class else 0
    keep_bg = int(largest * BACKGROUND_RATIO)
    rng.shuffle(background_tiles)
    background_tiles = background_tiles[:keep_bg]

    print(f'  weed tiles: {dict(per_class)}')
    print(f'  background kept: {len(background_tiles)} of the extracted total')

    written = Counter()
    for cls, tile in weed_tiles + background_tiles:
        folder = os.path.join(OUT_DIR, CLASS_NAMES[cls])
        os.makedirs(folder, exist_ok=True)
        written[CLASS_NAMES[cls]] += 1
        tile.save(os.path.join(folder, f'{CLASS_NAMES[cls]}_{written[CLASS_NAMES[cls]]:05d}.jpg'),
                  quality=92)

    print('  written:')
    for k in sorted(written):
        print(f'    {k:<16} {written[k]:>6}')
    print(f'  -> {OUT_DIR}')


if __name__ == '__main__':
    main()
