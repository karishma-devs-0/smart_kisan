# Plant Disease Detection using Deep Learning
## Lecture & Seminar Guide — SmartKisan Project

---

## Part 1: The Problem (5 min)

### Why Plant Disease Detection?
- India has 120M+ farmers. Crop diseases cause **20-40% yield loss** annually
- Most farmers can't afford or access plant pathologists
- By the time a disease is visually obvious, significant damage is done
- **Solution:** A phone camera + AI model = instant diagnosis in the field

### What We Built
- A mobile app (SmartKisan) where farmers take a photo of a diseased leaf
- The image is sent to a cloud API running our trained model
- Within seconds, the farmer gets: disease name, confidence, severity, and treatment recommendations

---

## Part 2: The Dataset (10 min)

### PlantVillage Dataset
- **Source:** Penn State University, publicly available on Kaggle
- **Size:** ~55,000 images of plant leaves
- **Classes:** 38 categories across 14 crop species
- **Format:** RGB images, various resolutions, lab-controlled backgrounds

### The 38 Classes
```
Apple: Apple Scab, Black Rot, Cedar Apple Rust, Healthy
Blueberry: Healthy
Cherry: Powdery Mildew, Healthy
Corn: Gray Leaf Spot, Common Rust, Northern Leaf Blight, Healthy
Grape: Black Rot, Esca, Leaf Blight, Healthy
Orange: Citrus Greening (Huanglongbing)
Peach: Bacterial Spot, Healthy
Pepper: Bacterial Spot, Healthy
Potato: Early Blight, Late Blight, Healthy
Raspberry: Healthy
Soybean: Healthy
Squash: Powdery Mildew
Strawberry: Leaf Scorch, Healthy
Tomato: Bacterial Spot, Early Blight, Late Blight, Leaf Mold,
        Septoria Leaf Spot, Spider Mites, Target Spot,
        Yellow Leaf Curl Virus, Mosaic Virus, Healthy
```

### Data Preparation
```
Original dataset (color/):         → one flat folder, 38 subfolders
                                    ↓ auto-split 80/20
Train set (80%): ~44,000 images    → used to teach the model
Validation set (20%): ~11,000      → used to check accuracy during training
```

### Data Augmentation (Training Only)
We apply random transformations to training images to make the model more robust:
- **Rotation:** ±20 degrees
- **Shift:** 20% horizontal/vertical
- **Flip:** Horizontal mirror
- **Zoom:** ±20%
- **Why?** A leaf photographed at different angles, distances, and lighting conditions should still be recognized. Augmentation simulates this variety.

```python
train_datagen = ImageDataGenerator(
    rescale=1./255,          # Normalize pixel values 0-255 → 0-1
    rotation_range=20,
    width_shift_range=0.2,
    height_shift_range=0.2,
    horizontal_flip=True,
    zoom_range=0.2,
)
```

---

## Part 3: The Model Architecture (15 min)

### Why Not Train From Scratch?
- Training a CNN from zero requires **millions** of images and **days** of GPU time
- With only 55K images, a model trained from scratch would overfit badly
- **Transfer Learning** solves this: start with a model already trained on 1.4M images (ImageNet), then adapt it to our task

### What is MobileNetV2?
- Developed by Google for mobile/edge devices
- Trained on **ImageNet** (1.4 million images, 1000 classes — dogs, cars, planes, etc.)
- Already "knows" how to recognize edges, textures, shapes, colors
- Key innovation: **Inverted Residuals + Linear Bottlenecks** → high accuracy at low computational cost
- Only **3.4M parameters** (vs. 138M for VGG16, 25M for ResNet50)

### Our Model Architecture
```
Input Image (224 × 224 × 3)
        ↓
┌─────────────────────────────┐
│  MobileNetV2 Base           │  ← Pretrained on ImageNet
│  (Feature Extractor)        │     Outputs 7×7×1280 feature maps
│  154 layers, 2.2M params    │
└─────────────────────────────┘
        ↓
  GlobalAveragePooling2D        ← Reduces 7×7×1280 → 1280
        ↓
  Dropout(0.3)                  ← Prevents overfitting (randomly drops 30% neurons)
        ↓
  Dense(256, relu)              ← Fully connected layer to learn combinations
        ↓
  Dropout(0.3)                  ← More regularization
        ↓
  Dense(38, softmax)            ← Output: probability for each of 38 classes
```

### Key Concepts to Explain

**Feature Maps:** Each layer of MobileNetV2 detects increasingly complex features:
- Layer 1-10: Edges, gradients, simple textures
- Layer 10-50: Shapes, patterns (spots, veins, curves)
- Layer 50-100: Object parts (leaf edges, lesion boundaries)
- Layer 100-154: High-level concepts (disease patterns, healthy vs diseased tissue)

**GlobalAveragePooling2D:** Instead of flattening 7×7×1280 = 62,720 values, we take the average of each 7×7 feature map → just 1280 values. This reduces parameters dramatically and prevents overfitting.

