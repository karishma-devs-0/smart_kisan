/**
 * MQTT Service for SmartKisan Backend
 *
 * Bridges MQTT messages with the PostgreSQL database. When a pump command
 * comes in via MQTT, the server updates the `pumps` row, logs an entry to
 * `pump_history`, and publishes a status update back to the device topic.
 * Also handles server-side timer auto-off.
 */

const mqtt = require('mqtt');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');

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

  // Look up the pump row so we can compute duration on off-transitions and
  // capture the current flow_rate for the history entry.
  const { rows } = await db.query(
    'SELECT id, name, status, last_on_at, flow_rate FROM pumps WHERE id = $1',
    [pumpId],
  );
  if (rows.length === 0) {
    console.warn(`MQTT: pump ${pumpId} not found in DB, skipping`);
    return;
  }
  const pump = rows[0];

  const now = new Date();
  const nowISO = now.toISOString();
  let duration = null;

  if (action === 'on') {
    await db.query(
      `UPDATE pumps
         SET status = 'on',
             last_on_at = $1,
             last_run = $1,
             updated_at = $1
       WHERE id = $2`,
      [nowISO, pumpId],
    );
  } else {
    // OFF — compute how long the pump ran (if it was on).
    if (pump.status === 'on' && pump.last_on_at) {
      const lastOn = new Date(pump.last_on_at);
      if (!isNaN(lastOn.getTime())) {
        duration = Math.max(0, Math.floor((now - lastOn) / 1000));
      }
    }
    await db.query(
      `UPDATE pumps
         SET status = 'off',
             updated_at = $1
       WHERE id = $2`,
      [nowISO, pumpId],
    );
    // Clear any active server-side timer.
    if (activeTimers.has(pumpId)) {
      clearTimeout(activeTimers.get(pumpId));
      activeTimers.delete(pumpId);
    }
  }

  // Log to pump_history. (Schema: id, pump_id, user_id, status, duration, flow_rate, timestamp)
  await db.query(
    `INSERT INTO pump_history (id, pump_id, user_id, status, duration, flow_rate, timestamp)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [uuidv4(), pumpId, userId, action, duration, pump.flow_rate, nowISO],
  );

  // Publish status back to the device topic so the app's subscriber updates.
  publishPumpStatus(userId, pumpId, {
    status: action,
    pumpId,
    pumpName: pump.name,
    timestamp: nowISO,
    runTime: action === 'off' ? duration : null,
  });

  console.log(`MQTT: Pump ${pumpId} turned ${action} by ${data.source || 'unknown'}`);
}

// ─── Handle timer command ───────────────────────────────────────────────────

async function handlePumpTimer(userId, pumpId, data) {
  const { duration } = data; // seconds
  if (!duration || duration <= 0) return;

  // Turn pump on immediately.
  await handlePumpCommand(userId, pumpId, { action: 'on', source: 'timer' });

  // Schedule the auto-off.
  if (activeTimers.has(pumpId)) {
    clearTimeout(activeTimers.get(pumpId));
  }
  const handle = setTimeout(async () => {
    try {
      await handlePumpCommand(userId, pumpId, { action: 'off', source: 'timer_auto' });
    } catch (err) {
      console.error('MQTT: Timer auto-off error', err.message);
    }
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
