/**
 * MQTT Service for SmartKisan Backend
 *
 * Bridges MQTT messages with Firestore — when a pump command comes via MQTT,
 * it updates Firestore. When Firestore changes, it publishes to MQTT.
 *
 * Also handles timer auto-off logic server-side.
 */

const mqtt = require('mqtt');
const { getDb } = require('../config/firebase');
const admin = require('firebase-admin');

let client = null;
const activeTimers = new Map(); // pumpId → setTimeout handle

const BROKER_URL = process.env.MQTT_BROKER_URL || 'mqtt://broker.hivemq.com:1883';
const MQTT_USERNAME = process.env.MQTT_USERNAME || '';
const MQTT_PASSWORD = process.env.MQTT_PASSWORD || '';

function initMQTT() {
  const options = {
    clientId: `smartkisan_server_${Date.now()}`,
    clean: true,
    connectTimeout: 10000,
    reconnectPeriod: 5000,
  };

  if (MQTT_USERNAME) options.username = MQTT_USERNAME;
  if (MQTT_PASSWORD) options.password = MQTT_PASSWORD;

  client = mqtt.connect(BROKER_URL, options);

  client.on('connect', () => {
    console.log('MQTT: Connected to', BROKER_URL);

    // Subscribe to all pump commands and timer commands
    client.subscribe('smartkisan/+/pump/+/command', { qos: 1 });
    client.subscribe('smartkisan/+/pump/+/timer', { qos: 1 });
    console.log('MQTT: Subscribed to pump command & timer topics');
  });

  client.on('message', async (topic, payload) => {
    try {
      const data = JSON.parse(payload.toString());
      const parts = topic.split('/');
      // smartkisan/{userId}/pump/{pumpId}/command|timer
      const userId = parts[1];
      const pumpId = parts[3];
      const type = parts[4]; // 'command' or 'timer'

      if (type === 'command') {
        await handlePumpCommand(userId, pumpId, data);
      } else if (type === 'timer') {
        await handlePumpTimer(userId, pumpId, data);
      }
    } catch (err) {
      console.error('MQTT: Message handling error', err.message);
    }
  });

  client.on('error', (err) => {
    console.error('MQTT: Error', err.message);
  });

  client.on('offline', () => {
    console.log('MQTT: Disconnected');
  });
}

// ─── Handle pump ON/OFF command ─────────────────────────────────────────────

async function handlePumpCommand(userId, pumpId, data) {
  const { action } = data; // 'on' or 'off'
  if (!['on', 'off'].includes(action)) return;

  const db = getDb();
  const pumpRef = db.collection('pumps').doc(pumpId);
  const pumpDoc = await pumpRef.get();

  if (!pumpDoc.exists) return;

  const pumpData = pumpDoc.data();
  const now = new Date();

  let additionalRunTime = 0;
  if (action === 'off' && pumpData.status === 'on' && pumpData.lastTurnedOn) {
    const lastOn = pumpData.lastTurnedOn.toDate ? pumpData.lastTurnedOn.toDate() : new Date(pumpData.lastTurnedOn);
    additionalRunTime = Math.floor((now - lastOn) / 1000);
  }

  const updateData = {
    status: action,
    lastAction: action === 'on' ? 'turned_on' : 'turned_off',
    lastActionAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  if (action === 'on') {
    updateData.lastTurnedOn = admin.firestore.FieldValue.serverTimestamp();
  } else {
    updateData.lastTurnedOff = admin.firestore.FieldValue.serverTimestamp();
    updateData.totalRunTime = (pumpData.totalRunTime || 0) + additionalRunTime;
    // Clear any active timer
    if (activeTimers.has(pumpId)) {
      clearTimeout(activeTimers.get(pumpId));
      activeTimers.delete(pumpId);
    }
  }

  await pumpRef.update(updateData);

  // Log to history
  await db.collection('pumpHistory').add({
    pumpId,
    pumpName: pumpData.name,
    action,
    triggeredBy: data.source === 'device' ? 'device' : 'mqtt',
    userId,
    duration: action === 'off' ? additionalRunTime : null,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Publish status update back
  publishPumpStatus(userId, pumpId, {
    status: action,
    pumpId,
    pumpName: pumpData.name,
    timestamp: now.toISOString(),
    runTime: action === 'off' ? additionalRunTime : null,
  });

  console.log(`MQTT: Pump ${pumpId} turned ${action} by ${data.source || 'unknown'}`);
}

// ─── Handle timer command ───────────────────────────────────────────────────

async function handlePumpTimer(userId, pumpId, data) {
  const { duration } = data; // seconds
  if (!duration || duration <= 0) return;

  // Turn pump on
  await handlePumpCommand(userId, pumpId, { action: 'on', source: 'timer' });

  // Set auto-off timer
  if (activeTimers.has(pumpId)) {
    clearTimeout(activeTimers.get(pumpId));
  }

  const handle = setTimeout(async () => {
    await handlePumpCommand(userId, pumpId, { action: 'off', source: 'timer_auto' });
    activeTimers.delete(pumpId);
    console.log(`MQTT: Timer expired — pump ${pumpId} auto-off after ${duration}s`);
  }, duration * 1000);

  activeTimers.set(pumpId, handle);
  console.log(`MQTT: Timer set — pump ${pumpId} will auto-off in ${duration}s`);
}

// ─── Publish helpers ────────────────────────────────────────────────────────

function publishPumpStatus(userId, pumpId, data) {
  if (!client || !client.connected) return;
  const topic = `smartkisan/${userId}/pump/${pumpId}/status`;
  client.publish(topic, JSON.stringify(data), { qos: 1 });
}

function publishSensorData(userId, deviceId, data) {
  if (!client || !client.connected) return;
  const topic = `smartkisan/${userId}/sensors/${deviceId}/data`;
  client.publish(topic, JSON.stringify(data), { qos: 1 });
}

function publishAlert(userId, alert) {
  if (!client || !client.connected) return;
  const topic = `smartkisan/${userId}/alerts`;
  client.publish(topic, JSON.stringify(alert), { qos: 1 });
}

function getClient() {
  return client;
}

module.exports = {
  initMQTT,
  getClient,
  publishPumpStatus,
  publishSensorData,
  publishAlert,
};
