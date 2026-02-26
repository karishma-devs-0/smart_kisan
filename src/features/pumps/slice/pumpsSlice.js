import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { pumpService } from '../../../services/api';

// ─── Async Thunks ────────────────────────────────────────────────────────────

export const fetchPumps = createAsyncThunk(
  'pumps/fetchPumps',
  async (_, { rejectWithValue }) => {
    try {
      const pumps = await pumpService.fetchPumps();
      return pumps;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const fetchGroups = createAsyncThunk(
  'pumps/fetchGroups',
  async (_, { rejectWithValue }) => {
    try {
      const groups = await pumpService.fetchGroups();
      return groups;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const savePump = createAsyncThunk(
  'pumps/savePump',
  async (pump, { rejectWithValue }) => {
    try {
      const saved = await pumpService.savePump(pump);
      return saved;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const saveGroup = createAsyncThunk(
  'pumps/saveGroup',
  async (group, { rejectWithValue }) => {
    try {
      const saved = await pumpService.saveGroup(group);
      return saved;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

// ─── Slice ───────────────────────────────────────────────────────────────────

const initialState = {
  pumps: [],
  groups: [],
  currentMode: 'manual',
  activeTimers: {},
  selectedPumpId: null,
  loading: false,
  error: null,
};

const pumpsSlice = createSlice({
  name: 'pumps',
  initialState,
  reducers: {
    setMode: (state, action) => {
      state.currentMode = action.payload;
    },
    togglePump: (state, action) => {
      const pump = state.pumps.find((p) => p.id === action.payload);
      if (pump) {
        pump.status = pump.status === 'on' ? 'off' : 'on';
      }
    },
    setSelectedPump: (state, action) => {
      state.selectedPumpId = action.payload;
    },
    stopAllPumps: (state) => {
      state.pumps.forEach((pump) => {
        pump.status = 'off';
      });
      state.activeTimers = {};
    },
    startTimer: (state, action) => {
      const { pumpId, seconds } = action.payload;
      state.activeTimers[pumpId] = seconds;
      const pump = state.pumps.find((p) => p.id === pumpId);
      if (pump) {
        pump.status = 'on';
      }
    },
    tickTimer: (state, action) => {
      const pumpId = action.payload;
      if (state.activeTimers[pumpId] !== undefined) {
        state.activeTimers[pumpId] -= 1;
        if (state.activeTimers[pumpId] <= 0) {
          delete state.activeTimers[pumpId];
          const pump = state.pumps.find((p) => p.id === pumpId);
          if (pump) {
            pump.status = 'off';
          }
        }
      }
    },
    stopTimer: (state, action) => {
      const pumpId = action.payload;
      delete state.activeTimers[pumpId];
      const pump = state.pumps.find((p) => p.id === pumpId);
      if (pump) {
        pump.status = 'off';
      }
    },
    updatePumpField: (state, action) => {
      const { id, field, value } = action.payload;
      const pump = state.pumps.find((p) => p.id === id);
      if (pump) {
        pump[field] = value;
      }
    },
  },
  extraReducers: (builder) => {
    // fetchPumps
    builder
      .addCase(fetchPumps.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPumps.fulfilled, (state, action) => {
        state.loading = false;
        state.pumps = action.payload;
      })
      .addCase(fetchPumps.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // fetchGroups
    builder
      .addCase(fetchGroups.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGroups.fulfilled, (state, action) => {
        state.loading = false;
        state.groups = action.payload;
      })
      .addCase(fetchGroups.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // savePump
    builder
      .addCase(savePump.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(savePump.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.pumps.findIndex((p) => p.id === action.payload.id);
        if (index !== -1) {
          state.pumps[index] = action.payload;
        } else {
          state.pumps.push(action.payload);
        }
      })
      .addCase(savePump.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // saveGroup
    builder
      .addCase(saveGroup.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(saveGroup.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.groups.findIndex(
          (g) => g.id === action.payload.id,
        );
        if (index !== -1) {
          state.groups[index] = action.payload;
        } else {
          state.groups.push(action.payload);
        }
      })
      .addCase(saveGroup.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  setMode,
  togglePump,
  setSelectedPump,
  stopAllPumps,
  startTimer,
  tickTimer,
  stopTimer,
  updatePumpField,
} = pumpsSlice.actions;

export default pumpsSlice.reducer;
