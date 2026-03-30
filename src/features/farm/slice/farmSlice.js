import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { farmService } from '../../../services/api';

// ─── Async Thunks ────────────────────────────────────────────────────────────

export const fetchFarmData = createAsyncThunk(
  'farm/fetchFarmData',
  async (_, { rejectWithValue }) => {
    try {
      return await farmService.fetchFarmData();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

// ─── Slice ───────────────────────────────────────────────────────────────────

const initialState = {
  tasks: [],
  categories: [],
  growthTrends: [],
  loading: false,
  error: null,
};

const farmSlice = createSlice({
  name: 'farm',
  initialState,
  reducers: {
    updateTaskStatus: (state, action) => {
      const { id, status } = action.payload;
      const task = state.tasks.find((t) => t.id === id);
      if (task) {
        task.status = status;
      }
    },
  },
  extraReducers: (builder) => {
    // fetchFarmData
    builder
      .addCase(fetchFarmData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFarmData.fulfilled, (state, action) => {
        state.loading = false;
        state.tasks = action.payload.tasks;
        state.categories = action.payload.categories;
        state.growthTrends = action.payload.growthTrends;
      })
      .addCase(fetchFarmData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { updateTaskStatus } = farmSlice.actions;
export default farmSlice.reducer;
