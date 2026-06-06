/**
 * Backend API client for SmartKisan
 * Handles all HTTP calls to the Express backend with auth token injection
 */
import { getFreshToken } from './secureAuth';

// Backend URL - change this when deploying to cloud
// 10.0.2.2 = Android emulator, 192.168.x.x = real device on same WiFi
const API_BASE_URL = __DEV__
  ? 'http://192.168.1.4:5000/api'  // Local dev — your computer's IP on WiFi
  : 'https://smartkisan-api.up.railway.app/api'; // Production URL (update after deploy)

// Allow overriding via a global (useful for testing)
let _baseUrl = API_BASE_URL;
export const setBaseUrl = (url) => { _baseUrl = url; };

/**
 * Get current user's token for Authorization header
 */
async function getAuthToken() {
  return await getFreshToken();
}

/**
 * Core fetch wrapper with auth, error handling, and JSON parsing
 */
async function apiRequest(endpoint, options = {}) {
  const token = await getAuthToken();

  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  if (token && config.headers.Authorization !== '') {
    config.headers.Authorization = `Bearer ${token}`;
  } else if (config.headers.Authorization === '') {
    delete config.headers.Authorization;
  }

  const url = `${_baseUrl}${endpoint}`;

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `Request failed with status ${response.status}`);
    }

    return data;
  } catch (error) {
    if (error.message === 'Network request failed') {
      throw new Error('Cannot connect to server. Check your internet connection.');
    }
    throw error;
  }
}

// ─── Auth APIs ────────────────────────────────────────────────────────────────

export const authAPI = {
  /** Login with email and password */
  login: (email, password) =>
    apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      // Don't inject Firebase token for login endpoint
      headers: { Authorization: '' },
    }),

  /** Register new user */
  register: (userData) =>
    apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
      headers: { Authorization: '' },
    }),

  /** Verify a Google ID token server-side and get our own JWT back */
  google: (idToken) =>
    apiRequest('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ idToken }),
      headers: { Authorization: '' },
    }),
};

// ─── Pump APIs ────────────────────────────────────────────────────────────────

export const pumpAPI = {
  /** Get all pumps for current user */
  fetchAll: () => apiRequest('/pumps'),

  /** Get single pump by ID */
  fetchById: (id) => apiRequest(`/pumps/${id}`),

  /** Create a new pump */
  create: (pumpData) =>
    apiRequest('/pumps', {
      method: 'POST',
      body: JSON.stringify(pumpData),
    }),

  /** Update pump settings */
  update: (id, updates) =>
    apiRequest(`/pumps/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),

  /** Delete a pump */
  remove: (id) =>
    apiRequest(`/pumps/${id}`, {
      method: 'DELETE',
    }),

  /** Turn pump ON or OFF */
  control: (id, action) =>
    apiRequest(`/pumps/${id}/control`, {
      method: 'POST',
      body: JSON.stringify({ action }),
    }),

  /** Set auto-off timer (turns pump on) */
  setTimer: (id, durationSeconds) =>
    apiRequest(`/pumps/${id}/timer`, {
      method: 'POST',
      body: JSON.stringify({ duration: durationSeconds }),
    }),

  /** Create a schedule */
  createSchedule: (id, schedule) =>
    apiRequest(`/pumps/${id}/schedule`, {
      method: 'POST',
      body: JSON.stringify(schedule),
    }),

  /** Get all schedules for a pump */
  fetchSchedules: (id) => apiRequest(`/pumps/${id}/schedules`),

  /** Delete a schedule */
  deleteSchedule: (pumpId, scheduleId) =>
    apiRequest(`/pumps/${pumpId}/schedules/${scheduleId}`, {
      method: 'DELETE',
    }),

  /** Get pump action history */
  fetchHistory: (id, limit = 50) =>
    apiRequest(`/pumps/${id}/history?limit=${limit}`),
};

// ─── Pump Group APIs ──────────────────────────────────────────────────────────

export const pumpGroupAPI = {
  /** Get all pump groups */
  fetchAll: () => apiRequest('/pump-groups'),

  /** Create a pump group */
  create: (groupData) =>
    apiRequest('/pump-groups', {
      method: 'POST',
      body: JSON.stringify(groupData),
    }),

  /** Update a group */
  update: (id, updates) =>
    apiRequest(`/pump-groups/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),

  /** Delete a group */
  remove: (id) =>
    apiRequest(`/pump-groups/${id}`, {
      method: 'DELETE',
    }),

  /** Control all pumps in a group */
  control: (id, action) =>
    apiRequest(`/pump-groups/${id}/control`, {
      method: 'POST',
      body: JSON.stringify({ action }),
    }),
};

// ─── AI Pump APIs ─────────────────────────────────────────────────────────────

export const aiPumpAPI = {
  /** Read AI config for one pump */
  fetchConfig: (pumpId) => apiRequest(`/ai/pumps/${pumpId}/config`),

  /** Update AI config (toggle, thresholds, links). Send only changed fields. */
  updateConfig: (pumpId, patch) =>
    apiRequest(`/ai/pumps/${pumpId}/config`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),

  /** Recent decisions for one pump (default 20) */
  fetchDecisions: (pumpId, limit = 20) =>
    apiRequest(`/ai/pumps/${pumpId}/decisions?limit=${limit}`),

  /** Recent decisions across all the user's pumps (default 50) */
  fetchAllDecisions: (limit = 50) =>
    apiRequest(`/ai/decisions?limit=${limit}`),

  /**
   * Queue a farmer override for the next scheduler tick.
   * kind: 'run_now' | 'skip_next' | 'pause_until'
   * payload (run_now): { duration_min: number }
   * expires_at (pause_until): ISO string
   */
  override: (pumpId, { kind, payload, expires_at }) =>
    apiRequest(`/ai/pumps/${pumpId}/override`, {
      method: 'POST',
      body: JSON.stringify({ kind, payload, expires_at }),
    }),

  /** Thumbs up/down on a past decision */
  feedback: (decisionId, feedback) =>
    apiRequest(`/ai/decisions/${decisionId}/feedback`, {
      method: 'POST',
      body: JSON.stringify({ feedback }),
    }),

  /** Force an immediate decision for one pump (instead of waiting 15 min) */
  tickPump: (pumpId) =>
    apiRequest(`/ai/pumps/${pumpId}/tick`, {
      method: 'POST',
      // Empty body must still be valid JSON — body-parser rejects bare ''.
      body: JSON.stringify({}),
    }),

  /** Publish a simulated sensor reading on the MQTT bridge */
  simulateSensor: (reading) =>
    apiRequest('/ai/simulate-sensor', {
      method: 'POST',
      body: JSON.stringify(reading),
    }),
};

// ─── Health Check ─────────────────────────────────────────────────────────────

export const healthCheck = () =>
  fetch(`${_baseUrl}/health`).then((r) => r.json());
