import { configureStore } from '@reduxjs/toolkit';

import authReducer from '../features/auth/slice/authSlice';
import pumpsReducer from '../features/pumps/slice/pumpsSlice';
import cropsReducer from '../features/crops/slice/cropsSlice';
import soilReducer from '../features/soil/slice/soilSlice';
import weatherReducer from '../features/weather/slice/weatherSlice';
import reportsReducer from '../features/reports/slice/reportsSlice';
import settingsReducer from '../features/settings/slice/settingsSlice';
import devicesReducer from '../features/devices/slice/devicesSlice';
import analyticsReducer from '../features/analytics/slice/analyticsSlice';
import farmReducer from '../features/farm/slice/farmSlice';
import fieldsReducer from '../features/fields/slice/fieldsSlice';

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
  },
});

export { store };
export default store;
