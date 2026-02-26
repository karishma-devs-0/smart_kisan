import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { cropService } from '../../../services/api';

// ─── Async Thunks ────────────────────────────────────────────────────────────

export const fetchCrops = createAsyncThunk(
  'crops/fetchCrops',
  async (_, { rejectWithValue }) => {
    try {
      const crops = await cropService.fetchCrops();
      return crops;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const addCrop = createAsyncThunk(
  'crops/addCrop',
  async (crop, { rejectWithValue }) => {
    try {
      const newCrop = await cropService.addCrop(crop);
      return newCrop;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const updateCrop = createAsyncThunk(
  'crops/updateCrop',
  async (crop, { rejectWithValue }) => {
    try {
      const updated = await cropService.updateCrop(crop);
      return updated;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const deleteCrop = createAsyncThunk(
  'crops/deleteCrop',
  async (id, { rejectWithValue }) => {
    try {
      await cropService.deleteCrop(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

// ─── Slice ───────────────────────────────────────────────────────────────────

const initialState = {
  crops: [],
  selectedCropId: null,
  loading: false,
  error: null,
};

const cropsSlice = createSlice({
  name: 'crops',
  initialState,
  reducers: {
    setSelectedCrop: (state, action) => {
      state.selectedCropId = action.payload;
    },
  },
  extraReducers: (builder) => {
    // fetchCrops
    builder
      .addCase(fetchCrops.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCrops.fulfilled, (state, action) => {
        state.loading = false;
        state.crops = action.payload;
      })
      .addCase(fetchCrops.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // addCrop
    builder
      .addCase(addCrop.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addCrop.fulfilled, (state, action) => {
        state.loading = false;
        state.crops.push(action.payload);
      })
      .addCase(addCrop.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // updateCrop
    builder
      .addCase(updateCrop.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCrop.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.crops.findIndex(
          (c) => c.id === action.payload.id,
        );
        if (index !== -1) {
          state.crops[index] = action.payload;
        }
      })
      .addCase(updateCrop.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // deleteCrop
    builder
      .addCase(deleteCrop.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCrop.fulfilled, (state, action) => {
        state.loading = false;
        state.crops = state.crops.filter((c) => c.id !== action.payload);
        if (state.selectedCropId === action.payload) {
          state.selectedCropId = null;
        }
      })
      .addCase(deleteCrop.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setSelectedCrop } = cropsSlice.actions;
export default cropsSlice.reducer;
