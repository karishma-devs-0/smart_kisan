"""
DSR for Thursday 10 to Saturday 12 September 2026, plus Monday 14 September.

Covers the work after the 3 September report: rebuilding the disease model
around the crops Indian farmers actually grow, and deploying it.

Same layout as the previous DSR generators. Every row corresponds to real work
on main. Two sections are new and deliberate:

  - "Result" states the numbers plainly, including the like-for-like figure
    rather than only the flattering one.
  - "Why this took three days" exists because the question was asked. Most of
    the elapsed time was a laptop CPU training, and two of the three runs
    failed. Both facts are better stated than left to be guessed at.

Hours are filled in here, unlike earlier DSRs, because the question was about
time rather than output: six hours a day across four days.
"""

import os
import sys
import subprocess

try:
    import openpyxl
except ImportError:
    subprocess.check_call([sys.executable, "-m", "pip", "install", "openpyxl"])
    import openpyxl

from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side

THU = "2026-09-10"
FRI = "2026-09-11"
SAT = "2026-09-12"
MON = "2026-09-14"

FILENAME = "SmartKisan_DSR_2026-09-10_to_09-14.xlsx"

HEADERS = ["Date", "Task Category", "Detailed Task Description",
           "Deliverables / Artifacts", "Status", "Hours Spent", "Remarks & Notes"]

