"""
Builds a test set of photographs taken by actual people, not by a dataset.

THE QUESTION THIS ANSWERS
-------------------------
Every set used so far except internet_test is dataset imagery: one campaign, one
or two cameras, one place, images curated for a paper. A model can learn the
photographer and score well on all of them. The one set that is not a dataset -
internet_test - holds 15 photographs, which is too few to settle anything, and
it is the one set where the retrained model looks WORSE (86.7% to 73.3%).

So the open question is whether the eight to twelve points gained on held-out
collections are real or an artefact of dataset style.

iNaturalist answers it. Research-grade observations are photographs taken by
ordinary people, mostly on phones, in the field, in whatever light there was,
with the identification confirmed by at least two independent people. Filter to
India and you have roughly what this app receives, from thousands of different
cameras and hands. None of it appears in any collection trained on here.

WHAT IS COLLECTED
-----------------
Species a farmer in India actually meets, grouped the way herbicide choice
groups them. Plus, separately, the cereal crops the model has never been shown -
wheat, rice, maize - which are not scored but are reported, because a model
whose only crop is sorghum will call a wheat plant something, and what it calls
it decides whether a wheat farmer is told to spray his own field.

CAVEATS, SO THE NUMBER IS READ PROPERLY
---------------------------------------
- iNaturalist photographs are taken by naturalists, who frame a plant to show
  its identifying features. A farmer photographs whatever is in front of him.
  The framing is therefore better than app use, not worse.
- Some observations are close-ups of a flower or seed head rather than the
  whole plant. Those are harder than app use for a model trained on whole
  plants, and they are left in, because a farmer photographs seed heads too.
- Research grade means two or more people agreed on the species. That is a
  stronger label than anything hand-collected, and stronger than some of the
  dataset labels.
- Licences are restricted to cc0, cc-by and cc-by-sa. The images are used to
  measure, not redistributed or trained on. ATTRIBUTION.csv records observer
  and licence per file either way.

Usage:
  .venv/Scripts/python.exe fetch_wild_test.py
  .venv/Scripts/python.exe fetch_wild_test.py --per-species 50
  .venv/Scripts/python.exe fetch_wild_test.py --global   # ignore the India filter
"""

import argparse
import csv
import os
import time
import urllib.parse
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'data', 'wild_test')

API = 'https://api.inaturalist.org/v1/observations'
UA = 'SmartKisan-eval/1.0 (weed model evaluation; contact via github karishma-devs-0)'
INDIA = 6681
LICENCES = 'cc0,cc-by,cc-by-sa'

# Species grouped as a farmer buying herbicide needs them grouped.
TAXA = [
    # ── grasses (Poaceae) ──
    ('grass_weed', 'Echinochloa crus-galli'),     # barnyard grass - worst in rice
    ('grass_weed', 'Cynodon dactylon'),           # doob / bermuda
    ('grass_weed', 'Digitaria sanguinalis'),      # large crabgrass
    ('grass_weed', 'Eleusine indica'),            # goosegrass
    ('grass_weed', 'Dactyloctenium aegyptium'),   # crowfoot grass
    ('grass_weed', 'Setaria viridis'),            # green foxtail

    # ── broadleaf ──
    ('broadleaf_weed', 'Parthenium hysterophorus'),   # congress grass
    ('broadleaf_weed', 'Amaranthus viridis'),         # pigweed
    ('broadleaf_weed', 'Chenopodium album'),          # bathua
    ('broadleaf_weed', 'Portulaca oleracea'),         # purslane
    ('broadleaf_weed', 'Commelina benghalensis'),     # kena
    ('broadleaf_weed', 'Tridax procumbens'),
    ('broadleaf_weed', 'Euphorbia hirta'),

    # ── the one crop the model knows ──
    ('crop', 'Sorghum bicolor'),

    # ── sedge: no class in the three-class model. Not scored; reported, because
    #    what it gets called decides which herbicide is bought. ──
    ('_sedge', 'Cyperus rotundus'),

    # ── crops the model has never been shown. Not scored. A wheat farmer
    #    photographing his own wheat gets one of three answers and two of them
    #    tell him to spray it. ──
    ('_unseen_crop', 'Triticum aestivum'),
    ('_unseen_crop', 'Oryza sativa'),
    ('_unseen_crop', 'Zea mays'),
]


