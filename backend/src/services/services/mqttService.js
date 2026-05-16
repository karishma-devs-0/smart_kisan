const mqtt = require('mqtt');
const db = require('../config/db');

let client = null;

// ============================================================
// INITIALIZE MQTT
// ============================================================

function initMQTT() {

  client = mqtt.connect(
    process.env.MQTT_BROKER_URL
  );

  client.on('connect', () => {
    console.log('✅ MQTT Connected');
  });

  client.on('error', (err) => {
    console.error(
      'MQTT Error:',
      err.message
    );
  });

  client.on('offline', () => {
    console.log('MQTT Offline');
  });

  client.on('reconnect', () => {
    console.log('MQTT Reconnecting...');
  });
}

// ============================================================
// GET MQTT CLIENT
// ============================================================

function getClient() {
  return client;
}

// ============================================================
// PUBLISH PUMP STATUS
// ============================================================

async function publishPumpStatus(
  userId,
  pumpId,
  data
) {

  try {

    if (
      !client ||
      !client.connected
    ) {
      return;
    }

    // MQTT Publish
    client.publish(
      `smartkisan/${userId}/pump/${pumpId}/status`,
      JSON.stringify(data)
    );

    // Update PostgreSQL
    await db.query(
      `
      UPDATE pumps
      SET
        status = $1,
        updated_at = NOW()
      WHERE id = $2
      `,
      [
        data.status,
        pumpId,
      ]
    );

  } catch (error) {

    console.error(
      'publishPumpStatus error:',
      error.message
    );
  }
}

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  initMQTT,
  getClient,
  publishPumpStatus,
};
