"""
SmartKisan Plant Disease — Local inference test
Usage: python predict.py path/to/leaf.jpg
"""
import os
import sys
import json
import numpy as np
from PIL import Image

HERE = os.path.dirname(__file__)
MODEL_PATH = os.path.join(HERE, 'huggingface', 'plant_disease_model.tflite')
LABELS_PATH = os.path.join(HERE, 'huggingface', 'class_labels.json')
IMG_SIZE = 224


def load_interpreter():
    try:
        import tflite_runtime.interpreter as tflite
    except ImportError:
        from tensorflow import lite as tflite
    interp = tflite.Interpreter(model_path=MODEL_PATH)
    interp.allocate_tensors()
    return interp


def preprocess(img_path):
    img = Image.open(img_path).convert('RGB').resize((IMG_SIZE, IMG_SIZE))
    arr = np.array(img, dtype=np.float32) / 255.0
    return np.expand_dims(arr, axis=0)


def main(img_path):
    if not os.path.exists(img_path):
        print(f'ERROR: file not found: {img_path}')
        sys.exit(1)

    with open(LABELS_PATH) as f:
        labels = json.load(f)

    interp = load_interpreter()
    inp = interp.get_input_details()
    out = interp.get_output_details()

    x = preprocess(img_path)
    interp.set_tensor(inp[0]['index'], x)
    interp.invoke()
    probs = interp.get_tensor(out[0]['index'])[0]

    top5 = np.argsort(probs)[-5:][::-1]

    print(f'\nImage: {img_path}')
    print('-' * 60)
    print(f'{"Rank":<6}{"Confidence":<14}{"Class"}')
    print('-' * 60)
    for rank, idx in enumerate(top5, 1):
        conf = probs[idx] * 100
        name = labels.get(str(int(idx)), f'Unknown_{idx}')
        bar = '█' * int(conf / 2)
        print(f'{rank:<6}{conf:>6.2f}%       {name}  {bar}')
    print('-' * 60)
    best = labels.get(str(int(top5[0])), 'Unknown')
    print(f'PREDICTION: {best.replace("___", " — ").replace("_", " ")}')
    print(f'CONFIDENCE: {probs[top5[0]] * 100:.1f}%')


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print('Usage: python predict.py <image_path>')
        sys.exit(1)
    main(sys.argv[1])
