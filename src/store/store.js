import { configureStore } from '@reduxjs/toolkit';

import authReducer from '../features/auth/slice/authSlice';
import pumpsReducer from '../features/pumps/slice/pumpsSlice';
import cropsReducer from '../features/crops/slice/cropsSlice';
import soilReducer from '../features/soil/slice/soilSlice';
import weatherReducer from '../features/weather/slice/weatherSlice';
import reportsReducer from '../features/reports/slice/reportsSlice';
import settingsReducer, { saveSettings } from '../features/settings/slice/settingsSlice';
import devicesReducer from '../features/devices/slice/devicesSlice';
import analyticsReducer from '../features/analytics/slice/analyticsSlice';
import farmReducer from '../features/farm/slice/farmSlice';
import fieldsReducer from '../features/fields/slice/fieldsSlice';
import onboardingReducer from '../features/onboarding/slice/onboardingSlice';
import marketplaceReducer from '../features/marketplace/slice/marketplaceSlice';
import cropRecommendReducer from '../features/cropRecommend/slice/cropRecommendSlice';
import diseaseDetectionReducer from '../features/diseaseDetection/slice/diseaseDetectionSlice';

// Auto-persist settings on every settings reducer action
const SETTINGS_ACTIONS = [
  'settings/setLanguage',
  'settings/toggleNotifications',
  'settings/setUnits',
  'settings/toggleOfflineMode',
  'settings/toggleDataSync',
  'settings/setLocation',
];

const settingsPersistMiddleware = (storeAPI) => (next) => (action) => {
  const result = next(action);
  if (SETTINGS_ACTIONS.includes(action.type)) {
    storeAPI.dispatch(saveSettings());
  }
  return result;
};

const store = configureStore({
  reducer: {
    auth: authReducer,
    pumps: pumpsReducer,
    crops: cropsReducer,
    soil: soilReducer,
    weather: weatherReducer,
    reports: reportsReducer,
    settings: settingsReducer,
    devices: devicesReducer,
    analytics: analyticsReducer,
    farm: farmReducer,
    fields: fieldsReducer,
    onboarding: onboardingReducer,
    marketplace: marketplaceReducer,
    cropRecommend: cropRecommendReducer,
    diseaseDetection: diseaseDetectionReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(settingsPersistMiddleware),
});

export { store };
export default store;
