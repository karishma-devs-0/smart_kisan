import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { weatherService } from '../../../services/api';

// ─── Async Thunks ────────────────────────────────────────────────────────────

export const fetchCurrentWeather = createAsyncThunk(
  'weather/fetchCurrentWeather',
  async (_, { getState, rejectWithValue }) => {
    try {
      const location = getState().settings.location;
      return await weatherService.fetchCurrentWeather(location);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const fetchForecast = createAsyncThunk(
  'weather/fetchForecast',
  async (_, { getState, rejectWithValue }) => {
    try {
      const location = getState().settings.location;
      return await weatherService.fetchForecast(location);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const fetchHistoricalWeather = createAsyncThunk(
  'weather/fetchHistoricalWeather',
  async (_, { rejectWithValue }) => {
    try {
      return await weatherService.fetchHistoricalWeather();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const fetchWindHistory = createAsyncThunk(
  'weather/fetchWindHistory',
  async (_, { getState, rejectWithValue }) => {
    try {
      const location = getState().settings.location;
      return await weatherService.fetchWindHistory(location);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const fetchHumidityHistory = createAsyncThunk(
  'weather/fetchHumidityHistory',
  async (_, { getState, rejectWithValue }) => {
    try {
      const location = getState().settings.location;
      return await weatherService.fetchHumidityHistory(location);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

// ─── Slice ───────────────────────────────────────────────────────────────────

const initialState = {
  current: null,
  forecast: [],
  historical: {
    yesterday: null,
    week: [],
  },
  windHistory: [],
  humidityHistory: [],
  selectedMetric: 'temperature',
  loading: false,
  error: null,
};

const weatherSlice = createSlice({
  name: 'weather',
  initialState,
  reducers: {
    setSelectedMetric: (state, action) => {
      state.selectedMetric = action.payload;
    },
  },
  extraReducers: (builder) => {
    // fetchCurrentWeather
    builder
      .addCase(fetchCurrentWeather.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCurrentWeather.fulfilled, (state, action) => {
        state.loading = false;
        state.current = action.payload;
      })
      .addCase(fetchCurrentWeather.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // fetchForecast
    builder
      .addCase(fetchForecast.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchForecast.fulfilled, (state, action) => {
        state.loading = false;
        state.forecast = action.payload;
      })
      .addCase(fetchForecast.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // fetchHistoricalWeather
    builder
      .addCase(fetchHistoricalWeather.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHistoricalWeather.fulfilled, (state, action) => {
        state.loading = false;
        state.historical = action.payload;
      })
      .addCase(fetchHistoricalWeather.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // fetchWindHistory
    builder
      .addCase(fetchWindHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWindHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.windHistory = action.payload;
      })
      .addCase(fetchWindHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // fetchHumidityHistory
    builder
      .addCase(fetchHumidityHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHumidityHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.humidityHistory = action.payload;
      })
      .addCase(fetchHumidityHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setSelectedMetric } = weatherSlice.actions;
export default weatherSlice.reducer;
