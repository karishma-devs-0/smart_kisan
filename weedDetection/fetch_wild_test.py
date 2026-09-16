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
import concurrent.futures as cf
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
        # Paged. This asked once with per_page=200 and stopped, so it could
        # never return more than 200 of a species however large --per-species
        # was; after dropping held-out and photo-less records, some came back
        # with a few dozen. Invisible while the only caller wanted 30 each.
        #
        # Ordered by id rather than at random, because random ordering is
        # re-rolled per request and the same observation would arrive on
        # several pages while others were never reached.
        page = 1
        while len(rows) < per_species:
            params = {
                'taxon_name': taxon,
                'quality_grade': 'research',
                'photo_license': LICENCES,
                'per_page': 200,
                'page': page,
                'order_by': 'id',
                'order': 'asc',
            }
            if scope:
                params['place_id'] = scope
            else:
                used_global = used_global or bool(rows) or scope is None

            data = json.loads(get(API + '?' + urllib.parse.urlencode(params)))
            results = data.get('results', [])
            if not results:
                break

            seen = {r['obs'] for r in rows}
            for r in results:
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

            # The API will not page beyond 10,000 records this way.
            if page * 200 >= 10000:
                break
            page += 1
            time.sleep(1.0)

        if len(rows) >= per_species:
            break
    return rows


def main():
    global OUT, LICENCES

    ap = argparse.ArgumentParser()
    ap.add_argument('--per-species', type=int, default=30)
    ap.add_argument('--global', dest='worldwide', action='store_true',
                    help='do not prefer Indian observations')
    # A training pull needs somewhere else to land, or it overwrites the test
    # set and there is nothing left to measure against.
    ap.add_argument('--out', default=OUT,
                    help='where to write (default: the wild test set)')
    # cc-by-sa carries a share-alike condition. Whether a trained model counts
    # as a derived work is unsettled, and not worth finding out, so a training
    # pull takes only cc0 and cc-by. The test set keeps all three: measuring
    # against an image is plainly fair use of it.
    ap.add_argument('--licences', default=LICENCES,
                    help='photo licences to accept')
    # Anything already in the test set must not be trained on. Without this the
    # final score would be partly measured on images the model had memorised,
    # which is the exact failure this whole exercise exists to detect.
    ap.add_argument('--exclude-from', default=None,
                    help='an ATTRIBUTION.csv whose observations to skip')
    args = ap.parse_args()

    OUT = args.out
    LICENCES = args.licences

    excluded = set()
    if args.exclude_from and os.path.exists(args.exclude_from):
        with open(args.exclude_from, newline='', encoding='utf-8') as fh:
            for row in csv.DictReader(fh):
                excluded.add(str(row.get('obs', '')).strip())
        print('excluding %d observations held out for testing\n' % len(excluded))

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

        # Downloaded in parallel. Serially this ran at 34 images a minute
        # whatever the sleep was set to, because the limit is round-trip
        # latency rather than any pause: a 10,000-image pull would have taken
        # six hours.
        #
        # The rate iNaturalist ask about governs api.inaturalist.org, which
        # this queries a few dozen times in total to list observations. The
        # image bytes come from their CDN, which is what these threads talk to.
        # Kept deliberately small regardless.
        pending = []
        for r in rows:
            if str(r['obs']) in excluded:
                continue
            path = os.path.join(folder, '%s_%s.jpg' % (slug, r['obs']))
            if os.path.exists(path):
                continue
            pending.append((r, path))

        def _fetch(item):
            r, path = item
            try:
                blob = get(r['url'])
            except Exception:
                return None
            try:
                with open(path, 'wb') as fh:
                    fh.write(blob)
            except Exception:
                return None
            r['file'] = os.path.relpath(path, OUT)
            r['class'] = cls
            r['taxon'] = taxon
            return r

        n = 0
        with cf.ThreadPoolExecutor(max_workers=6) as pool:
            for got in pool.map(_fetch, pending):
                if got is not None:
                    manifest.append(got)
                    n += 1
            # iNaturalist asks for restraint; 100/minute is their stated
            # ceiling and there is no reason to go near it.

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
