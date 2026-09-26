"""
Generates a one-day DSR covering the GOG/YOG weed-detection model training.

Matches the layout of generate_dsr.py (same headers, palette and styling) so it
drops into the existing reporting pack, but writes a single dated row rather
than a whole sheet of them.

Numbers below are the measured validation results from the runs, not estimates.
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

REPORT_DATE = "2026-08-10"
FILENAME = "SmartKisan_DSR_2026-08-10.xlsx"

HEADERS = [
    "Date",
    "Task Category",
    "Detailed Task Description",
    "Deliverables / Artifacts",
    "Status",
    "Hours Spent",
    "Remarks & Notes",
]

ROWS = [
    [
        REPORT_DATE,
        "ML - Green-on-Green (GOG)",
        "Built and trained the Green-on-Green weed classifier. MobileNetV2 "
        "backbone at 224px, two-phase schedule (frozen head, then fine-tune of "
        "the last 30 layers), trained on the DeepWeeds dataset (17,509 images, "
        "9 classes). Applied inverse-frequency class weights because the set is "
        "52% 'Negative'; without them the model scores 52% by predicting "
        "Negative for everything.",
        "gog_model.tflite (2.4 MB), class_labels.json, train_weed_model.py",
        "Completed",
        "",
        "Validation accuracy 77.6%. Per-class recall: Parkinsonia 97.1%, Rubber "
        "vine 92.5%, Siam weed 92.5%, Parthenium 90.7%, Lantana 89.6%, Prickly "
        "acacia 87.7%, Snake weed 80.3%, Chinee apple 76.0%, Negative 67.9%. "
        "The headline figure is held down by Negative, which is the majority "
        "class; every weed species is between 76% and 97%.",
    ],
    [
        REPORT_DATE,
        "ML - Yellow-on-Green (YOG)",
        "Built and trained the Yellow-on-Green crop-stress classifier from the "
        "PlantVillage split already held locally, regrouped into three classes: "
        "healthy, chlorosis and other_stress. 'chlorosis' groups the diseases "
        "whose dominant sign is yellowing or mottling (citrus greening, tomato "
        "yellow leaf curl and mosaic viruses, Esca, rust flecking) rather than "
        "discrete lesions.",
        "yog_model.tflite (2.4 MB), class_labels.json",
        "Completed",
        "",
        "Validation accuracy 99.2%. Per-class recall: healthy 99.8%, chlorosis "
        "99.4%, other_stress 98.6%. Caveat: PlantVillage is captured under "
        "controlled conditions with uniform backgrounds, so this figure will "
        "not transfer directly to field photographs. Field validation required "
        "before it is treated as production accuracy.",
    ],
    [
        REPORT_DATE,
        "ML - Data sourcing (accuracy improvement)",
        "Identified that DeepWeeds is rangeland imagery - individual weeds "
        "against soil and scrub, effectively Green-on-Brown - so it does not "
        "teach the model to separate weed from crop when both are green, which "
        "is what GOG actually requires. Sourced CoFly-WeedDB (Zenodo, "
        "CC-BY-4.0): 201 UAV frames over a cotton field with per-pixel masks. "
        "Wrote prepare_cofly.py to convert that segmentation into 3,399 "
        "classification patches via centre-weighted tiling.",
        "prepare_cofly.py, 3,399 in-crop patches, --task cofly",
        "In Progress",
        "",
        "This is the main lever for improving GOG accuracy in real conditions. "
        "Next step is fine-tuning the DeepWeeds backbone on these in-crop "
        "patches. Known limitation: field_bindweed has only 50 patches from 14 "
        "source frames, which is too few to learn the species rather than "
        "memorise those scenes.",
    ],
    [
        REPORT_DATE,
        "ML - Infrastructure",
        "Made training resumable after two full runs were killed mid-epoch and "
        "lost all progress. Root cause was host memory, not the code: the "
        "machine has 15.2 GB with under 1 GB typically free, and TensorFlow was "
        "terminated on every allocation spike. Model and a state cursor are now "
        "written after every epoch, a re-run continues from that cursor, and a "
        "wrapper script restarts automatically. Also added per-class recall "
        "reporting.",
        "run_training.sh, resumable checkpointing, per-class metrics",
        "Completed",
        "",
        "Memory footprint reduced from multiple GB to ~315 MB (batch 32 to 8, "
        "bounded shuffle/prefetch buffers). A kill now costs one epoch instead "
        "of the whole run. Per-class reporting was added because a single "
        "accuracy figure can hide a class the model never gets right, which "
        "matters when the output drives a spray decision.",
    ],
]


def create_dsr():
    wb = Workbook()
    ws = wb.active
    ws.title = "Daily Status Report"
    ws.views.sheetView[0].showGridLines = True

    header_fill = PatternFill("solid", start_color="2E7D32", end_color="2E7D32")
    title_font = Font(name="Segoe UI", size=16, bold=True, color="1B5E20")
    header_font = Font(name="Segoe UI", size=11, bold=True, color="FFFFFF")
    data_font = Font(name="Segoe UI", size=10, color="1E2C1F")
    bold_data_font = Font(name="Segoe UI", size=10, bold=True, color="1E2C1F")

    center = Alignment(horizontal="center", vertical="center", wrap_text=True)
    left = Alignment(horizontal="left", vertical="top", wrap_text=True)
    title_align = Alignment(horizontal="left", vertical="center")

    thin = Side(style="thin", color="C8D6C8")
    border_all = Border(left=thin, right=thin, top=thin, bottom=thin)

    ws["A2"] = "SMARTKISAN PROJECT - DAILY STATUS REPORT (DSR)"
    ws["A2"].font = title_font
    ws["A2"].alignment = title_align

    ws["A3"] = (
        f"AI weed-detection model training - {REPORT_DATE}. "
        "GOG and YOG baselines trained and measured; accuracy improvement in progress."
    )
    ws["A3"].font = Font(name="Segoe UI", size=10, italic=True, color="526654")
    ws["A3"].alignment = title_align

    for col, title in enumerate(HEADERS, 1):
        cell = ws.cell(row=5, column=col, value=title)
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = center
        cell.border = border_all
    ws.row_dimensions[5].height = 26

    row_num = 6
    for record in ROWS:
        for col, value in enumerate(record, 1):
            cell = ws.cell(row=row_num, column=col, value=value)
            cell.font = bold_data_font if col == 5 else data_font
            cell.border = border_all
            cell.alignment = center if col in (1, 5, 6) else left
        ws.row_dimensions[row_num].height = 132
        row_num += 1

    # Pre-styled blank rows so later entries can be typed in without restyling.
    for r in range(row_num, row_num + 10):
        ws.row_dimensions[r].height = 40
        for c in range(1, 8):
            cell = ws.cell(row=r, column=c)
            cell.font = data_font
            cell.border = border_all
            cell.alignment = center if c in (1, 5, 6) else left

    for col, width in {
        "A": 13, "B": 26, "C": 62, "D": 34, "E": 13, "F": 12, "G": 62
    }.items():
        ws.column_dimensions[col].width = width

    ws.freeze_panes = "A6"

    path = os.path.join(os.getcwd(), FILENAME)
    wb.save(path)
    print(f"DSR written: {path}")


if __name__ == "__main__":
    create_dsr()