ROWS = [
    # ---------------- Thursday 10 September ----------------
    [
        THU,
        "Disease Detection - Measurement",
        "Measured the model running in the app against 1,581 photographs it "
        "had never seen, taken in real fields rather than in a laboratory. "
        "The figure quoted until now came from images of the same kind it "
        "learned from, which reports memorisation rather than usefulness.",
        "evaluate_india_model.py",
        "Completed",
        1.5,
        "Named the disease correctly in 28 photographs out of 100, and the "
        "crop in 49. Worse, 42 healthy plants out of every 100 were reported "
        "as diseased - a farmer sent to buy a spray he does not need.",
    ],
    [
        THU,
        "Disease Detection - Root Cause",
        "Examined what the model had actually been taught. 16 of its 38 "
        "disease classes are apple, grape, cherry, peach, blueberry, "
        "raspberry and strawberry: temperate orchard and berry crops our "
        "farmers do not grow. It had no wheat and no rice at all.",
        "classes_india.py",
        "Completed",
        1.0,
        "A farmer photographing wheat was receiving a confident answer about "
        "a tomato, because wheat was not an answer the model could give. No "
        "amount of tuning fixes a wrong list of crops.",
    ],
    [
        THU,
        "Training Data - Sourcing and Licensing",
        "Selected replacement training collections covering rice, wheat and "
        "field-grown potato, maize and tomato, and checked the licence on "
        "each one before downloading it.",
        "Four public collections, licences recorded",
        "Completed",
        2.0,
        "One good multi-crop set from Bangladesh was rejected: its licence "
        "forbids commercial use, so it cannot sit inside a product we sell. "
        "Cheaper to find that now than after it is in a shipped model.",
    ],
    [
        THU,
        "Training Data - Download",
        "Downloaded roughly 1.5 GB of imagery across the four collections.",
        "dataset/ (not committed)",
        "Completed",
        1.5,
        "One host began refusing requests for downloading too quickly and the "
        "download had to be slowed and restarted from the beginning. "
        "Unavoidable, and it cost about half of this time.",
    ],

    # ---------------- Friday 11 September ----------------
    [
        FRI,
        "Disease Detection - New Crop List",
        "Rebuilt the list of crops and diseases the model can name: 32 "
        "classes across 9 crops. Removed the 16 orchard and berry classes, "
        "added rice, wheat and field-grown potato, maize and tomato.",
        "classes_india.py, finetune_india.py",
        "Completed",
        1.5,
        "Caught a trap while doing this. Maize and tomato both have folders "
        "named healthy and leaf blight in one dataset. Loaded carelessly, "
        "maize disease would have been taught as tomato disease with no error "
        "reported anywhere - it would only have shown up later as a model "
        "that is wrong for no visible reason.",
    ],
    [
        FRI,
        "Disease Detection - Design Comparison",
        "Compared two model designs on identical data before committing to "
        "one, rather than assuming the newer one is better.",
        "finetune_india.py (--arch)",
        "Completed",
        1.0,
        "58.1% against 61.9% on field photographs. Kept the better one. Worth "
        "the hour: the choice is made once and everything afterwards is built "
        "on top of it.",
    ],
    [
        FRI,
        "Disease Detection - First Full Training Run",
        "Trained the model on the new crop list: 20,777 training images, 78% "
        "of them photographed in real fields rather than in a laboratory.",
        "india_model.tflite, class_labels_india.json",
        "Completed",
        3.0,
        "85.9% overall, and rice and wheat work for the first time. But three "
        "crops were still weak - tomato 44%, potato 50%, maize 65%. Those are "
        "the crops our users grow most, so this was not shippable.",
    ],
    [
        FRI,
        "Disease Detection - Service Prepared",
        "Rewrote the service that answers the app so it carries treatment "
        "advice for rice and wheat, and reads the image size from the model "
        "rather than assuming the old one.",
        "huggingface_india/app.py",
        "Completed",
        0.5,
        "Rice bacterial blight and rice tungro deliberately advise no spray - "
        "neither responds to one, and recommending a chemical that cannot "
        "work costs the farmer money for nothing.",
    ],

    # ---------------- Saturday 12 September ----------------
    [
        SAT,
        "Disease Detection - First Attempt at the Weak Crops",
        "Tried to lift tomato, potato and maize by giving the model more "
        "laboratory photographs of those three crops.",
        "finetune_india.py (rebalanced run)",
        "Investigated - Not Adopted",
        2.0,
        "It made tomato worse: 44% down to 38%. Run discarded. Recorded in "
        "the code beside the setting it concerns, so it is not tried again.",
    ],
    [
        SAT,
        "Disease Detection - Error Analysis",
        "Instead of guessing at a second attempt, examined exactly which "
        "photographs the model was getting wrong and what it answered "
        "instead.",
        "evaluate_india_model.py",
        "Completed",
        1.0,
        "33 of the 39 tomato mistakes were one tomato disease mistaken for "
        "another. The model knew it was a tomato; it could not tell the "
        "diseases apart in field conditions. That is why more laboratory "
        "photographs failed, and it pointed straight at the real fix.",
    ],
    [
        SAT,
        "Training Data - Corrupt Files",
        "A training run died partway with a corrupt image error that did not "
        "name the file. Wrote a tool to find them by opening every image two "
        "different ways.",
        "find_bad_images.py",
        "Fixed",
        0.5,
        "96 broken image files in one download. Skipped by name, so a run "
        "does not stop on them and the rest of the collection is still used.",
    ],
    [
        SAT,
        "Disease Detection - Final Training Run",
        "Retrained with real field photographs of the three weak crops "
        "instead of more laboratory ones.",
        "india_model.tflite (final)",
        "Completed",
        2.5,
        "Tomato 44% to 88%, potato 50% to 86%, maize 65% to 82%. Overall 87%. "
        "This is the model now in the app.",
    ],

    # ---------------- Monday 14 September ----------------
    [
        MON,
        "Disease Detection - Deployment",
        "Uploaded the model, its crop list and the service that answers the "
        "app, together. Verified the live service is answering with the new "
        "model before calling it done.",
        "deploy_to_space.py",
        "Completed",
        1.5,
        "Live and confirmed: 32 classes, 9 crops, wheat and rice present. The "
        "upload script now refuses to run if the model and the crop list "
        "disagree - an earlier deployment sent the wrong model because "
        "nothing checked.",
    ],
    [
        MON,
        "App - Confidence Threshold",
        "Raised the confidence level below which the app declines to name a "
        "disease, from 70% to 80%, measured across the same test set.",
        "src/services/api.js",
        "Fixed",
        1.0,
        "About a quarter fewer wrong diagnoses reach the farmer, for six "
        "points of coverage. An unanswered scan costs him another "
        "photograph; a wrong one costs him a fungicide.",
    ],
    [
        MON,
        "Accuracy Report",
        "Prepared the accuracy report for sending, as a Word document and a "
        "web page, with the before-and-after chart by crop.",
        "SmartKisan_Model_Accuracy_2026-09-14.docx / .html",
        "Completed",
        2.0,
        "Trimmed to the four headline figures, the chart, the table and the "
        "confidence threshold. How the work was done was removed; what it "
        "produced was kept.",
    ],
    [
        MON,
        "Accuracy Report - Correction",
        "Found and fixed a labelling error in our own report before sending "
        "it. The chart called our first training run the previous model, "
        "which reads as the model the app was running.",
        "docs/reports/model-accuracy-2026-09-14.html",
        "Fixed",
        0.5,
        "The report was comparing against one baseline in the headline "
        "figures and a different one in the chart, under the same word. Also "
        "added the like-for-like figure, 35% to 86%, alongside the headline "
        "28% to 87% - see the Result section below.",
    ],
    [
        MON,
        "Test Build",
        "Built a test APK. First build since 31 August, so it also carries "
        "the fixes made in between.",
        "SmartKisan-test-2026-09-14.apk (71 MB)",
        "Ready for Testing",
        1.0,
        "Also includes: profile edits saving, the forgot-password flow, phone "
        "one-time codes, the pump routes that were writing to database "
        "columns that do not exist, and real data behind crop suitability and "
        "farm management.",
    ],
]

