import { mockDelay } from '../utils/mockDelay';

import { MOCK_USER, MOCK_TOKEN } from '../features/auth/mock/authMockData';
import {
  MOCK_PUMPS,
  MOCK_PUMP_GROUPS,
} from '../features/pumps/mock/pumpsMockData';
import { MOCK_CROPS } from '../features/crops/mock/cropsMockData';
import {
  MOCK_SOIL_CURRENT,
  MOCK_MOISTURE_HISTORY,
  MOCK_PH_HISTORY,
  MOCK_NPK_HISTORY,
  MOCK_FERTILIZER_HISTORY,
} from '../features/soil/mock/soilMockData';
import {
  MOCK_CURRENT_WEATHER,
  MOCK_FORECAST,
  MOCK_HISTORICAL_YESTERDAY,
  MOCK_HISTORICAL_WEEK,
  MOCK_WIND_HISTORY,
  MOCK_HUMIDITY_HISTORY,
} from '../features/weather/mock/weatherMockData';
import {
  MOCK_WATER_USAGE,
  MOCK_RUN_HOURS,
  MOCK_PUMP_RUNTIME,
  MOCK_SOIL_CONDITION,
  MOCK_HARVEST_PERFORMANCE,
  MOCK_GENERAL_METRICS,
} from '../features/reports/mock/reportsMockData';
import { MOCK_DEVICES } from '../features/devices/mock/devicesMockData';
import {
  MOCK_CROP_HEALTH,
  MOCK_AI_INSIGHTS,
  MOCK_NDVI_DATA,
  MOCK_YIELD_PREDICTION,
  MOCK_IRRIGATION_SCHEDULE,
  MOCK_EXPERT_NETWORK,
} from '../features/analytics/mock/analyticsMockData';
import { MOCK_FARM_TASKS, MOCK_FARM_CATEGORIES, MOCK_GROWTH_TRENDS } from '../features/farm/mock/farmMockData';
import { MOCK_FIELDS, MOCK_FIELD_GROWTH_DATA } from '../features/fields/mock/fieldsMockData';

// ─── Auth Service ────────────────────────────────────────────────────────────

export const authService = {
  loginWithEmail: async (email, password) => {
    await mockDelay(800);
    if (email === 'rajesh@example.com' && password === 'password') {
      return { user: MOCK_USER, token: MOCK_TOKEN };
    }
    throw new Error('Invalid email or password');
  },

  loginWithPhone: async (phone, otp) => {
    await mockDelay(800);
    if (otp === '123456') {
      return { user: MOCK_USER, token: MOCK_TOKEN };
    }
    throw new Error('Invalid OTP');
  },

  loginWithUsername: async (username, password) => {
    await mockDelay(800);
    if (username === 'rajesh' && password === 'password') {
      return { user: MOCK_USER, token: MOCK_TOKEN };
    }
    throw new Error('Invalid username or password');
  },

  register: async (userData) => {
    await mockDelay(1000);
    return {
      user: { ...MOCK_USER, ...userData, id: Date.now().toString() },
      token: MOCK_TOKEN,
    };
  },

  logout: async () => {
    await mockDelay(300);
    return { success: true };
  },
};

// ─── Pump Service ────────────────────────────────────────────────────────────

export const pumpService = {
  fetchPumps: async () => {
    await mockDelay(600);
    return [...MOCK_PUMPS];
  },

  fetchGroups: async () => {
    await mockDelay(600);
    return [...MOCK_PUMP_GROUPS];
  },

  savePump: async (pump) => {
    await mockDelay(500);
    return { ...pump };
  },

  saveGroup: async (group) => {
    await mockDelay(500);
    return { ...group };
  },
};

// ─── Crop Service ────────────────────────────────────────────────────────────

