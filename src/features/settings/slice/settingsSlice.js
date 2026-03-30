import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MOCK_SETTINGS } from '../mock/settingsMockData';
import { settingsService } from '../../../services/api';
import cache from '../../../services/cache';

const SETTINGS_STORAGE_KEY = '@smartkisan_settings';

// ─── Async Thunks ────────────────────────────────────────────────────────────

export const loadSettings = createAsyncThunk(
  'settings/loadSettings',
  async () => {
    // Try Firestore first, then AsyncStorage, then defaults
    try {
      const remote = await settingsService.load();
      if (remote) {
        // Sync to AsyncStorage for offline access
        await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(remote));
        return remote;
      }
    } catch (e) {
      // Firestore unavailable — try local
    }

    try {
      const local = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
      if (local) return JSON.parse(local);
    } catch (e) {
      // AsyncStorage unavailable
    }

    return null; // Use defaults from initialState
  },
);

export const saveSettings = createAsyncThunk(
  'settings/saveSettings',
  async (_, { getState }) => {
    const settings = getState().settings;
    const data = {
      language: settings.language,
      notifications: settings.notifications,
      units: settings.units,
      offlineMode: settings.offlineMode,
      dataSyncEnabled: settings.dataSyncEnabled,
      location: settings.location,
      notificationPrefs: settings.notificationPrefs,
    };

    // Write-through: AsyncStorage (fast) + Firestore (durable)
    await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(data));
    settingsService.save(data).catch(() => {}); // Best-effort remote save

    return data;
  },
);

// ─── Slice ───────────────────────────────────────────────────────────────────

const initialState = {
  language: MOCK_SETTINGS.language,
  notifications: MOCK_SETTINGS.notifications,
  units: MOCK_SETTINGS.units,
  offlineMode: MOCK_SETTINGS.offlineMode,
  dataSyncEnabled: MOCK_SETTINGS.dataSyncEnabled,
  location: MOCK_SETTINGS.location,
  smsAlerts: true,
  emailNotifications: false,
  soundAlerts: true,
  notificationPrefs: {
    irrigationReminders: true,
    weatherAlerts: true,
    priceAlerts: true,
    deviceAlerts: true,
    dailySummary: false,
    dailySummaryTime: '07:00',
  },
  loaded: false,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setLanguage: (state, action) => {
      state.language = action.payload;
    },
    toggleNotifications: (state) => {
      state.notifications = !state.notifications;
    },
    setUnits: (state, action) => {
      state.units = action.payload;
    },
    toggleOfflineMode: (state) => {
      state.offlineMode = !state.offlineMode;
    },
    toggleDataSync: (state) => {
      state.dataSyncEnabled = !state.dataSyncEnabled;
    },
    toggleSmsAlerts: (state) => {
      state.smsAlerts = !state.smsAlerts;
    },
    toggleEmailNotifications: (state) => {
      state.emailNotifications = !state.emailNotifications;
    },
    toggleSoundAlerts: (state) => {
      state.soundAlerts = !state.soundAlerts;
    },
    setLocation: (state, action) => {
      state.location = action.payload;
      // Invalidate all weather caches (including location-specific keys)
      cache.delByPrefix('weather:').catch(() => {});
    },
    updateNotificationSettings: (state, action) => {
      state.notificationPrefs = { ...state.notificationPrefs, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder.addCase(loadSettings.fulfilled, (state, action) => {
      if (action.payload) {
        Object.assign(state, action.payload);
      }
      state.loaded = true;
    });
    builder.addCase(loadSettings.rejected, (state) => {
      state.loaded = true;
    });
  },
});

export const {
  setLanguage,
  toggleNotifications,
  setUnits,
  toggleOfflineMode,
  toggleDataSync,
  setLocation,
  toggleSmsAlerts,
  toggleEmailNotifications,
  toggleSoundAlerts,
  updateNotificationSettings,
} = settingsSlice.actions;

export default settingsSlice.reducer;
