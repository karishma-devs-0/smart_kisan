import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { mockDelay } from '../../../utils/mockDelay';
import {
  MOCK_CROP_HEALTH,
  MOCK_AI_INSIGHTS,
  MOCK_NDVI_DATA,
  MOCK_YIELD_PREDICTION,
  MOCK_IRRIGATION_SCHEDULE,
  MOCK_EXPERT_NETWORK,
} from '../mock/analyticsMockData';

// ─── Async Thunks ────────────────────────────────────────────────────────────

export const fetchAnalytics = createAsyncThunk(
  'analytics/fetchAnalytics',
  async (_, { rejectWithValue }) => {
    try {
      await mockDelay(800);
      return {
        cropHealth: MOCK_CROP_HEALTH,
        aiInsights: MOCK_AI_INSIGHTS,
        ndviData: MOCK_NDVI_DATA,
        yieldPrediction: MOCK_YIELD_PREDICTION,
        irrigationSchedule: MOCK_IRRIGATION_SCHEDULE,
        expertNetwork: MOCK_EXPERT_NETWORK,
      };
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
    // fetchAnalytics
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
