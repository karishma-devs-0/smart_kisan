#!/usr/bin/env bash
# Captures the screenshots the testing manual needs, from a real phone.
#
# The manual is generated with a placeholder in every spot where a screenshot
# belongs. Run this with the phone plugged in, walk through the app as it
# prompts, and the images land in docs/screenshots/ named to match. Then
# re-run generate_test_manual.py and they drop into the document.
#
# Why a phone rather than an emulator: the weed detector and the camera do not
# work in an emulator, and screenshots from one look nothing like what a farmer
# sees. There is also no emulator installed on this machine.
#
# Setup on the phone, once:
#   Settings > About phone > tap Build number seven times
#   Settings > Developer options > USB debugging, on
#   Plug in, and accept the prompt on the phone screen
#
# Usage:
#   bash scripts/capture-screens.sh            # every screen, in order
#   bash scripts/capture-screens.sh 12         # start again from number 12
set -uo pipefail

ADB="${ADB:-adb}"
OUT="$(dirname "$0")/../docs/screenshots"
START="${1:-1}"

# Each entry: filename|what to do on the phone before pressing Enter
SCREENS=(
  "01-install|Install the APK and open it. Stop at the first screen you see."
  "02-consent|The terms and consent screen, before you tick anything."
  "03-register|Registration form, filled in but not submitted."
  "04-register-error|Registration with a bad email, showing the error under the field."
  "05-login-email|Login screen, Email tab."
  "06-login-code|Login screen, Code tab."
  "07-code-entered|After requesting a code, the 6-digit entry screen."
  "08-forgot-password|Tap 'Forgot password?' - the reset screen."
  "09-onboard-farm|Farm setup, step 1: farm name and type."
  "10-onboard-size|Farm setup, step 2: farm size."
  "11-onboard-location|Farm setup, step 3: where the farm is."
  "12-onboard-fields|Farm setup, step 4: fields, crops and devices."
  "13-home|The home dashboard, after setup finishes."
  "14-home-summary|Scroll to Today's Summary - hours, water, electricity."
  "15-farm-map|The farm map widget, or the full map screen."
  "16-notifications|The notifications list (tap the bell)."
  "17-pumps-list|My Pumps."
  "18-pump-add|Add a pump - the form, filled in."
  "19-pump-detail|A pump's detail screen."
  "20-pump-control|Pump controls, including the emergency stop."
  "21-pump-timer|The pump timer screen."
  "22-pump-history|Pump history."
  "23-soil|My Soil."
  "24-soil-add|Add a soil reading - the form, filled in."
  "25-soil-health|The soil health screen."
  "26-weather-today|Weather today."
  "27-weather-forecast|The forecast screen."
  "28-weather-et|The water need (ET) calculator."
  "29-crops|My Crops."
  "30-crop-add|Add a crop - the form."
  "31-fields|My Fields."
  "32-devices|The device list."
  "33-disease-home|Disease detection home."
  "34-disease-result|Scan a leaf - the result screen."
  "35-disease-refused|Photograph something that is not a leaf, to show the refusal."
  "36-weed-home|AI field monitor (weed detection)."
  "37-weed-result|Scan a plant - the result."
  "38-crop-suitability|Crop suitability."
  "39-fertilizer|The fertiliser calculator, with a result."
  "40-tasks|Farm tasks."
  "41-task-add|Add a task - the form."
  "42-harvests|Harvests, from the tile on the home screen."
  "43-harvest-add|The record-a-harvest form, filled in."
  "44-harvest-yields|The yield cards at the top, after two harvests of one crop."
  "45-harvest-report|Reports, showing harvest performance."
  "46-speak-button|A disease scan result - include the speaker icon."
  "47-speak-elsewhere|Farm Analytics, showing an observation with its speaker icon."
  "48-mic|The microphone dialog on the home screen, while listening."
  "49-mic-words|The dialog after it heard you, before it opens the screen."
  "50-mic-unknown|The dialog when it did not understand, showing the suggestions."
  "51-reports|Reports."
  "52-analytics|Farm analytics."
  "53-schemes|Government schemes."
  "54-profile|My profile, in Settings."
  "55-settings|The settings screen, showing language."
)

if ! "$ADB" get-state >/dev/null 2>&1; then
  echo "No phone connected."
  echo "Plug the phone in, turn on USB debugging, and accept the prompt on its screen."
  echo "Check with: $ADB devices"
  exit 1
fi

mkdir -p "$OUT"
echo "Saving to $OUT"
echo "Press Enter to capture each screen, or type s to skip it, or q to stop."
echo

n=0
for entry in "${SCREENS[@]}"; do
  n=$((n + 1))
  [ "$n" -lt "$START" ] && continue

  name="${entry%%|*}"
  what="${entry#*|}"

  printf '%2d/%d  %s\n      %s\n      > ' "$n" "${#SCREENS[@]}" "$name" "$what"
  read -r reply </dev/tty

  case "$reply" in
    q|Q) echo "Stopped. Start again here with: bash scripts/capture-screens.sh $n"; exit 0 ;;
    s|S) echo "      skipped"; echo; continue ;;
  esac

  # exec-out keeps the PNG bytes intact; adb shell screencap mangles them on
  # some Windows setups by translating line endings.
  if "$ADB" exec-out screencap -p > "$OUT/$name.png" 2>/dev/null && [ -s "$OUT/$name.png" ]; then
    size=$(wc -c < "$OUT/$name.png")
    echo "      saved ($((size / 1024)) KB)"
  else
    rm -f "$OUT/$name.png"
    echo "      FAILED - is the phone still connected and unlocked?"
  fi
  echo
done

echo "Done. $(ls -1 "$OUT"/*.png 2>/dev/null | wc -l) screenshots in $OUT"
echo "Now run:  python generate_test_manual.py"
echo "The manual is written to docs/documents/."
