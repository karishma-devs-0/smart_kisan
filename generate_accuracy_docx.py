"""
Builds the disease model accuracy report as a .docx for forwarding.

The same figures as docs/reports/model-accuracy-2026-09-14.html, in a format
that opens in Word and attaches to an email. The two charts are rendered to
PNG rather than described in text, because the point of both is a comparison
the eye makes faster than a table does.

Colours match the HTML report, and the pair was checked for colour-blind
separation before being used - green and blue rather than the green and red
that would read as one colour to a deuteranopic viewer.

Usage:
  .venv/Scripts/python.exe ../generate_accuracy_docx.py
"""

import os
import sys
import subprocess

try:
    import matplotlib
except ImportError:
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', 'matplotlib'])
    import matplotlib

matplotlib.use('Agg')
import matplotlib.pyplot as plt  # noqa: E402

from docx import Document  # noqa: E402
from docx.shared import Pt, Inches, RGBColor  # noqa: E402
from docx.enum.text import WD_ALIGN_PARAGRAPH  # noqa: E402
from docx.enum.table import WD_TABLE_ALIGNMENT  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'SmartKisan_Model_Accuracy_2026-09-14.docx')
TMP = os.path.join(HERE, '_chart_tmp')

BLUE = '#1F6FB2'    # previous model
GREEN = '#2E7D32'   # current model
INK = '#1A1E18'
MUTED = '#69705F'
GRID = '#E6E5DD'

# crop, before, now, test images
CROPS = [
    ('Tomato',   43.5, 88.0, 625),
    ('Potato',   50.0, 85.7, 210),
    ('Maize',    65.4, 81.7, 389),
    ('Capsicum', 82.4, 94.1, 17),
    ('Rice',     94.9, 92.4, 185),
    ('Wheat',    90.8, 90.1, 141),
    ('Soybean',  75.0, 75.0, 8),
    ('Squash',  100.0, 100.0, 6),
]

# threshold, scans answered %, wrong diagnoses shown %
THRESHOLDS = [
    ('none', 100.0, 13.1),
    ('60%',   94.0,  9.5),
    ('70%',   88.2,  6.8),
    ('80%',   82.5,  5.1),
    ('90%',   74.4,  3.0),
    ('95%',   66.7,  2.1),
]


def style_axes(ax):
    ax.set_ylim(0, 105)
    ax.set_yticks([0, 25, 50, 75, 100])
    ax.set_yticklabels(['0%', '25%', '50%', '75%', '100%'], fontsize=9, color=MUTED)
    ax.yaxis.grid(True, color=GRID, linewidth=0.8)
    ax.set_axisbelow(True)
    for side in ('top', 'right', 'left'):
        ax.spines[side].set_visible(False)
    ax.spines['bottom'].set_color(GRID)
    ax.tick_params(axis='x', length=0)


def chart_by_crop(path):
    fig, ax = plt.subplots(figsize=(9.2, 3.9), dpi=200)
    x = range(len(CROPS))
    w = 0.38
    before = [c[1] for c in CROPS]
    now = [c[2] for c in CROPS]

    ax.bar([i - w / 2 for i in x], before, w, color=BLUE, label='Our first training run')
    ax.bar([i + w / 2 for i in x], now, w, color=GREEN, label='Model now live')

    for i, (b, n) in enumerate(zip(before, now)):
        ax.text(i - w / 2, b + 2, '%.0f' % b, ha='center', fontsize=8, color=MUTED)
        ax.text(i + w / 2, n + 2, '%.0f' % n, ha='center', fontsize=8.5,
                color=INK, fontweight='bold')

    ax.set_xticks(list(x))
    ax.set_xticklabels(['%s\nn=%d' % (c[0], c[3]) for c in CROPS],
                       fontsize=9, color=INK)
    style_axes(ax)
    ax.legend(frameon=False, fontsize=9, loc='lower right', ncol=2)
    fig.tight_layout()
    fig.savefig(path, facecolor='white')
    plt.close(fig)


