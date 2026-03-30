import { mockDelay } from '../utils/mockDelay';
import cache from './cache';
import { FIREBASE_ENABLED, auth as firebaseAuth } from './firebase';
import { HUGGINGFACE_SPACE_URL } from '../config/firebase.config';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  GoogleAuthProvider,
  signInWithCredential,
} from 'firebase/auth';
import * as weatherAPI from './weather';

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
  SOIL_CROPS,
  MOCK_SOIL_READINGS,
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
import { MOCK_LISTINGS, MOCK_MANDI_PRICES, MOCK_MY_LISTINGS } from '../features/marketplace/mock/marketplaceMockData';
import { MOCK_SCAN_HISTORY, MOCK_DISEASES } from '../features/diseaseDetection/mock/diseaseDetectionMockData';
import {
  MOCK_RECOMMENDATIONS,
  MOCK_SOIL_PARAMS,
  MOCK_CLIMATE_PARAMS,
} from '../features/cropRecommend/mock/cropRecommendMockData';

// Lazy-load firestoreService only when Firebase is enabled
let _firestoreService = null;
const getFirestore = () => {
  if (!_firestoreService) {
    _firestoreService = require('./firestore').firestoreService;
  }
  return _firestoreService;
};

// ─── Helper: extract user shape from Firebase user ──────────────────────────

const firebaseUserToAppUser = (fbUser) => ({
  id: fbUser.uid,
  name: fbUser.displayName || 'Farmer',
  email: fbUser.email,
  phone: fbUser.phoneNumber || '',
  avatar: fbUser.photoURL || null,
});

// ─── Auth Service ────────────────────────────────────────────────────────────

export const authService = {
  loginWithEmail: async (email, password) => {
    if (FIREBASE_ENABLED) {
      const credential = await signInWithEmailAndPassword(firebaseAuth, email, password);
      return {
        user: firebaseUserToAppUser(credential.user),
        token: await credential.user.getIdToken(),
      };
    }
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
    if (FIREBASE_ENABLED) {
      const email = `${username}@smartkisan.app`;
      return authService.loginWithEmail(email, password);
    }
    await mockDelay(800);
    if (username === 'rajesh' && password === 'password') {
      return { user: MOCK_USER, token: MOCK_TOKEN };
    }
    throw new Error('Invalid username or password');
  },

  register: async (userData) => {
    if (FIREBASE_ENABLED) {
      const credential = await createUserWithEmailAndPassword(
        firebaseAuth,
        userData.email,
        userData.password,
      );
      if (userData.name) {
        await updateProfile(credential.user, { displayName: userData.name });
      }
      return {
        user: firebaseUserToAppUser(credential.user),
        token: await credential.user.getIdToken(),
      };
    }
    await mockDelay(1000);
    return {
      user: { ...MOCK_USER, ...userData, id: Date.now().toString() },
      token: MOCK_TOKEN,
    };
  },

  loginWithGoogle: async (idToken) => {
    if (!FIREBASE_ENABLED) {
      throw new Error('Google Sign-In requires Firebase');
    }
    const credential = GoogleAuthProvider.credential(idToken);
    const result = await signInWithCredential(firebaseAuth, credential);
    return {
      user: firebaseUserToAppUser(result.user),
      token: await result.user.getIdToken(),
    };
  },

  logout: async () => {
    if (FIREBASE_ENABLED) {
      await signOut(firebaseAuth);
      return { success: true };
    }
    await mockDelay(300);
    return { success: true };
  },
};

// ─── Pump Service ────────────────────────────────────────────────────────────
// Uses backend REST APIs when Firebase is enabled, mock data otherwise

import { pumpAPI, pumpGroupAPI } from './backendApi';

