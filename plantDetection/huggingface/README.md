---
title: SmartKisan Plant Disease Detection
emoji: 🌿
colorFrom: green
colorTo: green
sdk: docker
pinned: false
---

## State of this folder

The model staged here (`plant_disease_model.tflite`, 288px, 32 classes) is a
**candidate that has not been deployed**. The Space is still serving the
previous one, kept alongside as `plant_disease_model.tflite.replaced` (224px,
38 classes) with its own `class_labels.json.replaced`.

Do not push this folder expecting an improvement. Measured over 60 photographs
of diseased potato leaves taken in the field:

| model | answers given | wrongly called healthy |
|---|---|---|
| deployed (38-class) | 25 | 4 |
| candidate (32-class) | 47 | 8 |

The candidate answers far more often at a similar error rate, so it roughly
doubles the number of farmers told a diseased plant is healthy. That is the
costliest mistake the feature can make: nothing is done until the damage is
visible. Whether the extra answers are worth it depends on how often the
disease *name* is right, which these folders cannot measure — the dataset
labels causes (Bacteria, Virus, Fungi, Pest, Phytopthora) rather than
PlantVillage classes.

A model and its labels must be replaced together. They were not last time: a
32-class model was left paired with the 38-class label file, which would have
reported index 0 as Apple scab when the model meant Corn Cercospora leaf spot —
every scan confidently wrong, with HTTP 200. `app.py` now reads the input size
from the model and refuses to start if the label count disagrees.
