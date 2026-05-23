import { mockDelay } from '../utils/mockDelay';
import cache from './cache';
import { getIsConnected } from './network';
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
import { authAPI } from './backendApi';
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
import { calculateRecommendations } from './cropRecommendEngine';
import { generateIrrigationSchedule, calculateETSummary } from './irrigationEngine';

// ─── Offline-aware helper ──────────────────────────────────────────────────
// Checks settings store for offlineMode OR actual network state.
// Returns true if the app should avoid network calls.
const shouldUseOffline = () => {
  try {
    const { store } = require('../store/store');
    const offlineMode = store.getState().settings?.offlineMode;
    if (offlineMode) return true;
  } catch (e) {
    // Store not ready yet
  }
  return !getIsConnected();
};

/**
 * Try to fetch from cache (even stale) when offline, else run fetcher.
 * @param {string} cacheKey
 * @param {Function} fetcher - async function returning data
 * @param {*} fallback - mock data to return if cache is also empty
 * @param {number} ttl - cache TTL in seconds
 */
const offlineAwareRemember = async (cacheKey, fetcher, fallback, ttl = 3600) => {
  if (shouldUseOffline()) {
    // Try stale cache first
    const stale = await cache.getStale(cacheKey);
    if (stale !== null) return stale;
    // Fall back to mock data
    return typeof fallback === 'function' ? fallback() : fallback;
  }
  return cache.remember(cacheKey, fetcher, ttl);
};

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
    try {
      const response = await authAPI.login(email, password);
      // Backend should return { user: { id, name, email }, token: '...' }
      return response;
    } catch (error) {
      if (__DEV__) console.warn('Login Error:', error.message);
      // Fallback to mock for testing if backend is completely unavailable
      if (email === 'rajesh@example.com' && password === 'password') {
        return { user: MOCK_USER, token: MOCK_TOKEN };
      }
      throw error;
    }
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
    try {
      const response = await authAPI.register(userData);
      return response;
    } catch (error) {
      if (__DEV__) console.warn('Register Error:', error.message);
      throw error;
    }
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
    await mockDelay(300);
    return { success: true };
  },
};

// ─── Pump Service ────────────────────────────────────────────────────────────
// Uses Firestore for CRUD when Firebase enabled, mock data otherwise

