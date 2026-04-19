import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { analyticsService } from '../../../services/api';

// ─── Async Thunks ────────────────────────────────────────────────────────────

export const fetchAnalytics = createAsyncThunk(
  'analytics/fetchAnalytics',
  async (_, { getState, rejectWithValue }) => {
    try {
      // Gather weather + soil + fields data for the irrigation engine
      const state = getState();
      const forecast = state.weather?.forecast || [];
      const soilData = state.soil?.data || {};
      const fields = state.fields?.fields || [];
      const location = state.settings?.location || null;

      return await analyticsService.fetchAnalytics({
        forecast,
        soilData,
        fields,
        location,
      });
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

// ─── Slice ───────────────────────────────────────────────────────────────────

const initialState = {
  cropHealth: null,
  aiInsights: [],
  ndviData: null,
  yieldPrediction: null,
  irrigationSchedule: [],
  expertNetwork: [],
  loading: false,
  error: null,
};

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    clearAnalytics: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAnalytics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.cropHealth = action.payload.cropHealth;
        state.aiInsights = action.payload.aiInsights;
        state.ndviData = action.payload.ndviData;
        state.yieldPrediction = action.payload.yieldPrediction;
        state.irrigationSchedule = action.payload.irrigationSchedule;
        state.expertNetwork = action.payload.expertNetwork;
      })
      .addCase(fetchAnalytics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearAnalytics } = analyticsSlice.actions;
export default analyticsSlice.reducer;
