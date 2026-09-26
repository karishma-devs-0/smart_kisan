"""
Full feature list for SmartKisan.

Every row was checked against the code rather than written from memory: the
screen names come from src/features/*/screens, and the data source from whether
a backend route exists in backend/src/routes, whether the figure is calculated
in the app, or whether the screen is still reading a built-in sample list.

The "Data source" column is the one worth reading. A feature can look finished
and still be showing numbers that are the same for every farmer, which is what
the testing team reported in several places - so it is stated plainly here
rather than left for someone to discover.

Plain wording: this is forwarded to people who did not build the app.
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
from openpyxl.utils import get_column_letter

FILENAME = "SmartKisan_Feature_List.xlsx"

HEADERS = ["#", "Module", "Feature", "What it does", "Screens",
           "Data source", "Status", "Notes"]

# Status values, kept to a small set so the sheet can be filtered.
LIVE = "Working"
CALC = "Working"
SAMPLE = "Work in progress"
BUILT = "Built, not live"
MISSING = "Not available"

REAL = "Server (real farm data)"
DEVICE = "Sensors over MQTT"
APIS = "Weather service"
MODEL = "AI model"
INAPP = "Calculated in the app"
STATIC = "Built into the app"
NONE = "Sample data, no server"

ROWS = [
    # ── Accounts ─────────────────────────────────────────────────────────
    ["Accounts", "Register",
     "Create an account with name, email, phone and password.",
     "Register", REAL, LIVE,
     "Rejects a badly formed email or phone, and an email already registered."],
    ["Accounts", "Sign in with password",
     "Sign in with email and password.",
     "Login", REAL, LIVE, ""],
    ["Accounts", "Sign in with a code",
     "Sign in without a password. A 6-digit code is emailed.",
     "Login", REAL, LIVE,
     "Code expires in 10 minutes, 5 attempts, usable once."],
    ["Accounts", "Sign in with Google",
     "One-tap sign in with a Google account.",
     "Login", REAL, LIVE, ""],
    ["Accounts", "Forgot password",
     "Reset a forgotten password using an emailed code.",
     "ForgotPassword", REAL, LIVE,
     "Signs the farmer straight in afterwards."],
    ["Accounts", "Sign in by phone (OTP)",
     "Sign in with a code sent by SMS, for farmers with no email.",
     "Login", REAL, BUILT,
     "Code is written and works. No SMS can reach an Indian number until DLT "
     "registration with TRAI is done, or the company's SMS account is shared."],
    ["Accounts", "Sign in by username",
     "Sign in with a username instead of email.",
     "-", NONE, MISSING,
     "The app has no usernames; accounts are identified by email or phone. "
     "Replaced with the code sign-in above. Needs confirmation this is fine."],
    ["Accounts", "Delete my account",
     "Deletes the account and every record belonging to it.",
     "DeleteAccount", REAL, LIVE,
     "Required by Google Play. Clears farm, fields, crops, pumps, devices, "
     "soil history and tasks in one transaction."],
    ["Accounts", "Terms and consent",
     "Terms and privacy consent before the account is created.",
     "Consent", STATIC, LIVE, ""],

    # ── Setup ────────────────────────────────────────────────────────────
    ["Setup", "Farm setup wizard",
     "Four steps after signing up: farm name and type, size, location, and "
     "the fields, crops and devices the farm has.",
     "Onboarding", REAL, LIVE,
     "Creates everything on the server in one go, so the answers actually "
     "drive the rest of the app instead of being forgotten."],
    ["Setup", "Farm location",
     "Where the farm is, used by the weather screens and the farm map.",
     "Onboarding", REAL, LIVE,
     "Added after testers saw weather for the wrong place."],
    ["Setup", "Language",
     "The app runs in 10 Indian languages.",
     "Onboarding, SettingsMain", STATIC, LIVE,
     "English, Hindi, Punjabi, Marathi, Telugu, Tamil, Kannada, Bengali, "
     "Gujarati, Malayalam."],

    # ── Dashboard ────────────────────────────────────────────────────────
    ["Dashboard", "Farm overview",
     "Pumps running, soil moisture and temperature at a glance.",
     "Home", REAL, LIVE, ""],
    ["Dashboard", "Today's water and power",
     "Hours run, litres used and units of electricity used today.",
     "Home", REAL, LIVE,
     "Previously the same numbers at every login. Now worked out from real "
     "pump runs, using each pump's flow rate and horsepower."],
    ["Dashboard", "Farm map",
     "The farm's fields drawn on a satellite map.",
     "Home, FarmMap", REAL, LIVE, ""],
    ["Dashboard", "Recent activity",
     "What the pumps have done recently.",
     "Home", REAL, LIVE, ""],
    ["Dashboard", "Notifications",
     "Alerts and messages, with an unread count.",
     "Notification, NotificationDetail", INAPP, LIVE,
     "Generated in the app. No server-pushed alerts yet."],

    # ── Pumps ────────────────────────────────────────────────────────────
    ["Pumps", "Pump list",
     "Every pump on the farm, by category, with its current state.",
     "MyPumps, PumpDetail", REAL, LIVE, ""],
    ["Pumps", "Add and edit a pump",
     "Add a pump with its type, flow rate and horsepower.",
     "EditPump", REAL, LIVE,
     "This had never saved to the server. The pump appeared in the list and "
     "was gone after restarting the app."],
    ["Pumps", "Switch a pump on or off",
     "Turn a pump on or off from the phone.",
     "PumpControls, PumpDetail", DEVICE, LIVE,
     "Also returned an error after having already switched the pump; fixed."],
    ["Pumps", "Emergency stop",
     "Stops every pump at once.",
     "PumpControls", DEVICE, LIVE, ""],
    ["Pumps", "Timer",
     "Run a pump for a set time, then stop on its own.",
     "PumpTimer, TimerCountdown", DEVICE, LIVE, ""],
    ["Pumps", "Irrigation schedule",
     "Run pumps on a repeating schedule.",
     "PumpIrrigation", REAL, LIVE, ""],
    ["Pumps", "Run by soil moisture",
     "Start the pump when the soil dries past a set point.",
     "SensorBased, SoilMoistureControl", DEVICE, LIVE,
     "Needs a moisture sensor installed."],
    ["Pumps", "AI irrigation",
     "Decides watering from soil, crop and weather instead of a fixed rule.",
     "AIPump", REAL, LIVE,
     "Has an advisory mode that suggests rather than acts."],
    ["Pumps", "Pump groups",
     "Control several pumps together.",
     "PumpGroups, EditPumpGroups", REAL, LIVE, ""],
    ["Pumps", "Pump history",
     "When each pump ran and for how long.",
     "PumpHistory", REAL, LIVE,
     "No run had ever been recorded before - every write was failing silently."],

    # ── Soil ─────────────────────────────────────────────────────────────
    ["Soil", "Soil readings",
     "Current moisture, pH, nitrogen, phosphorus, potassium and organic carbon.",
     "MySoil", REAL, LIVE,
     "Shows blanks rather than invented numbers when no sensor has reported."],
    ["Soil", "Add a soil reading by hand",
     "Enter a lab or test-kit result.",
     "AddSoilReading", REAL, LIVE, ""],
    ["Soil", "Soil detail and history",
     "Moisture, pH and fertiliser levels over time.",
     "MoistureDetail, PhDetail, FertilizerDetail", REAL, LIVE, ""],
    ["Soil", "Soil health score",
     "A single score for the soil against the chosen crop.",
     "SoilHealth", INAPP, LIVE, ""],

    # ── Weather ──────────────────────────────────────────────────────────
    ["Weather", "Today's weather",
     "Temperature, humidity and conditions at the farm.",
     "WeatherToday", APIS, LIVE,
     "Uses the farm location set during setup."],
    ["Weather", "Forecast",
     "The days ahead.",
     "WeatherForecast", APIS, LIVE, ""],
    ["Weather", "Past weather",
     "What the weather has been.",
     "HistoricalWeather", APIS, LIVE, ""],
    ["Weather", "Wind and humidity detail",
     "Wind and humidity over time.",
     "WindDetail, HumidityDetail", APIS, LIVE, ""],
    ["Weather", "Water need calculator",
     "How much water the crop needs, from weather and crop stage.",
     "ETCalculator", INAPP, LIVE, ""],

    # ── Crops and fields ─────────────────────────────────────────────────
    ["Crops & Fields", "My crops",
     "Crops planted, their field and their stage.",
     "MyCrops, AddCrop", REAL, LIVE, ""],
    ["Crops & Fields", "Crop rotation",
     "What to plant next season.",
     "CropRotation", INAPP, LIVE, ""],
    ["Crops & Fields", "My fields",
     "Each field with its area and soil type.",
     "MyFields, AddField, FieldDetail", REAL, LIVE, ""],

    # ── AI features ──────────────────────────────────────────────────────
    ["AI", "Plant disease detection",
     "Photograph a leaf and get the likely disease and treatment.",
     "DiseaseDetectionHome, ScanResult", MODEL, LIVE,
     "87% on 1,581 held-out photographs, up from 28%. Covers 9 crops "
     "including rice and wheat. Refuses to answer below 80% confidence "
     "rather than guess a disease or a clean bill of health."],
    ["AI", "Weed detection (AI field monitor)",
     "Photograph a plant and get grass weed, broadleaf weed, or crop.",
     "WeedDetectionHome", MODEL, LIVE,
     "93.1% telling grass from broadleaf on photographs it has never seen, "
     "up from 82.1%. Runs on the phone, so it works without internet. "
     "Needs the installed APK - it cannot run in Expo Go."],
    ["AI", "Crop suitability",
     "Which crops suit this farm's soil and climate.",
     "CropRecommend, CropRecommendInput, CropRecommendDetail", INAPP, LIVE,
     "Uses the farm's own soil reading. Shows nothing rather than advising "
     "from invented figures when no reading exists; values can be typed in."],
    ["AI", "Fertiliser calculator",
     "How much N, P and K a crop needs, and the cost.",
     "FertilizerCalculator", INAPP, LIVE,
     "Confirmed working by the testing team."],

    # ── Farm management ──────────────────────────────────────────────────
    ["Farm", "Farm tasks",
     "A to-do list for the farm: what needs doing, on which field, by when.",
     "ActiveTasks, FarmManagement", REAL, LIVE,
     "Had no storage at all before - a fixed sample list, an Add button that "
     "did nothing, and ticks that vanished on restart."],
    ["Farm", "Crop growth trends",
     "How crops are growing over the season.",
     "FarmManagement", NONE, MISSING,
     "Left empty on purpose. Needs a season of recorded measurements that "
     "nothing collects yet; a made-up curve would be worse than none."],

    # ── Devices ──────────────────────────────────────────────────────────
    ["Devices", "Device list and detail",
     "Sensors and controllers on the farm, and whether they are online.",
     "DeviceList, DeviceDetail, ConnectedDevices", REAL, LIVE, ""],
    ["Devices", "Connect a device",
     "Pair a new sensor or controller.",
     "DeviceConnection", REAL, LIVE,
     "No physical hardware built yet - tested with simulated devices."],
    ["Devices", "Calibrate a sensor",
     "Step-by-step sensor calibration.",
     "CalibrationWizard", REAL, LIVE, ""],
    ["Devices", "Alert rules",
     "Be told when a reading crosses a limit.",
     "AlertRules, AddAlertRule", REAL, LIVE, ""],

    # ── Not yet backed by real data ──────────────────────────────────────
    ["Reports", "Water, hours and energy",
     "How much water and electricity the farm used, and for how long the "
     "pumps ran, by day and by week.",
     "ComprehensiveReport, MetricReports, TrendReports", REAL, LIVE,
     "Worked out from recorded pump runs: litres from each pump's flow rate, "
     "units from its horsepower. Compares against the period before."],
    ["Reports", "Soil condition report",
     "Moisture, pH and nutrients rated in plain words.",
     "SoilHarvestReport", REAL, LIVE,
     "Rated against Soil Health Card bands. The nutrient rating takes the "
     "worst of N, P and K, not the average - a farmer acts on the one that "
     "is short."],
    ["Reports", "Harvest performance",
     "Expected against actual yield.",
     "SoilHarvestReport", NONE, MISSING,
     "Left empty on purpose. Nothing records a sowing or a harvest, so there "
     "is no yield to compare. It used to show 91.7% efficiency to everyone."],
    ["Analytics", "Crop health",
     "A health score per field, with what is wrong listed.",
     "FarmAnalytics, FarmOverview", INAPP, LIVE,
     "Scored from the farm's soil reading against Soil Health Card bands. A "
     "field with no reading shows as unknown rather than being given a "
     "number."],
    ["Analytics", "Farm observations",
     "Plain advice drawn from the readings - dry soil, short nutrients, a "
     "pump offline, a harvest coming up.",
     "FarmAnalytics", INAPP, LIVE,
     "Each one says which reading it came from. Dry soil with rain forecast "
     "says wait rather than irrigate. No readings means no advice, instead "
     "of four cheerful tips."],
    ["Analytics", "Expert network",
     "Agronomists a farmer can consult.",
     "FarmAnalytics", NONE, MISSING,
     "Removed. These were invented names with invented ratings; a farmer "
     "ringing one would find nobody. Needs real agronomists signed up."],
    ["Analytics", "Satellite crop health (NDVI)",
     "Crop health from satellite imagery.",
     "NDVIMap", NONE, MISSING,
     "Returns nothing now rather than a made-up index. Needs a satellite "
     "imagery provider - Sentinel-2 through Copernicus is free but needs an "
     "account and real work to wire up."],
    ["Analytics", "Yield prediction",
     "Expected harvest.",
     "YieldPrediction", NONE, MISSING,
     "Returns nothing now rather than a made-up figure. Needs a season of "
     "recorded harvests first, which means recording sowings and harvests - "
     "a feature in itself, and the sensible next thing to build."],
    ["Marketplace", "Buy and sell produce",
     "Listings, chat with buyers, and creating a listing.",
     "MarketplaceHome, ListingDetail, CreateListing, ChatList, Chat",
     NONE, SAMPLE,
     "The largest of the unfinished features: needs buyers, sellers, "
     "messaging and payments."],
    ["Marketplace", "Mandi prices",
     "Market prices for crops.",
     "MandiPrices", NONE, SAMPLE,
     "The government publishes daily mandi prices through data.gov.in and "
     "this could use them. The feed did not respond when tried, so it needs "
     "our own free API key from data.gov.in before it can be wired and "
     "tested."],
    ["Schemes", "Government schemes",
     "PM-KISAN, Fasal Bima, KCC, Soil Health Card, eNAM and others, with "
     "eligibility and how to apply.",
     "GovernmentSchemes, SchemeDetail", STATIC, LIVE,
     "Real schemes, stored in the app rather than fetched. Needs someone to "
     "keep the details current."],

    # ── Settings ─────────────────────────────────────────────────────────
    ["Settings", "My profile",
     "Change name, phone, farm name and farm location.",
     "UserProfile", REAL, LIVE,
     "Opened blank and saved nothing before; both fixed."],
    ["Settings", "Notification settings",
     "Choose which alerts to receive.",
     "NotificationSettings", REAL, LIVE, ""],
    ["Settings", "App settings",
     "Language, units and location.",
     "SettingsMain, SettingsDetail", REAL, LIVE, ""],

    # ── Across the app ───────────────────────────────────────────────────
    ["Across the app", "Works offline",
     "Recently loaded data stays readable with no signal, and the app says "
     "when it is offline.",
     "All", INAPP, LIVE,
     "Actions needing the server are refused clearly rather than failing "
     "silently."],
    ["Across the app", "Live updates",
     "Pump state and sensor readings update without refreshing.",
     "Pumps, Soil, Devices", DEVICE, LIVE,
     "Runs on a public message broker. Anyone knowing a farmer's ID could "
     "read their sensors or switch their pump - must move to a private "
     "broker before real farms use it."],
]


def build():
    wb = Workbook()

    # ── Features sheet ───────────────────────────────────────────────────
    ws = wb.active
    ws.title = "Features"

    ws.append(["SmartKisan - Feature List"])
    ws.merge_cells(start_row=1, start_column=1, end_row=1, end_column=len(HEADERS))
    c = ws.cell(row=1, column=1)
    c.font = Font(bold=True, size=14, color="1B5E20")
    c.alignment = Alignment(horizontal="center")

    ws.append(["Every row checked against the code. "
               "'Work in progress' means the screens are built but not yet "
               "connected to real data - see the Data source column."])
    ws.merge_cells(start_row=2, start_column=1, end_row=2, end_column=len(HEADERS))
    c = ws.cell(row=2, column=1)
    c.font = Font(italic=True, size=10, color="555555")
    c.alignment = Alignment(horizontal="center")

    ws.append([])
    ws.append(HEADERS)

    header_fill = PatternFill("solid", fgColor="2E7D32")
    thin = Side(style="thin", color="BDBDBD")
    border = Border(left=thin, right=thin, top=thin, bottom=thin)

    for i in range(1, len(HEADERS) + 1):
        cell = ws.cell(row=4, column=i)
        cell.fill = header_fill
        cell.font = Font(bold=True, color="FFFFFF", size=11)
        cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        cell.border = border

    status_colour = {
        LIVE: "1B5E20",
        SAMPLE: "E65100",
        BUILT: "E65100",
        MISSING: "757575",
    }
    # Amber rather than red: these are unfinished, not broken.
    sample_fill = PatternFill("solid", fgColor="FFF8E1")

    for n, row in enumerate(ROWS, start=1):
        ws.append([n] + row)
        r = ws.max_row
        for i in range(1, len(HEADERS) + 1):
            cell = ws.cell(row=r, column=i)
            cell.border = border
            cell.alignment = Alignment(vertical="top", wrap_text=True)
        status = row[5]
        ws.cell(row=r, column=7).font = Font(bold=True,
                                             color=status_colour.get(status, "000000"))
        # Tint the rows that are not yet showing real data, so they are
        # findable at a glance rather than by reading every line.
        if status in (SAMPLE, MISSING):
            for i in range(1, len(HEADERS) + 1):
                ws.cell(row=r, column=i).fill = sample_fill

    for i, w in enumerate([5, 16, 30, 54, 38, 24, 16, 52], start=1):
        ws.column_dimensions[get_column_letter(i)].width = w
    ws.row_dimensions[4].height = 28
    ws.freeze_panes = "A5"
    ws.auto_filter.ref = "A4:H%d" % ws.max_row

    # ── Summary sheet ────────────────────────────────────────────────────
    s = wb.create_sheet("Summary")
    s.append(["SmartKisan - Feature Summary"])
    s.merge_cells(start_row=1, start_column=1, end_row=1, end_column=3)
    s.cell(row=1, column=1).font = Font(bold=True, size=14, color="1B5E20")
    s.append([])

    counts = {}
    for row in ROWS:
        counts[row[5]] = counts.get(row[5], 0) + 1

    s.append(["Status", "Features", "Meaning"])
    for i in range(1, 4):
        cell = s.cell(row=3, column=i)
        cell.fill = header_fill
        cell.font = Font(bold=True, color="FFFFFF")
        cell.border = border

    meaning = {
        LIVE: "Working with the farm's own data",
        SAMPLE: "Screens built and working; the data behind them is still to be connected, so figures are the same for every farmer",
        BUILT: "Code is finished, blocked on something outside development",
        MISSING: "Not available in the app",
    }
    for status in (LIVE, SAMPLE, BUILT, MISSING):
        if status in counts:
            s.append([status, counts[status], meaning[status]])
            r = s.max_row
            s.cell(row=r, column=1).font = Font(bold=True,
                                                color=status_colour.get(status, "000000"))
            for i in range(1, 4):
                s.cell(row=r, column=i).border = border
                s.cell(row=r, column=i).alignment = Alignment(vertical="top",
                                                              wrap_text=True)

    s.append([])
    s.append(["Total features", len(ROWS), ""])
    s.cell(row=s.max_row, column=1).font = Font(bold=True)
    s.cell(row=s.max_row, column=2).font = Font(bold=True)

    s.append([])
    s.append(["By module", "", ""])
    s.cell(row=s.max_row, column=1).font = Font(bold=True, size=12, color="1B5E20")

    by_module = {}
    for row in ROWS:
        by_module.setdefault(row[0], []).append(row[5])
    for module in sorted(by_module, key=lambda m: -len(by_module[m])):
        statuses = by_module[module]
        live = sum(1 for x in statuses if x == LIVE)
        s.append([module, "%d of %d working" % (live, len(statuses)), ""])
        for i in range(1, 4):
            s.cell(row=s.max_row, column=i).border = border

    for i, w in enumerate([26, 22, 54], start=1):
        s.column_dimensions[get_column_letter(i)].width = w

    out = os.path.join(os.path.dirname(os.path.abspath(__file__)), FILENAME)
    wb.save(out)
    print("Wrote " + out)
    print("  %d features" % len(ROWS))
    for status in (LIVE, SAMPLE, BUILT, MISSING):
        if status in counts:
            print("    %-18s %d" % (status, counts[status]))


if __name__ == "__main__":
    build()