export const pumpService = {
  fetchPumps: async () => {
    if (FIREBASE_ENABLED) {
      return offlineAwareRemember('pumps:all', () => getFirestore().getAll('pumps'), [...MOCK_PUMPS], 300);
    }
    await mockDelay(600);
    return [...MOCK_PUMPS];
  },

  fetchGroups: async () => {
    if (FIREBASE_ENABLED) {
      return offlineAwareRemember('pumps:groups', () => getFirestore().getAll('pump_groups'), [...MOCK_PUMP_GROUPS], 300);
    }
    await mockDelay(600);
    return [...MOCK_PUMP_GROUPS];
  },

  savePump: async (pump) => {
    if (FIREBASE_ENABLED) {
      if (shouldUseOffline()) {
        throw new Error('Offline — cannot save pump. Changes will sync when you reconnect.');
      }
      try {
        if (pump.id) {
          const result = await getFirestore().update('pumps', pump.id, pump);
          await cache.del('pumps:all');
          return result;
        }
        const result = await getFirestore().create('pumps', pump);
        await cache.del('pumps:all');
        return result;
      } catch (e) {
        // Fall back to local save if Firebase auth fails (Local Mode)
        if (__DEV__) console.warn('Firestore save failed, using local:', e.message);
        if (!pump.id) return { ...pump, id: Date.now().toString() };
        return { ...pump };
      }
    }
    await mockDelay(500);
    if (!pump.id) {
      return { ...pump, id: Date.now().toString() };
    }
    return { ...pump };
  },

  saveGroup: async (group) => {
    if (FIREBASE_ENABLED) {
      if (group.id) {
        const result = await getFirestore().update('pump_groups', group.id, group);
        await cache.del('pumps:groups');
        return result;
      }
      const result = await getFirestore().create('pump_groups', group);
      await cache.del('pumps:groups');
      return result;
    }
    await mockDelay(500);
    return { ...group };
  },

  deletePump: async (pumpId) => {
    if (FIREBASE_ENABLED) {
      await getFirestore().remove('pumps', pumpId);
      await cache.del('pumps:all');
      return { message: 'Pump deleted' };
    }
    await mockDelay(300);
    return { message: 'Pump deleted' };
  },

  deleteGroup: async (groupId) => {
    if (FIREBASE_ENABLED) {
      await getFirestore().remove('pump_groups', groupId);
      await cache.del('pumps:groups');
      return { message: 'Group deleted' };
    }
    await mockDelay(300);
    return { message: 'Group deleted' };
  },

  controlPump: async (pumpId, action) => {
    if (__DEV__) console.log(`[Pump] controlPump: ${pumpId} → ${action}`);
    if (shouldUseOffline()) {
      throw new Error('Offline — pump control unavailable. Please connect to the internet.');
    }
    if (FIREBASE_ENABLED) {
      const timestamp = new Date().toISOString();
      // Update status in Firestore
      await getFirestore().update('pumps', pumpId, {
        status: action,
        [`last${action === 'on' ? 'TurnedOn' : 'TurnedOff'}`]: timestamp,
      });
      // Log to pump history
      getFirestore().create('pump_history', {
        pumpId,
        action,
        timestamp,
        triggeredBy: 'manual',
        source: 'app',
      }).catch(() => {}); // best-effort
      await cache.del('pumps:all');
      return { id: pumpId, status: action, message: `Pump turned ${action}` };
    }
    await mockDelay(300);
    return { id: pumpId, status: action, message: `Pump turned ${action}` };
  },

  setTimer: async (pumpId, durationSeconds) => {
    if (__DEV__) console.log(`[Pump] setTimer: ${pumpId} → ${durationSeconds}s`);
    if (FIREBASE_ENABLED) {
      const timestamp = new Date().toISOString();
      await getFirestore().update('pumps', pumpId, {
        status: 'on',
        timer: { duration: durationSeconds, active: true, startedAt: timestamp },
        lastTurnedOn: timestamp,
      });
      // Log timer start to history
      getFirestore().create('pump_history', {
        pumpId,
        action: 'timer_started',
        duration: durationSeconds,
        timestamp,
        triggeredBy: 'timer',
        source: 'app',
      }).catch(() => {});
      await cache.del('pumps:all');
      return { id: pumpId, status: 'on', timer: { duration: durationSeconds } };
    }
    await mockDelay(300);
    return { id: pumpId, status: 'on', timer: { duration: durationSeconds } };
  },

  createSchedule: async (pumpId, schedule) => {
    if (FIREBASE_ENABLED) {
      const result = await getFirestore().create('pump_schedules', { pumpId, ...schedule });
      return { id: result.id || Date.now().toString(), pumpId, ...schedule };
    }
    await mockDelay(300);
    return { id: Date.now().toString(), pumpId, ...schedule };
  },

  fetchSchedules: async (pumpId) => {
    if (FIREBASE_ENABLED) {
      const all = await getFirestore().getAll('pump_schedules');
      return (all || []).filter((s) => s.pumpId === pumpId);
    }
    await mockDelay(300);
    return [];
  },

  addSchedule: async (pumpId, schedule) => {
    if (FIREBASE_ENABLED) {
      return getFirestore().create('pump_schedules', { ...schedule, pumpId });
    }
    await mockDelay(300);
    return { ...schedule, pumpId, id: Date.now().toString() };
  },

  deleteSchedule: async (pumpId, scheduleId) => {
    if (FIREBASE_ENABLED) {
      await getFirestore().remove('pump_schedules', scheduleId);
      return { message: 'Schedule deleted' };
    }
    await mockDelay(300);
    return { message: 'Schedule deleted' };
  },

  fetchHistory: async (pumpId) => {
    if (FIREBASE_ENABLED) {
      const all = await getFirestore().getAll('pump_history');
      return (all || []).filter((h) => h.pumpId === pumpId);
    }
    await mockDelay(300);
    return [];
  },

  controlGroup: async (groupId, action) => {
    if (FIREBASE_ENABLED) {
      const groups = await getFirestore().getAll('pump_groups');
      const group = (groups || []).find((g) => g.id === groupId);
      if (group && group.pumpIds) {
        await Promise.all(
          group.pumpIds.map((id) => getFirestore().update('pumps', id, { status: action })),
        );
        await cache.del('pumps:all');
      }
      return { groupId, action, message: `All pumps turned ${action}` };
    }
    await mockDelay(500);
    return { groupId, action, message: `All pumps turned ${action}` };
  },

  saveSensorConfig: async (pumpId, sensorConfig) => {
    if (__DEV__) console.log(`[Pump] saveSensorConfig: ${pumpId}`, sensorConfig);
    if (FIREBASE_ENABLED) {
      await getFirestore().update('pumps', pumpId, { sensorConfig });
      await cache.del('pumps:all');
      return { id: pumpId, sensorConfig };
    }
    await mockDelay(300);
    return { id: pumpId, sensorConfig };
  },

  saveAutoSchedule: async (pumpId, autoSchedule) => {
    if (__DEV__) console.log(`[Pump] saveAutoSchedule: ${pumpId}`, autoSchedule);
    if (FIREBASE_ENABLED) {
      await getFirestore().update('pumps', pumpId, { autoSchedule });
      await cache.del('pumps:all');
      return { id: pumpId, autoSchedule };
    }
    await mockDelay(300);
    return { id: pumpId, autoSchedule };
  },

  stopAllPumps: async (pumpIds) => {
    if (__DEV__) console.log(`[Pump] EMERGENCY STOP: ${pumpIds.length} pumps`, pumpIds);
    if (shouldUseOffline()) {
      throw new Error('Offline — pump control unavailable. Please connect to the internet.');
    }
    if (FIREBASE_ENABLED) {
      const timestamp = new Date().toISOString();
      await Promise.all(
        pumpIds.map((id) => getFirestore().update('pumps', id, { status: 'off', lastTurnedOff: timestamp })),
      );
      // Log emergency stop for each pump
      Promise.all(
        pumpIds.map((id) =>
          getFirestore().create('pump_history', {
            pumpId: id,
            action: 'off',
            timestamp,
            triggeredBy: 'emergency_stop',
            source: 'app',
          }),
        ),
      ).catch(() => {});
      await cache.del('pumps:all');
      return pumpIds.map((id) => ({ id, status: 'off' }));
    }
    await mockDelay(500);
    return pumpIds.map((id) => ({ id, status: 'off' }));
  },
};

