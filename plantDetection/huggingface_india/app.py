import os
import json
import numpy as np
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import io

# Use ai-edge-litert (replacement for tflite-runtime, supports newer model ops)
from ai_edge_litert.interpreter import Interpreter

app = FastAPI(title="SmartKisan Plant Disease API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model and labels at startup
MODEL_PATH = "plant_disease_model.tflite"
LABELS_PATH = "class_labels.json"

interpreter = Interpreter(model_path=MODEL_PATH)
interpreter.allocate_tensors()
input_details = interpreter.get_input_details()
output_details = interpreter.get_output_details()

with open(LABELS_PATH, "r") as f:
    class_labels = json.load(f)

# Read the input size from the model rather than hardcoding it. The previous
# version assumed 224, so swapping in a model trained at a different size would
# have fed it wrongly-scaled images and quietly halved its accuracy.
IMG_SIZE = int(input_details[0]["shape"][1])

# Accuracy is not high enough for this to be the last word. The app already
# withholds any answer below 70% confidence; this note is for the ones it does
# show.
ADVICE_NOTE = ("Check with your local Krishi Vigyan Kendra before buying any "
               "chemical. This is a suggestion from a photograph, not a "
               "diagnosis.")

# Disease info mapping (crop, disease, treatment).
#
# Covers the crops Indian smallholders grow. The apple, grape, cherry, peach,
# blueberry, raspberry and strawberry entries were removed along with their
# classes - the model can no longer emit them, and they were absorbing wrong
# answers that belonged to crops our users actually plant.
DISEASE_INFO = {
    "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot": {"crop": "Corn", "disease": "Gray Leaf Spot", "treatment": "Use resistant varieties. Apply foliar fungicide. Rotate crops."},
    "Corn_(maize)___Common_rust_": {"crop": "Corn", "disease": "Common Rust", "treatment": "Apply fungicide if severe. Plant resistant hybrids."},
    "Corn_(maize)___Northern_Leaf_Blight": {"crop": "Corn", "disease": "Northern Leaf Blight", "treatment": "Use resistant varieties. Apply foliar fungicide at first sign."},
    "Corn_(maize)___healthy": {"crop": "Corn", "disease": "Healthy", "treatment": "No treatment needed."},
    "Orange___Haunglongbing_(Citrus_greening)": {"crop": "Orange", "disease": "Citrus Greening", "treatment": "Control psyllid vectors. Remove infected trees. No cure available."},
    "Pepper,_bell___Bacterial_spot": {"crop": "Bell Pepper", "disease": "Bacterial Spot", "treatment": "Apply copper spray. Use disease-free seeds. Rotate crops."},
    "Pepper,_bell___healthy": {"crop": "Bell Pepper", "disease": "Healthy", "treatment": "No treatment needed."},
    "Potato___Early_blight": {"crop": "Potato", "disease": "Early Blight", "treatment": "Apply chlorothalonil or mancozeb fungicide. Rotate crops."},
    "Potato___Late_blight": {"crop": "Potato", "disease": "Late Blight", "treatment": "Apply metalaxyl fungicide immediately. Destroy infected plants."},
    "Potato___healthy": {"crop": "Potato", "disease": "Healthy", "treatment": "No treatment needed."},
    "Rice___Bacterial_leaf_blight": {"crop": "Rice", "disease": "Bacterial Leaf Blight", "treatment": "No spray cures this once it is established. Drain the field, stop applying nitrogen, and remove infected stubble after harvest. Plant a resistant variety next season."},
    "Rice___Blast": {"crop": "Rice", "disease": "Rice Blast", "treatment": "Spray tricyclazole or isoprothiolane at the first lesions. Avoid excess nitrogen and keep bunds free of weeds and old stubble, which carry the fungus between seasons."},
    "Rice___Brown_spot": {"crop": "Rice", "disease": "Brown Spot", "treatment": "Usually a sign of poor soil rather than a fungus alone. Correct potassium and apply mancozeb or propiconazole. Treating only the leaf lets it return."},
    "Rice___Tungro": {"crop": "Rice", "disease": "Tungro", "treatment": "A virus carried by green leafhopper - no fungicide will touch it. Remove infected plants, control the leafhopper, and sow in step with neighbouring fields so the insect has no staggered crop to move through."},
    "Rice___healthy": {"crop": "Rice", "disease": "Healthy", "treatment": "No treatment needed. Continue regular care."},
    "Soybean___healthy": {"crop": "Soybean", "disease": "Healthy", "treatment": "No treatment needed."},
    "Squash___Powdery_mildew": {"crop": "Squash", "disease": "Powdery Mildew", "treatment": "Apply neem oil or sulfur fungicide. Improve air circulation."},
    "Tomato___Bacterial_spot": {"crop": "Tomato", "disease": "Bacterial Spot", "treatment": "Apply copper-based bactericide. Remove infected plants."},
    "Tomato___Early_blight": {"crop": "Tomato", "disease": "Early Blight", "treatment": "Apply chlorothalonil fungicide. Remove lower infected leaves."},
    "Tomato___Late_blight": {"crop": "Tomato", "disease": "Late Blight", "treatment": "Apply metalaxyl fungicide. Destroy severely infected plants."},
    "Tomato___Leaf_Mold": {"crop": "Tomato", "disease": "Leaf Mold", "treatment": "Improve ventilation. Apply chlorothalonil. Reduce humidity."},
    "Tomato___Septoria_leaf_spot": {"crop": "Tomato", "disease": "Septoria Leaf Spot", "treatment": "Apply fungicide. Remove infected leaves. Mulch around base."},
    "Tomato___Spider_mites Two-spotted_spider_mite": {"crop": "Tomato", "disease": "Spider Mites", "treatment": "Apply insecticidal soap or neem oil. Increase humidity."},
    "Tomato___Target_Spot": {"crop": "Tomato", "disease": "Target Spot", "treatment": "Apply mancozeb or chlorothalonil. Remove infected debris."},
    "Tomato___Tomato_Yellow_Leaf_Curl_Virus": {"crop": "Tomato", "disease": "Yellow Leaf Curl Virus", "treatment": "Control whitefly vectors. Remove infected plants. Use resistant varieties."},
    "Tomato___Tomato_mosaic_virus": {"crop": "Tomato", "disease": "Mosaic Virus", "treatment": "Remove infected plants. Disinfect tools. No chemical cure."},
    "Tomato___healthy": {"crop": "Tomato", "disease": "Healthy", "treatment": "No treatment needed."},
    "Wheat___Brown_rust": {"crop": "Wheat", "disease": "Brown (Leaf) Rust", "treatment": "Spray propiconazole or tebuconazole. A resistant variety is the cheaper answer next season."},
    "Wheat___Powdery_mildew": {"crop": "Wheat", "disease": "Powdery Mildew", "treatment": "Dust with sulphur or spray a triazole fungicide. Cut back on nitrogen and thin sowing - dense lush crops invite it."},
    "Wheat___Septoria": {"crop": "Wheat", "disease": "Septoria Leaf Blotch", "treatment": "Apply a triazole fungicide. Rotate away from wheat next season and avoid sowing so thick that the canopy stays wet."},
    "Wheat___Yellow_rust": {"crop": "Wheat", "disease": "Yellow (Stripe) Rust", "treatment": "Spray propiconazole or tebuconazole as soon as the yellow stripes appear. It spreads fast in cool damp weather, so check the crop every few days once it is seen nearby."},
    "Wheat___healthy": {"crop": "Wheat", "disease": "Healthy", "treatment": "No treatment needed. Continue regular care."},
}


def preprocess_image(image_bytes: bytes) -> np.ndarray:
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img = img.resize((IMG_SIZE, IMG_SIZE))
    arr = np.array(img, dtype=np.float32) / 255.0
    return np.expand_dims(arr, axis=0)


@app.get("/")
def root():
    return {
        "status": "ok",
        "model": "SmartKisan Plant Disease Detection",
        "classes": len(class_labels),
        "input_size": IMG_SIZE,
        "crops": sorted({v["crop"] for v in DISEASE_INFO.values()}),
    }


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    image_bytes = await file.read()
    input_data = preprocess_image(image_bytes)

    interpreter.set_tensor(input_details[0]["index"], input_data)
    interpreter.invoke()
    output = interpreter.get_tensor(output_details[0]["index"])[0]

    predicted_idx = int(np.argmax(output))
    confidence = float(output[predicted_idx]) * 100
    class_name = class_labels.get(str(predicted_idx), f"Unknown_{predicted_idx}")

    top3_idx = np.argsort(output)[-3:][::-1]
    top3 = [
        {"class": class_labels.get(str(int(i)), "Unknown"),
         "confidence": round(float(output[i]) * 100, 1)}
        for i in top3_idx
    ]

    info = DISEASE_INFO.get(class_name, {})
    is_healthy = "healthy" in class_name.lower()

    return {
        "class_name": class_name,
        "crop": info.get("crop", "Unknown"),
        "disease": info.get("disease", "Unknown"),
        "confidence": round(confidence, 1),
        "is_healthy": is_healthy,
        "treatment": info.get("treatment", ""),
        "advice_note": ADVICE_NOTE,
        "top3": top3,
    }