def chart_threshold(path):
    fig, ax = plt.subplots(figsize=(9.2, 3.6), dpi=200)
    x = range(len(THRESHOLDS))
    w = 0.38
    answered = [t[1] for t in THRESHOLDS]
    wrong = [t[2] for t in THRESHOLDS]

    ax.bar([i - w / 2 for i in x], answered, w, color=BLUE,
           label='Scans answered')
    ax.bar([i + w / 2 for i in x], wrong, w, color=GREEN,
           label='Wrong diagnoses shown')

    for i, (a, g) in enumerate(zip(answered, wrong)):
        ax.text(i - w / 2, a + 2, '%.0f' % a, ha='center', fontsize=8, color=MUTED)
        ax.text(i + w / 2, g + 2, '%.1f' % g, ha='center', fontsize=8, color=MUTED)

    # Mark the setting actually in use.
    ax.annotate('IN USE', xy=(3, answered[3]), xytext=(3, 103),
                ha='center', fontsize=8.5, fontweight='bold', color=GREEN)

    ax.set_xticks(list(x))
    ax.set_xticklabels([t[0] for t in THRESHOLDS], fontsize=9.5, color=INK)
    ax.set_xlabel('Confidence threshold below which the app declines to answer',
                  fontsize=9, color=MUTED, labelpad=8)
    style_axes(ax)
    ax.legend(frameon=False, fontsize=9, loc='upper right', ncol=2)
    fig.tight_layout()
    fig.savefig(path, facecolor='white')
    plt.close(fig)


def shade(cell, hex_colour):
    from docx.oxml.ns import qn
    from docx.oxml import OxmlElement
    tcPr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:val'), 'clear')
    shd.set(qn('w:fill'), hex_colour)
    tcPr.append(shd)


