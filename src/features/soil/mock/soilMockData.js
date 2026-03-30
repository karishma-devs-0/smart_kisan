// Soil crops with icons for the crop selector
export const SOIL_CROPS = [
  { id: '1', name: 'Rice', icon: 'grain', color: '#8BC34A' },
  { id: '2', name: 'Wheat', icon: 'barley', color: '#FFC107' },
  { id: '3', name: 'Tomato', icon: 'food-apple', color: '#F44336' },
  { id: '4', name: 'Potato', icon: 'food-apple', color: '#795548' },
  { id: '5', name: 'Cotton', icon: 'flower', color: '#E0E0E0' },
  { id: '6', name: 'Maize', icon: 'corn', color: '#FFEB3B' },
  { id: '7', name: 'Sugarcane', icon: 'grass', color: '#66BB6A' },
  { id: '8', name: 'Mustard', icon: 'flower-tulip', color: '#FFD600' },
  { id: '9', name: 'Onion', icon: 'circle-slice-8', color: '#CE93D8' },
  { id: '10', name: 'Chilli', icon: 'chili-hot', color: '#E53935' },
  { id: '11', name: 'Soybean', icon: 'seed', color: '#A1887F' },
  { id: '12', name: 'Groundnut', icon: 'peanut', color: '#D4A373' },
];

// Optimal soil ranges per crop
export const CROP_SOIL_RANGES = {
  Rice: { pH: [5.5, 6.5], moisture: [60, 80], nitrogen: [40, 60], phosphorus: [20, 40], potassium: [20, 40], temp: [22, 32] },
  Wheat: { pH: [6.0, 7.5], moisture: [40, 60], nitrogen: [35, 55], phosphorus: [20, 35], potassium: [20, 35], temp: [15, 25] },
  Tomato: { pH: [6.0, 6.8], moisture: [50, 70], nitrogen: [40, 60], phosphorus: [30, 50], potassium: [30, 50], temp: [20, 30] },
  Potato: { pH: [5.0, 6.0], moisture: [50, 65], nitrogen: [40, 55], phosphorus: [30, 45], potassium: [35, 55], temp: [15, 22] },
  Cotton: { pH: [6.0, 7.5], moisture: [35, 55], nitrogen: [30, 50], phosphorus: [20, 35], potassium: [20, 40], temp: [25, 35] },
  Maize: { pH: [5.8, 7.0], moisture: [45, 65], nitrogen: [40, 60], phosphorus: [25, 40], potassium: [25, 45], temp: [21, 30] },
  Sugarcane: { pH: [6.0, 7.5], moisture: [55, 75], nitrogen: [45, 65], phosphorus: [25, 40], potassium: [30, 50], temp: [25, 35] },
  Mustard: { pH: [6.0, 7.0], moisture: [30, 50], nitrogen: [30, 45], phosphorus: [20, 35], potassium: [15, 30], temp: [15, 25] },
  Onion: { pH: [6.0, 7.0], moisture: [40, 60], nitrogen: [35, 50], phosphorus: [25, 40], potassium: [20, 35], temp: [15, 25] },
  Chilli: { pH: [6.0, 7.0], moisture: [45, 65], nitrogen: [35, 55], phosphorus: [25, 40], potassium: [25, 40], temp: [20, 30] },
  Soybean: { pH: [6.0, 7.0], moisture: [40, 60], nitrogen: [20, 40], phosphorus: [20, 35], potassium: [20, 35], temp: [20, 30] },
  Groundnut: { pH: [5.5, 7.0], moisture: [35, 55], nitrogen: [20, 40], phosphorus: [20, 35], potassium: [20, 35], temp: [25, 35] },
};

export const MOCK_SOIL_CURRENT = {
  moisture: 45,
  temperature: 28,
  pH: 6.5,
  nitrogen: 45,
  phosphorus: 30,
  potassium: 25,
  ec: 1.2,
  organicCarbon: 0.65,
  texture: 'Loamy',
  healthScore: 72,
};

// Soil readings history (manual entries)
export const MOCK_SOIL_READINGS = [
  { id: '1', date: '2026-03-15', field: 'Field A', moisture: 48, pH: 6.3, nitrogen: 42, phosphorus: 28, potassium: 23, source: 'sensor' },
  { id: '2', date: '2026-03-10', field: 'Field A', moisture: 44, pH: 6.5, nitrogen: 45, phosphorus: 30, potassium: 25, source: 'manual' },
  { id: '3', date: '2026-03-05', field: 'Field B', moisture: 52, pH: 6.8, nitrogen: 50, phosphorus: 35, potassium: 30, source: 'lab' },
];

export const MOCK_MOISTURE_HISTORY = [
  { date: '2024-12-01', value: 42 },
  { date: '2024-12-02', value: 45 },
  { date: '2024-12-03', value: 48 },
  { date: '2024-12-04', value: 40 },
  { date: '2024-12-05', value: 52 },
  { date: '2024-12-06', value: 55 },
  { date: '2024-12-07', value: 47 },
];

export const MOCK_PH_HISTORY = [
  { date: '2024-12-01', value: 6.3 },
  { date: '2024-12-02', value: 6.5 },
  { date: '2024-12-03', value: 6.7 },
  { date: '2024-12-04', value: 6.0 },
  { date: '2024-12-05', value: 6.8 },
  { date: '2024-12-06', value: 7.0 },
  { date: '2024-12-07', value: 6.5 },
];

export const MOCK_NPK_HISTORY = [
  { date: '2024-12-01', n: 40, p: 28, k: 22 },
  { date: '2024-12-02', n: 42, p: 30, k: 24 },
  { date: '2024-12-03', n: 45, p: 32, k: 26 },
  { date: '2024-12-04', n: 43, p: 29, k: 23 },
  { date: '2024-12-05', n: 47, p: 31, k: 27 },
  { date: '2024-12-06', n: 48, p: 33, k: 28 },
  { date: '2024-12-07', n: 45, p: 30, k: 25 },
];

export const MOCK_FERTILIZER_HISTORY = [
  { date: '2024-12-01', value: 12 },
  { date: '2024-12-02', value: 15 },
  { date: '2024-12-03', value: 10 },
  { date: '2024-12-04', value: 18 },
  { date: '2024-12-05', value: 14 },
  { date: '2024-12-06', value: 20 },
  { date: '2024-12-07', value: 16 },
];
