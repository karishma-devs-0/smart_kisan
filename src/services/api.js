import AsyncStorage from '@react-native-async-storage/async-storage';
import { mockDelay } from '../utils/mockDelay';
import cache from './cache';
import { getIsConnected } from './network';
import { FIREBASE_ENABLED, HUGGINGFACE_SPACE_URL } from '../config/firebase.config';
import {
  authAPI,
  fieldAPI,
  cropAPI,
  deviceAPI,
  soilAPI,
  profileAPI,
  pumpAPI,
  farmTaskAPI,
} from './backendApi';
import * as weatherAPI from './weather';

import { MOCK_USER, MOCK_TOKEN } from '../features/auth/mock/authMockData';
import {
  MOCK_PUMPS,
  MOCK_PUMP_GROUPS,
} from '../features/pumps/mock/pumpsMockData';
import {
  MOCK_MOISTURE_HISTORY,
  MOCK_PH_HISTORY,
  MOCK_NPK_HISTORY,
  MOCK_FERTILIZER_HISTORY,
  SOIL_CROPS,
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
import {
  MOCK_CROP_HEALTH,
  MOCK_AI_INSIGHTS,
  MOCK_NDVI_DATA,
  MOCK_YIELD_PREDICTION,
  MOCK_IRRIGATION_SCHEDULE,
  MOCK_EXPERT_NETWORK,
} from '../features/analytics/mock/analyticsMockData';
import { MOCK_FARM_CATEGORIES } from '../features/farm/mock/farmMockData';
import { MOCK_FIELDS, MOCK_FIELD_GROWTH_DATA } from '../features/fields/mock/fieldsMockData';
import { MOCK_LISTINGS, MOCK_MANDI_PRICES, MOCK_MY_LISTINGS } from '../features/marketplace/mock/marketplaceMockData';
import { MOCK_SCAN_HISTORY, MOCK_DISEASES } from '../features/diseaseDetection/mock/diseaseDetectionMockData';
import {
  MOCK_RECOMMENDATIONS,
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

// Firestore has been removed. The if(FIREBASE_ENABLED) branches below never
// execute (FIREBASE_ENABLED is constant false). Calling getFirestore() would
// throw — kept as a guard for any path that somehow regresses to using it.
const getFirestore = () => {
  throw new Error('Firestore is no longer used — Firebase was removed.');
};

// ─── Helper: extract user shape from Firebase user ──────────────────────────

const firebaseUserToAppUser = (fbUser) => ({
  id: fbUser.uid,
  name: fbUser.displayName || 'Farmer',
  email: fbUser.email,
  phone: fbUser.phoneNumber || '',
  avatar: fbUser.photoURL || null,
});

// ─── Row Mappers ─────────────────────────────────────────────────────────────
// Postgres hands back snake_case columns; the screens and slices were written
// against camelCase mock objects. These keep that contract intact so switching
// a service from mock to backend doesn't ripple into every component.

const mapField = (r) => ({
  id: r.id,
  name: r.name,
  area: r.area,
  areaUnit: r.area_unit,
  soilType: r.soil_type,
  cropName: r.crop_name,
  crop: r.crop_name, // some screens read `crop`
  latitude: r.latitude,
  longitude: r.longitude,
  status: r.status,
  createdAt: r.created_at,
});

const mapCrop = (r) => ({
  id: r.id,
  name: r.name,
  variety: r.variety,
  season: r.season,
  area: r.area,
  fieldId: r.field_id,
  sownOn: r.sown_on,
  sowingDate: r.sown_on,
  expectedHarvest: r.expected_harvest,
  harvestDate: r.expected_harvest,
  stage: r.stage,
  health: r.health,
});

const mapDevice = (r) => ({
  id: r.id,
  name: r.name,
  type: r.type,
  model: r.model,
  fieldId: r.field_id,
  isOnline: r.is_online,
  status: r.is_online ? 'online' : 'offline',
  batteryPct: r.battery_pct,
  battery: r.battery_pct,
  lastSeen: r.last_seen,
});

// The pumps table stores what the hardware needs; the screens were written
// against a richer mock shape. Live values (moisture, water level) arrive over
// MQTT rather than being columns, and mode/group are app-side concepts, so they
// default here rather than being invented.
const mapPump = (r) => ({
  id: r.id,
  name: r.name,
  type: r.type,
  hp: r.power_rating ? parseFloat(r.power_rating) : null,
  flowRate: r.flow_rate,
  field: r.location || '',
  location: r.location || '',
  status: r.status || 'off',
  isOnline: r.is_online !== false,
  mode: r.mode || 'manual',
  groupId: r.group_id || null,
  imageUri: null,
  lastRun: r.last_turned_on,
  lastAction: r.last_action,
  totalRunTimeSec: r.total_run_time_sec || 0,
  soilMoisture: null,
  waterLevel: null,
  nextRun: null,
});

const mapSoil = (r) =>
  r && {
    moisture: r.moisture,
    temperature: r.temperature,
    ph: r.pH,
    pH: r.pH,
    nitrogen: r.nitrogen,
    phosphorus: r.phosphorus,
    potassium: r.potassium,
    ec: r.ec,
    organicCarbon: r.organic_carbon,
    updatedAt: r.updated_at,
  };

// ─── Auth Service ────────────────────────────────────────────────────────────

export const authService = {
  // These used to hand out MOCK_TOKEN ('mock-jwt-token-smartkisan-2024') on
  // fallback. That is not a signed JWT, so the backend rejects it on every
  // protected route: the user lands on the dashboard "logged in" but nothing
  // loads, with no indication why. Harmless while all data was mock, broken now
  // that fields, crops, soil and the profile come from the API. A failed login
  // must fail, not grant an unusable session.

  loginWithEmail: async (email, password) => {
    const response = await authAPI.login(email, password);
    // Backend returns { user: { id, name, email }, token: '...' }
    return response;
  },

  loginWithPhone: async (phone, otp) => {
    // No OTP provider is wired up server-side yet, so there is no way to
    // authenticate a phone number for real.
    throw new Error(
      'Phone sign-in is not available yet. Please sign in with your email and password.'
    );
  },

  loginWithUsername: async (username, password) => {
    // The backend authenticates by email; there is no username lookup.
    throw new Error(
      'Username sign-in is not available yet. Please sign in with your email and password.'
    );
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
    try {
      const response = await authAPI.google(idToken);
      // Backend returns { user: { id, name, email }, token: '...' }
      return response;
    } catch (error) {
      if (__DEV__) console.warn('Google Login Error:', error.message);
      throw error;
    }
  },

  /**
   * Saves the profile screen's edits.
   *
   * The screen presents one form, but the fields behind it live in two places:
   * name and phone on the user record, farm name and location on the farm
   * profile. So this is two calls.
   *
   * They are not wrapped in a transaction — there is no cross-request one to
   * use — so the account update goes first and the farm update second. If the
   * second fails the first still stands, which is the harmless ordering: a
   * saved name with an unsaved farm name is recoverable by pressing save
   * again, and the error surfaces either way.
   *
   * Until this existed the thunk returned its own argument unchanged, so the
   * form appeared to save and reverted on the next launch.
   */
  updateProfile: async ({ name, phone, farmName, locationName }, userId) => {
    const { user } = await authAPI.updateAccount({ name, phone });

    let farm = null;
    if (farmName || locationName) {
      // COALESCE server-side, so undefined leaves the stored value alone
      // rather than blanking it.
      const res = await profileAPI.update({
        farmName: farmName || undefined,
        locationName: locationName || undefined,
      });
      const p = res.profile || {};
      farm = {
        farmName: p.farm_name,
        locationName: p.location_name,
        location:
          p.latitude != null
            ? { name: p.location_name, lat: p.latitude, lng: p.longitude }
            : null,
      };
    }

    // loadProfile keeps a copy of the profile in AsyncStorage and falls back to
    // it whenever the fetch fails — which on a sleeping free-tier server is
    // routine. Left untouched it would serve the pre-edit farm name back on the
    // next cold start, so the saved values are merged in here.
    if (farm) {
      try {
        const raw = await AsyncStorage.getItem(onboardingKey(userId));
        if (raw) {
          await AsyncStorage.setItem(
            onboardingKey(userId),
            JSON.stringify({ ...JSON.parse(raw), ...farm })
          );
        }
      } catch (e) {
        if (__DEV__) console.warn('Profile cache update failed:', e.message);
      }
    }

    return { user, farm };
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
    // Was returning MOCK_PUMPS unconditionally, so every account saw the same
    // sample pumps and a pump the user added vanished on restart. The backend
    // route and the API client both already existed; this service simply never
    // called them.
    try {
      const { pumps } = await pumpAPI.fetchAll();
      return pumps.map(mapPump);
    } catch (error) {
      if (__DEV__) console.warn('fetchPumps failed:', error.message);
      throw new Error('Could not load your pumps. Check your connection and try again.');
    }
  },

  fetchGroups: async () => {
    if (FIREBASE_ENABLED) {
      return offlineAwareRemember('pumps:groups', () => getFirestore().getAll('pump_groups'), [...MOCK_PUMP_GROUPS], 300);
    }
    await mockDelay(600);
    return [...MOCK_PUMP_GROUPS];
  },

  /**
   * Today's run hours, water and energy.
   *
   * Returns null when it cannot be worked out, so the dashboard can show a
   * dash rather than a confident zero — the previous code had no way to tell
   * "nothing ran" from "we do not know", because it invented the figures from
   * the active pump count either way.
   */
  fetchTodaySummary: async () => {
    if (shouldUseOffline()) return null;
    try {
      const { summary } = await pumpAPI.summaryToday();
      return summary || null;
    } catch (error) {
      if (__DEV__) console.warn('Pump summary failed:', error.message);
      return null;
    }
  },

  savePump: async (pump) => {
    // Previously returned the pump with a Date.now() id and never contacted the
    // server, so a newly added pump appeared in the list and was gone on the
    // next launch — it had only ever existed in Redux.
    const payload = {
      name: pump.name,
      type: pump.type,
      powerRating: pump.hp != null ? String(pump.hp) : null,
      flowRate: pump.flowRate ?? null,
      location: pump.field ?? pump.location ?? null,
    };

    const result = pump.id
      ? await pumpAPI.update(pump.id, payload)
      : await pumpAPI.create(payload);

    await cache.del('pumps:all');
    return mapPump(result.pump || result);
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
    await pumpAPI.remove(pumpId);
    await cache.del('pumps:all');
    return { success: true, id: pumpId };
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
    try {
      const { crops } = await cropAPI.fetchAll();
      return crops.map(mapCrop);
    } catch (error) {
      // Surface the failure instead of showing someone else's sample crops as
      // if they were this farmer's.
      if (__DEV__) console.warn('fetchCrops failed:', error.message);
      throw new Error('Could not load your crops. Check your connection and try again.');
    }
  },

  addCrop: async (crop) => {
    const { crop: created } = await cropAPI.create(crop);
    await cache.del('crops:all');
    return mapCrop(created);
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
    // No invented readings. Moisture, pH and NPK drive irrigation and
    // fertiliser decisions, so a fabricated 45% is worse than a blank dial:
    // it reads as a measurement from a sensor that never reported.
    //
    // Returns {} rather than null when there is no reading — MySoilScreen
    // reads current.moisture unguarded but already treats absent/zero values
    // as its empty state (see its `hasData` check), so {} shows that state
    // without a crash.
    try {
      const { soil } = await soilAPI.fetchCurrent();
      return {
        current: mapSoil(soil) || {},
        hasLiveReading: !!soil,
        soilCrops: SOIL_CROPS.slice(0, 5),
        soilReadings: [],
      };
    } catch (error) {
      if (__DEV__) console.warn('fetchSoilData failed:', error.message);
      return {
        current: {},
        hasLiveReading: false,
        error: 'Could not load soil data.',
        soilCrops: SOIL_CROPS.slice(0, 5),
        soilReadings: [],
      };
    }
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
    // Was a no-op that handed back a fake id, so a reading the user entered was
    // never sent anywhere and disappeared as soon as the app restarted. The
    // endpoint and the API client both already existed.
    await soilAPI.record({
      moisture: reading.moisture,
      temperature: reading.temperature,
      pH: reading.pH ?? reading.ph,
      nitrogen: reading.nitrogen,
      phosphorus: reading.phosphorus,
      potassium: reading.potassium,
    });

    // The reading changes what the soil screens show, so drop anything cached
    // from before it.
    await cache.delByPrefix('soil:');
    return { ...reading, id: reading.id || Date.now().toString() };
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
    try {
      const { devices } = await deviceAPI.fetchAll();
      return devices.map(mapDevice);
    } catch (error) {
      if (__DEV__) console.warn('fetchDevices failed:', error.message);
      throw new Error('Could not load your devices. Check your connection and try again.');
    }
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

const mapTask = (r) => ({
  id: r.id,
  title: r.title,
  description: r.description,
  category: r.category,
  status: r.status,
  priority: r.priority,
  dueDate: r.due_date,
  fieldId: r.field_id,
  fieldName: r.field_name,
  assignee: r.assignee,
  completedAt: r.completed_at,
});

export const farmService = {
  /**
   * The farm's own tasks.
   *
   * This used to return a fixed list of sample tasks — sowing wheat in Field A,
   * harvesting cotton — identical for every farmer, with no storage behind
   * them. Marking one done changed local state and was forgotten on the next
   * launch.
   *
   * An empty list is a legitimate answer for a farm that has not added any
   * tasks, and is shown as such rather than being padded with examples.
   */
  fetchFarmData: async () => {
    let tasks = [];
    try {
      const { tasks: rows } = await farmTaskAPI.fetchAll();
      tasks = (rows || []).map(mapTask);
    } catch (error) {
      if (__DEV__) console.warn('fetchFarmData failed:', error.message);
    }

    return {
      tasks,
      // Categories are fixed reference data — the kinds of work a farm does —
      // not per-farm records, so they are constants rather than a table.
      categories: [...MOCK_FARM_CATEGORIES],
      // Growth trends need a season of recorded crop measurements, which
      // nothing collects yet. Empty rather than a fabricated curve: a chart
      // that invents a yield trend is worse than no chart.
      growthTrends: [],
    };
  },

  createTask: async (task) => {
    if (shouldUseOffline()) {
      throw new Error('Offline — cannot add a task right now.');
    }
    const { task: created } = await farmTaskAPI.create(task);
    return mapTask(created);
  },

  updateTask: async (id, updates) => {
    if (shouldUseOffline()) {
      throw new Error('Offline — cannot update task. Changes will sync when you reconnect.');
    }
    const { task } = await farmTaskAPI.update(id, updates);
    return mapTask(task);
  },

  deleteTask: async (id) => {
    if (shouldUseOffline()) {
      throw new Error('Offline — cannot delete a task right now.');
    }
    await farmTaskAPI.remove(id);
    return { id };
  },
};

// ─── Fields Service ─────────────────────────────────────────────────────────

export const fieldsService = {
  fetchFields: async () => {
    // Real fields, created during onboarding. An empty array is a legitimate
    // answer (a farm with no fields yet) — we deliberately do NOT substitute
    // mock fields for it, because showing five imaginary plots was exactly what
    // made the dashboard meaningless. Mock data is only a fallback for a failed
    // request, so the app still renders something when the network is down.
    try {
      const { fields } = await fieldAPI.fetchAll();
      return {
        fields: fields.map(mapField),
        growthData: [...MOCK_FIELD_GROWTH_DATA],
      };
    } catch (error) {
      if (__DEV__) console.warn('fetchFields failed:', error.message);
      throw new Error('Could not load your fields. Check your connection and try again.');
    }
  },

  createField: async (field) => {
    const { field: created } = await fieldAPI.create(field);
    return mapField(created);
  },

  updateField: async (id, updates) => {
    const { field } = await fieldAPI.update(id, updates);
    return mapField(field);
  },

  deleteField: async (id) => fieldAPI.remove(id),
};

// ─── Onboarding / Profile Service ───────────────────────────────────────────

// Persist onboarding completion per-user in AsyncStorage. We key by user id
// so multi-account on the same device doesn't share onboarding state.
const onboardingKey = (userId) => `@smartkisan:onboarding:${userId || 'guest'}`;

export const onboardingService = {
  /**
   * The server is the source of truth for whether a user has onboarded, so the
   * farm follows them to a new device instead of living only in AsyncStorage.
   * The local copy is kept as a cache so the app can decide which screen to show
   * before the network answers (and while Render's free tier is waking up).
   */
  loadProfile: async (userId) => {
    try {
      const { profile, onboarded, counts } = await profileAPI.fetch();
      if (!onboarded) return null;

      const merged = {
        farmName: profile.farm_name,
        farmType: profile.farm_type,
        farmSize: profile.size_band || profile.farm_size,
        farmSizeAcres: profile.farm_size,
        sizeUnit: profile.size_unit,
        locationName: profile.location_name,
        location:
          profile.latitude != null
            ? { name: profile.location_name, lat: profile.latitude, lng: profile.longitude }
            : null,
        language: profile.language,
        counts,
        completedAt: profile.onboarded_at,
      };

      await AsyncStorage.setItem(onboardingKey(userId), JSON.stringify(merged)).catch(
        () => {}
      );
      return merged;
    } catch (error) {
      if (__DEV__) console.warn('loadProfile failed, using cache:', error.message);
      try {
        const raw = await AsyncStorage.getItem(onboardingKey(userId));
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    }
  },

  /**
   * Provisions the farm server-side: profile plus the fields, crops and devices
   * described during setup, all in one transaction. This is what makes the
   * onboarding answers actually drive the app rather than vanish into local
   * storage.
   */
  saveProfile: async (data, userId) => {
    // Onboarding picks a size band, not a number, and may also collect exact
    // acreage. Send the band verbatim and a numeric acreage when we have one —
    // parseFloat('medium') is NaN, which would silently discard the answer.
    const BAND_ACRES = { small: 1, medium: 6, large: 30, xlarge: 75 };
    const exactAcres = parseFloat(data.farmSizeAcres);

    const setup = {
      farmName: data.farmName,
      farmType: data.farmType,
      farmSize: Number.isFinite(exactAcres)
        ? exactAcres
        : BAND_ACRES[data.farmSize] ?? null,
      sizeBand: typeof data.farmSize === 'string' ? data.farmSize : null,
      sizeUnit: data.sizeUnit || 'acre',
      locationName: data.location?.name || data.locationName || null,
      latitude: data.location?.lat ?? null,
      longitude: data.location?.lng ?? null,
      language: data.language,
      fields: data.fields || [],
      crops: data.crops || [],
      devices: data.devices || [],
    };

    const result = await profileAPI.completeOnboarding(setup);

    const profile = {
      ...data,
      provisioned: {
        fields: result.fields?.length || 0,
        crops: result.crops?.length || 0,
        devices: result.devices?.length || 0,
      },
      completedAt: result.profile?.onboarded_at || new Date().toISOString(),
    };

    // Cache locally so the next launch can route instantly without waiting on
    // the network. The server copy remains authoritative.
    try {
      await AsyncStorage.setItem(onboardingKey(userId), JSON.stringify(profile));
    } catch (e) {
      if (__DEV__) console.warn('Onboarding cache write failed:', e.message);
    }

    // Freshly provisioned farm invalidates anything we cached from the old
    // (empty) state.
    await cache.delByPrefix('fields:');
    await cache.delByPrefix('crops:');

    return profile;
  },
};

// ─── Disease Detection Service ──────────────────────────────────────────────

export const diseaseDetectionService = {
  /**
   * Wakes the HuggingFace Space. Free Spaces sleep after inactivity and take
   * ~9s to come back, which is long enough that a scan started immediately
   * afterwards times out. Calling this when the Disease screen opens means the
   * model is usually warm by the time the user has framed a photo.
   *
   * Deliberately fire-and-forget: it is an optimisation, never a blocker.
   */
  warmUp: async () => {
    if (!HUGGINGFACE_SPACE_URL || shouldUseOffline()) return false;
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 20000);
      const res = await fetch(HUGGINGFACE_SPACE_URL, { signal: controller.signal });
      clearTimeout(timer);
      return res.ok;
    } catch {
      return false;
    }
  },

  scanImage: async (imageUri) => {
    // Offline check — disease detection requires network
    if (shouldUseOffline()) {
      throw new Error('Offline — scan unavailable. Please connect to the internet to use disease detection.');
    }

    let lastError = null;

    // Try real AI model (HuggingFace Space)
    if (HUGGINGFACE_SPACE_URL) {
      try {
        // A cold Space needs ~9s just to wake, before upload and inference.
        // The old 15s budget expired mid-wake and dropped the user into the
        // simulated path, so allow a genuine cold start and retry once.
        const attempt = async (timeoutMs) => {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

          const formData = new FormData();
          formData.append('file', {
            uri: imageUri,
            type: 'image/jpeg',
            name: 'plant_image.jpg',
          });

          try {
            return await fetch(`${HUGGINGFACE_SPACE_URL}/predict`, {
              method: 'POST',
              body: formData,
              headers: { 'Content-Type': 'multipart/form-data' },
              signal: controller.signal,
            });
          } finally {
            clearTimeout(timeoutId);
          }
        };

        let response;
        try {
          response = await attempt(45000);
        } catch (firstError) {
          if (__DEV__) console.warn('Scan attempt 1 failed, retrying:', firstError.message);
          response = await attempt(45000);
        }

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
            isSimulated: false,
          };
        }
      } catch (err) {
        lastError = err;
        if (__DEV__) console.warn('Disease scan failed:', err.message);
      }
    }

    // No fabricated result. This used to invent a diagnosis at random —
    // random disease, 75-95% confidence, a chemical treatment with a dosage —
    // and return it looking exactly like a real prediction. Spraying a crop for
    // a disease it does not have costs money and can damage the plant, so a
    // scan that could not run must fail rather than guess.
    throw new Error(
      lastError?.name === 'AbortError'
        ? 'The AI model took too long to respond. It may be waking up — please try again in a moment.'
        : 'Could not reach the AI model. Check your connection and try again.'
    );
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
  /**
   * Crop suitability for this farm.
   *
   * The engine itself is real, but with no arguments this fell back to a fixed
   * sample soil profile and sample climate. The screen opens that way, so
   * every farmer was shown recommendations computed from someone else's soil,
   * presented under the heading "Your Soil Profile" - which is what testers
   * reported as dummy data.
   *
   * Recommendations are only as good as the readings behind them; advising a
   * crop off invented nitrogen is worse than advising nothing. So when the
   * farm has no soil reading, this returns none and lets the screen say so.
   * The farmer can still enter values by hand, which is what the input screen
   * is for - that path passes soilParams and is unchanged.
   */
  fetchRecommendations: async (soilParams, climateParams, location) => {
    let soil = soilParams;
    let climate = climateParams;

    if (!soil) {
      // No hand-entered values, so use the farm's own recorded reading.
      try {
        const { soil: reading } = await soilAPI.fetchCurrent();
        const mapped = mapSoil(reading);
        // N, P, K and pH are what the engine scores on. Without them there is
        // nothing to base a recommendation on.
        if (mapped && mapped.nitrogen != null && mapped.phosphorus != null
            && mapped.potassium != null && mapped.ph != null) {
          soil = {
            nitrogen: mapped.nitrogen,
            phosphorus: mapped.phosphorus,
            potassium: mapped.potassium,
            ph: mapped.ph,
            organicCarbon: mapped.organicCarbon ?? null,
            // Not recorded anywhere: no sensor reports soil texture and there
            // is no column for it. Left null rather than guessed; the engine
            // scores it as unknown, and the farmer can supply it by hand.
            texture: null,
          };
        }
      } catch (error) {
        if (__DEV__) console.warn('Crop suitability: soil read failed:', error.message);
      }
    }

    if (!soil) {
      return {
        recommendations: [],
        soilParams: null,
        climateParams: null,
        needsSoilReading: true,
      };
    }

    if (!climate) {
      // Rainfall and altitude are not available from the weather source, so
      // they stay null rather than being filled in with a plausible-looking
      // number - the engine treats them as unknown.
      climate = { avgTemp: null, humidity: null, rainfall: null, altitude: null };

      // Only ask for weather when it can actually be observed for this farm.
      // fetchCurrentWeather returns sample data when there is no API key or no
      // location, and feeding that in here would put invented temperature and
      // humidity behind a crop recommendation - the same fault being fixed.
      if (weatherAPI.isWeatherAPIEnabled() && location?.lat) {
        try {
          const current = await weatherService.fetchCurrentWeather(location);
          climate.avgTemp = current?.temp ?? null;
          climate.humidity = current?.humidity ?? null;
        } catch (error) {
          if (__DEV__) console.warn('Crop suitability: weather read failed:', error.message);
        }
      }
    }

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
