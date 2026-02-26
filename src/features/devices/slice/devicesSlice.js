import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { mockDelay } from '../../../utils/mockDelay';
import { MOCK_DEVICES } from '../mock/devicesMockData';

// ─── Async Thunks ────────────────────────────────────────────────────────────

export const fetchDevices = createAsyncThunk(
  'devices/fetchDevices',
  async (_, { rejectWithValue }) => {
    try {
      await mockDelay(600);
      return [...MOCK_DEVICES];
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
  error: null,
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

export const { selectDevice, clearSelectedDevice } = devicesSlice.actions;
export default devicesSlice.reducer;
