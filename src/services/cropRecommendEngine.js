/**
 * Crop Recommendation Engine
 *
 * Rule-based scoring algorithm that evaluates crop suitability based on:
 * - Soil parameters: N, P, K, pH, organic carbon, texture
 * - Climate parameters: rainfall, temperature, humidity
 *
 * Each parameter contributes a weighted score. Final suitability = weighted average.
 */

// ─── Crop Database (50+ Indian crops with optimal ranges) ───────────────────

const CROP_DATABASE = [
  // ── Kharif (Monsoon: June–October) ──────────────────────────────────────
  {
    name: 'Rice (Paddy)', icon: 'rice', season: 'Kharif', growingDays: 120,
    waterRequirement: 'high', investmentPerHa: 45000, yieldRange: '18-22 quintals/ha',
    optimal: { n: [80, 300], p: [20, 60], k: [20, 60], ph: [5.5, 7.0], oc: [0.4, 1.5], rainfall: [1000, 2000], temp: [22, 32], humidity: [60, 90] },
    soilTextures: ['Loamy', 'Clay', 'Clayey', 'Silty'],
  },
  {
    name: 'Maize', icon: 'corn', season: 'Kharif', growingDays: 100,
    waterRequirement: 'medium', investmentPerHa: 32000, yieldRange: '25-30 quintals/ha',
    optimal: { n: [60, 250], p: [20, 50], k: [20, 50], ph: [5.8, 7.0], oc: [0.3, 1.2], rainfall: [600, 1200], temp: [21, 30], humidity: [50, 80] },
    soilTextures: ['Loamy', 'Sandy Loam', 'Silty'],
  },
  {
    name: 'Soybean', icon: 'seed', season: 'Kharif', growingDays: 95,
    waterRequirement: 'medium', investmentPerHa: 28000, yieldRange: '12-15 quintals/ha',
    optimal: { n: [15, 200], p: [20, 50], k: [20, 45], ph: [6.0, 7.0], oc: [0.4, 1.5], rainfall: [600, 1200], temp: [20, 30], humidity: [50, 80] },
    soilTextures: ['Loamy', 'Clay', 'Sandy Loam'],
  },
  {
    name: 'Cotton', icon: 'flower', season: 'Kharif', growingDays: 160,
    waterRequirement: 'medium', investmentPerHa: 50000, yieldRange: '8-12 quintals/ha',
    optimal: { n: [40, 200], p: [15, 45], k: [15, 50], ph: [6.0, 7.5], oc: [0.3, 1.0], rainfall: [500, 1000], temp: [25, 35], humidity: [40, 70] },
    soilTextures: ['Black', 'Loamy', 'Clay', 'Clayey'],
  },
  {
    name: 'Groundnut', icon: 'peanut', season: 'Kharif', growingDays: 110,
    waterRequirement: 'low', investmentPerHa: 30000, yieldRange: '10-15 quintals/ha',
    optimal: { n: [15, 150], p: [20, 50], k: [20, 45], ph: [5.5, 7.0], oc: [0.3, 1.0], rainfall: [500, 1000], temp: [25, 35], humidity: [50, 80] },
    soilTextures: ['Sandy', 'Sandy Loam', 'Loamy'],
  },
  {
    name: 'Jowar (Sorghum)', icon: 'grain', season: 'Kharif', growingDays: 110,
    waterRequirement: 'low', investmentPerHa: 20000, yieldRange: '15-20 quintals/ha',
    optimal: { n: [40, 180], p: [15, 40], k: [15, 40], ph: [6.0, 7.5], oc: [0.2, 0.8], rainfall: [400, 800], temp: [25, 35], humidity: [40, 70] },
    soilTextures: ['Loamy', 'Clay', 'Black', 'Sandy Loam'],
  },
  {
    name: 'Bajra (Pearl Millet)', icon: 'grain', season: 'Kharif', growingDays: 80,
    waterRequirement: 'low', investmentPerHa: 18000, yieldRange: '12-18 quintals/ha',
    optimal: { n: [30, 150], p: [10, 35], k: [10, 35], ph: [6.0, 7.5], oc: [0.2, 0.6], rainfall: [250, 600], temp: [25, 35], humidity: [30, 65] },
    soilTextures: ['Sandy', 'Sandy Loam', 'Loamy'],
  },
  {
    name: 'Sugarcane', icon: 'grass', season: 'Kharif', growingDays: 365,
    waterRequirement: 'high', investmentPerHa: 70000, yieldRange: '600-800 quintals/ha',
    optimal: { n: [80, 300], p: [20, 60], k: [30, 80], ph: [6.0, 7.5], oc: [0.4, 1.5], rainfall: [1000, 2000], temp: [25, 35], humidity: [60, 90] },
    soilTextures: ['Loamy', 'Clay', 'Clayey', 'Silty'],
  },
  {
    name: 'Jute', icon: 'grass', season: 'Kharif', growingDays: 120,
    waterRequirement: 'high', investmentPerHa: 25000, yieldRange: '20-25 quintals/ha',
    optimal: { n: [50, 200], p: [15, 40], k: [15, 40], ph: [5.5, 7.0], oc: [0.4, 1.5], rainfall: [1200, 2500], temp: [24, 35], humidity: [70, 95] },
    soilTextures: ['Loamy', 'Clay', 'Silty'],
  },
  {
    name: 'Sesame (Til)', icon: 'seed', season: 'Kharif', growingDays: 90,
    waterRequirement: 'low', investmentPerHa: 18000, yieldRange: '3-5 quintals/ha',
    optimal: { n: [20, 120], p: [15, 35], k: [10, 30], ph: [5.5, 7.5], oc: [0.3, 1.0], rainfall: [300, 700], temp: [25, 35], humidity: [40, 70] },
    soilTextures: ['Sandy Loam', 'Loamy', 'Sandy'],
  },
  {
    name: 'Turmeric', icon: 'leaf', season: 'Kharif', growingDays: 240,
    waterRequirement: 'medium', investmentPerHa: 55000, yieldRange: '200-250 quintals/ha',
    optimal: { n: [60, 250], p: [20, 50], k: [30, 60], ph: [5.5, 7.0], oc: [0.5, 2.0], rainfall: [800, 1500], temp: [20, 30], humidity: [60, 85] },
    soilTextures: ['Loamy', 'Sandy Loam', 'Clay'],
  },

  // ── Rabi (Winter: November–March) ──────────────────────────────────────
  {
    name: 'Wheat', icon: 'barley', season: 'Rabi', growingDays: 140,
    waterRequirement: 'low', investmentPerHa: 35000, yieldRange: '20-25 quintals/ha',
    optimal: { n: [60, 250], p: [20, 50], k: [20, 50], ph: [6.0, 7.5], oc: [0.3, 1.2], rainfall: [500, 1000], temp: [15, 25], humidity: [40, 70] },
    soilTextures: ['Loamy', 'Clay', 'Silty', 'Clayey'],
  },
  {
    name: 'Mustard', icon: 'flower-tulip', season: 'Rabi', growingDays: 110,
    waterRequirement: 'low', investmentPerHa: 25000, yieldRange: '8-12 quintals/ha',
    optimal: { n: [40, 180], p: [15, 40], k: [10, 35], ph: [6.0, 7.0], oc: [0.3, 1.0], rainfall: [300, 600], temp: [15, 25], humidity: [40, 65] },
    soilTextures: ['Loamy', 'Sandy Loam', 'Clay'],
  },
  {
    name: 'Chickpea (Chana)', icon: 'seed', season: 'Rabi', growingDays: 100,
    waterRequirement: 'low', investmentPerHa: 22000, yieldRange: '10-15 quintals/ha',
    optimal: { n: [15, 100], p: [20, 45], k: [15, 35], ph: [6.0, 7.5], oc: [0.3, 1.0], rainfall: [300, 600], temp: [15, 28], humidity: [35, 60] },
    soilTextures: ['Loamy', 'Sandy Loam', 'Clay'],
  },
  {
    name: 'Lentil (Masoor)', icon: 'seed-outline', season: 'Rabi', growingDays: 110,
    waterRequirement: 'low', investmentPerHa: 20000, yieldRange: '8-10 quintals/ha',
    optimal: { n: [10, 80], p: [20, 40], k: [15, 35], ph: [6.0, 7.0], oc: [0.3, 0.8], rainfall: [300, 600], temp: [15, 25], humidity: [35, 60] },
    soilTextures: ['Loamy', 'Sandy Loam'],
  },
  {
    name: 'Potato', icon: 'food-apple', season: 'Rabi', growingDays: 90,
    waterRequirement: 'medium', investmentPerHa: 60000, yieldRange: '200-300 quintals/ha',
    optimal: { n: [80, 250], p: [30, 60], k: [40, 80], ph: [5.0, 6.5], oc: [0.5, 1.5], rainfall: [500, 800], temp: [15, 22], humidity: [50, 75] },
    soilTextures: ['Sandy Loam', 'Loamy', 'Sandy'],
  },
  {
    name: 'Onion', icon: 'circle-slice-8', season: 'Rabi', growingDays: 130,
    waterRequirement: 'medium', investmentPerHa: 55000, yieldRange: '200-300 quintals/ha',
    optimal: { n: [50, 200], p: [25, 50], k: [20, 45], ph: [6.0, 7.0], oc: [0.4, 1.0], rainfall: [400, 800], temp: [15, 25], humidity: [50, 70] },
    soilTextures: ['Loamy', 'Sandy Loam', 'Silty'],
  },
  {
    name: 'Barley', icon: 'barley', season: 'Rabi', growingDays: 120,
    waterRequirement: 'low', investmentPerHa: 22000, yieldRange: '15-20 quintals/ha',
    optimal: { n: [40, 180], p: [15, 35], k: [15, 35], ph: [6.5, 8.0], oc: [0.2, 0.8], rainfall: [300, 600], temp: [12, 22], humidity: [35, 60] },
    soilTextures: ['Loamy', 'Sandy Loam', 'Sandy'],
  },
  {
    name: 'Sunflower', icon: 'white-balance-sunny', season: 'Rabi', growingDays: 90,
    waterRequirement: 'medium', investmentPerHa: 30000, yieldRange: '10-15 quintals/ha',
    optimal: { n: [40, 180], p: [20, 45], k: [20, 45], ph: [6.0, 7.5], oc: [0.3, 1.0], rainfall: [400, 800], temp: [18, 28], humidity: [40, 65] },
    soilTextures: ['Loamy', 'Sandy Loam', 'Clay'],
  },
  {
    name: 'Pea', icon: 'seed', season: 'Rabi', growingDays: 80,
    waterRequirement: 'low', investmentPerHa: 25000, yieldRange: '50-80 quintals/ha',
    optimal: { n: [15, 100], p: [20, 45], k: [15, 40], ph: [6.0, 7.5], oc: [0.4, 1.2], rainfall: [400, 700], temp: [10, 22], humidity: [50, 70] },
    soilTextures: ['Loamy', 'Sandy Loam', 'Silty'],
  },

  // ── Zaid (Summer: March–June) ──────────────────────────────────────────
  {
    name: 'Mung Bean (Moong)', icon: 'seed-outline', season: 'Zaid', growingDays: 65,
    waterRequirement: 'low', investmentPerHa: 18000, yieldRange: '6-8 quintals/ha',
    optimal: { n: [15, 100], p: [15, 35], k: [15, 35], ph: [6.0, 7.5], oc: [0.3, 0.8], rainfall: [300, 600], temp: [25, 35], humidity: [40, 65] },
    soilTextures: ['Loamy', 'Sandy Loam'],
  },
  {
    name: 'Watermelon', icon: 'fruit-watermelon', season: 'Zaid', growingDays: 80,
    waterRequirement: 'high', investmentPerHa: 40000, yieldRange: '300-400 quintals/ha',
    optimal: { n: [50, 200], p: [25, 50], k: [25, 50], ph: [6.0, 7.0], oc: [0.3, 1.0], rainfall: [200, 600], temp: [25, 35], humidity: [40, 70] },
    soilTextures: ['Sandy', 'Sandy Loam', 'Loamy'],
  },
  {
    name: 'Cucumber', icon: 'food-apple-outline', season: 'Zaid', growingDays: 60,
    waterRequirement: 'high', investmentPerHa: 35000, yieldRange: '150-200 quintals/ha',
    optimal: { n: [40, 150], p: [25, 50], k: [25, 50], ph: [6.0, 7.0], oc: [0.4, 1.2], rainfall: [300, 700], temp: [22, 30], humidity: [50, 75] },
    soilTextures: ['Loamy', 'Sandy Loam'],
  },
  {
    name: 'Bitter Gourd', icon: 'leaf', season: 'Zaid', growingDays: 55,
    waterRequirement: 'medium', investmentPerHa: 30000, yieldRange: '100-150 quintals/ha',
    optimal: { n: [40, 160], p: [25, 50], k: [25, 50], ph: [6.0, 7.0], oc: [0.4, 1.5], rainfall: [300, 700], temp: [24, 33], humidity: [50, 80] },
    soilTextures: ['Loamy', 'Sandy Loam', 'Clay'],
  },

  // ── Year-round Vegetables ──────────────────────────────────────────────
  {
    name: 'Tomato', icon: 'food-apple', season: 'Rabi', growingDays: 90,
    waterRequirement: 'medium', investmentPerHa: 55000, yieldRange: '200-300 quintals/ha',
    optimal: { n: [80, 250], p: [30, 60], k: [30, 60], ph: [6.0, 7.0], oc: [0.5, 1.5], rainfall: [400, 800], temp: [20, 30], humidity: [50, 75] },
    soilTextures: ['Loamy', 'Sandy Loam', 'Silty'],
  },
  {
    name: 'Chilli', icon: 'chili-hot', season: 'Kharif', growingDays: 150,
    waterRequirement: 'medium', investmentPerHa: 50000, yieldRange: '80-100 quintals/ha',
    optimal: { n: [60, 220], p: [25, 50], k: [25, 50], ph: [6.0, 7.0], oc: [0.4, 1.2], rainfall: [600, 1200], temp: [20, 30], humidity: [50, 75] },
    soilTextures: ['Loamy', 'Sandy Loam', 'Clay'],
  },
  {
    name: 'Brinjal (Eggplant)', icon: 'food-apple', season: 'Kharif', growingDays: 120,
    waterRequirement: 'medium', investmentPerHa: 45000, yieldRange: '250-350 quintals/ha',
    optimal: { n: [60, 200], p: [25, 50], k: [25, 50], ph: [5.5, 6.5], oc: [0.4, 1.5], rainfall: [500, 1000], temp: [22, 30], humidity: [50, 80] },
    soilTextures: ['Loamy', 'Sandy Loam', 'Clay'],
  },
  {
    name: 'Cabbage', icon: 'leaf', season: 'Rabi', growingDays: 90,
    waterRequirement: 'medium', investmentPerHa: 40000, yieldRange: '200-300 quintals/ha',
    optimal: { n: [60, 200], p: [30, 50], k: [30, 50], ph: [6.0, 7.0], oc: [0.4, 1.2], rainfall: [400, 700], temp: [15, 22], humidity: [60, 80] },
    soilTextures: ['Loamy', 'Clay', 'Silty'],
  },
  {
    name: 'Cauliflower', icon: 'flower', season: 'Rabi', growingDays: 90,
    waterRequirement: 'medium', investmentPerHa: 45000, yieldRange: '150-250 quintals/ha',
    optimal: { n: [60, 200], p: [30, 50], k: [30, 50], ph: [6.0, 7.0], oc: [0.4, 1.2], rainfall: [400, 700], temp: [15, 22], humidity: [60, 80] },
    soilTextures: ['Loamy', 'Silty', 'Clay'],
  },
  {
    name: 'Garlic', icon: 'seed', season: 'Rabi', growingDays: 140,
    waterRequirement: 'low', investmentPerHa: 50000, yieldRange: '60-80 quintals/ha',
    optimal: { n: [50, 180], p: [25, 50], k: [25, 50], ph: [6.0, 7.0], oc: [0.4, 1.0], rainfall: [300, 600], temp: [13, 22], humidity: [40, 65] },
    soilTextures: ['Loamy', 'Sandy Loam'],
  },
  {
    name: 'Carrot', icon: 'carrot', season: 'Rabi', growingDays: 80,
    waterRequirement: 'medium', investmentPerHa: 35000, yieldRange: '150-200 quintals/ha',
    optimal: { n: [40, 150], p: [25, 45], k: [25, 45], ph: [6.0, 7.0], oc: [0.4, 1.2], rainfall: [400, 700], temp: [15, 22], humidity: [50, 70] },
    soilTextures: ['Sandy Loam', 'Loamy', 'Sandy'],
  },
];

