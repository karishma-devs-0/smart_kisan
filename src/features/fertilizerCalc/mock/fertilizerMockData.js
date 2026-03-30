// Nutrient uptake factors: kg of N, P2O5, K2O removed per quintal of produce
export const CROP_NUTRIENT_FACTORS = {
  rice: { n: 1.8, p: 0.8, k: 1.5 },
  wheat: { n: 2.0, p: 0.9, k: 1.2 },
  maize: { n: 2.5, p: 1.0, k: 2.0 },
  cotton: { n: 1.5, p: 0.7, k: 1.8 },
  sugarcane: { n: 0.8, p: 0.4, k: 1.0 },
  soybean: { n: 3.0, p: 0.7, k: 1.4 },
  tomato: { n: 1.2, p: 0.5, k: 1.6 },
  potato: { n: 1.0, p: 0.4, k: 1.5 },
};

// Fertilizer prices per 50 kg bag (INR)
export const FERTILIZER_PRICES = {
  urea: 270,     // per 50 kg bag
  dap: 1350,     // per 50 kg bag
  mop: 870,      // per 50 kg bag
};

// Nutrient content in fertilizers
export const FERTILIZER_NUTRIENT_CONTENT = {
  urea: { n: 0.46 },         // 46% N
  dap: { n: 0.18, p: 0.46 }, // 18% N + 46% P2O5
  mop: { k: 0.60 },          // 60% K2O
};

// Application schedule: percentage of total at each stage
export const APPLICATION_SCHEDULE = {
  rice: { basal: 50, firstTopDressing: 25, secondTopDressing: 25 },
  wheat: { basal: 50, firstTopDressing: 25, secondTopDressing: 25 },
  maize: { basal: 33, firstTopDressing: 34, secondTopDressing: 33 },
  cotton: { basal: 40, firstTopDressing: 30, secondTopDressing: 30 },
  sugarcane: { basal: 30, firstTopDressing: 35, secondTopDressing: 35 },
  soybean: { basal: 100, firstTopDressing: 0, secondTopDressing: 0 },
  tomato: { basal: 40, firstTopDressing: 30, secondTopDressing: 30 },
  potato: { basal: 50, firstTopDressing: 50, secondTopDressing: 0 },
};
