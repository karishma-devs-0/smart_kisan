"""
Downloads the two CC BY 4.0 weed collections that cover Indian fields.

WHY THESE TWO
-------------
The shipped model learned grass from one farm - SRM Care Farm, Chengalpattu,
April-May 2023, one camera, one crop. It scores 95.9% on grass from that farm
and 12.8% on grass from a different one. diagnose_grass.py rules out blur as
the explanation: the failure is that the model has only ever seen one field.

So the fix is grass from more than one place, which these provide:

  MH-Weed16          19,141 images, Maharashtra (COEP Pune / ISI Kolkata).
                     Marathi common names. Grasses: Digitaria sanguinalis
                     (crabgrass, 1,561) and Cynodon dactylon (harali/Bermuda
                     grass, 709). Sedge: Cyperus rotundus (lavhala/purple
                     nutsedge, 1,177).

  Rice field weeds    3,632 images, Bangladesh. The rice weed flora of eastern
                     India. Grasses: Panicum repens (294), Paspalum
                     scrobiculatum (345). Sedges: Cyperus ochraceus (190),
                     Fimbristylis littoralis (168).

Together with the sorghum set that is five grass species across three regions
instead of one species on one farm.

LICENCES, CHECKED AT SOURCE
---------------------------
Both are CC BY 4.0, confirmed against the Mendeley record rather than against
the HuggingFace mirror's metadata field:

  MH-Weed16           10.17632/d3n3mgjjbv.2    CC BY 4.0
  Rice field weeds    10.17632/mt72bmxz73.4    CC BY 4.0
  SorghumWeedDataset  10.17632/4gkcyxjyss.1    CC BY 4.0   (already on disk)

That check is not ceremony. MegaWeeds advertises CC BY 4.0 on Zenodo while
containing CottonWeedDet12, which is CC BY-NC - an aggregate cannot relicense
its parts. Rejected for the same reason: MMDWWF (its README says "research
purpose only" even though the paper is CC BY), CottonWeedDet12, CottonWeedID15,
2SeasonWeedDet8, and the Southern Illinois greenhouse set (all NC).

The mirrors are used because they are already resized - 2.4 GB against the
18.5 GB of the originals, for images that get scaled to 224 anyway. Attribution
below travels with the data.

Usage:
  .venv/Scripts/python.exe fetch_indian_weeds.py
  .venv/Scripts/python.exe fetch_indian_weeds.py --dry-run
"""

import argparse
import io
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, 'data')

SOURCES = [
    {
        'repo': 'Project-AgML/MH_Weed16_weed_variety_classification',
        'out': 'mh_weed16',
        'cite': ('Shinde, Sayali; Attar, Vahida (2025), "MH-Weed16: An Indian '
                 'Multiclass Annotated Weed Dataset for Computer Vision Tasks", '
                 'Mendeley Data, V2, doi:10.17632/d3n3mgjjbv.2 - CC BY 4.0'),
    },
    {
        'repo': 'Project-AgML/rice_field_weed_classification',
        'out': 'rice_weeds',
        'cite': ('Ali, Md Sawkat et al. (2024), "A comprehensive dataset of rice '
                 'field weed detection from Bangladesh", Mendeley Data, V4, '
                 'doi:10.17632/mt72bmxz73.4 - CC BY 4.0'),
    },
]


def class_names(schema):
    """Pull the label names out of the parquet's HuggingFace metadata.

    Read from the file rather than hardcoded, so a dataset revision that adds
    or reorders a class cannot silently mislabel everything - the same failure
    that the crop/folder collision would have caused in the disease work.
    """
    meta = (schema.metadata or {}).get(b'huggingface')
    if not meta:
        return None
    info = json.loads(meta.decode('utf-8'))
    feats = info.get('info', {}).get('features', info.get('features', {}))
    label = feats.get('label', {})
    names = label.get('names') or label.get('class_label', {}).get('names')
    if isinstance(names, dict):
        names = [names[k] for k in sorted(names, key=lambda x: int(x))]
    return names


# One definition, shared with the class mapping. Keeping a second copy here is
# what silently dropped every MH-Weed16 image the first time.
from classes_weeds import normalise as safe  # noqa: E402


def fetch(src, dry):
    from huggingface_hub import snapshot_download
    import pyarrow.parquet as pq
    from PIL import Image

    out_root = os.path.join(DATA, src['out'])
    print('\n%s -> data/%s' % (src['repo'], src['out']))

    if os.path.isdir(out_root) and any(os.scandir(out_root)):
        n = sum(len(f) for _, _, f in os.walk(out_root))
        print('  already present (%d files), skipping download' % n)
        return

    if dry:
        print('  dry run: would download and expand')
        return

    local = snapshot_download(src['repo'], repo_type='dataset',
                              allow_patterns=['data/*.parquet', '*.md'])
    files = sorted(f for f in os.listdir(os.path.join(local, 'data'))
                   if f.endswith('.parquet'))
    print('  %d parquet shard(s)' % len(files))

    names = None
    written = 0
    per_class = {}
    for fi, fname in enumerate(files):
        table = pq.read_table(os.path.join(local, 'data', fname))
        if names is None:
            names = class_names(table.schema)
            if not names:
                sys.exit('  could not read class names from %s' % fname)
            print('  %d classes: %s' % (len(names), ', '.join(names[:4]) + ' ...'))
        imgs = table.column('image').to_pylist()
        labels = table.column('label').to_pylist()
        for img, lab in zip(imgs, labels):
            cls = safe(names[lab])
            d = os.path.join(out_root, cls)
            os.makedirs(d, exist_ok=True)
            idx = per_class.get(cls, 0)
            per_class[cls] = idx + 1
            path = os.path.join(d, '%s_%05d.jpg' % (cls, idx))
            data = img['bytes'] if isinstance(img, dict) else img
            # Re-encode rather than writing the blob straight out: the source
            # mixes PNG and JPEG, and the training scanners key on extension.
            with Image.open(io.BytesIO(data)) as im:
                im.convert('RGB').save(path, 'JPEG', quality=92)
            written += 1
        print('    shard %d/%d  %d images so far' % (fi + 1, len(files), written))

    with open(os.path.join(out_root, 'ATTRIBUTION.txt'), 'w', encoding='utf-8') as f:
        f.write(src['cite'] + '\n')

    print('  wrote %d images across %d classes' % (written, len(per_class)))
    for cls in sorted(per_class):
        print('    %-46s %5d' % (cls, per_class[cls]))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--dry-run', action='store_true')
    args = ap.parse_args()

    os.makedirs(DATA, exist_ok=True)
    for src in SOURCES:
        fetch(src, args.dry_run)
    print('\ndone.')


if __name__ == '__main__':
    main()