**Softmax:** Converts raw scores into probabilities that sum to 1.0. The class with the highest probability is our prediction.

**Dropout:** During training, randomly sets 30% of neuron outputs to zero. Forces the network to learn redundant representations — no single neuron becomes a "single point of failure."

---

## Part 4: Training Strategy (10 min)

### Two-Phase Training

#### Phase 1: Feature Extraction (10 epochs)
```python
base_model.trainable = False  # Freeze all MobileNetV2 layers
optimizer = Adam(lr=0.001)    # Higher learning rate — only training new layers
```
- MobileNetV2 weights are **frozen** — they don't change
- Only our new layers (GAP → Dense → Dense) are trained
- Fast training — only ~300K parameters to optimize
- The model learns to map MobileNetV2's ImageNet features to plant diseases

#### Phase 2: Fine-Tuning (15 epochs)
```python
base_model.trainable = True
for layer in base_model.layers[:-30]:
    layer.trainable = False   # Keep first 124 layers frozen
optimizer = Adam(lr=0.0001)   # 10x lower learning rate
```
- **Last 30 layers** of MobileNetV2 are unfrozen
- These layers learn to specialize for leaf/disease features
- **Lower learning rate** (0.0001) — we don't want to destroy pretrained knowledge
- This is the "fine-tuning" step that pushes accuracy from ~90% to ~95%+

### Why Two Phases?
If you unfreeze everything from the start with a high learning rate, the pretrained weights get destroyed → "catastrophic forgetting." Training the top layers first lets them stabilize, then fine-tuning adapts the base model gently.

### Callbacks
```python
EarlyStopping(patience=5)     # Stop if val_loss doesn't improve for 5 epochs
ReduceLROnPlateau(factor=0.2) # Cut learning rate by 5x when plateauing
```

---

## Part 5: Model Export & Deployment (10 min)

### Converting to TFLite
```python
converter = tf.lite.TFLiteConverter.from_keras_model(model)
converter.optimizations = [tf.lite.Optimize.DEFAULT]  # Quantization
tflite_model = converter.convert()
```

**Why TFLite?**
- Full Keras model: ~30 MB, requires TensorFlow (1.5 GB library)
- TFLite model: ~8 MB, requires tflite-runtime (5 MB library)
- 6x smaller model, 300x smaller runtime
- Perfect for deploying on a cheap server or even on-device

**Quantization:** `Optimize.DEFAULT` applies post-training dynamic range quantization:
- Weights converted from float32 (4 bytes) → int8 (1 byte)
- ~4x model size reduction with <1% accuracy loss
- Inference speed improvement on CPU

### Deployment Architecture
```
┌──────────────────┐     POST /predict      ┌────────────────────────┐
│                  │    (image upload)       │                        │
│  SmartKisan App  │ ──────────────────────→ │  HuggingFace Space     │
│  (React Native)  │                         │  (Docker + FastAPI)    │
│                  │ ←────────────────────── │                        │
│                  │    JSON response        │  - app.py              │
│                  │    {disease, crop,      │  - plant_disease.tflite│
│                  │     confidence, ...}    │  - class_labels.json   │
└──────────────────┘                         └────────────────────────┘
```

### The API (FastAPI + TFLite)
```python
@app.post("/predict")
async def predict(file: UploadFile):
    # 1. Read uploaded image
    image_bytes = await file.read()

    # 2. Preprocess: resize to 224x224, normalize to 0-1
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img = img.resize((224, 224))
    arr = np.array(img, dtype=np.float32) / 255.0
    input_data = np.expand_dims(arr, axis=0)  # Shape: (1, 224, 224, 3)

    # 3. Run inference
    interpreter.set_tensor(input_details[0]["index"], input_data)
    interpreter.invoke()
    output = interpreter.get_tensor(output_details[0]["index"])[0]

    # 4. Get prediction
    predicted_idx = np.argmax(output)          # Index of highest probability
    confidence = output[predicted_idx] * 100   # Convert to percentage

    # 5. Map to disease info
    class_name = class_labels[str(predicted_idx)]
    info = DISEASE_INFO[class_name]

    return {
        "crop": info["crop"],
        "disease": info["disease"],
        "confidence": confidence,
        "treatment": info["treatment"],
    }
```

### HuggingFace Spaces (Free Hosting)
- Free tier: 2 vCPU, 16 GB RAM, no GPU (CPU inference is fine for MobileNetV2)
- Docker-based deployment
- Auto-sleeps after inactivity, wakes on first request (~30s cold start)
- Public URL: `https://{username}-{space-name}.hf.space`

---

## Part 6: What If You Don't Have a GPU? (5 min)

### Option 1: Google Colab (Free)
- Free NVIDIA T4 GPU (16 GB VRAM)
- Upload dataset to Google Drive → mount in Colab
- Run the training notebook → download model files
- **Limitation:** 12-hour session limit, may disconnect

