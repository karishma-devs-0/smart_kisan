import { createSlice } from '@reduxjs/toolkit';
import { MOCK_SETTINGS } from '../mock/settingsMockData';

const initialState = {
  language: MOCK_SETTINGS.language,
  notifications: MOCK_SETTINGS.notifications,
  units: MOCK_SETTINGS.units,
  offlineMode: MOCK_SETTINGS.offlineMode,
  dataSyncEnabled: MOCK_SETTINGS.dataSyncEnabled,
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
  },
});

export const {
  setLanguage,
  toggleNotifications,
  setUnits,
  toggleOfflineMode,
  toggleDataSync,
} = settingsSlice.actions;

export default settingsSlice.reducer;