// ─── Crop Service ────────────────────────────────────────────────────────────

export const cropService = {
  fetchCrops: async () => {
    if (FIREBASE_ENABLED) {
      return offlineAwareRemember('crops:all', () => getFirestore().getAll('crops'), [...MOCK_CROPS], 300);
    }
    await mockDelay(600);
    return [...MOCK_CROPS];
  },

  addCrop: async (crop) => {
    if (FIREBASE_ENABLED && shouldUseOffline()) {
      throw new Error('Offline — cannot add crop. Changes will sync when you reconnect.');
    }
    if (FIREBASE_ENABLED) {
      const result = await getFirestore().create('crops', crop);
      await cache.del('crops:all');
      return result;
    }
    await mockDelay(500);
    return { ...crop, id: Date.now().toString() };
  },

  updateCrop: async (crop) => {
    if (FIREBASE_ENABLED && shouldUseOffline()) {
      throw new Error('Offline — cannot update crop. Changes will sync when you reconnect.');
    }
    if (FIREBASE_ENABLED) {
      const result = await getFirestore().update('crops', crop.id, crop);
      await cache.del('crops:all');
      return result;
    }
    await mockDelay(500);
    return { ...crop };
  },

  deleteCrop: async (id) => {
    if (FIREBASE_ENABLED && shouldUseOffline()) {
      throw new Error('Offline — cannot delete crop. Changes will sync when you reconnect.');
    }
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
      const fallback = { current: { ...MOCK_SOIL_CURRENT }, soilCrops: SOIL_CROPS.slice(0, 5), soilReadings: [...MOCK_SOIL_READINGS] };
      return offlineAwareRemember('soil:current', () => getFirestore().getSingleton('soil', 'current'), fallback, 300);
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
      return offlineAwareRemember('soil:moisture', () => getFirestore().getAll('soil_moisture'), [...MOCK_MOISTURE_HISTORY], 300);
    }
    await mockDelay(500);
    return [...MOCK_MOISTURE_HISTORY];
  },

  fetchPhHistory: async () => {
    if (FIREBASE_ENABLED) {
      return offlineAwareRemember('soil:ph', () => getFirestore().getAll('soil_ph'), [...MOCK_PH_HISTORY], 300);
    }
    await mockDelay(500);
    return [...MOCK_PH_HISTORY];
  },

  fetchNpkHistory: async () => {
    if (FIREBASE_ENABLED) {
      return offlineAwareRemember('soil:npk', () => getFirestore().getAll('soil_npk'), [...MOCK_NPK_HISTORY], 300);
    }
    await mockDelay(500);
    return [...MOCK_NPK_HISTORY];
  },

  fetchFertilizerHistory: async () => {
    if (FIREBASE_ENABLED) {
      return offlineAwareRemember('soil:fertilizer', () => getFirestore().getAll('soil_fertilizer'), [...MOCK_FERTILIZER_HISTORY], 300);
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
    const key = location?.lat ? `weather:current:${location.lat}:${location.lng}` : 'weather:current';
    if (weatherAPI.isWeatherAPIEnabled() && location?.lat) {
      return offlineAwareRemember(key, () => weatherAPI.fetchCurrentWeather(location.lat, location.lng), { ...MOCK_CURRENT_WEATHER }, 1800);
    }
    return offlineAwareRemember(key, async () => {
      await mockDelay(600);
      return { ...MOCK_CURRENT_WEATHER };
    }, { ...MOCK_CURRENT_WEATHER }, 1800);
  },

  fetchForecast: async (location) => {
    const key = location?.lat ? `weather:forecast:${location.lat}:${location.lng}` : 'weather:forecast';
    if (weatherAPI.isWeatherAPIEnabled() && location?.lat) {
      return offlineAwareRemember(key, () => weatherAPI.fetchForecast(location.lat, location.lng), [...MOCK_FORECAST], 3600);
    }
    return offlineAwareRemember(key, async () => {
      await mockDelay(600);
      return [...MOCK_FORECAST];
    }, [...MOCK_FORECAST], 3600);
  },

  fetchHistoricalWeather: async () => {
    return offlineAwareRemember('weather:historical', async () => {
      await mockDelay(700);
      return {
        yesterday: { ...MOCK_HISTORICAL_YESTERDAY },
        week: [...MOCK_HISTORICAL_WEEK],
      };
    }, { yesterday: { ...MOCK_HISTORICAL_YESTERDAY }, week: [...MOCK_HISTORICAL_WEEK] }, 3600);
  },

  fetchWindHistory: async (location) => {
    const key = location?.lat ? `weather:wind:${location.lat}:${location.lng}` : 'weather:wind';
    if (weatherAPI.isWeatherAPIEnabled() && location?.lat) {
      return offlineAwareRemember(key, () => weatherAPI.fetchWindHistory(location.lat, location.lng), [...MOCK_WIND_HISTORY], 1800);
    }
    return offlineAwareRemember(key, async () => {
      await mockDelay(500);
      return [...MOCK_WIND_HISTORY];
    }, [...MOCK_WIND_HISTORY], 1800);
  },

  fetchHumidityHistory: async (location) => {
    const key = location?.lat ? `weather:humidity:${location.lat}:${location.lng}` : 'weather:humidity';
    if (weatherAPI.isWeatherAPIEnabled() && location?.lat) {
      return offlineAwareRemember(key, () => weatherAPI.fetchHumidityHistory(location.lat, location.lng), [...MOCK_HUMIDITY_HISTORY], 1800);
    }
    return offlineAwareRemember(key, async () => {
      await mockDelay(500);
      return [...MOCK_HUMIDITY_HISTORY];
    }, [...MOCK_HUMIDITY_HISTORY], 1800);
  },
};