### Option 2: Kaggle Notebooks (Free)
- Free NVIDIA P100 GPU (16 GB VRAM)
- 30 hours/week GPU quota
- Dataset already on Kaggle — no upload needed
- **Limitation:** 12-hour session limit

### Option 3: CPU Training (Slow but works)
- A laptop CPU can train this model — just takes 5-10x longer
- ~55K images × 25 epochs ≈ 3-6 hours on a modern CPU
- Reduce batch size to 16 if RAM limited
- Good for learning/experimentation, not production

### Option 4: Rent Cloud GPU
- Google Cloud, AWS, Lambda Labs, Vast.ai
- NVIDIA A100 for ~$1-3/hour
- Train in 10-15 minutes
- Best for production/iteration

---

## Part 7: End-to-End Flow Demo (5 min)

### Live Demo Script
1. Open SmartKisan app on phone
2. Navigate to Disease Detection
3. Point camera at a plant leaf (or pick from gallery)
4. Show the "Analyzing..." loading state
5. Show results: disease name, confidence, severity, treatments
6. Explain what happened behind the scenes:
   - Image captured at full resolution
   - Compressed to JPEG (quality 0.8)
   - Sent as multipart form data to API
   - API resizes to 224×224
   - TFLite model processes in ~50ms
   - Response mapped to disease info with treatments
   - Result displayed + saved to Firestore history

---

## Part 8: Limitations & Future Work (5 min)

### Current Limitations
1. **Lab images only** — PlantVillage has clean, single-leaf photos. Real field photos have soil, multiple leaves, shadows, hands
2. **38 classes** — doesn't cover many Indian crops (rice blast, sugarcane diseases, etc.)
3. **No localization** — can't point to "where" the disease is on the leaf
4. **Cold start** — HuggingFace free tier takes ~30s to wake up
5. **Confidence calibration** — model says 95% but might be wrong; softmax outputs aren't true probabilities

### Future Improvements
1. **Field dataset** — collect real photos from Indian farms for fine-tuning
2. **Object detection** — use YOLO to detect and crop leaves automatically
3. **On-device inference** — run TFLite directly on phone (no network needed)
4. **More crops** — add rice, sugarcane, wheat, cotton diseases specific to India
5. **Severity estimation** — use image segmentation to measure % of leaf affected
6. **Multi-image** — analyze multiple photos of the same plant for better accuracy

---

## Appendix: Key Terms Glossary

| Term | Meaning |
|------|---------|
| **CNN** | Convolutional Neural Network — a type of deep learning model designed for images |
| **Transfer Learning** | Using a model trained on one task (ImageNet) as a starting point for another (plant diseases) |
| **Fine-Tuning** | Unfreezing and retraining some layers of the pretrained model |
| **MobileNetV2** | Google's efficient CNN architecture optimized for mobile devices |
| **TFLite** | TensorFlow Lite — compressed model format for edge/mobile deployment |
| **Softmax** | Activation function that converts scores into probabilities summing to 1 |
| **Epoch** | One complete pass through the entire training dataset |
| **Batch Size** | Number of images processed at once (32 in our case) |
| **Learning Rate** | How big of a step the optimizer takes (too high = unstable, too low = slow) |
| **Overfitting** | Model memorizes training data instead of learning generalizable patterns |
| **Dropout** | Randomly disabling neurons during training to prevent overfitting |
| **Data Augmentation** | Applying random transforms (rotation, flip, zoom) to artificially increase dataset diversity |
| **Quantization** | Reducing model weight precision (float32 → int8) to shrink size and speed up inference |
| **HuggingFace Spaces** | Free platform to host ML models as web APIs |
| **FastAPI** | Python web framework for building REST APIs |
| **FormData** | HTTP format for uploading files (images) from the mobile app to the API |

---

## Suggested Slide Structure (20-25 slides)

1. Title slide
2. The Problem: Crop diseases in India
3. Our Solution: SmartKisan Disease Detection
4. Demo screenshot of the app
5. The Dataset: PlantVillage (show sample images)
6. 38 Classes overview
7. Data Prep: Train/Valid split + Augmentation (show augmented images)
8. Why Transfer Learning? (comparison diagram)
9. MobileNetV2 Architecture (visual diagram)
10. Our Full Model Architecture (the stacked diagram from Part 3)
11. Feature Maps visualization (edges → shapes → disease patterns)
12. Training Phase 1: Feature Extraction
13. Training Phase 2: Fine-Tuning
14. Training curves (accuracy + loss graphs)
15. Results: Validation accuracy, confusion matrix
16. Model Export: Keras → TFLite (size comparison)
17. Deployment Architecture diagram
18. The API: FastAPI predict endpoint (code walkthrough)
19. HuggingFace Spaces: Free hosting
20. No GPU? Options (Colab, Kaggle, CPU, Cloud)
21. Live Demo
22. Limitations
23. Future Work
24. Q&A