export const pumpService = {
  fetchPumps: async () => {
    if (FIREBASE_ENABLED) {
      const data = await pumpAPI.fetchAll();
      return data.pumps;
    }
    await mockDelay(600);
    return [...MOCK_PUMPS];
  },

  fetchGroups: async () => {
    if (FIREBASE_ENABLED) {
      const data = await pumpGroupAPI.fetchAll();
      return data.groups;
    }
    await mockDelay(600);
    return [...MOCK_PUMP_GROUPS];
  },

  savePump: async (pump) => {
    if (FIREBASE_ENABLED) {
      if (pump.id) {
        return pumpAPI.update(pump.id, pump);
      }
      return pumpAPI.create(pump);
    }
    await mockDelay(500);
    return { ...pump };
  },

  saveGroup: async (group) => {
    if (FIREBASE_ENABLED) {
      if (group.id) {
        return pumpGroupAPI.update(group.id, group);
      }
      return pumpGroupAPI.create(group);
    }
    await mockDelay(500);
    return { ...group };
  },

  deletePump: async (pumpId) => {
    if (FIREBASE_ENABLED) {
      return pumpAPI.remove(pumpId);
    }
    await mockDelay(300);
    return { message: 'Pump deleted' };
  },

  deleteGroup: async (groupId) => {
    if (FIREBASE_ENABLED) {
      return pumpGroupAPI.remove(groupId);
    }
    await mockDelay(300);
    return { message: 'Group deleted' };
  },

  controlPump: async (pumpId, action) => {
    if (FIREBASE_ENABLED) {
      return pumpAPI.control(pumpId, action);
    }
    await mockDelay(300);
    return { id: pumpId, status: action, message: `Pump turned ${action}` };
  },

  setTimer: async (pumpId, durationSeconds) => {
    if (FIREBASE_ENABLED) {
      return pumpAPI.setTimer(pumpId, durationSeconds);
    }
    await mockDelay(300);
    return { id: pumpId, status: 'on', timer: { duration: durationSeconds } };
  },

  createSchedule: async (pumpId, schedule) => {
    if (FIREBASE_ENABLED) {
      return pumpAPI.createSchedule(pumpId, schedule);
    }
    await mockDelay(300);
    return { id: 'mock-schedule', pumpId, ...schedule };
  },

  fetchSchedules: async (pumpId) => {
    if (FIREBASE_ENABLED) {
      const data = await pumpAPI.fetchSchedules(pumpId);
      return data.schedules;
    }
    await mockDelay(300);
    return [];
  },

  deleteSchedule: async (pumpId, scheduleId) => {
    if (FIREBASE_ENABLED) {
      return pumpAPI.deleteSchedule(pumpId, scheduleId);
    }
    await mockDelay(300);
    return { message: 'Schedule deleted' };
  },

  fetchHistory: async (pumpId, limit = 50) => {
    if (FIREBASE_ENABLED) {
      const data = await pumpAPI.fetchHistory(pumpId, limit);
      return data.history;
    }
    await mockDelay(300);
    return [];
  },

  controlGroup: async (groupId, action) => {
    if (FIREBASE_ENABLED) {
      return pumpGroupAPI.control(groupId, action);
    }
    await mockDelay(500);
    return { groupId, action, message: `All pumps turned ${action}` };
  },

  stopAllPumps: async (pumpIds) => {
    if (FIREBASE_ENABLED) {
      const results = await Promise.all(
        pumpIds.map((id) => pumpAPI.control(id, 'off')),
      );
      return results;
    }
    await mockDelay(500);
    return pumpIds.map((id) => ({ id, status: 'off' }));
  },
};

// ─── Crop Service ────────────────────────────────────────────────────────────

export const cropService = {
  fetchCrops: async () => {
    if (FIREBASE_ENABLED) {
      return cache.remember('crops:all', () => getFirestore().getAll('crops'), 300);
    }
    await mockDelay(600);
    return [...MOCK_CROPS];
  },

  addCrop: async (crop) => {
    if (FIREBASE_ENABLED) {
      const result = await getFirestore().create('crops', crop);
      await cache.del('crops:all');
      return result;
    }
    await mockDelay(500);
    return { ...crop, id: Date.now().toString() };
  },

  updateCrop: async (crop) => {
    if (FIREBASE_ENABLED) {
      const result = await getFirestore().update('crops', crop.id, crop);
      await cache.del('crops:all');
      return result;
    }
    await mockDelay(500);
    return { ...crop };
  },

  deleteCrop: async (id) => {
    if (FIREBASE_ENABLED) {
      await getFirestore().remove('crops', id);
      await cache.del('crops:all');
      return { id };
    }
    await mockDelay(400);
    return { id };
  },
};

