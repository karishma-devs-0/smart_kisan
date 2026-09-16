"""
DSR for Tuesday 15 and Wednesday 16 September 2026.

Covers the work after the 10-14 September report, which ended with the disease
model deployed. Monday the 14th is not repeated here; it is in that report.

Written in the first person singular. It is submitted under one name, so "we"
would be the wrong voice. Where the plural carries real meaning it is named:
"our farmers" means Indian farmers, "our users" means SmartKisan users.

Plain wording throughout - this gets forwarded to people who did not do the
work, and some of it goes on to the testing team.

Same layout as the previous DSR generators. Every row corresponds to a real
commit on main.
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

TUE = "2026-09-15"
WED = "2026-09-16"
FILENAME = "SmartKisan_DSR_2026-09-15_to_09-16.xlsx"

HEADERS = ["Date", "Task Category", "Detailed Task Description",
           "Deliverables / Artifacts", "Status", "Hours Spent", "Remarks & Notes"]

ROWS = [
    # ── Tuesday 15 September ────────────────────────────────────────────────
    [
        TUE,
        "Weed Model - The Real Test",
        "The disease model got much better last week once real field "
        "photographs were added to its training. I set out to do the same for "
        "the weed model, using weed collections from India. On the usual "
        "tests it looked like a big win - about thirteen points. So I tested "
        "it properly, on 540 photographs taken by ordinary people on their "
        "phones rather than by a research project. Every version scored "
        "between 80 and 83 percent. The old one, the new ones, all the same.",
        "fetch_wild_test.py, evaluate_weed_type_only.py, train_weed_model.py",
        "Completed",
        "",
        "The gain was not real. It only showed up when I tested one "
        "collection against another, because both were shot the same way and "
        "the model was learning the photographer rather than the plant.",
    ],
    [
        TUE,
        "Weed Model - Decision Not to Ship",
        "On real photographs the new model and the one already on people's "
        "phones are level. Replacing it would mean a new app build for no "
        "measurable gain, so I did not replace it. The new data is kept - it "
        "is what made this ceiling visible, and it will be useful once there "
        "is real imagery to combine it with.",
        "train_weed_model.py (findings recorded in the file)",
        "Completed - Not Shipped",
        "",
        "A tie should go to what is already working in the field.",
    ],
    [
        TUE,
        "Weed Model - A Question It Cannot Answer",
        "The model tries to decide whether the plant in the photo is the crop "
        "rather than a weed. On real photographs it gets that right only 23 "
        "times in 100. It was taught on young sorghum from a single farm, so "
        "wheat, rice and maize confuse it. Not asking it that question is "
        "worth about three points and needs no retraining at all.",
        "evaluate_weed_type_only.py",
        "Measured - Fix Pending",
        "",
        "The app already knows which crop the farmer grows, so it can answer "
        "this itself instead of letting the model guess. Not yet built.",
    ],
    [
        TUE,
        "Disease App - Wrongly Saying a Plant is Healthy",
        "The app refuses to answer when it is not confident, so it does not "
        "name a disease off a guess. But that check only applied when it "
        "named a disease. If it said the plant was healthy, it went straight "
        "through however unsure it was. That is the wrong way round: a wrong "
        "disease costs one spray, a wrong all-clear can cost the crop, "
        "because the farmer then does nothing. The check now applies both "
        "ways.",
        "src/services/api.js",
        "Fixed",
        "",
        "Tested on 20 photographs of diseased potato leaves: before the fix, "
        "6 were called healthy; after, 2.",
    ],
    [
        TUE,
        "Disease App - Refusals Looked Like Failures",
        "When the app declined to answer an unclear photograph, it showed "
        "\"Scan Failed\" - the same message as when it could not reach the "
        "server at all. So the safety check doing its job looked like the "
        "feature being broken, which is what the testing team reported. It "
        "now says \"Try another photo\" and explains what to change.",
        "DiseaseDetectionHomeScreen.js, diseaseDetectionSlice.js",
        "Fixed",
        "",
        "This is the most likely explanation for TC-016 in the testing "
        "report.",
    ],
    [
        TUE,
        "Disease Service - Guard Against a Bad Upload",
        "A model and its list of disease names have to be replaced together. "
        "In my working folder they were not, for a day. Uploading it in that "
        "state would have looked completely normal - the server would start, "
        "every request would succeed - while every photograph was matched to "
        "the wrong name and the wrong chemical. The service now refuses to "
        "start if the model and the name list disagree.",
        "plantDetection/huggingface/app.py",
        "Fixed",
        "",
        "The live service was never affected. The guard makes that mistake "
        "impossible to upload quietly in future.",
    ],

    # ── Wednesday 16 September ──────────────────────────────────────────────
    [
        WED,
        "Weed Model - Found the Data It Needs",
        "The weed model is stuck because it has only ever seen photographs "
        "from two research collections. I found a source of real ones: "
        "iNaturalist, where ordinary people upload plant photographs taken on "
        "their phones, and two or more people confirm what each plant is. "
        "Filtered to weeds our farmers actually meet, and to licences that "
        "allow training, there are about 36,000 photographs. That is roughly "
        "25 times what the model has been trained on.",
        "fetch_wild_test.py (to be extended)",
        "Ready to Start",
        "",
        "The same source already supplied the 540 test photographs, so the "
        "tool exists. It was limited to India, which starved the grass "
        "classes - as few as 1 photograph for some species against 3,000 "
        "worldwide. These weeds are the same plants everywhere.",
    ],
    [
        WED,
        "Weed Model - Plan for the Next Run",
        "Two rules for the retraining. Split the photographs by photographer, "
        "so the same person's pictures never appear in both training and "
        "testing - that is what would have caught this problem earlier. And "
        "keep the 540 real photographs completely untouched as the final "
        "score. Downloading takes a few hours, training runs overnight "
        "because the graphics card cannot be used on Windows.",
        "Plan agreed, not yet started",
        "Planned",
        "",
        "Honest limit: these photographs are framed by nature enthusiasts, so "
        "they are tidier than a farmer's snapshot. This narrows the gap, it "
        "does not close it. Photographs from our own users remain the ceiling.",
    ],
    [
        WED,
        "Weather - Checked, No Work Needed",
        "I had reported the weather screens as showing sample data for want "
        "of an API key. That was wrong. The key is configured and working - I "
        "confirmed it returns live weather for Ludhiana. There is also a "
        "backup service needing no key, so the weather would stay real even "
        "if the key were lost.",
        "Verified against .env and the live service",
        "No Action Required",
        "",
        "Correcting my own earlier report. Weather comes off the outstanding "
        "list.",
    ],
    [
        WED,
        "Disease Service - Correcting My Own Note",
        "I had recorded that the new disease model was prepared but not yet "
        "live. It is live, and has been since Monday. I had been reading my "
        "working folder as though it were the running service; the service is "
        "ahead of it. The note in the repository now says so.",
        "plantDetection/huggingface/README.md",
        "Corrected",
        "",
        "No effect on anything running. Recorded so the next person does not "
        "read the same folder the same way.",
    ],
]

OPEN_ITEMS = [
    ["Weed model", "Retraining on the 36,000 real photographs",
     "Ready to start. Roughly a day: a few hours to download, then an "
     "overnight training run."],
    ["Weed model", "Stop the model guessing whether the plant is the crop",
     "Worth about three points, no retraining needed. The app should answer "
     "this from the farmer's own crop instead."],
    ["Disease model", "Confidence floor is set at 80 percent",
     "Lowering it gives more answers and more wrong ones. This is a decision "
     "about farmers, not a technical one. Left as it is."],
    ["Phone sign-in", "Codes cannot reach Indian numbers",
     "Needs either the company's existing SMS service details, or DLT "
     "registration with TRAI. Business registration, not development."],
    ["Username login", "No username system exists",
     "Replaced with email code sign-in. Needs confirmation that this is "
     "acceptable."],
]

HEADER_FILL = PatternFill("solid", fgColor="2E7D32")
HEADER_FONT = Font(bold=True, color="FFFFFF", size=11)
SECTION_FILL = PatternFill("solid", fgColor="C8E6C9")
THIN = Side(style="thin", color="BDBDBD")
BORDER = Border(left=THIN, right=THIN, top=THIN, bottom=THIN)

STATUS_COLOURS = {
    "Fixed": "1B5E20",
    "Completed": "1B5E20",
    "Corrected": "1B5E20",
    "No Action Required": "1B5E20",
    "Ready to Start": "E65100",
    "Planned": "E65100",
    "Measured - Fix Pending": "E65100",
    "Completed - Not Shipped": "E65100",
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

    ws.append(["Tuesday 15 - Wednesday 16 September 2026 "
               "(following the 10-14 September report)"])
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

    for i, w in enumerate([12, 30, 66, 32, 22, 12, 44], start=1):
        ws.column_dimensions[chr(64 + i)].width = w

    ws.row_dimensions[4].height = 28
    ws.freeze_panes = "A5"

    out = os.path.join(os.path.dirname(os.path.abspath(__file__)), FILENAME)
    wb.save(out)
    print("Wrote " + out)
    print("  %d task rows, %d open items" % (len(ROWS), len(OPEN_ITEMS)))


if __name__ == "__main__":
    build()
