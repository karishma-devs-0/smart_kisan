/**
 * Backend API client for SmartKisan
 * Handles all HTTP calls to the Express backend with Firebase auth token injection
 */
import { auth as firebaseAuth } from './firebase';

// Backend URL - change this when deploying to cloud
// 10.0.2.2 = Android emulator, 192.168.x.x = real device on same WiFi
const API_BASE_URL = __DEV__
  ? 'http://192.168.1.9:5000/api'  // Local dev — your computer's IP on WiFi
  : 'https://smartkisan-api.up.railway.app/api'; // Production URL (update after deploy)

// Allow overriding via a global (useful for testing)
let _baseUrl = API_BASE_URL;
export const setBaseUrl = (url) => { _baseUrl = url; };

/**
 * Get current user's Firebase ID token for Authorization header
 */
async function getAuthToken() {
  const user = firebaseAuth.currentUser;
  if (!user) throw new Error('Not authenticated');
  return user.getIdToken();
}

/**
 * Core fetch wrapper with auth, error handling, and JSON parsing
 */
async function apiRequest(endpoint, options = {}) {
  const token = await getAuthToken();

  const config = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
    ...options,
  };

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

// ─── Health Check ─────────────────────────────────────────────────────────────

export const healthCheck = () =>
  fetch(`${_baseUrl}/health`).then((r) => r.json());
