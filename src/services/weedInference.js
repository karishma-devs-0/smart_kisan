/**
 * On-device weed / crop-stress inference.
 *
 * Two MobileNetV2 classifiers, both 2.4 MB, bundled in the APK and run through
 * react-native-fast-tflite. On-device rather than a server because a farmer
 * standing in a field usually has no usable signal, and because these models
 * are small enough that there is no reason to make them a network round trip.
 *
 *   gog  Green-on-Green  — crop / grass weed / broadleaf weed
 *   yog  Yellow-on-Green — canopy stress: healthy / chlorosis / other_stress
 *
 * ACCURACY, HONESTLY
 * ------------------
 * GOG scores 97.4% on the held-out test split of SorghumWeedDataset — images
 * the model saw during neither training nor validation. That set is Indian and
 * shot handheld at 20-40 cm, so it is a fair proxy for app use, but it is one
 * farm in Tamil Nadu: expect lower on a different crop or region.
 *
 * YOG still runs on PlantVillage, where its 99.2% is a property of the dataset
 * rather than a field result — single leaves, uniform backgrounds, controlled
 * light. Treat it as unvalidated until it is retrained on field imagery.
 *
 * The UI shows confidence and flags anything under 60%, so a weak call is
 * visible rather than implied to be certain.
 */
import { loadTensorflowModel } from 'react-native-fast-tflite';
import * as ImageManipulator from 'expo-image-manipulator';
import { decode as jpegDecode } from 'jpeg-js';

import GOG_LABELS from '../../assets/models/gog_labels.json';
import YOG_LABELS from '../../assets/models/yog_labels.json';

const INPUT_SIZE = 224; // both models were trained at 224x224

const MODELS = {
  gog: {
    asset: require('../../assets/models/gog_model.tflite'),
    labels: GOG_LABELS,
    // 'crop' means the plant in frame is the crop, not a weed — a real answer,
    // and the one that tells a sprayer not to fire.
    //
    // Trained on SorghumWeedDataset (Tamil Nadu, CC BY): 4,312 images shot
    // handheld 20-40 cm from the plant, across morning and afternoon light,
    // sun, high wind and light rain. That capture style is the reason it is
    // here. The two models tried before were trained on imagery no phone
    // photograph resembles — CoFly is a drone at 5 m looking straight down,
    // DeepWeeds is Australian rangeland — so both were being asked to
    // generalise across a gap no amount of training fixes.
    //
    // 97.4% on the authors' held-out test split, which the model saw during
    // neither training nor validation.
    //
    // Three coarse classes rather than named species, because herbicide choice
    // turns on grass vs broadleaf. Naming the species is trivia if the action
    // is the same; this is the distinction that changes what a farmer does.
    negativeLabel: 'crop',
  },
  yog: {
    asset: require('../../assets/models/yog_model.tflite'),
    labels: YOG_LABELS,
    negativeLabel: 'healthy',
  },
};

const loaded = {};

// Dataset folder names are snake_case; farmers should not be shown
// "field_bindweed". Anything unmapped falls back to a de-underscored,
// capitalised form rather than the raw label.
const DISPLAY_NAMES = {
  crop: 'Crop — no weed detected',
  grass_weed: 'Grass weed',
  broadleaf_weed: 'Broadleaf weed',
  healthy: 'Healthy canopy',
  chlorosis: 'Chlorosis (yellowing)',
  other_stress: 'Other stress / damage',
};

