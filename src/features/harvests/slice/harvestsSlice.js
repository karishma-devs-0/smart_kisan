import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { harvestService } from '../../../services/api';
import { logout } from '../../auth/slice/authSlice';

// ─── Async Thunks ────────────────────────────────────────────────────────────

export const fetchHarvests = createAsyncThunk(
  'harvests/fetchHarvests',
  async (crop, { rejectWithValue }) => {
    try {
      return await harvestService.fetchHarvests(crop);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const fetchYieldSummary = createAsyncThunk(
  'harvests/fetchYieldSummary',
  async (_, { rejectWithValue }) => {
    try {
      return await harvestService.fetchYieldSummary();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const recordHarvest = createAsyncThunk(
  'harvests/recordHarvest',
  async (harvest, { dispatch, rejectWithValue }) => {
    try {
      const created = await harvestService.createHarvest(harvest);
      // The yield figures change with every record, and they are what the
      // reports and the crop screens read, so they are refreshed here rather
      // than left for whichever screen happens to load next.
      dispatch(fetchYieldSummary());
      return created;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const updateHarvest = createAsyncThunk(
  'harvests/updateHarvest',
  async ({ id, ...updates }, { dispatch, rejectWithValue }) => {
    try {
      const updated = await harvestService.updateHarvest(id, updates);
      dispatch(fetchYieldSummary());
      return updated;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const deleteHarvest = createAsyncThunk(
  'harvests/deleteHarvest',
  async (id, { dispatch, rejectWithValue }) => {
    try {
      await harvestService.deleteHarvest(id);
      dispatch(fetchYieldSummary());
      return id;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

// ─── Slice ───────────────────────────────────────────────────────────────────

const initialState = {
  harvests: [],
  // Per crop: average, best and worst yield per acre, and how the last season
  // compared. Empty until something has been recorded.
  yieldByCrop: [],
  enoughForTrend: false,
  loading: false,
  saving: false,
  error: null,
};

const harvestsSlice = createSlice({
  name: 'harvests',
  initialState,
  reducers: {
    clearHarvestError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchHarvests.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHarvests.fulfilled, (state, action) => {
        state.loading = false;
        state.harvests = action.payload;
      })
      .addCase(fetchHarvests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    builder.addCase(fetchYieldSummary.fulfilled, (state, action) => {
      state.yieldByCrop = action.payload?.crops || [];
      state.enoughForTrend = Boolean(action.payload?.enoughForTrend);
    });

    builder
      .addCase(recordHarvest.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(recordHarvest.fulfilled, (state, action) => {
        state.saving = false;
        state.harvests.unshift(action.payload);
      })
      .addCase(recordHarvest.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      });

    builder
      .addCase(updateHarvest.pending, (state) => {
        state.saving = true;
      })
      .addCase(updateHarvest.fulfilled, (state, action) => {
        state.saving = false;
        const i = state.harvests.findIndex((h) => h.id === action.payload.id);
        if (i !== -1) state.harvests[i] = action.payload;
      })
      .addCase(updateHarvest.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      });

    builder
      .addCase(deleteHarvest.fulfilled, (state, action) => {
        state.harvests = state.harvests.filter((h) => h.id !== action.payload);
      })
      .addCase(deleteHarvest.rejected, (state, action) => {
        state.error = action.payload;
      });

    // One farmer's harvest history must not be visible to the next person who
    // signs in on the same phone.
    builder.addCase(logout.fulfilled, () => initialState);
  },
});

export const { clearHarvestError } = harvestsSlice.actions;
export default harvestsSlice.reducer;
