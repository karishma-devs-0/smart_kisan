# Screenshots for the testing manual

Captured from a real phone, not an emulator: the camera and the on-device weed
detector do not run in one, and an emulator screenshot looks nothing like what
a farmer sees.

    bash scripts/capture-screens.sh      # phone connected, USB debugging on
    python generate_test_manual.py       # again, to place them in the document

The script prompts for each screen in the order the manual uses. Press Enter to
capture, `s` to skip one, `q` to stop; it tells you where to resume.

File names must match the manual's placeholders exactly. Both lists are
generated from the same order, so add a screen to `SECTIONS` in
`generate_test_manual.py` and to `SCREENS` in the capture script together.
