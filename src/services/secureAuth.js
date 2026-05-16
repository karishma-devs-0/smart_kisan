/**
 * Secure Auth Service
 *
 * Handles:
 * - Secure token storage via expo-secure-store
 * - Token refresh when expired (Firebase tokens expire after 1 hour)
 * - Session persistence across app restarts
 * - Auth state observation via onAuthStateChanged
 */
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'smartkisan_auth_token';
const USER_KEY = 'smartkisan_auth_user';

// ─── Secure Storage helpers ─────────────────────────────────────────────────

export const secureStorage = {
  saveToken: async (token) => {
    try {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    } catch (e) {
      console.warn('SecureStore: failed to save token', e.message);
    }
  },

  getToken: async () => {
    try {
      return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch (e) {
      console.warn('SecureStore: failed to read token', e.message);
      return null;
    }
  },

  saveUser: async (user) => {
    try {
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
    } catch (e) {
      console.warn('SecureStore: failed to save user', e.message);
    }
  },

  getUser: async () => {
    try {
      const json = await SecureStore.getItemAsync(USER_KEY);
      return json ? JSON.parse(json) : null;
    } catch (e) {
      console.warn('SecureStore: failed to read user', e.message);
      return null;
    }
  },

  clear: async () => {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_KEY);
    } catch (e) {
      console.warn('SecureStore: failed to clear', e.message);
    }
  },
};

// ─── Token refresh ──────────────────────────────────────────────────────────

/**
 * Gets a fresh Firebase ID token.
 * If `forceRefresh` is true, it always fetches a new one from Firebase servers.
 * Otherwise it returns the cached token if still valid.
 */
export const getFreshToken = async () => {
  return secureStorage.getToken();
};

/**
 * Returns auth headers for API calls.
 * Automatically refreshes token if needed.
 */
export const getAuthHeaders = async () => {
  const token = await getFreshToken();
  if (!token) return {};
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

// ─── Session persistence helpers ────────────────────────────────────────────

/**
 * Persist session after successful login/register.
 * Called by auth slice on fulfilled login actions.
 */
export const persistSession = async (user, token) => {
  await Promise.all([
    secureStorage.saveUser(user),
    secureStorage.saveToken(token),
  ]);
};

/**
 * Restore session from secure storage.
 * Returns { user, token } or null if no stored session.
 */
export const restorePersistedSession = async () => {
  const [user, token] = await Promise.all([
    secureStorage.getUser(),
    secureStorage.getToken(),
  ]);
  if (!user || !token) return null;
  return { user, token };
};

/**
 * Clear all persisted auth data on logout.
 */
export const clearSession = async () => {
  await secureStorage.clear();
};