// ─── Soil Service ────────────────────────────────────────────────────────────

export const soilService = {
  fetchSoilData: async () => {
    if (FIREBASE_ENABLED) {
      return cache.remember('soil:current', () => getFirestore().getSingleton('soil', 'current'), 300);
    }
    await mockDelay(600);
    return {
      current: { ...MOCK_SOIL_CURRENT },
      soilCrops: SOIL_CROPS.slice(0, 5),
      soilReadings: [...MOCK_SOIL_READINGS],
    };
  },

  fetchMoistureHistory: async () => {
    if (FIREBASE_ENABLED) {
      return cache.remember('soil:moisture', () => getFirestore().getAll('soil_moisture'), 300);
    }
    await mockDelay(500);
    return [...MOCK_MOISTURE_HISTORY];
  },

  fetchPhHistory: async () => {
    if (FIREBASE_ENABLED) {
      return cache.remember('soil:ph', () => getFirestore().getAll('soil_ph'), 300);
    }
    await mockDelay(500);
    return [...MOCK_PH_HISTORY];
  },

  fetchNpkHistory: async () => {
    if (FIREBASE_ENABLED) {
      return cache.remember('soil:npk', () => getFirestore().getAll('soil_npk'), 300);
    }
    await mockDelay(500);
    return [...MOCK_NPK_HISTORY];
  },

  fetchFertilizerHistory: async () => {
    if (FIREBASE_ENABLED) {
      return cache.remember('soil:fertilizer', () => getFirestore().getAll('soil_fertilizer'), 300);
    }
    await mockDelay(500);
    return [...MOCK_FERTILIZER_HISTORY];
  },

  fetchSoilCrops: async () => {
    await mockDelay(300);
    return [...SOIL_CROPS];
  },

  addSoilReading: async (reading) => {
    await mockDelay(400);
    return { ...reading, id: Date.now().toString() };
  },

  deleteSoilReading: async (readingId) => {
    await mockDelay(300);
    return readingId;
  },
};

// ─── Weather Service (cached — TTL 30 min for current, 1 hr for forecasts) ──

export const weatherService = {
  fetchCurrentWeather: async (location) => {
    if (weatherAPI.isWeatherAPIEnabled() && location?.lat) {
      return cache.remember(`weather:current:${location.lat}:${location.lng}`, async () => {
        return weatherAPI.fetchCurrentWeather(location.lat, location.lng);
      }, 1800);
    }
    return cache.remember('weather:current', async () => {
      await mockDelay(600);
      return { ...MOCK_CURRENT_WEATHER };
    }, 1800);
  },

  fetchForecast: async (location) => {
    if (weatherAPI.isWeatherAPIEnabled() && location?.lat) {
      return cache.remember(`weather:forecast:${location.lat}:${location.lng}`, async () => {
        return weatherAPI.fetchForecast(location.lat, location.lng);
      }, 3600);
    }
    return cache.remember('weather:forecast', async () => {
      await mockDelay(600);
      return [...MOCK_FORECAST];
    }, 3600);
  },

  fetchHistoricalWeather: async () => {
    // Historical data not available on OWM free tier — always mock
    return cache.remember('weather:historical', async () => {
      await mockDelay(700);
      return {
        yesterday: { ...MOCK_HISTORICAL_YESTERDAY },
        week: [...MOCK_HISTORICAL_WEEK],
      };
    }, 3600);
  },

  fetchWindHistory: async (location) => {
    if (weatherAPI.isWeatherAPIEnabled() && location?.lat) {
      return cache.remember(`weather:wind:${location.lat}:${location.lng}`, async () => {
        return weatherAPI.fetchWindHistory(location.lat, location.lng);
      }, 1800);
    }
    return cache.remember('weather:wind', async () => {
      await mockDelay(500);
      return [...MOCK_WIND_HISTORY];
    }, 1800);
  },

  fetchHumidityHistory: async (location) => {
    if (weatherAPI.isWeatherAPIEnabled() && location?.lat) {
      return cache.remember(`weather:humidity:${location.lat}:${location.lng}`, async () => {
        return weatherAPI.fetchHumidityHistory(location.lat, location.lng);
      }, 1800);
    }
    return cache.remember('weather:humidity', async () => {
      await mockDelay(500);
      return [...MOCK_HUMIDITY_HISTORY];
    }, 1800);
  },
};

