/**
 * AI Pump rules — per-crop and per-soil constants.
 *
 * Sources:
 *   - Kc curves: FAO Irrigation and Drainage Paper 56
 *   - Field capacity / wilting point: ICAR + FAO soil texture references
 *
 * Values are conservative starting points. They become per-pump overrides
 * once the user tunes thresholds.
 */

// Crop coefficient (Kc) per growth stage. Used by the ET-based duration calc.
// Stages match the frontend `crops` slice values.
const CROP_KC = {
  default:    { initial: 0.5, vegetative: 0.85, flowering: 1.10, maturity: 0.70 },
  wheat:      { initial: 0.4, vegetative: 0.85, flowering: 1.15, maturity: 0.40 },
  rice:       { initial: 1.0, vegetative: 1.10, flowering: 1.20, maturity: 0.90 },
  maize:      { initial: 0.4, vegetative: 0.80, flowering: 1.20, maturity: 0.60 },
  cotton:     { initial: 0.4, vegetative: 0.80, flowering: 1.20, maturity: 0.70 },
  sugarcane:  { initial: 0.4, vegetative: 0.85, flowering: 1.25, maturity: 0.75 },
  tomato:     { initial: 0.6, vegetative: 0.80, flowering: 1.15, maturity: 0.80 },
  potato:     { initial: 0.5, vegetative: 0.80, flowering: 1.15, maturity: 0.75 },
};

// Moisture thresholds the engine targets when the pump has no per-pump
// overrides. Values are volumetric soil moisture (% of saturation).
const CROP_MOISTURE = {
  default:   { min: 35, max: 70, maxHoursBetweenRuns: 36 },
  wheat:     { min: 30, max: 65, maxHoursBetweenRuns: 48 },
  rice:      { min: 60, max: 95, maxHoursBetweenRuns: 12 },
  maize:     { min: 35, max: 70, maxHoursBetweenRuns: 36 },
  cotton:    { min: 30, max: 65, maxHoursBetweenRuns: 48 },
  sugarcane: { min: 40, max: 75, maxHoursBetweenRuns: 24 },
  tomato:    { min: 45, max: 75, maxHoursBetweenRuns: 24 },
  potato:    { min: 45, max: 75, maxHoursBetweenRuns: 24 },
};

// Soil hydraulic properties (% volumetric).
// Field capacity = upper limit of plant-available water.
// Wilting point  = lower limit (below this, plants wilt).
const SOIL_PROPS = {
  default:  { fieldCapacity: 30, wiltingPoint: 12 },
  sandy:    { fieldCapacity: 12, wiltingPoint: 4  },
  loamy:    { fieldCapacity: 28, wiltingPoint: 12 },
  clay:     { fieldCapacity: 40, wiltingPoint: 20 },
  silty:    { fieldCapacity: 32, wiltingPoint: 14 },
  alluvial: { fieldCapacity: 30, wiltingPoint: 13 },
  black:    { fieldCapacity: 38, wiltingPoint: 18 }, // regur / vertisol
  red:      { fieldCapacity: 20, wiltingPoint: 8  },
  laterite: { fieldCapacity: 18, wiltingPoint: 7  },
};

function kcFor(cropName, stage) {
  const key = (cropName || '').toLowerCase();
  const table = CROP_KC[key] || CROP_KC.default;
  return table[stage] ?? table.vegetative;
}

function moistureFor(cropName) {
  const key = (cropName || '').toLowerCase();
  return CROP_MOISTURE[key] || CROP_MOISTURE.default;
}

function soilFor(soilType) {
  const key = (soilType || '').toLowerCase();
  return SOIL_PROPS[key] || SOIL_PROPS.default;
}

module.exports = { CROP_KC, CROP_MOISTURE, SOIL_PROPS, kcFor, moistureFor, soilFor };