RESULT = [
    ["Disease named correctly", "28%", "87%",
     "On 1,581 photographs the model never saw in training"],
    ["Crop named correctly", "49%", "99%",
     "Which plant it is looking at"],
    ["Healthy plant called diseased", "42%", "8%",
     "A spray recommended to a farmer who did not need one"],
    ["Crops covered", "7", "9",
     "Wheat and rice added - most of our users grow them"],
    ["Tomato", "44%", "88%", "Before figure is our own first training run"],
    ["Potato", "50%", "86%", "Before figure is our own first training run"],
    ["Maize", "65%", "82%", "Before figure is our own first training run"],
    ["Rice", "not covered", "92%", "The old model had no rice class"],
    ["Wheat", "not covered", "90%", "The old model had no wheat class"],
    ["Like-for-like", "about 35%", "about 86%",
     "A fifth of the test set is rice and wheat, which the old model could "
     "never have answered. Excluding those, this is the fair comparison. Both "
     "numbers are real; the farmer experiences 28% to 87%."],
]

WHY = [
    ["Training time",
     "One full training run takes about five hours on a laptop processor. We "
     "have no graphics card. Three runs were needed, so roughly 15 of the 18 "
     "hours was the machine working."],
    ["Runs cannot overlap",
     "Running two at once was tried. Both slowed badly - one step went from 8 "
     "minutes to 37. So it is one run at a time."],
    ["Results arrive only at the end",
     "Whether a change worked is unknown until the run finishes. The shape of "
     "the day is: start a run, wait, measure, work out what went wrong, "
     "change one thing, start the next. Two attempts a day at most."],
    ["Two of the three runs failed",
     "That is the part that was worth the time. The failed rebalancing run is "
     "what proved the problem was field conditions and not a shortage of "
     "data. Without it, the next day would have been spent adding more of the "
     "wrong thing."],
    ["What would make it faster",
     "Renting a cloud graphics card for a day brings a five-hour run to well "
     "under an hour. The same job would fit in one shift instead of three."],
]

OPEN_ITEMS = [
    ["Disease model", "Field testing not yet done",
     "Tomato, potato and maize are measured mostly on collections where we "
     "divided training and testing images ourselves, so those are the "
     "optimistic end. On the one collection where outside authors published "
     "the division, the model scores 57%. Real field results will land "
     "between the two."],
    ["Weed model", "Grass weeds identified 13% of the time",
     "Unchanged from the 3 September report and still the priority for weed "
     "work. Grass against broadleaf decides which herbicide is bought, so "
     "this matters more than the overall figure."],
    ["Training hardware", "No graphics card",
     "The main reason this work is measured in days rather than hours. A "
     "rented cloud machine for a day would remove it."],
    ["Phone sign-in", "Codes cannot reach Indian numbers",
     "Unchanged. Requires DLT registration with TRAI, or credentials for an "
     "SMS account the company already holds. Business registration, not "
     "development."],
    ["Real-time messaging", "Pump control uses a public broker",
     "Unchanged. Anyone who knows a user ID could read sensor data or switch "
     "a pump. Needs a private broker before physical hardware is connected."],
]

HEADER_FILL = PatternFill("solid", fgColor="2E7D32")
HEADER_FONT = Font(bold=True, color="FFFFFF", size=11)
SECTION_FILL = PatternFill("solid", fgColor="C8E6C9")
SUBHEAD_FILL = PatternFill("solid", fgColor="E8F5E9")
THIN = Side(style="thin", color="BDBDBD")
BORDER = Border(left=THIN, right=THIN, top=THIN, bottom=THIN)

STATUS_COLOURS = {
    "Fixed": "1B5E20",
    "Completed": "1B5E20",
    "Ready for Testing": "0277BD",
    "Investigated - Not Adopted": "E65100",
}

DAY_NAMES = {
    THU: "Thursday 10 September",
    FRI: "Friday 11 September",
    SAT: "Saturday 12 September",
    MON: "Monday 14 September",
}


def section(ws, title):
    ws.append([])
    ws.append([title])
    r = ws.max_row
    ws.merge_cells(start_row=r, start_column=1, end_row=r, end_column=len(HEADERS))
    ws.cell(row=r, column=1).font = Font(bold=True, size=12, color="1B5E20")
    ws.cell(row=r, column=1).fill = SECTION_FILL