def build():
    os.makedirs(TMP, exist_ok=True)
    crop_png = os.path.join(TMP, 'by_crop.png')
    thr_png = os.path.join(TMP, 'threshold.png')
    chart_by_crop(crop_png)
    chart_threshold(thr_png)

    doc = Document()
    style = doc.styles['Normal']
    style.font.name = 'Calibri'
    style.font.size = Pt(10.5)

    for s in doc.sections:
        s.left_margin = s.right_margin = Inches(0.9)
        s.top_margin = s.bottom_margin = Inches(0.8)

    eyebrow = doc.add_paragraph()
    r = eyebrow.add_run('SMARTKISAN  ·  DISEASE MODEL ACCURACY  ·  14 SEPTEMBER 2026')
    r.font.size = Pt(8)
    r.font.color.rgb = RGBColor(0x69, 0x70, 0x5F)

    h = doc.add_paragraph()
    r = h.add_run('Where it stands')
    r.font.size = Pt(22)
    r.font.bold = True
    r.font.color.rgb = RGBColor(0x1A, 0x1E, 0x18)

    # ── Headline figures ──
    head = doc.add_table(rows=2, cols=4)
    head.alignment = WD_TABLE_ALIGNMENT.CENTER
    # The big number is always the current model; the line under it says what
    # the old one scored. An earlier version wrote these as '28 -> 87%', which
    # left the reader to work out which end was which.
    figures = [
        ('DISEASE IDENTIFIED', '87%', 'Old model: 28%',
         'Names the right disease, on 1,581 photographs'),
        ('CROP IDENTIFIED', '99%', 'Old model: 49%',
         'Knows which plant it is looking at'),
        ('HEALTHY PLANT CALLED DISEASED', '8%', 'Old model: 42%',
         'Sent the farmer to buy a fungicide he did not need'),
        ('CROPS COVERED', '9', 'Old model: 7',
         'Wheat and rice are new — most of our users grow them'),
    ]
    for i, (k, v, was, s) in enumerate(figures):
        top = head.cell(0, i).paragraphs[0]
        rk = top.add_run(k + '\n')
        rk.font.size = Pt(7.5)
        rk.font.color.rgb = RGBColor(0x69, 0x70, 0x5F)
        rv = top.add_run(v)
        rv.font.size = Pt(17)
        rv.font.bold = True
        rv.font.color.rgb = RGBColor(0x2E, 0x7D, 0x32)
        rw = top.add_run('\n' + was)
        rw.font.size = Pt(8)
        rw.font.color.rgb = RGBColor(0x69, 0x70, 0x5F)

        bot = head.cell(1, i).paragraphs[0]
        rs = bot.add_run(s)
        rs.font.size = Pt(8)
        rs.font.color.rgb = RGBColor(0x69, 0x70, 0x5F)
        shade(head.cell(0, i), 'F3F2ED')
        shade(head.cell(1, i), 'F3F2ED')

    doc.add_paragraph()
    doc.add_picture(crop_png, width=Inches(6.7))
    cap = doc.add_paragraph()
    rc = cap.add_run(
        'Both bars are our own training runs - the first one, and the one now '
        'live. The three crops on the left were the ones failing, and adding '
        'real field photographs is what fixed them. Rice and wheat worked from '
        'the first run and held. Soybean and squash have too few test images to '
        'read anything into. The model the app used until today is not on this '
        'chart: it had no rice or wheat classes, so there is no per-crop figure '
        'to set against these.')
    rc.font.size = Pt(8.5)
    rc.font.color.rgb = RGBColor(0x69, 0x70, 0x5F)

    # ── Table ──
    doc.add_paragraph()
    t = doc.add_table(rows=1, cols=4)
    t.style = 'Light Grid Accent 1'
    hdr = t.rows[0].cells
    for i, label in enumerate(['Crop', 'First run', 'Now', 'Test images']):
        p = hdr[i].paragraphs[0]
        rr = p.add_run(label)
        rr.font.bold = True
        rr.font.size = Pt(9)
        if i:
            p.alignment = WD_ALIGN_PARAGRAPH.RIGHT

    notes = {
        'Tomato': 'The crop the testing team will reach for first',
        'Potato': 'Early blight against late blight was the failure',
        'Maize': 'Leaf blight against gray leaf spot',
    }
    for name, before, now, n in CROPS:
        row = t.add_row().cells
        p = row[0].paragraphs[0]
        rn = p.add_run(name)
        rn.font.size = Pt(9.5)
        if name in notes:
            rn.font.bold = True
            sub = p.add_run('\n' + notes[name])
            sub.font.size = Pt(7.5)
            sub.font.color.rgb = RGBColor(0x69, 0x70, 0x5F)
        for i, val in enumerate(['%.1f%%' % before, '%.1f%%' % now, str(n)], start=1):
            pp = row[i].paragraphs[0]
            pp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
            rv = pp.add_run(val)
            rv.font.size = Pt(9.5)
            if i == 2 and now - before > 5:
                rv.font.bold = True
                rv.font.color.rgb = RGBColor(0x2E, 0x7D, 0x32)

    # ── Caveat ──
    doc.add_paragraph()
    cav = doc.add_paragraph()
    rb = cav.add_run('One caveat before quoting the crop figures. ')
    rb.font.bold = True
    rb.font.size = Pt(9.5)
    rt = cav.add_run(
        'Tomato, potato and maize are measured largely on newly added '
        'collections whose train/test splits we made ourselves, so they are the '
        'optimistic end. On the one split published by outside authors, the '
        'model scores 57%.')
    rt.font.size = Pt(9.5)

    cav2 = doc.add_paragraph()
    rb2 = cav2.add_run('And on the 28% figure. ')
    rb2.font.bold = True
    rb2.font.size = Pt(9.5)
    rt = cav2.add_run(
        'A fifth of the test set is rice and wheat, which the old model had no '
        'classes for and so could never have answered. Leaving those out, the '
        'old model scores about 35% and the new one about 86%. Both '
        'comparisons are real: 35% to 86% is the like-for-like one, and 28% to '
        '87% is what a farmer actually experiences, since the rice and wheat '
        'photographs are ones he would have taken anyway.')
    rt.font.size = Pt(9.5)

    # ── Threshold ──
    doc.add_page_break()
    h2 = doc.add_paragraph()
    r2 = h2.add_run('When the app declines to answer')
    r2.font.size = Pt(15)
    r2.font.bold = True

    p = doc.add_paragraph()
    rp = p.add_run('The app withholds a diagnosis below a confidence threshold '
                   'and asks for a clearer photograph instead.')
    rp.font.size = Pt(10.5)

    doc.add_picture(thr_png, width=Inches(6.7))
    cap2 = doc.add_paragraph()
    rc2 = cap2.add_run(
        'Set to 80%: a quarter fewer wrong diagnoses reach the farmer, for six '
        'points of coverage. The previous model answered only 47% of scans at '
        'its 70% threshold, against 88% for this one at the same cut.')
    rc2.font.size = Pt(8.5)
    rc2.font.color.rgb = RGBColor(0x69, 0x70, 0x5F)

    foot = doc.add_paragraph()
    rf = foot.add_run('SmartKisan · Hbeonlabs Technologies Pvt. Ltd. · '
                      'Measured on 1,581 held-out photographs')
    rf.font.size = Pt(8)
    rf.font.color.rgb = RGBColor(0x69, 0x70, 0x5F)

    doc.save(OUT)
    print('Wrote ' + OUT)

    for f in (crop_png, thr_png):
        os.remove(f)
    os.rmdir(TMP)


if __name__ == '__main__':
    build()
