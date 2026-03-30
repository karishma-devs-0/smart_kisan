/**
 * MQTT Service for SmartKisan
 *
 * Handles real-time communication between app and IoT devices.
 * Uses WebSocket transport (wss://) for React Native compatibility.
 *
 * Topic Structure:
 *   smartkisan/{userId}/pump/{pumpId}/command   → App publishes ON/OFF
 *   smartkisan/{userId}/pump/{pumpId}/status    → Device publishes status
 *   smartkisan/{userId}/pump/{pumpId}/timer     → App publishes timer commands
 *   smartkisan/{userId}/sensors/{deviceId}/data → Device publishes sensor data
 *   smartkisan/{userId}/alerts                  → System publishes alerts
 */

import mqtt from 'mqtt';
import { MQTT_BROKER_URL, MQTT_USERNAME, MQTT_PASSWORD } from '../config/firebase.config';

let client = null;
let userId = null;
const subscribers = new Map(); // topic → Set<callback>
let connectionStatus = 'disconnected'; // disconnected, connecting, connected, error
const statusListeners = new Set();

// ─── Connection Management ──────────────────────────────────────────────────

export function connect(uid) {
  if (client && client.connected) {
    if (__DEV__) console.log('MQTT: Already connected');
    return;
  }

  userId = uid;
  connectionStatus = 'connecting';
  notifyStatusListeners();

  const brokerUrl = MQTT_BROKER_URL || 'wss://broker.hivemq.com:8884/mqtt';

  const options = {
    clientId: `smartkisan_${uid}_${Date.now()}`,
    clean: true,
    connectTimeout: 10000,
    reconnectPeriod: 5000,
    keepalive: 60,
  };

  // Add credentials if configured
  if (MQTT_USERNAME) options.username = MQTT_USERNAME;
  if (MQTT_PASSWORD) options.password = MQTT_PASSWORD;

  client = mqtt.connect(brokerUrl, options);

  client.on('connect', () => {
    connectionStatus = 'connected';
    notifyStatusListeners();
    if (__DEV__) console.log('MQTT: Connected to', brokerUrl);

    // Auto-subscribe to user's topics
    const baseTopic = `smartkisan/${userId}/#`;
    client.subscribe(baseTopic, { qos: 1 }, (err) => {
      if (err && __DEV__) console.warn('MQTT: Subscribe error', err);
    });
  });

  client.on('message', (topic, payload) => {
    const message = payload.toString();
    let parsed;
    try {
      parsed = JSON.parse(message);
    } catch {
      parsed = message;
    }

    // Notify all subscribers for this topic
    for (const [pattern, callbacks] of subscribers.entries()) {
      if (topicMatches(pattern, topic)) {
        callbacks.forEach((cb) => cb(topic, parsed));
      }
    }
  });

  client.on('error', (err) => {
    connectionStatus = 'error';
    notifyStatusListeners();
    if (__DEV__) console.warn('MQTT: Error', err.message);
  });

  client.on('offline', () => {
    connectionStatus = 'disconnected';
    notifyStatusListeners();
  });

  client.on('reconnect', () => {
    connectionStatus = 'connecting';
    notifyStatusListeners();
  });
}

export function disconnect() {
  if (client) {
    client.end(true);
    client = null;
    connectionStatus = 'disconnected';
    notifyStatusListeners();
    subscribers.clear();
  }
}

export function getConnectionStatus() {
  return connectionStatus;
}

export function onConnectionStatusChange(callback) {
  statusListeners.add(callback);
  return () => statusListeners.delete(callback);
}

function notifyStatusListeners() {
  statusListeners.forEach((cb) => cb(connectionStatus));
}

// ─── Topic Matching (supports MQTT wildcards) ───────────────────────────────