def subhead(ws, labels):
    ws.append(labels + [""] * (len(HEADERS) - len(labels)))
    r = ws.max_row
    for c in range(1, len(labels) + 1):
        cell = ws.cell(row=r, column=c)
        cell.font = Font(bold=True)
        cell.fill = SUBHEAD_FILL
        cell.border = BORDER
        cell.alignment = Alignment(vertical="top", wrap_text=True)


def body(ws, values, span):
    ws.append(list(values) + [""] * (len(HEADERS) - len(values)))
    r = ws.max_row
    for c in range(1, span + 1):
        cell = ws.cell(row=r, column=c)
        cell.border = BORDER
        cell.alignment = Alignment(vertical="top", wrap_text=True)
    return r


def day_total(ws, day, hours):
    """Close each day with its own total, so the six hours are visible
    rather than something the reader has to add up."""
    ws.append(["", DAY_NAMES[day] + " - total", "", "", "", hours, ""])
    r = ws.max_row
    for c in range(1, len(HEADERS) + 1):
        cell = ws.cell(row=r, column=c)
        cell.fill = SUBHEAD_FILL
        cell.border = BORDER
    ws.cell(row=r, column=2).font = Font(bold=True, color="1B5E20")
    ws.cell(row=r, column=2).alignment = Alignment(horizontal="right", vertical="center")
    ws.cell(row=r, column=6).font = Font(bold=True, color="1B5E20")
    ws.cell(row=r, column=6).alignment = Alignment(horizontal="center", vertical="center")


def build():
    wb = Workbook()
    ws = wb.active
    ws.title = "DSR"

    ws.append(["SmartKisan - Daily Status Report"])
    ws.merge_cells(start_row=1, start_column=1, end_row=1, end_column=len(HEADERS))
    ws.cell(row=1, column=1).font = Font(bold=True, size=14, color="1B5E20")
    ws.cell(row=1, column=1).alignment = Alignment(horizontal="center")

    ws.append(["Thursday 10 to Saturday 12 September 2026, and Monday 14 September "
               "(following the 3 September report) - 6 hours per day"])
    ws.merge_cells(start_row=2, start_column=1, end_row=2, end_column=len(HEADERS))
    ws.cell(row=2, column=1).alignment = Alignment(horizontal="center")
    ws.cell(row=2, column=1).font = Font(italic=True, size=10, color="555555")

    ws.append([])
    ws.append(HEADERS)
    for c in range(1, len(HEADERS) + 1):
        cell = ws.cell(row=4, column=c)
        cell.fill = HEADER_FILL
        cell.font = HEADER_FONT
        cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        cell.border = BORDER

    current_day = None
    day_hours = 0.0
    for row in ROWS:
        if current_day is not None and row[0] != current_day:
            day_total(ws, current_day, day_hours)
            day_hours = 0.0
        current_day = row[0]
        day_hours += row[5]

        ws.append(row)
        r = ws.max_row
        for c in range(1, len(HEADERS) + 1):
            cell = ws.cell(row=r, column=c)
            cell.border = BORDER
            cell.alignment = Alignment(vertical="top", wrap_text=True)
        ws.cell(row=r, column=6).alignment = Alignment(horizontal="center", vertical="top")
        colour = STATUS_COLOURS.get(row[4])
        if colour:
            ws.cell(row=r, column=5).font = Font(bold=True, color=colour)
    day_total(ws, current_day, day_hours)

    section(ws, "Result - measured on 1,581 photographs never seen in training")
    subhead(ws, ["Measure", "Old model", "Now", "Note"])
    for item in RESULT:
        r = body(ws, item, 4)
        ws.cell(row=r, column=3).font = Font(bold=True, color="1B5E20")

    section(ws, "Why this took three days and not one")
    subhead(ws, ["Reason", "Detail"])
    for item in WHY:
        body(ws, item, 2)

    section(ws, "Open Items")
    subhead(ws, ["Reference", "Item", "Blocked On / Next Step"])
    for item in OPEN_ITEMS:
        body(ws, item, 3)

    for i, w in enumerate([12, 34, 62, 34, 26, 12, 56], start=1):
        ws.column_dimensions[chr(64 + i)].width = w

    ws.row_dimensions[4].height = 28
    ws.freeze_panes = "A5"

    out = os.path.join(os.path.dirname(os.path.abspath(__file__)), FILENAME)
    wb.save(out)
    print("Wrote " + out)
    print("  %d task rows over %d days, %.1f hours total"
          % (len(ROWS), len(DAY_NAMES), sum(r[5] for r in ROWS)))
    print("  %d result rows, %d reasons, %d open items"
          % (len(RESULT), len(WHY), len(OPEN_ITEMS)))


if __name__ == "__main__":
    build()
