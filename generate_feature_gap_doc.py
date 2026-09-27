"""
Feature gap analysis: the Crop Suitability Analyzer specification against the
Android app as built.

Answers the question asked directly - how many of the features in that document
exist in the app, and how many are left.

The specification describes a Python web platform ("64 Python modules",
"farmer_dashboard.py"). The Android app is a separate React Native build, so
this compares capability against capability rather than file against file. Where
the app does something equivalent by another route it is recorded as built, and
where it does part of it the missing part is named.

Assessed at module level. The document claims 87 features but does not number
them, and its own sub-headings do not divide cleanly into 87, so a made-up
count against a made-up count would tell nobody anything. The 16 modules it
specifies in detail are each assessed, with the specific capabilities inside
them listed as present or missing.

Plain language throughout: this goes to management.
"""

import os
import subprocess
import sys

try:
    import docx  # noqa: F401
except ImportError:
    subprocess.check_call([sys.executable, "-m", "pip", "install", "python-docx"])

from docx import Document
from docx.shared import Pt, RGBColor, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT

FILENAME = "SmartKisan_Feature_Gap_Analysis.docx"
OUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "docs", "documents")

GREEN = RGBColor(0x1B, 0x5E, 0x20)
AMBER = RGBColor(0xE6, 0x51, 0x00)
RED = RGBColor(0xC6, 0x28, 0x28)
GREY = RGBColor(0x55, 0x55, 0x55)

BUILT = "Built"
PARTIAL = "Partly built"
NOT_BUILT = "Not built"

COLOURS = {BUILT: GREEN, PARTIAL: AMBER, NOT_BUILT: RED}