function topicMatches(pattern, topic) {
  if (pattern === topic) return true;
  const patternParts = pattern.split('/');
  const topicParts = topic.split('/');

  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i] === '#') return true;
    if (patternParts[i] === '+') continue;
    if (patternParts[i] !== topicParts[i]) return false;
  }
  return patternParts.length === topicParts.length;
}

// ─── Publish / Subscribe ────────────────────────────────────────────────────

export function publish(topic, data, options = {}) {
  if (!client || !client.connected) {
    if (__DEV__) console.warn('MQTT: Not connected, cannot publish');
    return false;
  }

  const message = typeof data === 'string' ? data : JSON.stringify(data);
  client.publish(topic, message, { qos: 1, ...options });
  return true;
}

export function subscribe(topicPattern, callback) {
  if (!subscribers.has(topicPattern)) {
    subscribers.set(topicPattern, new Set());
  }
  subscribers.get(topicPattern).add(callback);

  // Return unsubscribe function
  return () => {
    const callbacks = subscribers.get(topicPattern);
    if (callbacks) {
      callbacks.delete(callback);
      if (callbacks.size === 0) subscribers.delete(topicPattern);
    }
  };
}

// ─── Pump Control Helpers ───────────────────────────────────────────────────

export function getTopics(uid) {
  const base = `smartkisan/${uid || userId}`;
  return {
    pumpCommand: (pumpId) => `${base}/pump/${pumpId}/command`,
    pumpStatus: (pumpId) => `${base}/pump/${pumpId}/status`,
    pumpTimer: (pumpId) => `${base}/pump/${pumpId}/timer`,
    sensorData: (deviceId) => `${base}/sensors/${deviceId}/data`,
    alerts: `${base}/alerts`,
  };
}

/**
 * Send pump ON/OFF command via MQTT
 */
export function sendPumpCommand(pumpId, action) {
  const topic = getTopics().pumpCommand(pumpId);
  return publish(topic, {
    action, // 'on' or 'off'
    pumpId,
    timestamp: new Date().toISOString(),
    source: 'app',
  });
}

/**
 * Send pump timer command via MQTT
 */
export function sendPumpTimer(pumpId, durationSeconds) {
  const topic = getTopics().pumpTimer(pumpId);
  return publish(topic, {
    action: 'start_timer',
    pumpId,
    duration: durationSeconds,
    timestamp: new Date().toISOString(),
    source: 'app',
  });
}

/**
 * Subscribe to pump status updates from device
 */
export function onPumpStatus(pumpId, callback) {
  const topic = getTopics().pumpStatus(pumpId);
  return subscribe(topic, (t, data) => callback(data));
}

/**
 * Subscribe to ALL pump status updates for this user
 */
export function onAllPumpStatus(callback) {
  const pattern = `smartkisan/${userId}/pump/+/status`;
  return subscribe(pattern, (topic, data) => {
    // Extract pumpId from topic
    const parts = topic.split('/');
    const pumpId = parts[3];
    callback(pumpId, data);
  });
}

/**
 * Subscribe to sensor data from a device
 */
export function onSensorData(deviceId, callback) {
  const topic = getTopics().sensorData(deviceId);
  return subscribe(topic, (t, data) => callback(data));
}

/**
 * Subscribe to all sensor data for this user
 */
export function onAllSensorData(callback) {
  const pattern = `smartkisan/${userId}/sensors/+/data`;
  return subscribe(pattern, (topic, data) => {
    const parts = topic.split('/');
    const deviceId = parts[3];
    callback(deviceId, data);
  });
}

/**
 * Subscribe to alerts
 */
export function onAlerts(callback) {
  const topic = getTopics().alerts;
  return subscribe(topic, (t, data) => callback(data));
}

export default {
  connect,
  disconnect,
  getConnectionStatus,
  onConnectionStatusChange,
  publish,
  subscribe,
  getTopics,
  sendPumpCommand,
  sendPumpTimer,
  onPumpStatus,
  onAllPumpStatus,
  onSensorData,
  onAllSensorData,
  onAlerts,
};