// ─── Report Service ──────────────────────────────────────────────────────────

export const reportService = {
  fetchReports: async () => {
    if (FIREBASE_ENABLED) {
      try {
        const [pumps, history, soil] = await Promise.all([
          cache.remember('pumps:all', () => getFirestore().getAll('pumps'), 300),
          cache.remember('report:history', () => getFirestore().getAll('pump_history'), 300),
          cache.remember('soil:current', () => getFirestore().getSingleton('soil', 'current'), 300),
        ]);

        // Compute pump runtime from history
        const totalRuns = (history || []).filter((h) => h.action === 'on').length;
        const totalStops = (history || []).filter((h) => h.action === 'off').length;
        const timerRuns = (history || []).filter((h) => h.action === 'timer_started');
        const totalTimerSec = timerRuns.reduce((sum, h) => sum + (h.duration || 0), 0);

        return {
          waterUsage: { ...MOCK_WATER_USAGE, totalLiters: totalTimerSec * 2 }, // rough estimate
          runHours: { ...MOCK_RUN_HOURS, total: Math.round(totalTimerSec / 3600 * 10) / 10, sessions: totalRuns },
          pumpRuntime: (pumps || []).map((p) => ({
            id: p.id,
            name: p.name,
            status: p.status,
            lastRun: p.lastTurnedOn || p.lastRun,
          })),
          soilCondition: soil ? { ...MOCK_SOIL_CONDITION, moisture: soil.moisture, ph: soil.ph, nitrogen: soil.nitrogen } : { ...MOCK_SOIL_CONDITION },
          harvestPerformance: { ...MOCK_HARVEST_PERFORMANCE },
          generalMetrics: { ...MOCK_GENERAL_METRICS, totalPumps: (pumps || []).length, activePumps: (pumps || []).filter((p) => p.status === 'on').length },
        };
      } catch (e) {
        if (__DEV__) console.warn('[Reports] Firestore fetch failed, falling back to mock', e.message);
      }
    }
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
      return offlineAwareRemember('devices:all', () => getFirestore().getAll('devices'), [...MOCK_DEVICES], 300);
    }
    await mockDelay(600);
    return [...MOCK_DEVICES];
  },

  updateDevice: async (id, updates) => {
    if (FIREBASE_ENABLED && shouldUseOffline()) {
      throw new Error('Offline — cannot update device. Changes will sync when you reconnect.');
    }
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
  fetchAnalytics: async (options = {}) => {
    const { forecast, soilData, fields, location } = options;

    // Generate real irrigation schedule if we have weather data
    let irrigationSchedule;
    try {
      if (forecast || soilData) {
        irrigationSchedule = generateIrrigationSchedule({
          forecast: forecast || [],
          soilData: soilData || {},
          fields: fields || [],
          location,
        });
      }
    } catch (e) {
      if (__DEV__) console.warn('Irrigation engine error:', e.message);
    }

    await mockDelay(400);
    return {
      cropHealth: { ...MOCK_CROP_HEALTH },
      aiInsights: [...MOCK_AI_INSIGHTS],
      ndviData: { ...MOCK_NDVI_DATA },
      yieldPrediction: { ...MOCK_YIELD_PREDICTION },
      irrigationSchedule: irrigationSchedule || [...MOCK_IRRIGATION_SCHEDULE],
      expertNetwork: [...MOCK_EXPERT_NETWORK],
    };
  },

  fetchETSummary: async (forecast, location) => {
    return calculateETSummary(forecast || [], location);
  },
};