// ─── Report Service ──────────────────────────────────────────────────────────

export const reportService = {
  fetchReports: async () => {
    // Reports are computed/aggregated — keep mock for now, will connect to analytics later
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
    if (FIREBASE_ENABLED) {
      return cache.remember('devices:all', () => getFirestore().getAll('devices'), 300);
    }
    await mockDelay(600);
    return [...MOCK_DEVICES];
  },

  updateDevice: async (id, updates) => {
    if (FIREBASE_ENABLED) {
      const result = await getFirestore().update('devices', id, updates);
      await cache.del('devices:all');
      return result;
    }
    await mockDelay(500);
    return { id, ...updates };
  },
};

// ─── Analytics Service ──────────────────────────────────────────────────────

export const analyticsService = {
  fetchAnalytics: async () => {
    // Analytics are AI/ML computed — keep mock for now
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
    if (FIREBASE_ENABLED) {
      const [tasks, categories] = await Promise.all([
        cache.remember('farm:tasks', () => getFirestore().getAll('farm_tasks'), 300),
        cache.remember('farm:categories', async () => [...MOCK_FARM_CATEGORIES], 3600),
      ]);
      return {
        tasks,
        categories,
        growthTrends: [...MOCK_GROWTH_TRENDS],
      };
    }
    await mockDelay(600);
    return {
      tasks: [...MOCK_FARM_TASKS],
      categories: [...MOCK_FARM_CATEGORIES],
      growthTrends: [...MOCK_GROWTH_TRENDS],
    };
  },

  updateTask: async (id, updates) => {
    if (FIREBASE_ENABLED) {
      const result = await getFirestore().update('farm_tasks', id, updates);
      await cache.del('farm:tasks');
      return result;
    }
    await mockDelay(500);
    return { id, ...updates };
  },
};

// ─── Fields Service ─────────────────────────────────────────────────────────

export const fieldsService = {
  fetchFields: async () => {
    if (FIREBASE_ENABLED) {
      const fields = await cache.remember('fields:all', () => getFirestore().getAll('fields'), 300);
      return {
        fields,
        growthData: [...MOCK_FIELD_GROWTH_DATA],
      };
    }
    await mockDelay(600);
    return {
      fields: [...MOCK_FIELDS],
      growthData: [...MOCK_FIELD_GROWTH_DATA],
    };
  },

  updateField: async (id, updates) => {
    if (FIREBASE_ENABLED) {
      const result = await getFirestore().update('fields', id, updates);
      await cache.del('fields:all');
      return result;
    }
    await mockDelay(500);
    return { id, ...updates };
  },
};

// ─── Onboarding / Profile Service ───────────────────────────────────────────

export const onboardingService = {
  loadProfile: async () => {
    if (FIREBASE_ENABLED) {
      return getFirestore().getSingleton('profile', 'onboarding');
    }
    return null;
  },

  saveProfile: async (data) => {
    if (FIREBASE_ENABLED) {
      return getFirestore().setSingleton('profile', 'onboarding', {
        ...data,
        completedAt: new Date().toISOString(),
      });
    }
    return data;
  },
};

// ─── Disease Detection Service ──────────────────────────────────────────────

