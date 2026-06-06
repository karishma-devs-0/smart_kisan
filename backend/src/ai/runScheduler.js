/**
 * AI Pump scheduler — periodic tick that runs the engine for every
 * AI-enabled pump, persists decisions, and acts on them.
 *
 * Default cadence: every 15 minutes. Override with AI_TICK_SECONDS env var.
 *
 * Loop per tick:
 *   1. SELECT all pumps where ai_enabled = true
 *   2. For each pump:
 *      a. Check ai_overrides for a pending farmer command — honor it first
 *      b. Gather context (crop, field, soil, weather, history)
 *      c. Run decisionEngine.decide(ctx)
 *      d. INSERT into ai_decisions
 *      e. If action='run' AND not advisory_mode → publish MQTT command
 *      f. Publish decision notification to app
 */

const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
const { decide } = require('./decisionEngine');
const { publishPumpStatus, getClient } = require('../services/mqttService');

const TICK_SECONDS = Number(process.env.AI_TICK_SECONDS) || 15 * 60;

let tickHandle = null;

function start() {
  if (tickHandle) return;
  console.log(`AI scheduler: starting (tick every ${TICK_SECONDS}s)`);
  // Run one tick on startup so we don't have to wait for the first interval.
  tick().catch((e) => console.error('AI tick error (startup):', e.message));
  tickHandle = setInterval(
    () => tick().catch((e) => console.error('AI tick error:', e.message)),
    TICK_SECONDS * 1000,
  );
}

function stop() {
  if (tickHandle) {
    clearInterval(tickHandle);
    tickHandle = null;
  }
}

async function tick() {
  const { rows: pumps } = await db.query(
    `SELECT * FROM pumps WHERE ai_enabled = true`
  );
  if (pumps.length === 0) return;

  for (const pump of pumps) {
    try {
      await processPump(pump);
    } catch (err) {
      console.error(`AI tick: pump ${pump.id} failed:`, err.message);
    }
  }
}

async function processPump(pump) {
  // ─── Check for pending farmer override ───────────────────────────────────
  const override = await consumePendingOverride(pump.id);
  if (override?.kind === 'pause_until') {
    // pause active → just log a skip with reason, don't tick the engine.
    await persistDecision(pump, {
      action: 'skip',
      durationMin: null,
      reasonKey: 'skip_user_paused',
      reasonArgs: {},
      inputs: { override: true },
    });
    return;
  }
  if (override?.kind === 'skip_next') {
    await persistDecision(pump, {
      action: 'skip',
      durationMin: null,
      reasonKey: 'skip_user_requested',
      reasonArgs: {},
      inputs: { override: true },
    }, { overridden: true, overrideKind: 'skip_next' });
    return;
  }
  if (override?.kind === 'run_now') {
    const mins = Number(override.payload?.duration_min) || 10;
    const decision = {
      action: 'run',
      durationMin: mins,
      reasonKey: 'run_user_requested',
      reasonArgs: { minutes: mins },
      inputs: { override: true },
    };
    await executeDecision(pump, decision, { overridden: true, overrideKind: 'run_now' });
    return;
  }

  // ─── Normal engine path ──────────────────────────────────────────────────
  const ctx = await loadContext(pump);
  const decision = decide(ctx);

  if (decision.action === 'run') {
    await executeDecision(pump, decision);
  } else {
    await persistDecision(pump, decision);
    notifyAppOfDecision(pump, decision, /*executed*/ false);
  }
}

// ─── Context loading ────────────────────────────────────────────────────────

async function loadContext(pump) {
  const [crop, field, soil, weather, history] = await Promise.all([
    loadCrop(pump),
    loadField(pump),
    loadSoil(pump),
    loadWeather(pump),
    loadHistory(pump),
  ]);
  return { pump, crop, field, soil, weather, history };
}

async function loadCrop(pump) {
  if (!pump.linked_crop_id) return null;
  const { rows } = await db.query(
    `SELECT * FROM crops WHERE id = $1`, [pump.linked_crop_id]
  ).catch(() => ({ rows: [] }));
  return rows[0] || null;
}

async function loadField(pump) {
  if (!pump.linked_field_id) return null;
  const { rows } = await db.query(
    `SELECT * FROM fields WHERE id = $1`, [pump.linked_field_id]
  ).catch(() => ({ rows: [] }));
  return rows[0] || null;
}

async function loadSoil(pump) {
  // Prefer per-field reading, fall back to per-user `soil_current`.
  const userId = pump.owner_id || pump.user_id;
  const { rows } = await db.query(
    `SELECT moisture, updated_at FROM soil_current WHERE user_id = $1`, [userId]
  ).catch(() => ({ rows: [] }));
  return rows[0] || null;
}