# (ref, module, status, what the app has, what is missing)
MODULES = [
    ("1.1", "Farmer Dashboard", BUILT,
     "Home screen with farm overview, quick access tiles, notifications, a "
     "recent activity feed from real pump runs, a farm map drawn from the "
     "farmer's own fields, and today's water, hours and electricity worked "
     "out from recorded pump runs.",
     "The specification's revenue KPI needs market prices, which are not "
     "connected yet. Predicted yield needs harvest records, which nothing "
     "collects. Widget customisation is not offered."),

    ("1.2", "Crop Suitability Analysis", BUILT,
     "Full input form for soil and climate, a scoring engine over an Indian "
     "crop set, ranked recommendations with reasons, crop rotation planning, "
     "and season handling. Uses the farm's own soil reading when one exists, "
     "and says so rather than guessing when it does not.",
     "The specification's Random Forest trained on 2,200 samples is not what "
     "the app uses; it scores against published crop tolerance ranges "
     "instead. The radar comparison chart is not built."),

    ("1.3", "Soil Analysis and Testing", PARTIAL,
     "Nitrogen, phosphorus, potassium, pH, moisture, temperature and organic "
     "carbon, each with a gauge and optimal ranges. Readings can be entered "
     "by hand or come from a sensor. History charts per measure. A composite "
     "health score, and a report rating the soil against Soil Health Card "
     "bands. Soil texture is collected when a reading is entered.",
     "No texture classifier - texture is typed in rather than worked out "
     "from clay/silt/sand percentages, and there is no USDA texture triangle. "
     "Soil temperature is a single reading, not measured at surface, 10 cm "
     "and 20 cm. No microbial activity input, so the health score weights "
     "differ from the specification."),

    ("1.4", "IoT Device Management", PARTIAL,
     "Add, edit and remove devices; device detail with battery and online "
     "status; a calibration wizard; alert rules with thresholds; and live "
     "readings over MQTT.",
     "No data logging controls - logging interval, retention and cloud "
     "backup are not configurable. No CSV or Excel export from the device "
     "screens. Alerts reach the app only; SMS, email and WhatsApp channels "
     "are not connected."),

    ("1.5", "Weather and Irrigation", PARTIAL,
     "14-day forecast with temperature, rainfall, humidity and wind, for the "
     "farm's own location. An evapotranspiration calculator, an irrigation "
     "scheduler that takes soil moisture and forecast into account, historical "
     "weather, and wind and humidity detail screens.",
     "No rain probability heatmap in calendar form. No heat or cold stress "
     "alerts against crop-specific thresholds. No wind-based spray scheduling "
     "or lodging risk. No growing degree day accumulation."),

    ("1.6", "Marketplace", NOT_BUILT,
     "Six screens exist and work as screens - listings, listing detail, "
     "create a listing, chat list, chat, and mandi prices.",
     "Nothing is stored. There is no server behind any of it, so a listing "
     "is not saved, a message is not delivered, and every farmer sees the "
     "same sample listings and prices. Buyer matching, QR traceability, "
     "delivery tracking and transaction history do not exist. Daily mandi "
     "prices could come from the government's public feed, which needs a "
     "free data.gov.in key."),

    ("1.7", "Pest and Disease Detection", PARTIAL,
     "Photograph a leaf from the camera or gallery and get the crop, the "
     "disease and a treatment with dosage, plus organic alternatives. 32 "
     "disease classes across 9 crops including rice and wheat. 87% accurate "
     "on held-out photographs. Refuses to answer below 80% confidence rather "
     "than guessing a disease or a clean bill of health.",
     "32 classes against the 38 specified. No weather-based risk prediction, "
     "no regional outbreak warnings, no crowd-sourced reporting, and no "
     "before-and-after efficacy tracking."),

    ("1.8", "Voice Assistant", NOT_BUILT,
     "Nothing. The app is fully translated into the 10 languages the "
     "specification lists, so the words exist - but they are read, not "
     "spoken.",
     "No speech-to-text, no text-to-speech, no voice navigation. This is the "
     "largest single gap for the intended user: a farmer who reads little "
     "cannot use an app that only writes."),

    ("1.9", "AR Crop Identification", NOT_BUILT,
     "The app has an on-device weed detector that photographs a plant and "
     "answers grass weed, broadleaf weed or crop, at 93% on real "
     "photographs. It runs offline. That is adjacent to this module but it "
     "is not the same thing.",
     "No live camera overlay, no growth stage assessment, no nutrient "
     "deficiency visualisation, no species identification beyond the three "
     "weed classes, and no care instruction overlays."),

    ("1.10", "Farmer Forum", NOT_BUILT,
     "Nothing.",
     "No discussion boards, question and answer system, expert responses, "
     "image sharing for diagnosis, voting, search or moderation. This is a "
     "community product in its own right, with moderation and abuse handling "
     "to consider before any of it is written."),

    ("2.1", "Soil Health AI", PARTIAL,
     "A composite soil health score and a report rating moisture, pH and "
     "each nutrient against Soil Health Card bands, with the specific "
     "shortage named. The nutrient rating takes the worst of N, P and K "
     "rather than the average, because a farmer acts on the one that is "
     "short.",
     "Rules rather than the specified ensemble decision trees. Micronutrients "
     "(iron, zinc, copper, manganese, boron), microbial biomass, bulk density "
     "and electrical conductivity are not collected, so they cannot be scored."),

    ("2.2", "Crop Recommendation Engine", BUILT,
     "Scores crops against the farm's soil and climate and returns ranked "
     "recommendations with the reasoning shown.",
     "Fewer input parameters than the 22 specified, because several of them "
     "are not collected anywhere in the app."),

    ("2.3", "Market Price Forecaster", NOT_BUILT,
     "Nothing.",
     "No price data, so nothing to forecast from. The first step is "
     "connecting daily mandi prices; forecasting comes after there is a "
     "history to forecast from."),

    ("2.4", "Yield Predictor", NOT_BUILT,
     "Nothing.",
     "Needs a season of recorded harvests to learn from, and the app does "
     "not record a sowing or a harvest at all. Recording those is the "
     "sensible next step - it is a small feature and it unlocks both this "
     "and harvest performance reporting."),

    ("2.5", "Fertilizer Calculator", BUILT,
     "Select the crop, target yield and field area and it works out the "
     "nitrogen, phosphorus and potassium needed and what it will cost. "
     "Confirmed working by the testing team.",
     "Organic alternatives and a staged application schedule are thinner "
     "than the specification describes."),

    ("2.6", "Blockchain Supply Chain", NOT_BUILT,
     "Nothing.",
     "No batch QR codes, origin certification, transaction log or smart "
     "contracts. This is the largest and least certain item in the "
     "specification, and it only has value once the marketplace exists - "
     "there is nothing to trace until produce is being sold through the app."),
]

