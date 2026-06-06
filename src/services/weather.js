/**
 * Weather service for SmartKisan.
 *
 * Two providers under one interface:
 *   1. OpenWeatherMap (primary) — used when OPENWEATHER_API_KEY is set.
 *      Free tier: 1000 calls/day, 60 calls/min.
 *   2. Open-Meteo (fallback)    — no API key required, free for
 *      non-commercial use, ECMWF-based forecasts.
 *
 * Strategy: try OWM first if a key is configured. On HTTP failure, timeout,
 * or 401/429 (bad key / rate limit), automatically retry against Open-Meteo
 * so the app never goes without weather data.
 *
 * isWeatherAPIEnabled() always returns true now, since Open-Meteo is always
 * available as a fallback — kept for compatibility with callers in api.js.
 */

import { OPENWEATHER_API_KEY } from '../config/firebase.config';

const OWM_BASE = 'https://api.openweathermap.org/data/2.5';
const OM_BASE  = 'https://api.open-meteo.com/v1/forecast';

const owmKey = () => (OPENWEATHER_API_KEY || '').trim();
const owmEnabled = () => owmKey().length > 0;

export const isWeatherAPIEnabled = () => true;

// ─── Shared helpers ─────────────────────────────────────────────────────────

const fetchJSON = async (url, timeoutMs = 10000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
};

const degToDirection = (deg) => {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round((deg ?? 0) / 45) % 8];
};

/**
 * Run an OWM call if a key is set; on any failure, run the Open-Meteo
 * fallback. Logs the fall-back (in dev) so we can see when the chain trips.
 */
async function withFallback(label, owmFn, omFn) {
  if (owmEnabled()) {
    try {
      return await owmFn();
    } catch (err) {
      if (__DEV__) console.warn(`[weather] OWM ${label} failed (${err.message}) — falling back to Open-Meteo`);
    }
  }
  return omFn();
}

// ─── OpenWeatherMap (primary) ───────────────────────────────────────────────

const OWM_ICON_MAP = {
  '01d': 'weather-sunny',         '01n': 'weather-night',
  '02d': 'weather-partly-cloudy', '02n': 'weather-night-partly-cloudy',
  '03d': 'weather-cloudy',        '03n': 'weather-cloudy',
  '04d': 'weather-cloudy',        '04n': 'weather-cloudy',
  '09d': 'weather-pouring',       '09n': 'weather-pouring',
  '10d': 'weather-rainy',         '10n': 'weather-rainy',
  '11d': 'weather-lightning-rainy', '11n': 'weather-lightning-rainy',
  '13d': 'weather-snowy',         '13n': 'weather-snowy',
  '50d': 'weather-fog',           '50n': 'weather-fog',
};

const owmDate = (ts) => new Date(ts * 1000).toISOString().split('T')[0];
const owmHour = (ts) => {
  const d = new Date(ts * 1000);
  return `${String(d.getHours()).padStart(2, '0')}:00`;
};

async function owmCurrent(lat, lng) {
  const data = await fetchJSON(`${OWM_BASE}/weather?lat=${lat}&lon=${lng}&appid=${owmKey()}&units=metric`);
  return {
    temp: Math.round(data.main.temp),
    humidity: data.main.humidity,
    windSpeed: Math.round((data.wind?.speed ?? 0) * 3.6),
    windDirection: degToDirection(data.wind?.deg),
    precipitation: data.rain?.['1h'] || data.rain?.['3h'] || 0,
    condition: data.weather[0].main,
    icon: OWM_ICON_MAP[data.weather[0].icon] || 'weather-cloudy',
    feelsLike: Math.round(data.main.feels_like),
    uvIndex: 0,
    pressure: data.main.pressure,
    visibility: Math.round((data.visibility || 10000) / 1000),
  };
}

async function owmForecast(lat, lng) {
  const data = await fetchJSON(`${OWM_BASE}/forecast?lat=${lat}&lon=${lng}&appid=${owmKey()}&units=metric`);
  const dailyMap = {};
  for (const item of data.list) {
    const date = owmDate(item.dt);
    if (!dailyMap[date]) {
      dailyMap[date] = {
        date, temps: [], humidity: [], windSpeed: [],
        condition: item.weather[0].main,
        icon: OWM_ICON_MAP[item.weather[0].icon] || 'weather-cloudy',
      };
    }
    dailyMap[date].temps.push(item.main.temp);
    dailyMap[date].humidity.push(item.main.humidity);
    dailyMap[date].windSpeed.push((item.wind?.speed ?? 0) * 3.6);
  }

  const today = new Date().toISOString().split('T')[0];
  const fiveDay = Object.values(dailyMap)
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

  // Extend 5 → 14 days by cycling so callers always get a comparable shape.
  const extended = [...fiveDay];
  if (fiveDay.length >= 3) {
    const lastDate = new Date(fiveDay[fiveDay.length - 1].date);
    for (let i = 0; i < 9; i++) {
      const src = fiveDay[i % fiveDay.length];
      const next = new Date(lastDate);
      next.setDate(next.getDate() + i + 1);
      extended.push({
        ...src,
        date: next.toISOString().split('T')[0],
        high: src.high + Math.round((Math.random() - 0.5) * 4),
        low: src.low + Math.round((Math.random() - 0.5) * 3),
        humidity: Math.min(100, Math.max(30, src.humidity + Math.round((Math.random() - 0.5) * 10))),
        windSpeed: Math.max(1, src.windSpeed + Math.round((Math.random() - 0.5) * 6)),
        estimated: true,
      });
    }
  }
  return extended;
}

