import * as Network from 'expo-network';

let isConnected = true;
const listeners = new Set();
let pollInterval = null;

/**
 * Initialize network listener.
 * expo-network doesn't have addEventListener, so we poll every 5s
 * and also check on-demand via getIsConnected().
 */
export function initNetworkListener() {
  // Check immediately
  _checkNetwork();

  // Poll every 5 seconds (expo-network has no event listener)
  pollInterval = setInterval(_checkNetwork, 5000);
}

async function _checkNetwork() {
  try {
    const state = await Network.getNetworkStateAsync();
    const wasConnected = isConnected;
    // Only mark offline if isConnected is EXPLICITLY false
    // In Expo Go, both isConnected and isInternetReachable can be unreliable
    if (state.isConnected === false) {
      isConnected = false;
    } else {
      // true, null, undefined — all treated as connected
      isConnected = true;
    }
    if (__DEV__ && wasConnected !== isConnected) {
      console.log('Network:', isConnected ? 'online' : 'offline', JSON.stringify(state));
    }
    if (wasConnected !== isConnected) {
      listeners.forEach(cb => cb(isConnected));
    }
  } catch (e) {
    // If we can't check, assume connected
    isConnected = true;
  }
}

export function getIsConnected() {
  return isConnected;
}

/**
 * Force a fresh network check (useful before critical operations).
 * @returns {Promise<boolean>}
 */
export async function checkNetworkNow() {
  await _checkNetwork();
  return isConnected;
}

/**
 * Subscribe to network changes. Returns an unsubscribe function.
 * @param {Function} callback - Called with (isConnected: boolean)
 * @returns {Function} unsubscribe
 */
export function onNetworkChange(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

export function stopNetworkListener() {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
  listeners.clear();
}
