import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { weatherService } from '../../../services/api';
import { detectSevereEvents } from '../../../services/weather';
import { scheduleLocalNotification } from '../../../services/notifications';

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
      const forecast = await weatherService.fetchForecast(location);
      const severeEvents = detectSevereEvents(forecast, 3);

      // Schedule local notifications for each severe event (deduped per day-per-type)
      const previouslyNotified = getState().weather.notifiedSevereKeys || [];
      const newNotifiedKeys = [...previouslyNotified];
      for (const event of severeEvents) {
        const key = `${event.date}-${event.type}`;
        if (previouslyNotified.includes(key)) continue;
        scheduleLocalNotification({
          title: event.severity === 'critical' ? '🚨 Weather Alert' : '⚠️ Weather Alert',
          body: event.message,
          data: { type: event.type, date: event.date },
        }).catch(() => {});
        newNotifiedKeys.push(key);
      }

      return { forecast, severeEvents, notifiedSevereKeys: newNotifiedKeys };
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
  severeEvents: [],
  notifiedSevereKeys: [],
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
        state.forecast = action.payload.forecast;
        state.severeEvents = action.payload.severeEvents;
        state.notifiedSevereKeys = action.payload.notifiedSevereKeys;
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
