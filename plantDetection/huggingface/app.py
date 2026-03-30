import os
import json
import numpy as np
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import io

# Use tflite-runtime (lighter than full tensorflow)
import tflite_runtime.interpreter as tflite

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

interpreter = tflite.Interpreter(model_path=MODEL_PATH)
interpreter.allocate_tensors()
input_details = interpreter.get_input_details()
output_details = interpreter.get_output_details()

with open(LABELS_PATH, "r") as f:
    class_labels = json.load(f)

IMG_SIZE = 224

# Disease info mapping (crop, disease, healthy?)
DISEASE_INFO = {
    "Apple___Apple_scab": {"crop": "Apple", "disease": "Apple Scab", "treatment": "Apply fungicide (captan or myclobutanil). Remove infected leaves and debris."},
    "Apple___Black_rot": {"crop": "Apple", "disease": "Black Rot", "treatment": "Prune dead wood, apply copper-based fungicide. Remove mummified fruits."},
    "Apple___Cedar_apple_rust": {"crop": "Apple", "disease": "Cedar Apple Rust", "treatment": "Apply fungicide in spring. Remove nearby juniper/cedar trees if possible."},
    "Apple___healthy": {"crop": "Apple", "disease": "Healthy", "treatment": "No treatment needed. Continue regular care."},
    "Blueberry___healthy": {"crop": "Blueberry", "disease": "Healthy", "treatment": "No treatment needed."},
    "Cherry_(including_sour)___Powdery_mildew": {"crop": "Cherry", "disease": "Powdery Mildew", "treatment": "Apply sulfur-based fungicide. Ensure good air circulation."},
    "Cherry_(including_sour)___healthy": {"crop": "Cherry", "disease": "Healthy", "treatment": "No treatment needed."},
    "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot": {"crop": "Corn", "disease": "Gray Leaf Spot", "treatment": "Use resistant varieties. Apply foliar fungicide. Rotate crops."},
    "Corn_(maize)___Common_rust_": {"crop": "Corn", "disease": "Common Rust", "treatment": "Apply fungicide if severe. Plant resistant hybrids."},
    "Corn_(maize)___Northern_Leaf_Blight": {"crop": "Corn", "disease": "Northern Leaf Blight", "treatment": "Use resistant varieties. Apply foliar fungicide at first sign."},
    "Corn_(maize)___healthy": {"crop": "Corn", "disease": "Healthy", "treatment": "No treatment needed."},
    "Grape___Black_rot": {"crop": "Grape", "disease": "Black Rot", "treatment": "Remove mummified berries. Apply fungicide before bloom."},
    "Grape___Esca_(Black_Measles)": {"crop": "Grape", "disease": "Esca (Black Measles)", "treatment": "Prune infected wood. No effective chemical treatment available."},
    "Grape___Leaf_blight_(Isariopsis_Leaf_Spot)": {"crop": "Grape", "disease": "Leaf Blight", "treatment": "Apply fungicide. Remove infected leaves. Ensure good drainage."},
    "Grape___healthy": {"crop": "Grape", "disease": "Healthy", "treatment": "No treatment needed."},
    "Orange___Haunglongbing_(Citrus_greening)": {"crop": "Orange", "disease": "Citrus Greening", "treatment": "Control psyllid vectors. Remove infected trees. No cure available."},
    "Peach___Bacterial_spot": {"crop": "Peach", "disease": "Bacterial Spot", "treatment": "Apply copper-based bactericide. Use resistant varieties."},
    "Peach___healthy": {"crop": "Peach", "disease": "Healthy", "treatment": "No treatment needed."},
    "Pepper,_bell___Bacterial_spot": {"crop": "Bell Pepper", "disease": "Bacterial Spot", "treatment": "Apply copper spray. Use disease-free seeds. Rotate crops."},
    "Pepper,_bell___healthy": {"crop": "Bell Pepper", "disease": "Healthy", "treatment": "No treatment needed."},
    "Potato___Early_blight": {"crop": "Potato", "disease": "Early Blight", "treatment": "Apply chlorothalonil or mancozeb fungicide. Rotate crops."},
    "Potato___Late_blight": {"crop": "Potato", "disease": "Late Blight", "treatment": "Apply metalaxyl fungicide immediately. Destroy infected plants."},
    "Potato___healthy": {"crop": "Potato", "disease": "Healthy", "treatment": "No treatment needed."},
    "Raspberry___healthy": {"crop": "Raspberry", "disease": "Healthy", "treatment": "No treatment needed."},
    "Soybean___healthy": {"crop": "Soybean", "disease": "Healthy", "treatment": "No treatment needed."},
    "Squash___Powdery_mildew": {"crop": "Squash", "disease": "Powdery Mildew", "treatment": "Apply neem oil or sulfur fungicide. Improve air circulation."},
    "Strawberry___Leaf_scorch": {"crop": "Strawberry", "disease": "Leaf Scorch", "treatment": "Remove infected leaves. Apply fungicide. Ensure proper spacing."},
    "Strawberry___healthy": {"crop": "Strawberry", "disease": "Healthy", "treatment": "No treatment needed."},
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
}


def preprocess_image(image_bytes: bytes) -> np.ndarray:
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img = img.resize((IMG_SIZE, IMG_SIZE))
    arr = np.array(img, dtype=np.float32) / 255.0
    return np.expand_dims(arr, axis=0)


@app.get("/")
def root():
    return {"status": "ok", "model": "SmartKisan Plant Disease Detection", "classes": len(class_labels)}


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

    # Get top 3
    top3_idx = np.argsort(output)[-3:][::-1]
    top3 = [
        {"class": class_labels.get(str(int(i)), "Unknown"), "confidence": round(float(output[i]) * 100, 1)}
        for i in top3_idx
    ]

    # Get disease info
    info = DISEASE_INFO.get(class_name, {})
    is_healthy = "healthy" in class_name.lower()

    return {
        "class_name": class_name,
        "crop": info.get("crop", class_name.split("___")[0].replace("_", " ")),
        "disease": info.get("disease", class_name.split("___")[-1].replace("_", " ")),
        "confidence": round(confidence, 1),
        "is_healthy": is_healthy,
        "treatment": info.get("treatment", "Consult a local agronomist for specific treatment."),
        "top3": top3,
    }