# Requirements that run across the whole product rather than sitting in one
# module.
CROSS = [
    ("10 Indian languages", BUILT,
     "All 10 languages in the specification are supported: Hindi, Bengali, "
     "Telugu, Tamil, Kannada, Malayalam, Punjabi, Gujarati, Marathi and "
     "English."),
    ("Offline mode", BUILT,
     "Recently loaded data stays readable with no signal, and the weed "
     "detector runs on the phone with no internet at all. Actions needing "
     "the server are refused clearly rather than failing silently."),
    ("Reports and export", PARTIAL,
     "Water, hours, electricity and soil reports run on real data, and a "
     "report can be exported as CSV. PDF export and scheduled daily reports "
     "are not built."),
    ("Accessibility", PARTIAL,
     "Large touch targets and the 10 languages help. No screen reader "
     "testing has been done and there is no high contrast mode."),
    ("WhatsApp integration", NOT_BUILT,
     "Not built. The specification itself marks this as planned rather than "
     "delivered."),
]


def shade(cell, hexcolour):
    from docx.oxml.ns import qn
    from docx.oxml import OxmlElement
    el = OxmlElement('w:shd')
    el.set(qn('w:val'), 'clear')
    el.set(qn('w:fill'), hexcolour)
    cell._tc.get_or_add_tcPr().append(el)