// ─── Scoring Weights ────────────────────────────────────────────────────────

const WEIGHTS = {
  nitrogen: 0.15,
  phosphorus: 0.10,
  potassium: 0.10,
  ph: 0.15,
  organicCarbon: 0.05,
  texture: 0.10,
  rainfall: 0.10,
  temperature: 0.15,
  humidity: 0.10,
};

// ─── Scoring Functions ──────────────────────────────────────────────────────

/**
 * Score how well a value falls within an optimal range.
 * Returns 0-100:
 *  - 100 if within range
 *  - Linearly decreasing as value moves outside range
 *  - 0 if more than 100% outside range
 */
function rangeScore(value, [min, max]) {
  if (value >= min && value <= max) return 100;

  const rangeWidth = max - min;
  const tolerance = rangeWidth * 0.5; // 50% tolerance outside range

  if (value < min) {
    const deficit = min - value;
    return Math.max(0, 100 - (deficit / tolerance) * 100);
  }
  // value > max
  const excess = value - max;
  return Math.max(0, 100 - (excess / tolerance) * 100);
}

/**
 * Score soil texture match (binary with partial credit).
 */
function textureScore(actual, idealTextures) {
  if (!actual) return 50; // unknown texture gets average score
  if (idealTextures.includes(actual)) return 100;
  // Partial credit for related textures
  const related = {
    'Loamy': ['Sandy Loam', 'Silty', 'Clay'],
    'Sandy Loam': ['Loamy', 'Sandy'],
    'Sandy': ['Sandy Loam'],
    'Clay': ['Loamy', 'Clayey', 'Black'],
    'Clayey': ['Clay', 'Black'],
    'Black': ['Clay', 'Clayey'],
    'Silty': ['Loamy', 'Clay'],
  };
  const relatedTextures = related[actual] || [];
  if (idealTextures.some((t) => relatedTextures.includes(t))) return 60;
  return 20;
}

