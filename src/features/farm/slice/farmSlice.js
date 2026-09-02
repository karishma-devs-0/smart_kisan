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

export const createTask = createAsyncThunk(
  'farm/createTask',
  async (task, { rejectWithValue }) => {
    try {
      return await farmService.createTask(task);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

/**
 * Marking a task done, or editing it.
 *
 * This used to be a plain reducer that changed local state only, so a task
 * ticked off reappeared as outstanding on the next launch.
 */
export const saveTask = createAsyncThunk(
  'farm/saveTask',
  async ({ id, ...updates }, { rejectWithValue }) => {
    try {
      return await farmService.updateTask(id, updates);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const deleteTask = createAsyncThunk(
  'farm/deleteTask',
  async (id, { rejectWithValue }) => {
    try {
      await farmService.deleteTask(id);
      return id;
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
  saving: false,
  error: null,
};

const farmSlice = createSlice({
  name: 'farm',
  initialState,
  reducers: {
    clearFarmError: (state) => {
      state.error = null;
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

    // createTask
    builder
      .addCase(createTask.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(createTask.fulfilled, (state, action) => {
        state.saving = false;
        state.tasks.unshift(action.payload);
      })
      .addCase(createTask.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      });

    // saveTask
    builder
      .addCase(saveTask.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(saveTask.fulfilled, (state, action) => {
        state.saving = false;
        const i = state.tasks.findIndex((t) => t.id === action.payload.id);
        if (i !== -1) state.tasks[i] = action.payload;
      })
      .addCase(saveTask.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      });

    // deleteTask
    builder
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.tasks = state.tasks.filter((t) => t.id !== action.payload);
      })
      .addCase(deleteTask.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { clearFarmError } = farmSlice.actions;
export default farmSlice.reducer;
