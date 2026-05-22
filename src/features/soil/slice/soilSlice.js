import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { soilService } from '../../../services/api';
import { computeHealthScore, mergeLatestReading } from '../utils/soilHealth';

// ─── Helpers ────────────────────────────────────────────────────────────────

const recomputeCurrent = (state) => {
  const selectedCrop = state.soilCrops.find((c) => c.id === state.selectedCropId) || state.soilCrops[0];
  const cropName = selectedCrop?.name;
  state.healthScore = computeHealthScore(state.current, cropName);
  state.current.healthScore = state.healthScore;
};

// ─── Async Thunks ────────────────────────────────────────────────────────────

export const fetchSoilData = createAsyncThunk(
  'soil/fetchSoilData',
  async (_, { rejectWithValue }) => {
    try {
      return await soilService.fetchSoilData();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const fetchMoistureHistory = createAsyncThunk(
  'soil/fetchMoistureHistory',
  async (_, { rejectWithValue }) => {
    try {
      return await soilService.fetchMoistureHistory();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const fetchPhHistory = createAsyncThunk(
  'soil/fetchPhHistory',
  async (_, { rejectWithValue }) => {
    try {
      return await soilService.fetchPhHistory();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const fetchNpkHistory = createAsyncThunk(
  'soil/fetchNpkHistory',
  async (_, { rejectWithValue }) => {
    try {
      return await soilService.fetchNpkHistory();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const fetchFertilizerHistory = createAsyncThunk(
  'soil/fetchFertilizerHistory',
  async (_, { rejectWithValue }) => {
    try {
      return await soilService.fetchFertilizerHistory();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const saveSoilReading = createAsyncThunk(
  'soil/saveSoilReading',
  async (reading, { getState, rejectWithValue }) => {
    try {
      const withId = { id: reading.id || Date.now().toString(), ...reading };
      const saved = await soilService.addSoilReading(withId);

      const state = getState().soil;
      const newCurrent = mergeLatestReading(state.current, saved);
      const selectedCrop = state.soilCrops.find((c) => c.id === state.selectedCropId) || state.soilCrops[0];
      const healthScore = computeHealthScore(newCurrent, selectedCrop?.name);
      const updatedCurrent = { ...newCurrent, healthScore };

      await soilService.updateCurrentSoil(updatedCurrent);

      return { reading: saved, current: updatedCurrent, healthScore };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const deleteSoilReading = createAsyncThunk(
  'soil/deleteSoilReading',
  async (readingId, { rejectWithValue }) => {
    try {
      await soilService.deleteSoilReading(readingId);
      return readingId;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const addSoilCrop = createAsyncThunk(
  'soil/addSoilCrop',
  async (crop, { rejectWithValue }) => {
    try {
      return await soilService.saveSoilCrop(crop);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const removeSoilCrop = createAsyncThunk(
  'soil/removeSoilCrop',
  async (cropId, { rejectWithValue }) => {
    try {
      await soilService.removeSoilCrop(cropId);
      return cropId;
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
      recomputeCurrent(state);
    },
    // Sensor-pushed reading (MQTT) — updates current in place, persistence handled by caller
    ingestSensorReading(state, action) {
      const reading = action.payload;
      state.soilReadings.unshift(reading);
      state.current = mergeLatestReading(state.current, reading);
      recomputeCurrent(state);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSoilData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSoilData.fulfilled, (state, action) => {
        state.loading = false;
        state.current = action.payload.current || state.current;
        state.organicCarbon = action.payload.current?.organicCarbon ?? 0;
        state.texture = action.payload.current?.texture ?? '';
        state.soilCrops = action.payload.soilCrops ?? [];
        state.soilReadings = action.payload.soilReadings ?? [];
        if (!state.selectedCropId && state.soilCrops.length > 0) {
          state.selectedCropId = state.soilCrops[0].id;
        }
        recomputeCurrent(state);
      })
      .addCase(fetchSoilData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    builder
      .addCase(fetchMoistureHistory.fulfilled, (state, action) => {
        state.moistureHistory = action.payload;
      })
      .addCase(fetchPhHistory.fulfilled, (state, action) => {
        state.phHistory = action.payload;
      })
      .addCase(fetchNpkHistory.fulfilled, (state, action) => {
        state.npkHistory = action.payload;
      })
      .addCase(fetchFertilizerHistory.fulfilled, (state, action) => {
        state.fertilizerHistory = action.payload;
      });

    builder
      .addCase(saveSoilReading.fulfilled, (state, action) => {
        state.soilReadings.unshift(action.payload.reading);
        state.current = action.payload.current;
        state.healthScore = action.payload.healthScore;
      })
      .addCase(deleteSoilReading.fulfilled, (state, action) => {
        state.soilReadings = state.soilReadings.filter((r) => r.id !== action.payload);
      });

    builder
      .addCase(addSoilCrop.fulfilled, (state, action) => {
        state.soilCrops.push(action.payload);
        if (!state.selectedCropId) {
          state.selectedCropId = action.payload.id;
          recomputeCurrent(state);
        }
      })
      .addCase(removeSoilCrop.fulfilled, (state, action) => {
        state.soilCrops = state.soilCrops.filter((c) => c.id !== action.payload);
        if (state.selectedCropId === action.payload) {
          state.selectedCropId = state.soilCrops[0]?.id || null;
          recomputeCurrent(state);
        }
      });
  },
});

export const { setSelectedCrop, ingestSensorReading } = soilSlice.actions;
export default soilSlice.reducer;