export const cropService = {
  fetchCrops: async () => {
    await mockDelay(600);
    return [...MOCK_CROPS];
  },

  addCrop: async (crop) => {
    await mockDelay(500);
    return { ...crop, id: Date.now().toString() };
  },

  updateCrop: async (crop) => {
    await mockDelay(500);
    return { ...crop };
  },

  deleteCrop: async (id) => {
    await mockDelay(400);
    return { id };
  },
};

// ─── Soil Service ────────────────────────────────────────────────────────────

export const soilService = {
  fetchSoilData: async () => {
    await mockDelay(600);
    return { ...MOCK_SOIL_CURRENT };
  },

  fetchMoistureHistory: async () => {
    await mockDelay(500);
    return [...MOCK_MOISTURE_HISTORY];
  },

  fetchPhHistory: async () => {
    await mockDelay(500);
    return [...MOCK_PH_HISTORY];
  },

  fetchNpkHistory: async () => {
    await mockDelay(500);
    return [...MOCK_NPK_HISTORY];
  },

  fetchFertilizerHistory: async () => {
    await mockDelay(500);
    return [...MOCK_FERTILIZER_HISTORY];
  },
};

// ─── Weather Service ─────────────────────────────────────────────────────────

export const weatherService = {
  fetchCurrentWeather: async () => {
    await mockDelay(600);
    return { ...MOCK_CURRENT_WEATHER };
  },

  fetchForecast: async () => {
    await mockDelay(600);
    return [...MOCK_FORECAST];
  },

  fetchHistoricalWeather: async () => {
    await mockDelay(700);
    return {
      yesterday: { ...MOCK_HISTORICAL_YESTERDAY },
      week: [...MOCK_HISTORICAL_WEEK],
    };
  },

  fetchWindHistory: async () => {
    await mockDelay(500);
    return [...MOCK_WIND_HISTORY];
  },

  fetchHumidityHistory: async () => {
    await mockDelay(500);
    return [...MOCK_HUMIDITY_HISTORY];
  },
};

// ─── Report Service ──────────────────────────────────────────────────────────

export const reportService = {
  fetchReports: async () => {
    await mockDelay(800);
    return {
      waterUsage: { ...MOCK_WATER_USAGE },
      runHours: { ...MOCK_RUN_HOURS },
      pumpRuntime: [...MOCK_PUMP_RUNTIME],
      soilCondition: { ...MOCK_SOIL_CONDITION },
      harvestPerformance: { ...MOCK_HARVEST_PERFORMANCE },
      generalMetrics: { ...MOCK_GENERAL_METRICS },
    };
  },
};

// ─── Device Service ─────────────────────────────────────────────────────────

export const deviceService = {
  fetchDevices: async () => {
    await mockDelay(600);
    return [...MOCK_DEVICES];
  },
};

// ─── Analytics Service ──────────────────────────────────────────────────────

export const analyticsService = {
  fetchAnalytics: async () => {
    await mockDelay(800);
    return {
      cropHealth: { ...MOCK_CROP_HEALTH },
      aiInsights: [...MOCK_AI_INSIGHTS],
      ndviData: { ...MOCK_NDVI_DATA },
      yieldPrediction: { ...MOCK_YIELD_PREDICTION },
      irrigationSchedule: [...MOCK_IRRIGATION_SCHEDULE],
      expertNetwork: [...MOCK_EXPERT_NETWORK],
    };
  },
};

// ─── Farm Service ───────────────────────────────────────────────────────────

export const farmService = {
  fetchFarmData: async () => {
    await mockDelay(600);
    return {
      tasks: [...MOCK_FARM_TASKS],
      categories: [...MOCK_FARM_CATEGORIES],
      growthTrends: [...MOCK_GROWTH_TRENDS],
    };
  },
};

// ─── Fields Service ─────────────────────────────────────────────────────────

export const fieldsService = {
  fetchFields: async () => {
    await mockDelay(600);
    return {
      fields: [...MOCK_FIELDS],
      growthData: [...MOCK_FIELD_GROWTH_DATA],
    };
  },
};
