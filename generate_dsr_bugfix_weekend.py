"""
Two-day DSR covering the QA defect resolution work.

  Friday 28 Aug   - backend hardening and the automated API check
  Saturday 29 Aug - defects from the QA testing report, plus the build

Same layout as generate_dsr.py. Every row corresponds to a real commit.
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

FRI = "2026-08-28"
SAT = "2026-08-29"
FILENAME = "SmartKisan_DSR_2026-08-28_29.xlsx"

HEADERS = ["Date", "Task Category", "Detailed Task Description",
           "Deliverables / Artifacts", "Status", "Hours Spent", "Remarks & Notes"]

ROWS = [
    # ── Friday ───────────────────────────────────────────────────────────────
    [
        FRI,
        "Backend - Reliability",
        "Reviewed the server for reliability gaps and fixed five. The health "
        "check the hosting platform polls reported healthy without testing "
        "anything, so an instance that had lost its database stayed in service "
        "while every request failed. It now queries the database and reports "
        "unhealthy with the reason when that fails.",
        "backend/src/server.js",
        "Fixed",
        "",
        "This is the one situation the health check exists to catch, and it was "
        "the one situation it could not detect.",
    ],
    [
        FRI,
        "Backend - Deploy Safety",
        "Added an orderly shutdown. The hosting platform signals the server "
        "before every deployment and before idling it; with no handler, requests "
        "in progress were cut off mid-response and database connections were "
        "abandoned rather than closed. The server now stops accepting new work, "
        "lets current requests finish, and closes its connections.",
        "backend/src/server.js",
        "Fixed",
        "",
        "Abandoned connections matter on the current hosting plan because the "
        "number of simultaneous connections is capped.",
    ],
    [
        FRI,
        "Backend - Security",
        "Tightened the limit on login attempts. Sign-in shared the general "
        "allowance of 100 requests a minute, which is 100 password guesses a "
        "minute. Credential endpoints are now limited to 10 attempts per 15 "
        "minutes, and a successful sign-in does not consume the allowance.",
        "backend/src/server.js",
        "Fixed",
        "",
        "Counted per account rather than per network address. Indian mobile "
        "networks place many customers behind a shared address, so a per-address "
        "limit would let ten bad attempts lock out everyone on that network. "
        "Verified: the targeted account is blocked while another user on the "
        "same address signs in normally.",
    ],
    [
        FRI,
        "Backend - Input Handling",
        "Added checks on submitted data. Values were passed straight to the "
        "database, so a letter where a number was expected came back as a "
        "generic server error that told the user nothing and filled the logs "
        "with database errors that were really typing mistakes. Invalid input "
        "now returns a message naming the field.",
        "backend/src/middleware/validate.js",
        "Fixed",
        "",
        "Applied to field creation so far; the remaining write operations still "
        "need the same treatment.",
    ],
    [
        FRI,
        "Backend - Automated Verification",
        "Built an automated check that exercises the API the way the app does: "
        "sign up, sign in, farm setup, adding and editing records, sensor "
        "readings, confirming one account cannot read another's data, and "
        "account deletion. Reports pass or fail for each step and can be run "
        "with a single command.",
        "backend/scripts/e2eCheck.js  (npm run e2e)",
        "Completed",
        "",
        "40 of 40 checks passing. It creates temporary accounts and removes them "
        "afterwards, so it is safe to run against the live service. This also "
        "tested account deletion for the first time - the code existed but had "
        "never been run against real data. Confirmed working.",
    ],

    # ── Saturday ─────────────────────────────────────────────────────────────
    [
        SAT,
        "Defect Fix - Data Not Saving",
        "Fixed pumps and soil readings not being stored. Both features were "
        "still using sample data: adding a pump produced a temporary entry that "
        "was never sent to the server, so it appeared in the list and was gone "
        "after restarting the app, and adding a soil reading did nothing at all. "
        "Every account also saw the same sample pumps.",
        "src/services/api.js",
        "Fixed",
        "",
        "Raised by QA as three separate items. The server side and the "
        "connecting code both already existed; these two features had simply "
        "been missed when the others were moved across.",
    ],
    [
        SAT,
        "Defect Fix - AI Field Monitor",
        "Fixed the weed scan producing no result. The photograph was captured "
        "and analysed, but the result was read from the analysis engine in the "
        "wrong format, which produced an empty answer instead of an error. The "
        "screen therefore had nothing to display.",
        "src/services/weedInference.js",
        "Fixed",
        "",
        "The model itself was never at fault. Confirmed by running the app's "
        "exact processing sequence against the reference images: 12 of 12 "
        "correct at 98-100% confidence. This defect could only be found by "
        "running the app on a phone, so the QA round is what surfaced it.",
    ],
    [
        SAT,
        "Defect Fix - Registration",
        "Added format checks on the registration form. Only presence was "
        "checked, so an entry like 'abc' was accepted as an email address and "
        "any sequence of digits as a phone number. The email address is where a "
        "password reset would be sent, so an invalid one is only discovered when "
        "it is needed.",
        "src/features/auth/screens/RegisterScreen.js",
        "Fixed",
        "",
        "Phone rule matches Indian mobile numbers and accepts the +91, leading "
        "zero, spaces and dashes people actually type.",
    ],
    [
        SAT,
        "Defect Fix - Sign-in and Weather",
        "Two smaller corrections. An error message from one sign-in method "
        "stayed on screen after switching to another, so a failed code was still "
        "displayed while the user was on the email form. Separately, the weather "
        "screen showed a default location instead of the farm's own: the "
        "location is saved with the farm, but nothing restored it after a "
        "reinstall or on a second device.",
        "LoginScreen.js, App.js",
        "Fixed",
        "",
        "The pump form also always read 'Edit' because one screen serves both "
        "adding and editing; it now reflects which is happening.",
    ],
    [
        SAT,
        "Build & Handover",
        "Produced a new build containing all of the above and confirmed each fix "
        "is present in the packaged application. Prepared a reference image set "
        "so the AI field monitor can be verified against images with known "
        "answers.",
        "SmartKisan APK (71 MB), weedDetection/test_pack",
        "Completed",
        "",
        "Three items from the QA report are not defects: analytics, crop "
        "suitability and farm management have no server behind them yet and show "
        "the same sample figures to everyone, which is a decision to build or "
        "label rather than something to repair. Phone and username sign-in need "
        "a messaging provider before they can work.",
    ],
]


def create():
    wb = Workbook()
    ws = wb.active
    ws.title = "Daily Status Report"
    ws.views.sheetView[0].showGridLines = True

    header_fill = PatternFill("solid", start_color="2E7D32", end_color="2E7D32")
    fri_fill = PatternFill("solid", start_color="F1F8E9", end_color="F1F8E9")
    title_font = Font(name="Segoe UI", size=16, bold=True, color="1B5E20")
    header_font = Font(name="Segoe UI", size=11, bold=True, color="FFFFFF")
    data_font = Font(name="Segoe UI", size=10, color="1E2C1F")
    bold_font = Font(name="Segoe UI", size=10, bold=True, color="1E2C1F")

    center = Alignment(horizontal="center", vertical="center", wrap_text=True)
    left = Alignment(horizontal="left", vertical="top", wrap_text=True)
    title_align = Alignment(horizontal="left", vertical="center")

    thin = Side(style="thin", color="C8D6C8")
    border = Border(left=thin, right=thin, top=thin, bottom=thin)

    ws["A2"] = "SMARTKISAN PROJECT - DAILY STATUS REPORT (DSR)"
    ws["A2"].font = title_font
    ws["A2"].alignment = title_align

    ws["A3"] = ("Defect resolution following the QA testing report - "
                + FRI + " and " + SAT + ".")
    ws["A3"].font = Font(name="Segoe UI", size=10, italic=True, color="526654")
    ws["A3"].alignment = title_align

    for col, title in enumerate(HEADERS, 1):
        c = ws.cell(row=5, column=col, value=title)
        c.fill = header_fill
        c.font = header_font
        c.alignment = center
        c.border = border
    ws.row_dimensions[5].height = 26

    row = 6
    for record in ROWS:
        for col, value in enumerate(record, 1):
            c = ws.cell(row=row, column=col, value=value)
            c.font = bold_font if col == 5 else data_font
            c.border = border
            c.alignment = center if col in (1, 5, 6) else left
            # Shade Friday's rows so the two days read apart at a glance.
            if record[0] == FRI:
                c.fill = fri_fill
        ws.row_dimensions[row].height = 116
        row += 1

    for r in range(row, row + 8):
        ws.row_dimensions[r].height = 40
        for c in range(1, 8):
            cell = ws.cell(row=r, column=c)
            cell.font = data_font
            cell.border = border
            cell.alignment = center if c in (1, 5, 6) else left

    for col, w in {"A": 13, "B": 28, "C": 62, "D": 34, "E": 13,
                   "F": 12, "G": 62}.items():
        ws.column_dimensions[col].width = w

    ws.freeze_panes = "A6"

    path = os.path.join(os.getcwd(), FILENAME)
    wb.save(path)
    print("DSR written: " + path)
    fri = sum(1 for r in ROWS if r[0] == FRI)
    print("  {} rows  ({} Friday, {} Saturday)".format(len(ROWS), fri, len(ROWS) - fri))


if __name__ == "__main__":
    create()
