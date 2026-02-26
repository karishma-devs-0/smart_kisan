import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { reportService } from '../../../services/api';

// ─── Async Thunks ────────────────────────────────────────────────────────────

export const fetchReports = createAsyncThunk(
  'reports/fetchReports',
  async (_, { rejectWithValue }) => {
    try {
      const data = await reportService.fetchReports();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

// ─── Slice ───────────────────────────────────────────────────────────────────

const initialState = {
  waterUsage: null,
  runHours: null,
  pumpRuntime: [],
  soilCondition: null,
  harvestPerformance: null,
  generalMetrics: null,
  loading: false,
  error: null,
};

const reportsSlice = createSlice({
  name: 'reports',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchReports.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReports.fulfilled, (state, action) => {
        state.loading = false;
        state.waterUsage = action.payload.waterUsage;
        state.runHours = action.payload.runHours;
        state.pumpRuntime = action.payload.pumpRuntime;
        state.soilCondition = action.payload.soilCondition;
        state.harvestPerformance = action.payload.harvestPerformance;
        state.generalMetrics = action.payload.generalMetrics;
      })
      .addCase(fetchReports.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default reportsSlice.reducer;