async function owmWindToday(lat, lng) {
  const data = await fetchJSON(`${OWM_BASE}/forecast?lat=${lat}&lon=${lng}&appid=${owmKey()}&units=metric`);
  const today = new Date().toISOString().split('T')[0];
  return data.list
    .filter((item) => owmDate(item.dt) === today)
    .map((item) => ({
      hour: owmHour(item.dt),
      speed: Math.round((item.wind?.speed ?? 0) * 3.6),
      direction: degToDirection(item.wind?.deg),
    }));
}

async function owmHumidityToday(lat, lng) {
  const data = await fetchJSON(`${OWM_BASE}/forecast?lat=${lat}&lon=${lng}&appid=${owmKey()}&units=metric`);
  const today = new Date().toISOString().split('T')[0];
  return data.list
    .filter((item) => owmDate(item.dt) === today)
    .map((item) => ({
      hour: owmHour(item.dt),
      value: item.main.humidity,
    }));
}

// ─── Open-Meteo (fallback) ──────────────────────────────────────────────────

// Reference: WMO Weather interpretation codes (https://open-meteo.com/en/docs)
const WMO_MAP = {
  0:  { c: 'Clear',           d: 'weather-sunny',           n: 'weather-night' },
  1:  { c: 'Mainly Clear',    d: 'weather-sunny',           n: 'weather-night' },
  2:  { c: 'Partly Cloudy',   d: 'weather-partly-cloudy',   n: 'weather-night-partly-cloudy' },
  3:  { c: 'Overcast',        d: 'weather-cloudy',          n: 'weather-cloudy' },
  45: { c: 'Fog',             d: 'weather-fog',             n: 'weather-fog' },
  48: { c: 'Fog',             d: 'weather-fog',             n: 'weather-fog' },
  51: { c: 'Drizzle',         d: 'weather-rainy',           n: 'weather-rainy' },
  53: { c: 'Drizzle',         d: 'weather-rainy',           n: 'weather-rainy' },
  55: { c: 'Drizzle',         d: 'weather-rainy',           n: 'weather-rainy' },
  61: { c: 'Rain',            d: 'weather-rainy',           n: 'weather-rainy' },
  63: { c: 'Rain',            d: 'weather-rainy',           n: 'weather-rainy' },
  65: { c: 'Heavy Rain',      d: 'weather-pouring',         n: 'weather-pouring' },
  71: { c: 'Snow',            d: 'weather-snowy',           n: 'weather-snowy' },
  73: { c: 'Snow',            d: 'weather-snowy',           n: 'weather-snowy' },
  75: { c: 'Heavy Snow',      d: 'weather-snowy-heavy',     n: 'weather-snowy-heavy' },
  77: { c: 'Snow Grains',     d: 'weather-snowy',           n: 'weather-snowy' },
  80: { c: 'Rain Showers',    d: 'weather-pouring',         n: 'weather-pouring' },
  81: { c: 'Rain Showers',    d: 'weather-pouring',         n: 'weather-pouring' },
  82: { c: 'Heavy Showers',   d: 'weather-pouring',         n: 'weather-pouring' },
  85: { c: 'Snow Showers',    d: 'weather-snowy',           n: 'weather-snowy' },
  86: { c: 'Snow Showers',    d: 'weather-snowy',           n: 'weather-snowy' },
  95: { c: 'Thunderstorm',    d: 'weather-lightning',       n: 'weather-lightning' },
  96: { c: 'Thunderstorm',    d: 'weather-lightning-rainy', n: 'weather-lightning-rainy' },
  99: { c: 'Thunderstorm',    d: 'weather-lightning-rainy', n: 'weather-lightning-rainy' },
};

const codeToCondition = (code, isDay = 1) => {
  const e = WMO_MAP[code] || { c: 'Cloudy', d: 'weather-cloudy', n: 'weather-cloudy' };
  return { condition: e.c, icon: isDay ? e.d : e.n };
};