export const diseaseDetectionService = {
  scanImage: async (imageUri) => {
    // Try real AI model (HuggingFace Space)
    if (HUGGINGFACE_SPACE_URL) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        const formData = new FormData();
        formData.append('file', {
          uri: imageUri,
          type: 'image/jpeg',
          name: 'plant_image.jpg',
        });

        const response = await fetch(`${HUGGINGFACE_SPACE_URL}/predict`, {
          method: 'POST',
          body: formData,
          headers: { 'Content-Type': 'multipart/form-data' },
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const result = await response.json();

          const severity = result.is_healthy ? 'none'
            : result.confidence > 85 ? 'severe'
            : result.confidence > 60 ? 'moderate' : 'mild';

          return {
            id: Date.now().toString(),
            cropName: result.crop,
            imagePath: imageUri,
            disease: result.is_healthy ? 'Healthy' : result.disease,
            confidence: result.confidence,
            severity,
            date: new Date().toISOString().split('T')[0],
            symptoms: result.is_healthy ? [] : [`${result.disease} detected on ${result.crop} leaf`],
            treatments: result.is_healthy
              ? []
              : [
                  { type: 'chemical', name: result.treatment.split('.')[0], dosage: 'As recommended', method: result.treatment },
                  { type: 'organic', name: 'Neem Oil', dosage: '5 ml/L water', method: 'Spray on affected leaves early morning' },
                ],
            preventiveMeasures: result.is_healthy
              ? ['Continue regular monitoring']
              : ['Crop rotation', 'Use disease-resistant varieties', 'Ensure proper spacing'],
            top3: result.top3 || [],
            aiSource: 'huggingface',
          };
        }
      } catch (err) {
        clearTimeout(timeoutId);
        if (__DEV__) console.warn('AI model unavailable, using mock:', err.message);
      }
    }

    // Mock fallback when AI model is unavailable
    await mockDelay(1500);
    const crops = ['Tomato', 'Rice', 'Wheat', 'Cotton', 'Maize', 'Potato'];
    const isHealthy = Math.random() > 0.6;
    const matchedDisease = isHealthy
      ? null
      : MOCK_DISEASES[Math.floor(Math.random() * MOCK_DISEASES.length)];

    return {
      id: Date.now().toString(),
      cropName: matchedDisease ? matchedDisease.crop : crops[Math.floor(Math.random() * crops.length)],
      imagePath: imageUri,
      disease: isHealthy ? 'Healthy' : matchedDisease.name,
      confidence: isHealthy ? 95 + Math.floor(Math.random() * 5) : 75 + Math.floor(Math.random() * 20),
      severity: isHealthy ? 'none' : ['mild', 'moderate', 'severe'][Math.floor(Math.random() * 3)],
      date: new Date().toISOString().split('T')[0],
      symptoms: matchedDisease ? matchedDisease.symptoms : [],
      treatments: isHealthy
        ? []
        : [
            { type: 'chemical', name: 'Mancozeb 75% WP', dosage: '2.5 g/L water', method: 'Foliar spray every 7-10 days' },
            { type: 'organic', name: 'Neem Oil', dosage: '5 ml/L water', method: 'Spray on affected leaves early morning' },
          ],
      preventiveMeasures: matchedDisease ? matchedDisease.preventiveMeasures : [],
    };
  },

  fetchScanHistory: async () => {
    await mockDelay(600);
    return [...MOCK_SCAN_HISTORY];
  },
};

// ─── Marketplace Service ────────────────────────────────────────────────────

export const marketplaceService = {
  fetchListings: async () => {
    await mockDelay(600);
    return [...MOCK_LISTINGS];
  },

  fetchMandiPrices: async () => {
    await mockDelay(600);
    return [...MOCK_MANDI_PRICES];
  },

  fetchMyListings: async () => {
    await mockDelay(600);
    return [...MOCK_MY_LISTINGS];
  },

  createListing: async (listingData) => {
    await mockDelay(800);
    return {
      ...listingData,
      id: `lst-${Date.now()}`,
      seller: { name: 'You', location: 'Your Farm', rating: 4.5 },
    };
  },
};

// ─── Crop Recommend Service ─────────────────────────────────────────────────

export const cropRecommendService = {
  fetchRecommendations: async (soilParams, climateParams) => {
    await mockDelay(800);
    return {
      recommendations: [...MOCK_RECOMMENDATIONS],
      soilParams: soilParams || { ...MOCK_SOIL_PARAMS },
      climateParams: climateParams || { ...MOCK_CLIMATE_PARAMS },
    };
  },
};

// ─── Settings Service ───────────────────────────────────────────────────────

export const settingsService = {
  load: async () => {
    if (FIREBASE_ENABLED) {
      return getFirestore().getSingleton('settings', 'preferences');
    }
    return null;
  },

  save: async (settings) => {
    if (FIREBASE_ENABLED) {
      return getFirestore().setSingleton('settings', 'preferences', settings);
    }
    return settings;
  },
};
