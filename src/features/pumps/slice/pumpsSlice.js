import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { pumpService } from '../../../services/api';

// ─── Async Thunks ────────────────────────────────────────────────────────────

export const fetchPumps = createAsyncThunk(
  'pumps/fetchPumps',
  async (_, { rejectWithValue }) => {
    try {
      return await pumpService.fetchPumps();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const fetchGroups = createAsyncThunk(
  'pumps/fetchGroups',
  async (_, { rejectWithValue }) => {
    try {
      return await pumpService.fetchGroups();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const savePump = createAsyncThunk(
  'pumps/savePump',
  async (pump, { rejectWithValue }) => {
    try {
      return await pumpService.savePump(pump);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const saveGroup = createAsyncThunk(
  'pumps/saveGroup',
  async (group, { rejectWithValue }) => {
    try {
      return await pumpService.saveGroup(group);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const deletePump = createAsyncThunk(
  'pumps/deletePump',
  async (pumpId, { rejectWithValue }) => {
    try {
      await pumpService.deletePump(pumpId);
      return pumpId;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const deleteGroup = createAsyncThunk(
  'pumps/deleteGroup',
  async (groupId, { rejectWithValue }) => {
    try {
      await pumpService.deleteGroup(groupId);
      return groupId;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

/** Turn a pump ON or OFF via backend API */
export const controlPump = createAsyncThunk(
  'pumps/controlPump',
  async ({ pumpId, action }, { rejectWithValue }) => {
    try {
      return await pumpService.controlPump(pumpId, action);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

/** Start a pump with auto-off timer via backend API */
export const startPumpTimer = createAsyncThunk(
  'pumps/startPumpTimer',
  async ({ pumpId, durationSeconds }, { rejectWithValue }) => {
    try {
      return await pumpService.setTimer(pumpId, durationSeconds);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

/** Stop pump timer (turns pump off) */
export const stopPumpTimer = createAsyncThunk(
  'pumps/stopPumpTimer',
  async (pumpId, { rejectWithValue }) => {
    try {
      return await pumpService.controlPump(pumpId, 'off');
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

/** Create a schedule for a pump */
export const createSchedule = createAsyncThunk(
  'pumps/createSchedule',
  async ({ pumpId, schedule }, { rejectWithValue }) => {
    try {
      return await pumpService.createSchedule(pumpId, schedule);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

/** Fetch schedules for a pump */
export const fetchSchedules = createAsyncThunk(
  'pumps/fetchSchedules',
  async (pumpId, { rejectWithValue }) => {
    try {
      const schedules = await pumpService.fetchSchedules(pumpId);
      return { pumpId, schedules };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

/** Delete a schedule */
export const deleteSchedule = createAsyncThunk(
  'pumps/deleteSchedule',
  async ({ pumpId, scheduleId }, { rejectWithValue }) => {
    try {
      await pumpService.deleteSchedule(pumpId, scheduleId);
      return { pumpId, scheduleId };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

/** Fetch pump action history */
export const fetchPumpHistory = createAsyncThunk(
  'pumps/fetchPumpHistory',
  async ({ pumpId, limit = 50 }, { rejectWithValue }) => {
    try {
      const history = await pumpService.fetchHistory(pumpId, limit);
      return { pumpId, history };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

/** Control all pumps in a group */
export const controlGroup = createAsyncThunk(
  'pumps/controlGroup',
  async ({ groupId, action }, { rejectWithValue }) => {
    try {
      return await pumpService.controlGroup(groupId, action);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

/** Emergency stop — turn off ALL pumps */
export const stopAllPumpsAsync = createAsyncThunk(
  'pumps/stopAllPumpsAsync',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { pumps } = getState().pumps;
      const onPumps = pumps.filter((p) => p.status === 'on').map((p) => p.id);
      if (onPumps.length > 0) {
        await pumpService.stopAllPumps(onPumps);
      }
      return true;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

// ─── Slice ───────────────────────────────────────────────────────────────────

const initialState = {
  pumps: [],
  groups: [],
  activeTab: 'all',
  activeTimers: {},
  schedules: {},      // { [pumpId]: [...schedules] }
  history: {},         // { [pumpId]: [...history] }
  selectedPumpId: null,
  loading: false,
  controlling: false,  // separate loading state for control actions
  error: null,
};

const pumpsSlice = createSlice({
  name: 'pumps',
  initialState,
  reducers: {
    setActiveTab: (state, action) => {
      state.activeTab = action.payload;
    },
    setPumpMode: (state, action) => {
      const { pumpId, mode } = action.payload;
      const pump = state.pumps.find((p) => p.id === pumpId);
      if (pump) pump.mode = mode;
    },
    // Local-only toggle for mock mode / optimistic UI
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
      if (pump) pump.status = 'on';
    },
    tickTimer: (state, action) => {
      const pumpId = action.payload;
      if (state.activeTimers[pumpId] !== undefined) {
        state.activeTimers[pumpId] -= 1;
        if (state.activeTimers[pumpId] <= 0) {
          delete state.activeTimers[pumpId];
          const pump = state.pumps.find((p) => p.id === pumpId);
          if (pump) pump.status = 'off';
        }
      }
    },
    stopTimer: (state, action) => {
      const pumpId = action.payload;
      delete state.activeTimers[pumpId];
      const pump = state.pumps.find((p) => p.id === pumpId);
      if (pump) pump.status = 'off';
    },
    updatePumpField: (state, action) => {
      const { id, field, value } = action.payload;
      const pump = state.pumps.find((p) => p.id === id);
      if (pump) pump[field] = value;
    },
    clearError: (state) => {
      state.error = null;
    },
    updatePumpStatusFromMQTT: (state, action) => {
      const { pumpId, status } = action.payload;
      const pump = state.pumps.find((p) => p.id === pumpId);
      if (pump) {
        pump.status = status;
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
        state.pumps = action.payload.map((p) => ({ ...p, mode: p.mode || 'manual' }));
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
        const index = state.groups.findIndex((g) => g.id === action.payload.id);
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

    // deletePump
    builder.addCase(deletePump.fulfilled, (state, action) => {
      state.pumps = state.pumps.filter((p) => p.id !== action.payload);
    });

    // deleteGroup
    builder.addCase(deleteGroup.fulfilled, (state, action) => {
      state.groups = state.groups.filter((g) => g.id !== action.payload);
    });

    // controlPump (ON/OFF)
    builder
      .addCase(controlPump.pending, (state) => {
        state.controlling = true;
      })
      .addCase(controlPump.fulfilled, (state, action) => {
        state.controlling = false;
        const pump = state.pumps.find((p) => p.id === action.payload.id);
        if (pump) {
          pump.status = action.payload.status;
        }
      })
      .addCase(controlPump.rejected, (state, action) => {
        state.controlling = false;
        state.error = action.payload;
      });

    // startPumpTimer
    builder
      .addCase(startPumpTimer.fulfilled, (state, action) => {
        const pump = state.pumps.find((p) => p.id === action.payload.id);
        if (pump) {
          pump.status = 'on';
          pump.timer = action.payload.timer;
        }
        if (action.payload.timer?.duration) {
          state.activeTimers[action.payload.id] = action.payload.timer.duration;
        }
      });

    // stopPumpTimer
    builder.addCase(stopPumpTimer.fulfilled, (state, action) => {
      const pump = state.pumps.find((p) => p.id === action.payload.id);
      if (pump) {
        pump.status = 'off';
        pump.timer = null;
      }
      delete state.activeTimers[action.payload.id];
    });

    // controlGroup
    builder
      .addCase(controlGroup.fulfilled, (state, action) => {
        const { results } = action.payload;
        if (results) {
          results.forEach(({ pumpId, status }) => {
            const pump = state.pumps.find((p) => p.id === pumpId);
            if (pump) pump.status = status;
          });
        }
      });

    // stopAllPumpsAsync
    builder.addCase(stopAllPumpsAsync.fulfilled, (state) => {
      state.pumps.forEach((pump) => { pump.status = 'off'; });
      state.activeTimers = {};
    });

    // fetchSchedules
    builder.addCase(fetchSchedules.fulfilled, (state, action) => {
      state.schedules[action.payload.pumpId] = action.payload.schedules;
    });

    // deleteSchedule
    builder.addCase(deleteSchedule.fulfilled, (state, action) => {
      const { pumpId, scheduleId } = action.payload;
      if (state.schedules[pumpId]) {
        state.schedules[pumpId] = state.schedules[pumpId].filter(
          (s) => s.id !== scheduleId,
        );
      }
    });

    // fetchPumpHistory
    builder.addCase(fetchPumpHistory.fulfilled, (state, action) => {
      state.history[action.payload.pumpId] = action.payload.history;
    });
  },
});

export const {
  setActiveTab,
  setPumpMode,
  togglePump,
  setSelectedPump,
  stopAllPumps,
  startTimer,
  tickTimer,
  stopTimer,
  updatePumpField,
  clearError,
  updatePumpStatusFromMQTT,
} = pumpsSlice.actions;

export default pumpsSlice.reducer;