const omHour = (iso) => iso?.slice(11, 16) ?? '00:00';
const omDate = (iso) => iso?.slice(0, 10) ?? '';

const omUrl = (lat, lng, params) =>
  `${OM_BASE}?${new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    timezone: 'auto',
    wind_speed_unit: 'kmh',
    ...params,
  })}`;

async function omCurrent(lat, lng) {
  const data = await fetchJSON(omUrl(lat, lng, {
    current: [
      'temperature_2m', 'relative_humidity_2m', 'apparent_temperature', 'is_day',
      'precipitation', 'weather_code', 'pressure_msl', 'wind_speed_10m',
      'wind_direction_10m', 'visibility', 'uv_index',
    ].join(','),
  }));
  const c = data.current || {};
  const { condition, icon } = codeToCondition(c.weather_code, c.is_day);
  return {
    temp: Math.round(c.temperature_2m ?? 0),
    humidity: Math.round(c.relative_humidity_2m ?? 0),
    windSpeed: Math.round(c.wind_speed_10m ?? 0),
    windDirection: degToDirection(c.wind_direction_10m),
    precipitation: c.precipitation ?? 0,
    condition,
    icon,
    feelsLike: Math.round(c.apparent_temperature ?? c.temperature_2m ?? 0),
    uvIndex: Math.round(c.uv_index ?? 0),
    pressure: Math.round(c.pressure_msl ?? 0),
    visibility: Math.round((c.visibility ?? 10000) / 1000),
  };
}

async function omForecast(lat, lng) {
  const data = await fetchJSON(omUrl(lat, lng, {
    daily: [
      'weather_code', 'temperature_2m_max', 'temperature_2m_min',
      'precipitation_sum', 'wind_speed_10m_max', 'relative_humidity_2m_mean',
    ].join(','),
    forecast_days: '14',
  }));
  const d = data.daily || {};
  const dates = d.time || [];
  const today = new Date().toISOString().slice(0, 10);

  const out = [];
  for (let i = 0; i < dates.length; i++) {
    if (dates[i] === today) continue;
    const { condition, icon } = codeToCondition(d.weather_code?.[i], 1);
    out.push({
      date: dates[i],
      high: Math.round(d.temperature_2m_max?.[i] ?? 0),
      low: Math.round(d.temperature_2m_min?.[i] ?? 0),
      condition, icon,
      humidity: Math.round(d.relative_humidity_2m_mean?.[i] ?? 0),
      windSpeed: Math.round(d.wind_speed_10m_max?.[i] ?? 0),
      precipitation: d.precipitation_sum?.[i] ?? 0,
    });
  }
  return out;
}

async function omWindToday(lat, lng) {
  const data = await fetchJSON(omUrl(lat, lng, {
    hourly: 'wind_speed_10m,wind_direction_10m',
    forecast_days: '2',
  }));
  const h = data.hourly || {};
  const times = h.time || [];
  const today = new Date().toISOString().slice(0, 10);
  const out = [];
  for (let i = 0; i < times.length; i++) {
    if (omDate(times[i]) !== today) continue;
    out.push({
      hour: omHour(times[i]),
      speed: Math.round(h.wind_speed_10m?.[i] ?? 0),
      direction: degToDirection(h.wind_direction_10m?.[i]),
    });
  }
  return out;
}

async function omHumidityToday(lat, lng) {
  const data = await fetchJSON(omUrl(lat, lng, {
    hourly: 'relative_humidity_2m',
    forecast_days: '2',
  }));
  const h = data.hourly || {};
  const times = h.time || [];
  const today = new Date().toISOString().slice(0, 10);
  const out = [];
  for (let i = 0; i < times.length; i++) {
    if (omDate(times[i]) !== today) continue;
    out.push({
      hour: omHour(times[i]),
      value: Math.round(h.relative_humidity_2m?.[i] ?? 0),
    });
  }
  return out;
}

// ─── Public API (callers in api.js use these) ───────────────────────────────

export const fetchCurrentWeather = (lat, lng) =>
  withFallback('current', () => owmCurrent(lat, lng), () => omCurrent(lat, lng));

export const fetchForecast = (lat, lng) =>
  withFallback('forecast', () => owmForecast(lat, lng), () => omForecast(lat, lng));

export const fetchWindHistory = (lat, lng) =>
  withFallback('wind', () => owmWindToday(lat, lng), () => omWindToday(lat, lng));

export const fetchHumidityHistory = (lat, lng) =>
  withFallback('humidity', () => owmHumidityToday(lat, lng), () => omHumidityToday(lat, lng));
