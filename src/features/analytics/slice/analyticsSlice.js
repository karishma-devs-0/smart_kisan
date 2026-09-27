import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { analyticsService } from '../../../services/api';

// ─── Async Thunks ────────────────────────────────────────────────────────────

export const fetchAnalytics = createAsyncThunk(
  'analytics/fetchAnalytics',
  async (_, { getState, rejectWithValue }) => {
    try {
      // Everything the health and irrigation engines score from.
      const state = getState();
      const forecast = state.weather?.forecast || [];
      // The soil slice keeps the latest reading under `current`. This read
      // `state.soil.data`, which does not exist, so soil arrived empty every
      // time - the irrigation engine has never seen a reading either.
      const soilData = state.soil?.current || null;
      const fields = state.fields?.fields || [];
      const crops = state.crops?.crops || [];
      const pumps = state.pumps?.pumps || [];
      // Past yields per crop, which is what the prediction is drawn from.
      const yieldByCrop = state.harvests?.yieldByCrop || [];
      const location = state.settings?.location || null;

      return await analyticsService.fetchAnalytics({
        forecast,
        soilData,
        fields,
        crops,
        pumps,
        yieldByCrop,
        location,
      });
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

// ─── Slice ───────────────────────────────────────────────────────────────────

const initialState = {
  rainOutlook: null,
  growingDegreeDays: null,
  weatherAlerts: null,
  sprayAdvice: null,
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
        state.sprayAdvice = action.payload.sprayAdvice;
        state.weatherAlerts = action.payload.weatherAlerts;
        state.growingDegreeDays = action.payload.growingDegreeDays;
        state.rainOutlook = action.payload.rainOutlook;
      })
      .addCase(fetchAnalytics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearAnalytics } = analyticsSlice.actions;
export default analyticsSlice.reducer;
