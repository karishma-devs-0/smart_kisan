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

// ─── Slice ───────────────────────────────────────────────────────────────────

const initialState = {
  devices: [],
  selectedDevice: null,
  calibrations: [],
  loading: false,
  error: null,
  alertRules: [],
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
    addDevice: (state, action) => {
      state.devices.push(action.payload);
    },
    removeDevice: (state, action) => {
      state.devices = state.devices.filter((d) => d.id !== action.payload);
    },
    addAlertRule: (state, action) => {
      state.alertRules.push(action.payload);
    },
    removeAlertRule: (state, action) => {
      state.alertRules = state.alertRules.filter((r) => r.id !== action.payload);
    },
    toggleAlertRule: (state, action) => {
      const rule = state.alertRules.find((r) => r.id === action.payload);
      if (rule) {
        rule.active = !rule.active;
      }
    },
    saveCalibration: (state, action) => {
      state.calibrations.push(action.payload);
    },
  },
  extraReducers: (builder) => {
    // fetchDevices
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
  },
});

export const { selectDevice, clearSelectedDevice, addDevice, removeDevice, addAlertRule, removeAlertRule, toggleAlertRule, saveCalibration } = devicesSlice.actions;
export default devicesSlice.reducer;