function displayName(label) {
  if (DISPLAY_NAMES[label]) return DISPLAY_NAMES[label];
  return label
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Loads and caches a model. First call pays the disk read; later calls are free.
 */
export async function getModel(task) {
  if (loaded[task]) return loaded[task];
  const spec = MODELS[task];
  if (!spec) throw new Error(`Unknown inference task: ${task}`);
  loaded[task] = await loadTensorflowModel(spec.asset);
  return loaded[task];
}

/** Warms both models so the first scan isn't noticeably slower than the rest. */
export async function preloadModels() {
  try {
    await Promise.all([getModel('gog'), getModel('yog')]);
    return true;
  } catch (error) {
    if (__DEV__) console.warn('Model preload failed:', error.message);
    return false;
  }
}

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/**
 * base64 -> bytes. React Native has no dependable global atob, and pulling in a
 * polyfill for one call is not worth it.
 */
function base64ToBytes(b64) {
  const clean = b64.replace(/[^A-Za-z0-9+/]/g, '');
  const len = Math.floor((clean.length * 3) / 4);
  const out = new Uint8Array(len);
  let p = 0;
  for (let i = 0; i < clean.length; i += 4) {
    const a = B64.indexOf(clean[i]);
    const b = B64.indexOf(clean[i + 1]);
    const c = B64.indexOf(clean[i + 2]);
    const d = B64.indexOf(clean[i + 3]);
    out[p++] = (a << 2) | (b >> 4);
    if (p < len) out[p++] = ((b & 15) << 4) | (c >> 2);
    if (p < len) out[p++] = ((c & 3) << 6) | d;
  }
  return out;
}

/**
 * Resize to the model's 224x224 input and hand back the JPEG bytes.
 * `base64: true` means the resized file is returned inline, so the image is
 * read once rather than written and re-read.
 */
async function resizeToInput(uri) {
  const resized = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: INPUT_SIZE, height: INPUT_SIZE } }],
    { compress: 1, format: ImageManipulator.SaveFormat.JPEG, base64: true }
  );
  return base64ToBytes(resized.base64);
}

/**
 * MobileNetV2 was trained with inputs scaled to [-1, 1] (its preprocess_input),
 * so the same scaling has to be applied here. Getting this wrong does not throw
 * — it silently produces confident nonsense, which is the worst failure mode
 * for something driving a spray decision.
 */
function toFloat32Input(rgbBytes) {
  const out = new Float32Array(INPUT_SIZE * INPUT_SIZE * 3);
  for (let i = 0; i < out.length; i++) {
    out[i] = rgbBytes[i] / 127.5 - 1.0;
  }
  return out;
}

/**
 * Runs a model over an image URI.
 *
 * @returns {{label:string, confidence:number, isNegative:boolean, top3:Array}}
 */
export async function classify(task, imageUri) {
  const spec = MODELS[task];
  const model = await getModel(task);

  const jpegBytes = await resizeToInput(imageUri);
  const pixels = decodeToRgb(jpegBytes);
  const input = toFloat32Input(pixels);

  // run() takes and returns ArrayBuffers, not typed arrays. Passing the
  // Float32Array itself, and then calling Array.from on the returned buffer,
  // silently produced an empty array — Array.from(ArrayBuffer) is [] because an
  // ArrayBuffer is not iterable. `best` was therefore undefined and the scan
  // threw, which is why a photo could be taken and no result ever appeared.
  const outputs = await model.run([input.buffer]);
  const scores = Array.from(new Float32Array(outputs[0]));

  if (!scores.length) {
    throw new Error('The model returned no output. Please try again.');
  }

  const ranked = scores
    .map((score, i) => ({ raw: spec.labels[i], confidence: score * 100 }))
    .sort((a, b) => b.confidence - a.confidence);

  const best = ranked[0];
  return {
    label: displayName(best.raw),
    rawLabel: best.raw,
    confidence: Math.round(best.confidence * 10) / 10,
    isNegative: best.raw === spec.negativeLabel,
    top3: ranked.slice(0, 3).map((r) => ({
      label: displayName(r.raw),
      confidence: Math.round(r.confidence * 10) / 10,
    })),
  };
}

/**
 * Decodes JPEG bytes into a flat RGB array.
 *
 * react-native-fast-tflite wants pixels, not an encoded file, and React Native
 * has no canvas to decode with — hence jpeg-js.
 */
function decodeToRgb(jpegBytes) {
  const decoded = jpegDecode(jpegBytes, { useTArray: true });

  // jpeg-js returns RGBA; the models take RGB, so the alpha byte is dropped.
  const rgb = new Uint8Array(INPUT_SIZE * INPUT_SIZE * 3);
  for (let i = 0, j = 0; j < rgb.length; i += 4, j += 3) {
    rgb[j] = decoded.data[i];
    rgb[j + 1] = decoded.data[i + 1];
    rgb[j + 2] = decoded.data[i + 2];
  }
  return rgb;
}

export const TASK_LABELS = {
  gog: GOG_LABELS,
  yog: YOG_LABELS,
};
