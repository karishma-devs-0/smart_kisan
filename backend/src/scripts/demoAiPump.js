/**
 * End-to-end AI Pump demo / smoke test.
 *
 *   1. Picks any AI-enabled pump from Neon
 *   2. Signs a JWT for its owner
 *   3. Subscribes to MQTT smartkisan/<userId>/# (every relevant topic)
 *   4. Fires POST /api/ai/simulate-sensor (moisture=20)
 *   5. Fires POST /api/ai/pumps/<pumpId>/tick
 *   6. Prints every MQTT message that arrives for 15 seconds
 *   7. Prints the new ai_decisions row
 *
 * Run from backend/ with:  node src/scripts/demoAiPump.js
 *
 * Override the injected moisture with: MOISTURE=80 node src/scripts/demoAiPump.js
 */

require('dotenv').config();

const db   = require('../config/db');
const jwt  = require('jsonwebtoken');
const mqtt = require('mqtt');

const API_BASE   = process.env.DEMO_API_BASE || 'http://localhost:5000/api';
const BROKER_URL = process.env.MQTT_BROKER_URL || 'mqtt://broker.hivemq.com:1883';
const MOISTURE   = Number(process.env.MOISTURE || 20);
const LISTEN_MS  = 15_000;

const c = {
  reset: '\x1b[0m', dim: '\x1b[2m', bold: '\x1b[1m',
  green: '\x1b[32m', cyan: '\x1b[36m', yellow: '\x1b[33m', red: '\x1b[31m',
};
const log = (color, label, ...rest) =>
  console.log(`${c[color]}${c.bold}${label}${c.reset} ${rest.join(' ')}`);

async function main() {
  // ─── 1. Find an AI-enabled pump ─────────────────────────────────────────
  const { rows } = await db.query(
    `SELECT id, owner_id, name, ai_enabled, flow_rate
       FROM pumps WHERE ai_enabled = true ORDER BY updated_at DESC LIMIT 1`,
  );
  if (rows.length === 0) {
    log('red', '✗', 'No AI-enabled pump found in Neon.');
    log('dim', '  ', 'Toggle AI on for a pump in the app first, then re-run.');
    process.exit(1);
  }
  const pump = rows[0];
  log('cyan', '◆ Pump:', `${pump.name} (id=${pump.id}, owner=${pump.owner_id}, flow=${pump.flow_rate ?? 'null'})`);

  // ─── 2. Sign a JWT for the pump's owner ────────────────────────────────
  const token = jwt.sign(
    { id: pump.owner_id, email: 'demo' },
    process.env.JWT_SECRET,
    { expiresIn: '15m' },
  );
  log('cyan', '◆ JWT:', 'signed for user', pump.owner_id);

  // ─── 3. Connect MQTT and subscribe ─────────────────────────────────────
  // Public broker is flaky — retry once with a longer timeout if first attempt fails.
  const client = await connectMqttWithRetry();
  log('cyan', '◆ MQTT:', 'connected to', BROKER_URL);

  const topicFilter = `smartkisan/${pump.owner_id}/#`;
  await new Promise((resolve, reject) =>
    client.subscribe(topicFilter, { qos: 1 }, (e) => (e ? reject(e) : resolve())),
  );
  log('cyan', '◆ MQTT:', 'subscribed to', topicFilter);

  const messages = [];
  client.on('message', (topic, payload) => {
    const text = payload.toString();
    let parsed;
    try { parsed = JSON.parse(text); } catch { parsed = text; }
    messages.push({ at: Date.now(), topic, parsed });
    log('green', '← MQTT:', topic);
    console.log('       ', JSON.stringify(parsed));
  });

  // ─── 4. Fire simulate-sensor + tick ─────────────────────────────────────
  console.log();
  log('yellow', '→ POST', `${API_BASE}/ai/simulate-sensor { moisture: ${MOISTURE} }`);
  const sim = await fetch(`${API_BASE}/ai/simulate-sensor`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ moisture: MOISTURE, temperature: 32 }),
  });
  console.log('       status', sim.status, await sim.text());

  await new Promise((r) => setTimeout(r, 600));

  log('yellow', '→ POST', `${API_BASE}/ai/pumps/${pump.id}/tick`);
  const tick = await fetch(`${API_BASE}/ai/pumps/${pump.id}/tick`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({}),
  });
  console.log('       status', tick.status, await tick.text());

  // ─── 5. Listen for MQTT messages ────────────────────────────────────────
  console.log();
  log('cyan', '◆ Listening:', `${LISTEN_MS / 1000}s for MQTT messages on ${topicFilter} …`);
  await new Promise((r) => setTimeout(r, LISTEN_MS));

  // ─── 6. Pull the latest decision from the DB ────────────────────────────
  console.log();
  const { rows: dec } = await db.query(
    `SELECT decided_at, action, duration_min, reason_key, reason_args, inputs_json
       FROM ai_decisions
      WHERE pump_id = $1 ORDER BY decided_at DESC LIMIT 1`,
    [pump.id],
  );
  if (dec.length === 0) {
    log('red', '✗', 'No ai_decisions row was created. Engine likely failed silently.');
  } else {
    log('cyan', '◆ Latest decision:');
    console.log(JSON.stringify(dec[0], null, 2));
  }

  // ─── Summary ────────────────────────────────────────────────────────────
  console.log();
  log('cyan', '◆ Summary:', `${messages.length} MQTT message(s) observed`);
  messages.forEach((m) => console.log(' ', m.topic));

  client.end(true);
  process.exit(0);
}

async function connectMqttWithRetry() {
  const attempts = [
    { timeout: 15000, label: 'attempt 1 (15s)' },
    { timeout: 30000, label: 'attempt 2 (30s)' },
  ];
  for (const a of attempts) {
    try {
      const c = mqtt.connect(BROKER_URL, {
        clientId: `demo_ai_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        connectTimeout: a.timeout,
        reconnectPeriod: 0,
        keepalive: 30,
      });
      await new Promise((resolve, reject) => {
        const onErr = (e) => { c.end(true); reject(e); };
        const onConn = () => { c.off('error', onErr); resolve(); };
        c.once('connect', onConn);
        c.once('error', onErr);
      });
      return c;
    } catch (e) {
      log('yellow', '⚠ MQTT:', `${a.label} failed — ${e.message}`);
    }
  }
  throw new Error('Could not connect to MQTT broker after retries');
}

main().catch((err) => {
  console.error('Demo failed:', err);
  process.exit(1);
});
