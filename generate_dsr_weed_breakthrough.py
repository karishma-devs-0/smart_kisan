"""
DSR for 16 - 23 September 2026.

Covers the weed model work after the 15-16 September report: the public
photograph collection, the retraining, and the measurement that finally moved.

Written in the first person singular. It is submitted under one name, so "we"
would be the wrong voice.

Plain wording throughout - this is forwarded to people who did not do the work.

Honest about the difficulty, because it was genuinely hard and took several
failed attempts over three weeks. Honest about what the new number does and
does not mean, because the testing team will hold the app to whatever is
claimed here.

Every row corresponds to a real commit or a file on disk.
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

WED1 = "2026-09-16"
WED2 = "2026-09-23"
FILENAME = "SmartKisan_DSR_2026-09-16_to_09-23.xlsx"

HEADERS = ["Date", "Task Category", "Detailed Task Description",
           "Deliverables / Artifacts", "Status", "Hours Spent", "Remarks & Notes"]

ROWS = [
    [
        WED1,
        "Weed Model - Why It Was Failing",
        "This has been the hardest problem on the project and it took three "
        "weeks and several failed attempts to understand. The model looked "
        "accurate - over 90% on its own test data - but that was misleading. "
        "It scored 95.9% on grass photographed at the farm it learned from, "
        "and 12.8% on grass photographed anywhere else. It was recognising "
        "the farm and the camera, not the plant.",
        "diagnose_grass.py, evaluate_crop_aware.py",
        "Root Cause Found",
        "",
        "The crop class was worse still, at 23.3% on real photographs. I first "
        "suspected blurred images, then the way the results were read. Testing "
        "ruled out both.",
    ],
    [
        WED1,
        "Weed Model - Two Failed Attempts",
        "The obvious fix was more Indian weed data, so I added two collections "
        "and retrained twice. On dataset images this looked like a gain of "
        "thirteen points. On real photographs it was worth nothing: 78.5% and "
        "82.6%, against 82.1% for the model already in the app. All that "
        "changed was which weed type was weak.",
        "train_weed_model.py, model/india3_holdout, model/india3_balanced",
        "Not Adopted",
        "",
        "Time spent, but not wasted - this is what proved the problem was the "
        "kind of photographs, not the quantity, and pointed at the fix.",
    ],
    [
        WED1,
        "Weed Model - Collecting Real Photographs",
        "Collected 11,555 photographs of the weeds our farmers meet, taken by "
        "about 1,900 different people on their own phones, each plant "
        "confirmed by two or more people. Photographers who appear in our test "
        "set were removed from the training data - 4,120 images - because "
        "testing a model on someone whose habits it has learned measures the "
        "exact fault being removed.",
        "fetch_wild_test.py, data/wild_train (11,555 images)",
        "Completed",
        "",
        "Also fixed two faults in the collection tool: it could never fetch "
        "more than 200 photographs of any plant, which is probably why the "
        "grass classes always looked short.",
    ],
    [
        WED1,
        "Weed Model - Retraining",
        "Retrained on the collected photographs, split by photographer rather "
        "than by image so the same person's pictures never appear on both "
        "sides.",
        "model/inat/combined_model.tflite",
        "Completed",
        "",
        "7,473 training images across three classes.",
    ],
    [
        WED2,
        "Weed Model - Measurement",
        "Measured against 390 real photographs that no version of the model "
        "has ever been trained on, and taken by people who appear nowhere in "
        "the training data. Telling grass from broadleaf - the distinction "
        "that decides which weedkiller a farmer buys - the new model reaches "
        "93.1%, against 82.1% for the one currently in the app and 82.6% for "
        "the best earlier attempt.",
        "evaluate_weed_type_only.py",
        "Completed",
        "",
        "It is also the first version that does not improve one weed type by "
        "damaging the other: grass 91.1% and broadleaf 94.8%, where earlier "
        "attempts traded one for the other.",
    ],
    [
        WED2,
        "Weed Model - What the Number Does Not Mean",
        "Stating the limits plainly so the figure is not read as more than it "
        "is. It measures grass against broadleaf only. The photographs, though "
        "real and taken on phones, are framed by people photographing a plant "
        "deliberately - a farmer pointing his phone at a patch of field will "
        "do worse. The model still cannot reliably tell whether a plant is the "
        "crop rather than a weed, so the app answers that from the crop the "
        "farmer has already entered.",
        "Recorded in train_weed_model.py",
        "Noted",
        "",
        "I would not promise 93% to a farmer. I would say the model is now "
        "materially better and worth putting in front of the testing team.",
    ],
    [
        WED2,
        "Weed Model - Ready to Ship",
        "The model is trained, measured and ready. Putting it into the app "
        "needs a new APK build, which the previous attempt did not justify and "
        "this one does.",
        "model/inat/combined_model.tflite (2.4 MB)",
        "Ready for Build",
        "",
        "Recommend building and giving it to the testing team this week.",
    ],
]

OPEN_ITEMS = [
    ["Weed model", "Build the APK with the new model",
     "Ready. Half a day including a smoke test on a phone."],
    ["Weed model", "Stop the model guessing whether the plant is the crop",
     "Worth about three more points and needs no retraining. The app can "
     "answer it from the crop the farmer entered at setup."],
    ["Testing", "Fresh test results from the testing team",
     "11 of their 14 defects are fixed and deployed. Requested a retest, and "
     "the exact error text for TC-016."],
    ["Phone sign-in", "Codes cannot reach Indian numbers",
     "Needs the company's SMS service details, or DLT registration with TRAI. "
     "Business registration, not development."],
    ["Username login", "No username system exists in the app",
     "Replaced with email code sign-in. Needs confirmation this is acceptable."],
    ["Security", "Pump control runs on a public message broker",
     "Anyone who knows a user's ID can read their sensors and switch their "
     "pump. Acceptable for a demo, not for real pumps in real fields."],
]

HEADER_FILL = PatternFill("solid", fgColor="2E7D32")
HEADER_FONT = Font(bold=True, color="FFFFFF", size=11)
SECTION_FILL = PatternFill("solid", fgColor="C8E6C9")
THIN = Side(style="thin", color="BDBDBD")
BORDER = Border(left=THIN, right=THIN, top=THIN, bottom=THIN)

STATUS_COLOURS = {
    "Completed": "1B5E20",
    "Root Cause Found": "1B5E20",
    "Ready for Build": "E65100",
    "Not Adopted": "E65100",
    "Noted": "555555",
}


def build():
    wb = Workbook()
    ws = wb.active
    ws.title = "DSR"

    ws.append(["SmartKisan - Daily Status Report"])
    ws.merge_cells(start_row=1, start_column=1, end_row=1, end_column=len(HEADERS))
    c = ws.cell(row=1, column=1)
    c.font = Font(bold=True, size=14, color="1B5E20")
    c.alignment = Alignment(horizontal="center")

    ws.append(["16 - 23 September 2026 | Weed detection model "
               "(following the 15-16 September report)"])
    ws.merge_cells(start_row=2, start_column=1, end_row=2, end_column=len(HEADERS))
    c = ws.cell(row=2, column=1)
    c.alignment = Alignment(horizontal="center")
    c.font = Font(italic=True, size=10, color="555555")

    ws.append([])
    ws.append(HEADERS)
    for i in range(1, len(HEADERS) + 1):
        cell = ws.cell(row=4, column=i)
        cell.fill = HEADER_FILL
        cell.font = HEADER_FONT
        cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        cell.border = BORDER

    for row in ROWS:
        ws.append(row)
        r = ws.max_row
        for i in range(1, len(HEADERS) + 1):
            cell = ws.cell(row=r, column=i)
            cell.border = BORDER
            cell.alignment = Alignment(vertical="top", wrap_text=True)
        colour = STATUS_COLOURS.get(row[4])
        if colour:
            ws.cell(row=r, column=5).font = Font(bold=True, color=colour)

    ws.append([])
    ws.append(["Open Items"])
    r = ws.max_row
    ws.merge_cells(start_row=r, start_column=1, end_row=r, end_column=len(HEADERS))
    ws.cell(row=r, column=1).font = Font(bold=True, size=12, color="1B5E20")
    ws.cell(row=r, column=1).fill = SECTION_FILL

    ws.append(["Area", "Item", "What it needs", "", "", "", ""])
    r = ws.max_row
    for i in range(1, 4):
        cell = ws.cell(row=r, column=i)
        cell.font = Font(bold=True)
        cell.fill = PatternFill("solid", fgColor="E8F5E9")
        cell.border = BORDER

    for item in OPEN_ITEMS:
        ws.append([item[0], item[1], item[2], "", "", "", ""])
        r = ws.max_row
        for i in range(1, 4):
            cell = ws.cell(row=r, column=i)
            cell.border = BORDER
            cell.alignment = Alignment(vertical="top", wrap_text=True)

    for i, w in enumerate([12, 32, 68, 34, 20, 12, 46], start=1):
        ws.column_dimensions[chr(64 + i)].width = w

    ws.row_dimensions[4].height = 28
    ws.freeze_panes = "A5"

    out = os.path.join(os.path.dirname(os.path.abspath(__file__)), FILENAME)
    wb.save(out)
    print("Wrote " + out)
    print("  %d task rows, %d open items" % (len(ROWS), len(OPEN_ITEMS)))


if __name__ == "__main__":
    build()
