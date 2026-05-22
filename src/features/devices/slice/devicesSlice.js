import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { deviceService } from '../../../services/api';

// ─── Async Thunks ────────────────────────────────────────────────────────────

export const fetchDevices = createAsyncThunk(
  'devices/fetchDevices',
  async (_, { rejectWithValue }) => {
    try {
      return await deviceService.fetchDevices();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const fetchAlertRules = createAsyncThunk(
  'devices/fetchAlertRules',
  async (_, { rejectWithValue }) => {
    try {
      return await deviceService.fetchAlertRules();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const saveDevice = createAsyncThunk(
  'devices/saveDevice',
  async (device, { rejectWithValue }) => {
    try {
      return await deviceService.saveDevice(device);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const updateDevice = createAsyncThunk(
  'devices/updateDevice',
  async ({ id, updates }, { rejectWithValue }) => {
    try {
      return await deviceService.updateDevice(id, updates);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const deleteDevice = createAsyncThunk(
  'devices/deleteDevice',
  async (id, { rejectWithValue }) => {
    try {
      await deviceService.deleteDevice(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const saveCalibration = createAsyncThunk(
  'devices/saveCalibration',
  async (payload, { rejectWithValue }) => {
    try {
      const { deviceId, ...calibrationData } = payload;
      return await deviceService.updateDevice(deviceId, { calibration: calibrationData });
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const saveAlertRule = createAsyncThunk(
  'devices/saveAlertRule',
  async (rule, { rejectWithValue }) => {
    try {
      return await deviceService.saveAlertRule(rule);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const deleteAlertRule = createAsyncThunk(
  'devices/deleteAlertRule',
  async (id, { rejectWithValue }) => {
    try {
      await deviceService.deleteAlertRule(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

// ─── Slice ───────────────────────────────────────────────────────────────────

const initialState = {
  devices: [],
  selectedDevice: null,
  loading: false,
  saving: false,
  error: null,
  alertRules: [],
  triggeredAlerts: [],
  notifiedKeys: [],
};

const devicesSlice = createSlice({
  name: 'devices',
  initialState,
  reducers: {
    selectDevice: (state, action) => {
      state.selectedDevice = action.payload;
    },
    clearSelectedDevice: (state) => {
      state.selectedDevice = null;
    },
    // MQTT telemetry — high-frequency, no round-trip to Firestore
    updateDeviceTelemetry: (state, action) => {
      const { id, telemetry } = action.payload;
      const idx = state.devices.findIndex((d) => d.id === id);
      if (idx >= 0) {
        state.devices[idx] = { ...state.devices[idx], ...telemetry, lastSeen: new Date().toISOString() };
      }
    },
    pushAlert: (state, action) => {
      state.triggeredAlerts.unshift(action.payload);
      // Cap history at 100 to stop the array growing unboundedly
      if (state.triggeredAlerts.length > 100) state.triggeredAlerts.length = 100;
    },
    markNotified: (state, action) => {
      if (!state.notifiedKeys.includes(action.payload)) {
        state.notifiedKeys.push(action.payload);
      }
    },
    resolveAlert: (state, action) => {
      state.triggeredAlerts = state.triggeredAlerts.filter((a) => a.ruleId !== action.payload);
    },
    toggleAlertRule: (state, action) => {
      const rule = state.alertRules.find((r) => r.id === action.payload);
      if (rule) rule.enabled = !rule.enabled;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDevices.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDevices.fulfilled, (state, action) => {
        state.loading = false;
        state.devices = action.payload;
      })
      .addCase(fetchDevices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    builder
      .addCase(fetchAlertRules.fulfilled, (state, action) => {
        state.alertRules = action.payload || [];
      });

    builder
      .addCase(saveDevice.fulfilled, (state, action) => {
        state.devices.push(action.payload);
      })
      .addCase(updateDevice.fulfilled, (state, action) => {
        const idx = state.devices.findIndex((d) => d.id === action.payload.id);
        if (idx >= 0) state.devices[idx] = { ...state.devices[idx], ...action.payload };
      })
      .addCase(deleteDevice.fulfilled, (state, action) => {
        state.devices = state.devices.filter((d) => d.id !== action.payload);
      });

    builder
      .addCase(saveCalibration.fulfilled, (state, action) => {
        const idx = state.devices.findIndex((d) => d.id === action.payload.id);
        if (idx >= 0) state.devices[idx] = { ...state.devices[idx], calibration: action.payload.calibration };
      });

    builder
      .addCase(saveAlertRule.fulfilled, (state, action) => {
        const existing = state.alertRules.findIndex((r) => r.id === action.payload.id);
        if (existing >= 0) {
          state.alertRules[existing] = action.payload;
        } else {
          state.alertRules.push(action.payload);
        }
      })
      .addCase(deleteAlertRule.fulfilled, (state, action) => {
        state.alertRules = state.alertRules.filter((r) => r.id !== action.payload);
      });
  },
});

export const {
  selectDevice,
  clearSelectedDevice,
  updateDeviceTelemetry,
  pushAlert,
  markNotified,
  resolveAlert,
  toggleAlertRule,
} = devicesSlice.actions;
export default devicesSlice.reducer;