def build():
    doc = Document()

    for section in doc.sections:
        section.left_margin = Inches(0.8)
        section.right_margin = Inches(0.8)

    style = doc.styles['Normal']
    style.font.name = 'Calibri'
    style.font.size = Pt(10.5)

    # ── Title ────────────────────────────────────────────────────────────
    t = doc.add_paragraph()
    t.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = t.add_run('SmartKisan - Feature Gap Analysis')
    r.bold = True
    r.font.size = Pt(20)
    r.font.color.rgb = GREEN

    s = doc.add_paragraph()
    s.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = s.add_run('The Crop Suitability Analyzer specification against the '
                  'Android app as built')
    r.font.size = Pt(11)
    r.font.color.rgb = GREY

    s = doc.add_paragraph()
    s.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = s.add_run('Hbeonlabs Technologies Pvt. Ltd.  |  Prepared 27 September 2026')
    r.font.size = Pt(9)
    r.font.color.rgb = GREY

    # ── The answer, up front ─────────────────────────────────────────────
    doc.add_heading('The short answer', level=1)

    built = sum(1 for m in MODULES if m[2] == BUILT)
    partial = sum(1 for m in MODULES if m[2] == PARTIAL)
    missing = sum(1 for m in MODULES if m[2] == NOT_BUILT)

    p = doc.add_paragraph()
    p.add_run('The specification describes 16 modules in detail. Of those, ')
    r = p.add_run('%d are built' % built); r.bold = True; r.font.color.rgb = GREEN
    p.add_run(', ')
    r = p.add_run('%d are partly built' % partial); r.bold = True; r.font.color.rgb = AMBER
    p.add_run(' and ')
    r = p.add_run('%d are not built' % missing); r.bold = True; r.font.color.rgb = RED
    p.add_run('.')

    doc.add_paragraph(
        'Counting differently: everything a farmer needs to run their own farm '
        'day to day is working - soil, weather, pumps, irrigation, crops, '
        'fields, devices, disease detection, weed detection, fertiliser and '
        'crop suitability. What is missing is everything that connects a '
        'farmer to other people: the marketplace, the forum, market prices, '
        'and the supply chain. Plus the voice assistant, which is a different '
        'kind of gap and discussed below.')

    doc.add_paragraph(
        'A note on the numbers. That document states 87 features but does not '
        'number them, and its own headings do not divide into 87 any way they '
        'are counted. Rather than invent a figure to match, every one of the '
        '16 detailed modules is assessed below, and what is missing inside '
        'each is named. That is a more useful answer than a percentage.')

    # ── Summary table ────────────────────────────────────────────────────
    doc.add_heading('Module by module', level=1)

    table = doc.add_table(rows=1, cols=3)
    table.style = 'Table Grid'
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    hdr = table.rows[0].cells
    for i, text in enumerate(['Ref', 'Module', 'Status']):
        hdr[i].text = ''
        run = hdr[i].paragraphs[0].add_run(text)
        run.bold = True
        run.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
        shade(hdr[i], '2E7D32')

    for ref, name, status, _have, _missing in MODULES:
        cells = table.add_row().cells
        cells[0].text = ref
        cells[1].text = name
        cells[2].text = ''
        run = cells[2].paragraphs[0].add_run(status)
        run.bold = True
        run.font.color.rgb = COLOURS[status]
        if status != BUILT:
            for c in cells:
                shade(c, 'FFF8E1' if status == PARTIAL else 'FFEBEE')

    for row in table.rows:
        row.cells[0].width = Inches(0.6)
        row.cells[1].width = Inches(3.4)
        row.cells[2].width = Inches(1.4)

    # ── Detail ───────────────────────────────────────────────────────────
    doc.add_page_break()
    doc.add_heading('What each module has, and what is missing', level=1)

    for ref, name, status, have, missing_text in MODULES:
        h = doc.add_heading(level=2)
        r = h.add_run('%s  %s' % (ref, name))
        r.font.color.rgb = COLOURS[status]

        p = doc.add_paragraph()
        r = p.add_run(status)
        r.bold = True
        r.font.color.rgb = COLOURS[status]

        p = doc.add_paragraph()
        r = p.add_run('In the app: ')
        r.bold = True
        p.add_run(have)

        p = doc.add_paragraph()
        r = p.add_run('Missing: ')
        r.bold = True
        p.add_run(missing_text)

    # ── Cross-cutting ────────────────────────────────────────────────────
    doc.add_page_break()
    doc.add_heading('Requirements across the whole product', level=1)

    for name, status, text in CROSS:
        p = doc.add_paragraph()
        r = p.add_run('%s - ' % name)
        r.bold = True
        r = p.add_run(status)
        r.bold = True
        r.font.color.rgb = COLOURS[status]
        p = doc.add_paragraph(text)
        p.paragraph_format.space_after = Pt(10)

    # ── Recommendation ───────────────────────────────────────────────────
    doc.add_heading('What to build next, and why', level=1)

    doc.add_paragraph(
        'The seven modules that are not built are not equal in value or in '
        'effort, so they are not a single queue of work.')

    order = [
        ('Record sowings and harvests',
         'Small, and it unlocks two other things. Yield prediction cannot be '
         'built without a season of harvest records, and the harvest '
         'performance report is empty for the same reason. Nothing in the app '
         'records either today. Roughly a week.'),
        ('Voice assistant',
         'The biggest gap relative to who this app is for. A farmer who reads '
         'little cannot use an app that only writes, whatever language it is '
         'written in. Speech-to-text and text-to-speech for the 10 languages '
         'already translated. Several weeks, and worth costing properly.'),
        ('Mandi prices',
         'The government publishes daily prices through data.gov.in. Needs a '
         'free API key, then roughly half a day. It also has to exist before '
         'price forecasting is possible at all.'),
        ('Marketplace',
         'Large, and it needs decisions before code: how payment works, who '
         'moderates listings, and who carries the risk in a dispute. Those '
         'are business questions, not development ones.'),
        ('Farmer forum',
         'A community product with its own moderation and abuse handling. '
         'Worth deciding whether it belongs in this app at all, or whether a '
         'WhatsApp group already does the job for these users.'),
        ('Blockchain supply chain',
         'Last. It traces produce sold through the marketplace, and there is '
         'no marketplace yet, so there is nothing to trace.'),
    ]

    for i, (name, why) in enumerate(order, start=1):
        p = doc.add_paragraph()
        r = p.add_run('%d. %s' % (i, name))
        r.bold = True
        r.font.size = Pt(11)
        p = doc.add_paragraph(why)
        p.paragraph_format.space_after = Pt(10)

    doc.add_heading('One thing worth saying plainly', level=1)
    doc.add_paragraph(
        'That specification describes a Python web platform. The Android app '
        'is a separate build and was never a port of it, so a module missing '
        'from the app is not necessarily work that was skipped - in several '
        'cases the app does the same job a different way, and in a few it '
        'does more. The weed detector, the farm task list, one-time code '
        'sign-in and account deletion are all in the app and appear nowhere '
        'in that document.')

    os.makedirs(OUT_DIR, exist_ok=True)
    out = os.path.join(OUT_DIR, FILENAME)
    doc.save(out)
    print('Wrote ' + out)
    print('  %d modules: %d built, %d partial, %d not built'
          % (len(MODULES), built, partial, missing))


if __name__ == '__main__':
    build()
