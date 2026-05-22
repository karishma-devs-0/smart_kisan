import { CROP_SOIL_RANGES } from '../mock/soilMockData';

const DEFAULT_RANGES = {
  moisture: [40, 65],
  pH: [6.0, 7.0],
  nitrogen: [30, 55],
  phosphorus: [20, 40],
  potassium: [20, 45],
  organicCarbon: [0.5, 1.5],
  ec: [0.2, 2.0],
};

const WEIGHTS = {
  moisture: 0.20,
  pH: 0.20,
  nitrogen: 0.15,
  phosphorus: 0.15,
  potassium: 0.15,
  organicCarbon: 0.10,
  ec: 0.05,
};

const scoreInRange = (value, range) => {
  if (value == null || !range) return null;
  const [min, max] = range;
  if (value >= min && value <= max) return 100;
  const mid = (min + max) / 2;
  const halfWidth = (max - min) / 2;
  const distanceFromMid = Math.abs(value - mid);
  const overshoot = distanceFromMid - halfWidth;
  const tolerance = halfWidth * 1.5;
  const score = 100 - (overshoot / tolerance) * 100;
  return Math.max(0, Math.min(100, score));
};

export const computeHealthScore = (current, cropName = null) => {
  if (!current) return 0;

  const cropRange = cropName ? CROP_SOIL_RANGES[cropName] : null;
  const ranges = {
    moisture: cropRange?.moisture || DEFAULT_RANGES.moisture,
    pH: cropRange?.pH || DEFAULT_RANGES.pH,
    nitrogen: cropRange?.nitrogen || DEFAULT_RANGES.nitrogen,
    phosphorus: cropRange?.phosphorus || DEFAULT_RANGES.phosphorus,
    potassium: cropRange?.potassium || DEFAULT_RANGES.potassium,
    organicCarbon: DEFAULT_RANGES.organicCarbon,
    ec: DEFAULT_RANGES.ec,
  };

  let weightedSum = 0;
  let totalWeight = 0;

  for (const key of Object.keys(WEIGHTS)) {
    const score = scoreInRange(current[key], ranges[key]);
    if (score != null) {
      weightedSum += score * WEIGHTS[key];
      totalWeight += WEIGHTS[key];
    }
  }

  if (totalWeight === 0) return 0;
  return Math.round(weightedSum / totalWeight);
};

export const mergeLatestReading = (current, reading) => {
  const merged = { ...current };
  const keys = ['moisture', 'pH', 'nitrogen', 'phosphorus', 'potassium', 'organicCarbon', 'ec', 'temperature', 'texture'];
  for (const key of keys) {
    if (reading[key] != null) merged[key] = reading[key];
  }
  return merged;
};
