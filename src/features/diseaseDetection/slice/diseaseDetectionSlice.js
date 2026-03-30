import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { diseaseDetectionService } from '../../../services/api';

// ─── Async Thunks ────────────────────────────────────────────────────────────

export const scanImage = createAsyncThunk(
  'diseaseDetection/scanImage',
  async (imageUri, { rejectWithValue }) => {
    try {
      return await diseaseDetectionService.scanImage(imageUri);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const fetchScanHistory = createAsyncThunk(
  'diseaseDetection/fetchScanHistory',
  async (_, { rejectWithValue }) => {
    try {
      return await diseaseDetectionService.fetchScanHistory();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

// ─── Slice ───────────────────────────────────────────────────────────────────

const initialState = {
  scanHistory: [],
  currentScan: null,
  loading: false,
  error: null,
};

const diseaseDetectionSlice = createSlice({
  name: 'diseaseDetection',
  initialState,
  reducers: {
    setCurrentScan: (state, action) => {
      state.currentScan = action.payload;
    },
    clearCurrentScan: (state) => {
      state.currentScan = null;
    },
  },
  extraReducers: (builder) => {
    // scanImage
    builder
      .addCase(scanImage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(scanImage.fulfilled, (state, action) => {
        state.loading = false;
        state.currentScan = action.payload;
        state.scanHistory = [action.payload, ...state.scanHistory];
      })
      .addCase(scanImage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // fetchScanHistory
    builder
      .addCase(fetchScanHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchScanHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.scanHistory = action.payload;
      })
      .addCase(fetchScanHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setCurrentScan, clearCurrentScan } = diseaseDetectionSlice.actions;
export default diseaseDetectionSlice.reducer;