def get(url):
    req = urllib.request.Request(url, headers={'User-Agent': UA})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()


def observations(taxon, per_species, place):
    """Research-grade, permissively licensed observations of one species.

    Asks for India first. Falls back to worldwide when India alone cannot fill
    the quota, and says so, because a species that is common here but rarely
    recorded here would otherwise silently contribute almost nothing.
    """
    import json
    rows, used_global = [], False
    for scope in ([place, None] if place else [None]):
        params = {
            'taxon_name': taxon,
            'quality_grade': 'research',
            'photo_license': LICENCES,
            'per_page': 200,
            'order_by': 'random',
        }
        if scope:
            params['place_id'] = scope
        else:
            used_global = used_global or bool(rows) or scope is None
        data = json.loads(get(API + '?' + urllib.parse.urlencode(params)))
        seen = {r['obs'] for r in rows}
        for r in data.get('results', []):
            if len(rows) >= per_species:
                break
            if r['id'] in seen:
                continue
            photos = r.get('photos') or []
            if not photos:
                continue
            ph = photos[0]
            url = (ph.get('url') or '').replace('/square', '/medium')
            if not url:
                continue
            rows.append({
                'obs': r['id'],
                'url': url,
                'licence': ph.get('license_code') or '',
                'observer': (r.get('user') or {}).get('login') or '',
                'place': 'India' if scope else 'worldwide',
            })
        if len(rows) >= per_species:
            break
        time.sleep(1.0)
    return rows


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--per-species', type=int, default=30)
    ap.add_argument('--global', dest='worldwide', action='store_true',
                    help='do not prefer Indian observations')
    args = ap.parse_args()

    os.makedirs(OUT, exist_ok=True)
    place = None if args.worldwide else INDIA
    manifest = []
    totals = {}

    for cls, taxon in TAXA:
        folder = os.path.join(OUT, cls)
        os.makedirs(folder, exist_ok=True)
        slug = taxon.lower().replace(' ', '_').replace('-', '_')

        have = len([f for f in os.listdir(folder) if f.startswith(slug)])
        if have >= args.per_species:
            print('  %-28s %-16s already have %d' % (taxon, cls, have))
            totals[cls] = totals.get(cls, 0) + have
            continue

        try:
            rows = observations(taxon, args.per_species, place)
        except Exception as e:
            print('  %-28s FAILED: %s' % (taxon, e))
            continue

        n = 0
        for r in rows:
            path = os.path.join(folder, '%s_%s.jpg' % (slug, r['obs']))
            if os.path.exists(path):
                continue
            try:
                blob = get(r['url'])
            except Exception:
                continue
            with open(path, 'wb') as fh:
                fh.write(blob)
            r['file'] = os.path.relpath(path, OUT)
            r['class'] = cls
            r['taxon'] = taxon
            manifest.append(r)
            n += 1
            # iNaturalist asks for restraint; 100/minute is their stated
            # ceiling and there is no reason to go near it.
            time.sleep(0.7)

        scopes = {r['place'] for r in rows}
        print('  %-28s %-16s %3d images  (%s)'
              % (taxon, cls, n, ', '.join(sorted(scopes)) or 'none'))
        totals[cls] = totals.get(cls, 0) + n

    if manifest:
        mpath = os.path.join(OUT, 'ATTRIBUTION.csv')
        new = not os.path.exists(mpath)
        with open(mpath, 'a', newline='', encoding='utf-8') as fh:
            w = csv.DictWriter(fh, fieldnames=['file', 'class', 'taxon', 'obs',
                                               'observer', 'licence', 'place', 'url'])
            if new:
                w.writeheader()
            for r in manifest:
                w.writerow({k: r.get(k, '') for k in w.fieldnames})

    print('\nby class:')
    for cls in sorted(totals):
        print('  %-16s %4d' % (cls, totals[cls]))
    print('\nwrote %s' % OUT)


if __name__ == '__main__':
    main()
