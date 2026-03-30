import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { cropRecommendService } from '../../../services/api';

// ─── Async Thunks ────────────────────────────────────────────────────────────

export const fetchRecommendations = createAsyncThunk(
  'cropRecommend/fetchRecommendations',
  async ({ soilParams, climateParams } = {}, { rejectWithValue }) => {
    try {
      return await cropRecommendService.fetchRecommendations(soilParams, climateParams);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

// ─── Slice ───────────────────────────────────────────────────────────────────

const initialState = {
  recommendations: [],
  soilParams: null,
  climateParams: null,
  loading: false,
  error: null,
};

const cropRecommendSlice = createSlice({
  name: 'cropRecommend',
  initialState,
  reducers: {
    setSoilParams: (state, action) => {
      state.soilParams = action.payload;
    },
    setClimateParams: (state, action) => {
      state.climateParams = action.payload;
    },
    clearRecommendations: (state) => {
      state.recommendations = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRecommendations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRecommendations.fulfilled, (state, action) => {
        state.loading = false;
        state.recommendations = action.payload.recommendations;
        state.soilParams = action.payload.soilParams;
        state.climateParams = action.payload.climateParams;
      })
      .addCase(fetchRecommendations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setSoilParams, setClimateParams, clearRecommendations } = cropRecommendSlice.actions;
export default cropRecommendSlice.reducer;
