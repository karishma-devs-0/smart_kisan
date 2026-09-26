"""
Generates the SmartKisan QA test suite as an Excel workbook.

Two sheets:
  Test Cases - every case, with an honest status
  Summary    - counts by status and module, plus priority next steps

On status values: "Verified" is reserved for things actually exercised and
observed passing, which so far means backend endpoints and build artifacts.
Anything needing a phone is "Not Tested", because no build of this app has run
on a device yet. Marking those as passing would make the suite useless as a
record of what is actually known.
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
from openpyxl.worksheet.datavalidation import DataValidation

FILENAME = "SmartKisan_Test_Suite.xlsx"

HEADERS = ["ID", "Module", "Test Case", "Steps", "Expected Result",
           "Status", "How Verified", "Notes"]

V = "Verified"
NT = "Not Tested"
BL = "Blocked"
KI = "Known Issue"
NA = "Not Applicable"

CASES = [
    ("API-01", "Backend", "Health endpoint responds",
     "GET /api/health on the deployed service",
     "200 with status ok", V, "curl against live deployment (0.26s)",
     "Confirmed warm. Cold start is ~50s after 15 min idle."),
    ("API-02", "Backend", "Rate limiter works behind proxy",
     "12 rapid calls to /api/health via the platform proxy",
     "All 200, no proxy error", V, "curl loop against live service",
     "Regression guard: without trust-proxy this returns 500 on every request."),
    ("API-03", "Backend", "Protected routes reject anonymous calls",
     "GET /api/fields and /api/profile with no Authorization header",
     "401 Authorization header missing", V, "curl against live service", ""),
    ("API-04", "Backend", "Register issues a signed JWT",
     "POST /api/auth/register with a new email",
     "201 and a valid JWT", V, "curl, token decoded and reused", ""),
    ("API-05", "Backend", "Login rejects a wrong password",
     "POST /api/auth/login with a bad password",
     "401 Invalid credentials, not 500", V, "curl against live service",
     "Confirms the database is reachable and the password check runs."),
    ("API-06", "Backend", "Cross-user data isolation",
     "User B requests User A's fields, crops, devices and profile",
     "Zero rows; 404 on a direct foreign id", V, "curl with two registered users",
     "Security-critical. Re-run after any change to route scoping."),
    ("API-07", "Backend", "Onboarding provisions a farm atomically",
     "POST /api/profile/onboarding with fields and crops",
     "201; all records created; crops linked to fields", V, "curl, then read back",
     "Transactional - a partial failure must roll back."),
    ("API-08", "Backend", "Partial update preserves other columns",
     "PUT /api/fields/{id} sending only area",
     "Area changes; name, soil and crop unchanged", V, "curl before/after compare", ""),
    ("API-09", "Backend", "Soil reading writes current and history",
     "POST /api/soil, then GET /api/soil and /api/soil/history",
     "Current reflects the reading; history has one row", V, "curl", ""),
    ("API-10", "Backend", "Account deletion clears all user data",
     "DELETE /api/auth/delete-account, then query every user-scoped table",
     "No rows remain in any table", NT, "",
     "Route written; returns 401 unauthenticated as expected. The full cascade "
     "has never been executed against real data - needs a throwaway account."),
    ("API-11", "Backend", "Socket.IO handshake",
     "GET /socket.io/?EIO=4&transport=polling",
     "200 handshake response", V, "curl against local merged build",
     "Verified locally only. Not yet confirmed on the deployed service."),

    ("AUTH-01", "Auth", "Email sign-in with valid credentials",
     "Enter a registered email and password, submit",
     "Signs in and lands on the dashboard", NT, "", ""),
    ("AUTH-02", "Auth", "Email sign-in with wrong password",
     "Enter a wrong password and submit",
     "Clear error message; no session granted", NT, "",
     "Backend half already verified by API-05."),
    ("AUTH-03", "Auth", "Google Sign-In",
     "Tap Sign in with Google and pick an account",
     "Signs in and lands on the dashboard", BL, "",
     "Needs an Android OAuth client for com.smartkisan.app with SHA-1 "
     "5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25. "
     "Fails with DEVELOPER_ERROR until that is registered."),
    ("AUTH-04", "Auth", "Phone sign-in reports unavailable",
     "Open the Phone tab and attempt sign-in",
     "Message that the method is unavailable", NT, "",
     "Previously granted an unusable session using a placeholder token."),
    ("AUTH-05", "Auth", "Username sign-in reports unavailable",
     "Open the Username tab and attempt sign-in",
     "Message that the method is unavailable", NT, "", ""),
    ("AUTH-06", "Auth", "Sign-in is not slow on a cold backend",
     "Leave the app closed 20+ minutes, open Login, sign in",
     "Completes without a long freeze", NT, "",
     "The login screen now warms the API on mount so the cold start overlaps the "
     "Google account picker. That fix is the thing under test."),
    ("AUTH-07", "Auth", "Session survives an app restart",
     "Sign in, force close the app, reopen",
     "Still signed in; no re-login required", NT, "", ""),
    ("AUTH-08", "Auth", "Sign out clears the session",
     "Sign out, then reopen the app",
     "Returns to the Login screen", NT, "", ""),

    ("CON-01", "Consent", "Checkbox enables on reaching the bottom",
     "Scroll the terms to the bottom in one continuous flick",
     "Checkbox becomes tappable immediately", NT, "",
     "Reported bug: previously required scrolling up and back down. Throttle was "
     "250ms; now 16ms plus scroll-end handlers."),
    ("CON-02", "Consent", "Short content does not lock the user out",
     "Open consent on a large screen or with a short translation",
     "Checkbox enables without needing to scroll", NT, "",
     "Latent lockout: onScroll never fires when content fits, so the gate could "
     "never open and the user could not proceed."),
    ("CON-03", "Consent", "Consent persists across restarts",
     "Accept the terms, restart the app",
     "Consent screen does not reappear", NT, "", ""),

    ("ONB-01", "Onboarding", "Farm setup provisions real records",
     "Complete onboarding with 2 fields and 2 crops",
     "Dashboard shows those exact fields and crops", NT, "",
     "Backend half already verified by API-07."),
    ("ONB-02", "Onboarding", "At least one field is required",
     "Try to advance past the field step without adding one",
     "Next button stays disabled", NT, "", ""),
    ("ONB-03", "Onboarding", "Provisioning failure keeps the answers",
     "Disable the network, then tap Finish",
     "Error shown; user stays on the step with answers intact", NT, "",
     "Previously fire-and-forget: a failure dropped the user into an empty app "
     "with the farm never created."),
    ("ONB-04", "Onboarding", "No dashboard flash before onboarding",
     "Sign in as a user who has not onboarded",
     "Goes straight to onboarding with no dashboard flicker", NT, "",
     "An unknown onboarding status used to fall through to the main app."),
    ("ONB-05", "Onboarding", "Farm follows the account to a new device",
     "Onboard, then sign in on a second device",
     "The same farm data appears", NT, "",
     "The profile is stored server-side now, not only in local storage."),

    ("WEED-01", "Weed Detection", "Models load on screen open",
     "Open AI Field Monitor",
     "No persistent loading-models message", NT, "",
     "Both models confirmed present inside the APK."),
    ("WEED-02", "Weed Detection", "Held-out images classify correctly",
     "Scan the 12 images in weedDetection/test_pack via Gallery",
     "Most match the EXPECT_ prefix in each filename", NT, "",
     "HIGHEST PRIORITY. The model scores 97.4% on this exact data, so a wrong "
     "answer means the preprocessing is broken rather than the model being weak. "
     "This is the only test that separates a code fault from a data problem."),
    ("WEED-03", "Weed Detection", "Crop photo returns no-weed",
     "Photograph the crop with no weeds present",
     "Reports Crop - no weed detected", NT, "", ""),
    ("WEED-04", "Weed Detection", "Grass weed identified",
     "Photograph a grass weed handheld at 20-40cm",
     "Reports Grass weed", NT, "",
     "Herbicide selection turns on grass vs broadleaf, so this distinction is "
     "the one that changes what a farmer does."),
    ("WEED-05", "Weed Detection", "Broadleaf weed identified",
     "Photograph a broadleaf weed handheld at 20-40cm",
     "Reports Broadleaf weed", NT, "", ""),
    ("WEED-06", "Weed Detection", "Low confidence is flagged",
     "Scan something ambiguous or poorly lit",
     "Below 60% shows the uncertainty warning", NT, "",
     "The model always names something; the confidence score is the only signal "
     "that it is guessing."),
    ("WEED-07", "Weed Detection", "Failed scan does not invent a result",
     "Force an inference error and scan",
     "Reports the failure; no species named", NT, "", ""),
    ("WEED-08", "Weed Detection", "Works with no network",
     "Enable airplane mode and scan",
     "Classifies normally", NT, "",
     "Running on-device is the whole point: farmers often have no signal."),
    ("WEED-09", "Weed Detection", "Scan history survives restart",
     "Scan, force close the app, reopen",
     "Recent scans still listed", NT, "", ""),
    ("WEED-10", "Weed Detection", "Model provenance is shown",
     "Open the screen and read the note at the bottom",
     "States what the models were trained on and the limits", NT, "", ""),

    ("DIS-01", "Disease Detection", "Camera scan returns a diagnosis",
     "Scan a diseased leaf using the camera",
     "Disease, confidence and treatment shown", NT, "",
     "Remote model measured at 1.15s warm and 9.1s cold."),
    ("DIS-02", "Disease Detection", "Model is warmed on screen open",
     "Open the screen, wait a moment, then scan",
     "Scan is quick rather than a ~9s wait", NT, "", ""),
    ("DIS-03", "Disease Detection", "Unreachable model fails honestly",
     "Disable the network and scan",
     "Reports the failure; no diagnosis invented", NT, "",
     "Previously returned a randomly chosen disease with 75-95% confidence and a "
     "chemical treatment, indistinguishable from a real result."),

    ("FARM-01", "Farm Data", "Fields list shows the user's own fields",
     "Open My Fields after onboarding",
     "Exactly the fields that were created", NT, "", ""),
    ("FARM-02", "Farm Data", "Empty state when no fields exist",
     "Open My Fields with none created",
     "Empty state rather than sample records", NT, "",
     "Placeholder records used to appear as though they were the user's own."),
    ("FARM-03", "Farm Data", "Soil shows empty until a sensor reports",
     "Open My Soil with no sensor data",
     "Empty state rather than an invented reading", NT, "",
     "A fabricated moisture figure would drive real irrigation decisions."),
    ("FARM-04", "Farm Data", "Add and delete a crop",
     "Add a crop, confirm it appears, then delete it",
     "Persists and disappears correctly", NT, "", ""),

    ("NOT-01", "Notifications", "Bell badge reflects the real count",
     "Open Home with no unread notifications",
     "No red dot on the bell", NT, "",
     "The dot used to render unconditionally, whether or not anything was unread."),
    ("NOT-02", "Notifications", "Alerts become notifications",
     "Publish an MQTT alert for the signed-in user",
     "Appears in the notification list", NT, "",
     "Nothing populated the list at all before this was wired up."),
    ("NOT-03", "Notifications", "History survives restart",
     "Receive a notification, force close, reopen",
     "Still listed", NT, "", ""),

    ("BLD-01", "Build", "APK installs and launches",
     "Sideload the APK onto an Android phone",
     "Installs and opens without error", NT, "",
     "Signed with the debug keystore - suitable for sideloading only, not for "
     "the Play Store."),
    ("BLD-02", "Build", "Ships only phone ABIs",
     "Inspect lib/ inside the APK",
     "arm64-v8a and armeabi-v7a only", V, "unzip listing of the built APK",
     "Emulator ABIs cost about 60 MB. Build with scripts/build-apk.sh or they "
     "come back, since android/ is regenerated and gitignored."),
    ("BLD-03", "Build", "Models are inside the APK",
     "Inspect the APK for .tflite files and the native runtime",
     "2 model files and 2 native runtime libraries", V, "unzip listing of the APK", ""),
    ("BLD-04", "Build", "Bundle points at the live API",
     "Search the JS bundle for the API host",
     "Deployed host present; no stale local IP", V, "byte search of the bundle",
     "The bundle is Hermes bytecode: any string containing non-ASCII is stored "
     "as UTF-16, so a plain text search gives false negatives. Search both."),

    ("MOCK-01", "Analytics", "NDVI, yield prediction, crop health",
     "Open the analytics screens",
     "Values are displayed", NA, "",
     "No backend. The figures are fixed sample data, identical for every user, so "
     "a pass would only confirm that a placeholder renders."),
    ("MOCK-02", "Reports", "Water usage, run hours, harvest performance",
     "Open the reports screens",
     "Charts are displayed", NA, "", "No backend; same caveat as MOCK-01."),
    ("MOCK-03", "Marketplace", "Mandi prices and listings",
     "Open Marketplace",
     "Prices are listed", NA, "",
     "Highest-risk of the placeholder screens: a farmer could time a sale against "
     "invented prices. Recommend labelling clearly or hiding until real."),
    ("MOCK-04", "Weather", "Forecast beyond 5 days",
     "Open the 14-day forecast",
     "Days 6-14 marked as estimated", NT, "",
     "The provider returns 5 real days; the rest are extrapolated and are already "
     "labelled est. in the UI."),
]


def create():
    wb = Workbook()
    ws = wb.active
    ws.title = "Test Cases"

    head_fill = PatternFill("solid", start_color="2E7D32", end_color="2E7D32")
    head_font = Font(name="Segoe UI", size=11, bold=True, color="FFFFFF")
    data_font = Font(name="Segoe UI", size=10, color="1E2C1F")
    title_font = Font(name="Segoe UI", size=16, bold=True, color="1B5E20")

    center = Alignment(horizontal="center", vertical="center", wrap_text=True)
    left = Alignment(horizontal="left", vertical="top", wrap_text=True)

    thin = Side(style="thin", color="C8D6C8")
    border = Border(left=thin, right=thin, top=thin, bottom=thin)

    status_fill = {
        V: PatternFill("solid", start_color="C8E6C9", end_color="C8E6C9"),
        NT: PatternFill("solid", start_color="FFF3E0", end_color="FFF3E0"),
        BL: PatternFill("solid", start_color="FFCDD2", end_color="FFCDD2"),
        KI: PatternFill("solid", start_color="FFCDD2", end_color="FFCDD2"),
        NA: PatternFill("solid", start_color="ECEFF1", end_color="ECEFF1"),
    }

    ws["A1"] = "SMARTKISAN - QA TEST SUITE"
    ws["A1"].font = title_font
    ws["A2"] = ("Status reflects what has actually been exercised. Verified means observed "
                "passing; anything requiring a phone is Not Tested, because no build has yet "
                "run on a device.")
    ws["A2"].font = Font(name="Segoe UI", size=10, italic=True, color="526654")

    for col, title in enumerate(HEADERS, 1):
        c = ws.cell(row=4, column=col, value=title)
        c.fill = head_fill
        c.font = head_font
        c.alignment = center
        c.border = border
    ws.row_dimensions[4].height = 24

    row = 5
    for case in CASES:
        for col, val in enumerate(case, 1):
            c = ws.cell(row=row, column=col, value=val)
            c.border = border
            c.alignment = center if col in (1, 6) else left
            if col == 6:
                c.fill = status_fill.get(val, status_fill[NT])
                c.font = Font(name="Segoe UI", size=10, bold=True, color="1E2C1F")
            else:
                c.font = data_font
        ws.row_dimensions[row].height = 58
        row += 1

    options = V + "," + NT + "," + BL + "," + KI + "," + NA + ",Passed,Failed"
    dv = DataValidation(type="list", formula1='"' + options + '"', allow_blank=True)
    ws.add_data_validation(dv)
    dv.add("F5:F" + str(row - 1))

    widths = {"A": 10, "B": 18, "C": 34, "D": 40, "E": 34, "F": 14, "G": 28, "H": 46}
    for col, w in widths.items():
        ws.column_dimensions[col].width = w
    ws.freeze_panes = "A5"
    ws.auto_filter.ref = "A4:H" + str(row - 1)

    s = wb.create_sheet("Summary")
    s["A1"] = "SUMMARY"
    s["A1"].font = title_font

    counts = {}
    modules = {}
    for case in CASES:
        counts[case[5]] = counts.get(case[5], 0) + 1
        modules.setdefault(case[1], {})
        modules[case[1]][case[5]] = modules[case[1]].get(case[5], 0) + 1

    s["A3"] = "By status"
    s["A3"].font = Font(name="Segoe UI", size=12, bold=True)
    r = 4
    for k in (V, NT, BL, KI, NA):
        if k not in counts:
            continue
        c = s.cell(row=r, column=1, value=k)
        c.font = data_font
        c.fill = status_fill[k]
        s.cell(row=r, column=2, value=counts[k]).font = data_font
        pct = "{:.0f}%".format(100.0 * counts[k] / len(CASES))
        s.cell(row=r, column=3, value=pct).font = data_font
        r += 1
    s.cell(row=r, column=1, value="TOTAL").font = Font(name="Segoe UI", size=10, bold=True)
    s.cell(row=r, column=2, value=len(CASES)).font = Font(name="Segoe UI", size=10, bold=True)

    r += 2
    s.cell(row=r, column=1, value="By module").font = Font(name="Segoe UI", size=12, bold=True)
    r += 1
    c = s.cell(row=r, column=1, value="Module")
    c.font = head_font
    c.fill = head_fill
    for i, k in enumerate((V, NT, BL, NA), start=2):
        c = s.cell(row=r, column=i, value=k)
        c.font = head_font
        c.fill = head_fill
    r += 1
    for mod in sorted(modules):
        s.cell(row=r, column=1, value=mod).font = data_font
        for i, k in enumerate((V, NT, BL, NA), start=2):
            s.cell(row=r, column=i, value=modules[mod].get(k, 0)).font = data_font
        r += 1

    r += 2
    s.cell(row=r, column=1, value="Priority next steps").font = Font(
        name="Segoe UI", size=12, bold=True)
    steps = [
        "1. WEED-02 - scan the 12 held-out test images. Separates a preprocessing "
        "fault from a weak model, and gates every other weed test.",
        "2. BLD-01 - install the APK on a phone. Nothing device-side can be tested "
        "until this happens; it is 43 of the 55 cases.",
        "3. AUTH-03 - register the Android OAuth client so Google Sign-In becomes "
        "testable at all.",
        "4. API-10 - run account deletion against a throwaway account and confirm "
        "every user-scoped table is cleared.",
        "5. MOCK-03 - decide whether to label or hide mandi prices, since invented "
        "prices could inform a real selling decision.",
    ]
    for note in steps:
        r += 1
        c = s.cell(row=r, column=1, value=note)
        c.font = data_font
        c.alignment = left
        s.row_dimensions[r].height = 32
        s.merge_cells(start_row=r, start_column=1, end_row=r, end_column=6)

    for col, w in {"A": 58, "B": 14, "C": 14, "D": 14, "E": 14, "F": 14}.items():
        s.column_dimensions[col].width = w

    path = os.path.join(os.getcwd(), FILENAME)
    wb.save(path)
    print("Test suite written: " + path)
    print("  {} cases across {} modules".format(len(CASES), len(modules)))
    for k in (V, NT, BL, NA):
        if k in counts:
            print("    {:<16} {}".format(k, counts[k]))


if __name__ == "__main__":
    create()
