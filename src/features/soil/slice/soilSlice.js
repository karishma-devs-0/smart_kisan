import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { soilService } from '../../../services/api';

// ─── Async Thunks ────────────────────────────────────────────────────────────

export const fetchSoilData = createAsyncThunk(
  'soil/fetchSoilData',
  async (_, { rejectWithValue }) => {
    try {
      const data = await soilService.fetchSoilData();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const fetchMoistureHistory = createAsyncThunk(
  'soil/fetchMoistureHistory',
  async (_, { rejectWithValue }) => {
    try {
      const data = await soilService.fetchMoistureHistory();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const fetchPhHistory = createAsyncThunk(
  'soil/fetchPhHistory',
  async (_, { rejectWithValue }) => {
    try {
      const data = await soilService.fetchPhHistory();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const fetchNpkHistory = createAsyncThunk(
  'soil/fetchNpkHistory',
  async (_, { rejectWithValue }) => {
    try {
      const data = await soilService.fetchNpkHistory();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const fetchFertilizerHistory = createAsyncThunk(
  'soil/fetchFertilizerHistory',
  async (_, { rejectWithValue }) => {
    try {
      const data = await soilService.fetchFertilizerHistory();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

// ─── Slice ───────────────────────────────────────────────────────────────────

const initialState = {
  current: {
    moisture: 0,
    temperature: 0,
    pH: 0,
    nitrogen: 0,
    phosphorus: 0,
    potassium: 0,
    ec: 0,
  },
  moistureHistory: [],
  phHistory: [],
  npkHistory: [],
  fertilizerHistory: [],
  soilCrops: [],
  selectedCropId: null,
  soilReadings: [],
  organicCarbon: 0,
  texture: '',
  healthScore: 0,
  loading: false,
  error: null,
};

const soilSlice = createSlice({
  name: 'soil',
  initialState,
  reducers: {
    setSelectedCrop(state, action) {
      state.selectedCropId = action.payload;
    },
    addSoilReading(state, action) {
      state.soilReadings.unshift(action.payload);
    },
    deleteSoilReading(state, action) {
      state.soilReadings = state.soilReadings.filter(
        (r) => r.id !== action.payload,
      );
    },
    addSoilCrop(state, action) {
      state.soilCrops.push(action.payload);
    },
    removeSoilCrop(state, action) {
      state.soilCrops = state.soilCrops.filter(
        (c) => c.id !== action.payload,
      );
    },
  },
  extraReducers: (builder) => {
    // fetchSoilData
    builder
      .addCase(fetchSoilData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSoilData.fulfilled, (state, action) => {
        state.loading = false;
        state.current = action.payload.current;
        state.organicCarbon = action.payload.current.organicCarbon ?? 0;
        state.texture = action.payload.current.texture ?? '';
        state.healthScore = action.payload.current.healthScore ?? 0;
        state.soilCrops = action.payload.soilCrops ?? [];
        state.soilReadings = action.payload.soilReadings ?? [];
      })
      .addCase(fetchSoilData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // fetchMoistureHistory
    builder
      .addCase(fetchMoistureHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMoistureHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.moistureHistory = action.payload;
      })
      .addCase(fetchMoistureHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // fetchPhHistory
    builder
      .addCase(fetchPhHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPhHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.phHistory = action.payload;
      })
      .addCase(fetchPhHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // fetchNpkHistory
    builder
      .addCase(fetchNpkHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNpkHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.npkHistory = action.payload;
      })
      .addCase(fetchNpkHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // fetchFertilizerHistory
    builder
      .addCase(fetchFertilizerHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFertilizerHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.fertilizerHistory = action.payload;
      })
      .addCase(fetchFertilizerHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  setSelectedCrop,
  addSoilReading,
  deleteSoilReading,
  addSoilCrop,
  removeSoilCrop,
} = soilSlice.actions;

export default soilSlice.reducer;