/**
 * Generate human-readable reasons for the recommendation.
 */
function generateReasons(crop, soilParams, climateParams) {
  const reasons = [];
  const opt = crop.optimal;

  // Nitrogen
  if (soilParams.nitrogen >= opt.n[0] && soilParams.nitrogen <= opt.n[1]) {
    reasons.push(`Nitrogen level (${soilParams.nitrogen} kg/ha) is ideal for ${crop.name}`);
  } else if (soilParams.nitrogen < opt.n[0]) {
    reasons.push(`Nitrogen (${soilParams.nitrogen} kg/ha) is below optimal — consider urea supplementation`);
  }

  // pH
  if (soilParams.ph >= opt.ph[0] && soilParams.ph <= opt.ph[1]) {
    reasons.push(`Soil pH ${soilParams.ph} is within the optimal range (${opt.ph[0]}-${opt.ph[1]})`);
  }

  // Temperature
  if (climateParams.avgTemp >= opt.temp[0] && climateParams.avgTemp <= opt.temp[1]) {
    reasons.push(`Average temperature (${climateParams.avgTemp}°C) suits ${crop.name} growth`);
  } else if (climateParams.avgTemp > opt.temp[1]) {
    reasons.push(`Temperature (${climateParams.avgTemp}°C) is above optimal — heat-tolerant varieties recommended`);
  }

  // Rainfall
  if (climateParams.rainfall >= opt.rainfall[0] && climateParams.rainfall <= opt.rainfall[1]) {
    reasons.push(`Rainfall (${climateParams.rainfall} mm) meets the crop's water requirements`);
  } else if (climateParams.rainfall < opt.rainfall[0]) {
    reasons.push(`Rainfall (${climateParams.rainfall} mm) is low — supplemental irrigation needed`);
  }

  // Texture
  if (soilParams.texture && crop.soilTextures.includes(soilParams.texture)) {
    reasons.push(`${soilParams.texture} soil texture is well-suited for ${crop.name}`);
  }

  // P & K
  if (soilParams.phosphorus >= opt.p[0] && soilParams.potassium >= opt.k[0]) {
    reasons.push(`Phosphorus (${soilParams.phosphorus}) and potassium (${soilParams.potassium}) levels support healthy growth`);
  }

  // Organic carbon
  if (soilParams.organicCarbon && soilParams.organicCarbon >= (opt.oc?.[0] || 0.3)) {
    reasons.push(`Good organic carbon content (${soilParams.organicCarbon}%) supports soil biology`);
  }

  // If few reasons, add a generic one
  if (reasons.length < 3) {
    reasons.push(`${crop.season} season crop with ${crop.growingDays}-day growing cycle`);
  }

  return reasons.slice(0, 5);
}

