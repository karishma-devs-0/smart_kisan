import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = '@smartkisan_cache:';

/**
 * AsyncStorage-based cache with TTL (Redis-like).
 * Stores JSON-serialized values with expiration timestamps.
 */
const cache = {
  /**
   * Store a value with optional TTL (in seconds).
   * @param {string} key
   * @param {*} value - Any JSON-serializable value
   * @param {number} [ttl=3600] - Time to live in seconds (default: 1 hour)
   */
  set: async (key, value, ttl = 3600) => {
    try {
      const entry = {
        data: value,
        expiresAt: Date.now() + ttl * 1000,
        createdAt: Date.now(),
      };
      await AsyncStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
    } catch (e) {
      // Silently fail — cache is best-effort
    }
  },

  /**
   * Retrieve a cached value. Returns null if expired or missing.
   * @param {string} key
   * @returns {Promise<*|null>}
   */
  get: async (key) => {
    try {
      const raw = await AsyncStorage.getItem(CACHE_PREFIX + key);
      if (!raw) return null;
      const entry = JSON.parse(raw);
      if (Date.now() > entry.expiresAt) {
        // Expired — clean up lazily
        AsyncStorage.removeItem(CACHE_PREFIX + key).catch(() => {});
        return null;
      }
      return entry.data;
    } catch (e) {
      return null;
    }
  },

  /**
   * Remove a specific cache entry.
   * @param {string} key
   */
  del: async (key) => {
    try {
      await AsyncStorage.removeItem(CACHE_PREFIX + key);
    } catch (e) {
      // Silently fail
    }
  },

  /**
   * Check if a key exists and is not expired.
   * @param {string} key
   * @returns {Promise<boolean>}
   */
  has: async (key) => {
    const value = await cache.get(key);
    return value !== null;
  },

  /**
   * Clear all cache entries (keys starting with CACHE_PREFIX).
   */
  flush: async () => {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const cacheKeys = allKeys.filter((k) => k.startsWith(CACHE_PREFIX));
      if (cacheKeys.length > 0) {
        await AsyncStorage.multiRemove(cacheKeys);
      }
    } catch (e) {
      // Silently fail
    }
  },

  /**
   * Delete all cache entries matching a prefix.
   * @param {string} prefix - Key prefix to match (e.g., 'weather:')
   */
  delByPrefix: async (prefix) => {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const matching = allKeys.filter((k) => k.startsWith(CACHE_PREFIX + prefix));
      if (matching.length > 0) {
        await AsyncStorage.multiRemove(matching);
      }
    } catch (e) {
      // Silently fail
    }
  },

  /**
   * Get-or-set: returns cached value if fresh, otherwise calls fetcher and caches result.
   * @param {string} key
   * @param {Function} fetcher - Async function that returns the fresh value
   * @param {number} [ttl=3600] - TTL in seconds
   * @returns {Promise<*>}
   */
  remember: async (key, fetcher, ttl = 3600) => {
    const cached = await cache.get(key);
    if (cached !== null) return cached;
    const fresh = await fetcher();
    await cache.set(key, fresh, ttl);
    return fresh;
  },
};

export default cache;