async function loadWeather(_pump) {
  // v1: weather is fetched by the app and pushed via a future endpoint. For
  // now return null so the engine falls back to its ~4mm/day default.
  // TODO(weather-cache): when the backend grows a server-side weather cache,
  //                       wire it here. Kept null on purpose for v1.
  return null;
}

async function loadHistory(pump) {
  const userId = pump.owner_id || pump.user_id;
  const today = new Date().toISOString().slice(0, 10);
  const { rows: runRows } = await db.query(
    `SELECT COUNT(*)::int AS count
       FROM ai_decisions
      WHERE pump_id = $1 AND user_id = $2
        AND action = 'run' AND executed = true
        AND decided_at::date = $3`,
    [pump.id, userId, today],
  ).catch(() => ({ rows: [{ count: 0 }] }));

  const { rows: lastRows } = await db.query(
    `SELECT executed_at
       FROM ai_decisions
      WHERE pump_id = $1 AND executed = true
      ORDER BY executed_at DESC LIMIT 1`,
    [pump.id],
  ).catch(() => ({ rows: [] }));

  return {
    runsToday: runRows[0]?.count || 0,
    lastRunAt: lastRows[0]?.executed_at || pump.last_run || pump.last_turned_on || null,
  };
}

// ─── Decision side-effects ──────────────────────────────────────────────────

async function executeDecision(pump, decision, meta = {}) {
  const isAdvisory = pump.ai_advisory_mode !== false;
  const userId = pump.owner_id || pump.user_id;

  if (isAdvisory) {
    // Advisory mode: log the recommendation, do NOT publish a pump command.
    await persistDecision(pump, decision, { ...meta, executed: false });
    notifyAppOfDecision(pump, decision, false, /*advisory*/ true);
    return;
  }

  // Execute: publish ON command via MQTT and schedule auto-off via existing
  // timer topic so mqttService's auto-off path handles it.
  const client = getClient();
  if (client && client.connected) {
    const topic = `smartkisan/${userId}/pump/${pump.id}/timer`;
    client.publish(
      topic,
      JSON.stringify({ duration: decision.durationMin * 60, source: 'ai' }),
      { qos: 1 },
    );
  } else {
    console.warn(`AI: MQTT not connected, cannot execute pump ${pump.id}`);
  }

  await persistDecision(pump, decision, {
    ...meta,
    executed: true,
    executedAt: new Date().toISOString(),
  });
  notifyAppOfDecision(pump, decision, true);
}

async function persistDecision(pump, decision, meta = {}) {
  const userId = pump.owner_id || pump.user_id;
  await db.query(
    `INSERT INTO ai_decisions
       (id, user_id, pump_id, action, duration_min, reason_key, reason_args,
        inputs_json, overridden, override_kind, executed, executed_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
    [
      uuidv4(),
      userId,
      pump.id,
      decision.action,
      decision.durationMin,
      decision.reasonKey,
      JSON.stringify(decision.reasonArgs || {}),
      JSON.stringify(decision.inputs || {}),
      meta.overridden || false,
      meta.overrideKind || null,
      meta.executed || false,
      meta.executedAt || null,
    ],
  );
}

function notifyAppOfDecision(pump, decision, executed, advisory = false) {
  const client = getClient();
  if (!client || !client.connected) return;
  const userId = pump.owner_id || pump.user_id;
  const topic = `smartkisan/${userId}/pump/${pump.id}/ai/decision`;
  client.publish(topic, JSON.stringify({
    pumpId: pump.id,
    action: decision.action,
    durationMin: decision.durationMin,
    reasonKey: decision.reasonKey,
    reasonArgs: decision.reasonArgs,
    executed,
    advisory,
    decidedAt: new Date().toISOString(),
  }), { qos: 1 });
}

// ─── Overrides ──────────────────────────────────────────────────────────────

async function consumePendingOverride(pumpId) {
  const { rows } = await db.query(
    `SELECT * FROM ai_overrides
      WHERE pump_id = $1 AND consumed_at IS NULL
        AND (expires_at IS NULL OR expires_at > NOW())
      ORDER BY created_at ASC LIMIT 1`,
    [pumpId],
  );
  if (rows.length === 0) return null;
  const override = rows[0];
  // Don't mark `pause_until` as consumed — it stays pending until expiry.
  if (override.kind !== 'pause_until') {
    await db.query(
      `UPDATE ai_overrides SET consumed_at = NOW() WHERE id = $1`,
      [override.id],
    );
  }
  return override;
}

module.exports = { start, stop, tick };
