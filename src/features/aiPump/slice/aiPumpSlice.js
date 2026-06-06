import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { aiPumpAPI } from '../../../services/backendApi';

// ─── Async Thunks ──────────────────────────────────────────────────────────

export const fetchAiConfig = createAsyncThunk(
  'aiPump/fetchConfig',
  async (pumpId, { rejectWithValue }) => {
    try {
      const config = await aiPumpAPI.fetchConfig(pumpId);
      return { pumpId, config };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const updateAiConfig = createAsyncThunk(
  'aiPump/updateConfig',
  async ({ pumpId, patch }, { rejectWithValue }) => {
    try {
      const result = await aiPumpAPI.updateConfig(pumpId, patch);
      return { pumpId, pump: result.pump };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const fetchDecisionsForPump = createAsyncThunk(
  'aiPump/fetchDecisions',
  async ({ pumpId, limit = 20 }, { rejectWithValue }) => {
    try {
      const result = await aiPumpAPI.fetchDecisions(pumpId, limit);
      return { pumpId, decisions: result.decisions };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const fetchAllDecisions = createAsyncThunk(
  'aiPump/fetchAllDecisions',
  async (limit = 50, { rejectWithValue }) => {
    try {
      const result = await aiPumpAPI.fetchAllDecisions(limit);
      return result.decisions;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const submitOverride = createAsyncThunk(
  'aiPump/override',
  async ({ pumpId, kind, payload, expires_at }, { rejectWithValue }) => {
    try {
      const result = await aiPumpAPI.override(pumpId, { kind, payload, expires_at });
      return { pumpId, kind, id: result.id };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const submitFeedback = createAsyncThunk(
  'aiPump/feedback',
  async ({ decisionId, feedback }, { rejectWithValue }) => {
    try {
      await aiPumpAPI.feedback(decisionId, feedback);
      return { decisionId, feedback };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const simulateSensor = createAsyncThunk(
  'aiPump/simulateSensor',
  async ({ pumpId, reading, andTick = true }, { rejectWithValue }) => {
    try {
      await aiPumpAPI.simulateSensor(reading);
      // Small delay so the MQTT bridge has time to write soil_current before
      // the engine reads it on the next tick.
      if (andTick && pumpId) {
        await new Promise((r) => setTimeout(r, 500));
        await aiPumpAPI.tickPump(pumpId);
      }
      return { pumpId, reading };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

// ─── Slice ─────────────────────────────────────────────────────────────────

const initialState = {
  // configsByPumpId[pumpId] = { ai_enabled, ai_advisory_mode, ... }
  configsByPumpId: {},
  // decisionsByPumpId[pumpId] = [decision, decision, ...] (newest first)
  decisionsByPumpId: {},
  // Global feed across all pumps (newest first)
  allDecisions: [],
  loading: false,
  saving: false,
  error: null,
};

const aiPumpSlice = createSlice({
  name: 'aiPump',
  initialState,
  reducers: {
    /**
     * Insert a decision received over MQTT. Mirrors what the backend would
     * have written to ai_decisions — gives the UI live updates without
     * waiting for a manual refresh.
     */
    receiveMqttDecision(state, action) {
      const { pumpId, decision } = action.payload;
      const list = state.decisionsByPumpId[pumpId] || [];
      state.decisionsByPumpId[pumpId] = [decision, ...list].slice(0, 50);
      state.allDecisions = [decision, ...state.allDecisions].slice(0, 100);
    },
    clearAiError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAiConfig.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchAiConfig.fulfilled, (state, action) => {
        const { pumpId, config } = action.payload;
        state.configsByPumpId[pumpId] = config;
        state.loading = false;
      })
      .addCase(fetchAiConfig.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(updateAiConfig.pending, (state) => { state.saving = true; state.error = null; })
      .addCase(updateAiConfig.fulfilled, (state, action) => {
        const { pumpId, pump } = action.payload;
        state.configsByPumpId[pumpId] = { ...state.configsByPumpId[pumpId], ...pump };
        state.saving = false;
      })
      .addCase(updateAiConfig.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      })

      .addCase(fetchDecisionsForPump.fulfilled, (state, action) => {
        const { pumpId, decisions } = action.payload;
        state.decisionsByPumpId[pumpId] = decisions;
      })

      .addCase(fetchAllDecisions.pending, (state) => { state.loading = true; })
      .addCase(fetchAllDecisions.fulfilled, (state, action) => {
        state.allDecisions = action.payload;
        state.loading = false;
      })
      .addCase(fetchAllDecisions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(submitFeedback.fulfilled, (state, action) => {
        const { decisionId, feedback } = action.payload;
        for (const pumpId of Object.keys(state.decisionsByPumpId)) {
          const idx = state.decisionsByPumpId[pumpId].findIndex((d) => d.id === decisionId);
          if (idx >= 0) state.decisionsByPumpId[pumpId][idx].feedback = feedback;
        }
        const idx = state.allDecisions.findIndex((d) => d.id === decisionId);
        if (idx >= 0) state.allDecisions[idx].feedback = feedback;
      });
  },
});

export const { receiveMqttDecision, clearAiError } = aiPumpSlice.actions;
export default aiPumpSlice.reducer;