// ─── Farm Service ───────────────────────────────────────────────────────────

export const farmService = {
  fetchFarmData: async () => {
    if (FIREBASE_ENABLED) {
      const [tasks, categories] = await Promise.all([
        offlineAwareRemember('farm:tasks', () => getFirestore().getAll('farm_tasks'), [...MOCK_FARM_TASKS], 300),
        offlineAwareRemember('farm:categories', async () => [...MOCK_FARM_CATEGORIES], [...MOCK_FARM_CATEGORIES], 3600),
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
    if (FIREBASE_ENABLED && shouldUseOffline()) {
      throw new Error('Offline — cannot update task. Changes will sync when you reconnect.');
    }
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
      const fields = await offlineAwareRemember('fields:all', () => getFirestore().getAll('fields'), [...MOCK_FIELDS], 300);
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
    if (FIREBASE_ENABLED && shouldUseOffline()) {
      throw new Error('Offline — cannot update field. Changes will sync when you reconnect.');
    }
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
    // Offline check — disease detection requires network
    if (shouldUseOffline()) {
      throw new Error('Offline — scan unavailable. Please connect to the internet to use disease detection.');
    }

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

  saveScanResult: async (result) => {
    if (FIREBASE_ENABLED) {
      await getFirestore().create('scan_history', result);
      await cache.del('scans:all');
    }
  },

  fetchScanHistory: async () => {
    if (FIREBASE_ENABLED) {
      return offlineAwareRemember('scans:all', () => getFirestore().getAll('scan_history'), [...MOCK_SCAN_HISTORY], 300);
    }
    await mockDelay(600);
    return [...MOCK_SCAN_HISTORY];
  },
};

// ─── Marketplace Service ────────────────────────────────────────────────────

export const marketplaceService = {
  fetchListings: async () => {
    if (FIREBASE_ENABLED) {
      return offlineAwareRemember('marketplace:listings', () => getFirestore().getAll('marketplace_listings'), [...MOCK_LISTINGS], 300);
    }
    await mockDelay(600);
    return [...MOCK_LISTINGS];
  },

  fetchMandiPrices: async () => {
    await mockDelay(600);
    return [...MOCK_MANDI_PRICES];
  },

  fetchMyListings: async () => {
    if (FIREBASE_ENABLED) {
      return offlineAwareRemember('marketplace:my', () => getFirestore().getAll('my_listings'), [...MOCK_MY_LISTINGS], 300);
    }
    await mockDelay(600);
    return [...MOCK_MY_LISTINGS];
  },

  createListing: async (listingData) => {
    if (FIREBASE_ENABLED) {
      const listing = {
        ...listingData,
        seller: { name: 'You', location: 'Your Farm', rating: 4.5 },
        createdAt: new Date().toISOString(),
      };
      const result = await getFirestore().create('my_listings', listing);
      await cache.del('marketplace:my');
      return result;
    }
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
    const soil = soilParams || { ...MOCK_SOIL_PARAMS };
    const climate = climateParams || { ...MOCK_CLIMATE_PARAMS };

    // Use real recommendation engine
    const recommendations = calculateRecommendations(soil, climate);

    return { recommendations, soilParams: soil, climateParams: climate };
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
