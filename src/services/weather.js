/**
 * OpenWeatherMap API service for SmartKisan.
 * Free tier: 1000 calls/day, 60 calls/min.
 * Transforms OWM responses to match existing mock data shapes.
 */

import { OPENWEATHER_API_KEY } from '../config/firebase.config';

const API_KEY = OPENWEATHER_API_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

export const isWeatherAPIEnabled = () => API_KEY.length > 0;

// ─── OWM condition → MaterialCommunityIcons icon mapping ────────────────────

const OWM_ICON_MAP = {
  '01d': 'weather-sunny',
  '01n': 'weather-night',
  '02d': 'weather-partly-cloudy',
  '02n': 'weather-night-partly-cloudy',
  '03d': 'weather-cloudy',
  '03n': 'weather-cloudy',
  '04d': 'weather-cloudy',
  '04n': 'weather-cloudy',
  '09d': 'weather-pouring',
  '09n': 'weather-pouring',
  '10d': 'weather-rainy',
  '10n': 'weather-rainy',
  '11d': 'weather-lightning-rainy',
  '11n': 'weather-lightning-rainy',
  '13d': 'weather-snowy',
  '13n': 'weather-snowy',
  '50d': 'weather-fog',
  '50n': 'weather-fog',
};

const degToDirection = (deg) => {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(deg / 45) % 8];
};

const formatDate = (timestamp) => {
  const d = new Date(timestamp * 1000);
  return d.toISOString().split('T')[0];
};

const formatHour = (timestamp) => {
  const d = new Date(timestamp * 1000);
  return `${String(d.getHours()).padStart(2, '0')}:00`;
};

// ─── API calls ──────────────────────────────────────────────────────────────

const fetchJSON = async (url) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

/**
 * Fetch current weather → matches MOCK_CURRENT_WEATHER shape
 */
export const fetchCurrentWeather = async (lat, lng) => {
  const data = await fetchJSON(
    `${BASE_URL}/weather?lat=${lat}&lon=${lng}&appid=${API_KEY}&units=metric`,
  );
  return {
    temp: Math.round(data.main.temp),
    humidity: data.main.humidity,
    windSpeed: Math.round(data.wind.speed * 3.6), // m/s → km/h
    windDirection: degToDirection(data.wind.deg || 0),
    precipitation: data.rain?.['1h'] || data.rain?.['3h'] || 0,
    condition: data.weather[0].main,
    icon: OWM_ICON_MAP[data.weather[0].icon] || 'weather-cloudy',
    feelsLike: Math.round(data.main.feels_like),
    uvIndex: 0, // Not available in free tier — needs One Call API
    pressure: data.main.pressure,
    visibility: Math.round((data.visibility || 10000) / 1000),
  };
};

/**
 * Fetch 5-day forecast → matches MOCK_FORECAST shape (daily aggregated)
 */
export const fetchForecast = async (lat, lng) => {
  const data = await fetchJSON(
    `${BASE_URL}/forecast?lat=${lat}&lon=${lng}&appid=${API_KEY}&units=metric`,
  );

  // Group by date and aggregate
  const dailyMap = {};
  for (const item of data.list) {
    const date = formatDate(item.dt);
    if (!dailyMap[date]) {
      dailyMap[date] = {
        date,
        temps: [],
        humidity: [],
        windSpeed: [],
        condition: item.weather[0].main,
        icon: OWM_ICON_MAP[item.weather[0].icon] || 'weather-cloudy',
      };
    }
    dailyMap[date].temps.push(item.main.temp);
    dailyMap[date].humidity.push(item.main.humidity);
    dailyMap[date].windSpeed.push(item.wind.speed * 3.6);
  }

  // Skip today, take next 5 days
  const today = new Date().toISOString().split('T')[0];
  const fiveDayForecast = Object.values(dailyMap)
    .filter((d) => d.date !== today)
    .slice(0, 5)
    .map((d) => ({
      date: d.date,
      high: Math.round(Math.max(...d.temps)),
      low: Math.round(Math.min(...d.temps)),
      condition: d.condition,
      icon: d.icon,
      humidity: Math.round(d.humidity.reduce((a, b) => a + b, 0) / d.humidity.length),
      windSpeed: Math.round(d.windSpeed.reduce((a, b) => a + b, 0) / d.windSpeed.length),
    }));

  // Generate estimated days 6-14 by cycling through the 5-day trend
  const extendedForecast = [...fiveDayForecast];
  if (fiveDayForecast.length >= 3) {
    const lastDate = new Date(fiveDayForecast[fiveDayForecast.length - 1].date);
    for (let i = 0; i < 9; i++) {
      const sourceDay = fiveDayForecast[i % fiveDayForecast.length];
      const nextDate = new Date(lastDate);
      nextDate.setDate(nextDate.getDate() + i + 1);
      const dateStr = nextDate.toISOString().split('T')[0];
      extendedForecast.push({
        ...sourceDay,
        date: dateStr,
        high: sourceDay.high + Math.round((Math.random() - 0.5) * 4),
        low: sourceDay.low + Math.round((Math.random() - 0.5) * 3),
        humidity: Math.min(100, Math.max(30, sourceDay.humidity + Math.round((Math.random() - 0.5) * 10))),
        windSpeed: Math.max(1, sourceDay.windSpeed + Math.round((Math.random() - 0.5) * 6)),
        estimated: true,
      });
    }
  }

  return extendedForecast;
};

/**
 * Fetch 3-hour forecast data for wind history → matches MOCK_WIND_HISTORY shape
 */
export const fetchWindHistory = async (lat, lng) => {
  const data = await fetchJSON(
    `${BASE_URL}/forecast?lat=${lat}&lon=${lng}&appid=${API_KEY}&units=metric`,
  );

  // Take first 24 entries (3-hour intervals for ~3 days, pick today's)
  const today = new Date().toISOString().split('T')[0];
  return data.list
    .filter((item) => formatDate(item.dt) === today)
    .map((item) => ({
      hour: formatHour(item.dt),
      speed: Math.round(item.wind.speed * 3.6),
      direction: degToDirection(item.wind.deg || 0),
    }));
};

/**
 * Fetch humidity from forecast → matches MOCK_HUMIDITY_HISTORY shape
 */
export const fetchHumidityHistory = async (lat, lng) => {
  const data = await fetchJSON(
    `${BASE_URL}/forecast?lat=${lat}&lon=${lng}&appid=${API_KEY}&units=metric`,
  );

  const today = new Date().toISOString().split('T')[0];
  return data.list
    .filter((item) => formatDate(item.dt) === today)
    .map((item) => ({
      hour: formatHour(item.dt),
      value: item.main.humidity,
    }));
};