// ─── Main Engine ────────────────────────────────────────────────────────────

/**
 * Calculate crop recommendations based on soil and climate parameters.
 *
 * @param {Object} soilParams   - { nitrogen, phosphorus, potassium, ph, organicCarbon, texture }
 * @param {Object} climateParams - { rainfall, avgTemp, humidity }
 * @returns {Array} Sorted array of recommendations (highest suitability first)
 */
export function calculateRecommendations(soilParams, climateParams) {
  const results = CROP_DATABASE.map((crop) => {
    const opt = crop.optimal;

    const scores = {
      nitrogen: rangeScore(soilParams.nitrogen || 0, opt.n),
      phosphorus: rangeScore(soilParams.phosphorus || 0, opt.p),
      potassium: rangeScore(soilParams.potassium || 0, opt.k),
      ph: rangeScore(soilParams.ph || 7, opt.ph),
      organicCarbon: rangeScore(soilParams.organicCarbon || 0.5, opt.oc || [0.2, 1.5]),
      texture: textureScore(soilParams.texture, crop.soilTextures),
      rainfall: rangeScore(climateParams.rainfall || 800, opt.rainfall),
      temperature: rangeScore(climateParams.avgTemp || 25, opt.temp),
      humidity: rangeScore(climateParams.humidity || 60, opt.humidity),
    };

    // Weighted average
    let totalScore = 0;
    let totalWeight = 0;
    for (const [key, weight] of Object.entries(WEIGHTS)) {
      totalScore += (scores[key] || 50) * weight;
      totalWeight += weight;
    }

    const suitabilityScore = Math.round(totalScore / totalWeight);

    // Risk level based on score
    let riskLevel = 'high';
    if (suitabilityScore >= 75) riskLevel = 'low';
    else if (suitabilityScore >= 55) riskLevel = 'medium';

    return {
      id: crop.name.replace(/[^a-zA-Z]/g, '_').toLowerCase(),
      cropName: crop.name,
      icon: crop.icon,
      suitabilityScore,
      expectedYield: crop.yieldRange,
      investmentPerHa: crop.investmentPerHa,
      riskLevel,
      season: crop.season,
      waterRequirement: crop.waterRequirement,
      growingDays: crop.growingDays,
      reasons: generateReasons(crop, soilParams, climateParams),
    };
  });

  // Sort by suitability (highest first) and return top 10
  results.sort((a, b) => b.suitabilityScore - a.suitabilityScore);
  return results.filter((r) => r.suitabilityScore >= 30).slice(0, 10);
}
