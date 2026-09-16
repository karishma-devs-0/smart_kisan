---
title: SmartKisan Plant Disease Detection
emoji: 🌿
colorFrom: green
colorTo: green
sdk: docker
pinned: false
---

## State of this folder

This folder is a working copy and has drifted from what the Space actually
runs. The Space reports 32 classes at 288px and returns `input_size` and
`crops` from its root endpoint, which the `app.py` here does not; the live
`app.py` is therefore ahead of this one. Check the Space before assuming this
folder reflects production.

The 32-class India model has been live since 14 September. `.replaced` holds
the 38-class model it succeeded, with its own labels, purely as history.

A model and its labels must be replaced together. In this folder they were
not: the 32-class model sat next to the 38-class label file for a day, and
`app.py` still hardcoded 224px. Pushing it in that state would have overwritten
a working Space with one that started cleanly, answered every request with
HTTP 200, and read predictions off the wrong list -- index 0 reported as Apple
scab where the model meant Corn Cercospora leaf spot. `app.py` now takes the
input size from the model and refuses to start if the label count disagrees
with the output tensor, so that push cannot succeed silently.

## Known weakness of the live model

Measured on 60 photographs of diseased potato leaves taken in the field, and
compared against the model it replaced:

| model | answers given | wrongly called healthy |
|---|---|---|
| 38-class (previous) | 25 | 4 |
| 32-class (live) | 47 | 8 |

The live model answers far more often, which is the improvement the accuracy
report records. It also calls roughly twice as many diseased leaves healthy.
Telling a farmer his sick plant is fine is the costliest mistake this feature
makes, because nothing is then done. The app's confidence floor now applies to
healthy verdicts as well as to diagnoses, which is what holds that number down.
