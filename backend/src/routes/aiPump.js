/**
 * AI Pump routes.
 *
 *   GET    /api/ai/pumps/:id/config          — read AI config for one pump
 *   PATCH  /api/ai/pumps/:id/config          — update AI config + thresholds
 *   GET    /api/ai/pumps/:id/decisions       — recent decisions for this pump
 *   GET    /api/ai/decisions                 — recent decisions across all pumps
 *   POST   /api/ai/pumps/:id/override        — { kind, payload, expires_at? }
 *   POST   /api/ai/decisions/:id/feedback    — { feedback: 'good' | 'bad' }
 *   POST   /api/ai/tick                      — force a scheduler tick (dev)
 */

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

const db = require('../config/db');
const { tick } = require('../ai/runScheduler');

// ─── Config ─────────────────────────────────────────────────────────────────

router.get('/pumps/:id/config', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT id, ai_enabled, ai_advisory_mode, linked_crop_id, linked_field_id,
              ai_min_moisture, ai_max_moisture, max_runs_per_day, max_run_minutes,
              cooldown_minutes, soil_type, field_capacity_pct, wilting_point_pct,
              flow_rate, last_heartbeat_at
         FROM pumps WHERE id = $1 AND owner_id = $2`,
      [req.params.id, req.user.id],
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Pump not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('GET /ai/pumps/:id/config error:', err.message);
    res.status(500).json({ error: 'Failed to fetch AI config' });
  }
});

const ALLOWED_CONFIG_FIELDS = {
  ai_enabled:           'boolean',
  ai_advisory_mode:     'boolean',
  linked_crop_id:       'string',
  linked_field_id:      'string',
  ai_min_moisture:      'number',
  ai_max_moisture:      'number',
  max_runs_per_day:     'number',
  max_run_minutes:      'number',
  cooldown_minutes:     'number',
  soil_type:            'string',
  field_capacity_pct:   'number',
  wilting_point_pct:    'number',
  // Flow rate (L/min) lives on the pumps row but the legacy /pumps PUT route
  // writes the wrong column name — letting it be patched here means the Edit
  // Pump form can persist it via this endpoint instead.
  flow_rate:            'number',
};

router.patch('/pumps/:id/config', async (req, res) => {
  try {
    const updates = [];
    const values = [];
    let idx = 1;

    for (const [key, expectedType] of Object.entries(ALLOWED_CONFIG_FIELDS)) {
      if (!(key in req.body)) continue;
      const val = req.body[key];
      if (val !== null && typeof val !== expectedType) {
        return res.status(400).json({ error: `${key} must be ${expectedType}` });
      }
      updates.push(`${key} = $${idx++}`);
      values.push(val);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    values.push(req.params.id, req.user.id);
    const { rows } = await db.query(
      `UPDATE pumps SET ${updates.join(', ')}, updated_at = NOW()
        WHERE id = $${idx} AND owner_id = $${idx + 1}
        RETURNING *`,
      values,
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Pump not found' });
    res.json({ pump: rows[0], message: 'AI config updated' });
  } catch (err) {
    console.error('PATCH /ai/pumps/:id/config error:', err.message);
    res.status(500).json({ error: 'Failed to update AI config' });
  }
});

// ─── Decisions feed ─────────────────────────────────────────────────────────

router.get('/pumps/:id/decisions', async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const { rows } = await db.query(
      `SELECT * FROM ai_decisions
        WHERE pump_id = $1 AND user_id = $2
        ORDER BY decided_at DESC LIMIT $3`,
      [req.params.id, req.user.id, limit],
    );
    res.json({ decisions: rows, count: rows.length });
  } catch (err) {
    console.error('GET /ai/pumps/:id/decisions error:', err.message);
    res.status(500).json({ error: 'Failed to fetch decisions' });
  }
});

router.get('/decisions', async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const { rows } = await db.query(
      `SELECT * FROM ai_decisions
        WHERE user_id = $1
        ORDER BY decided_at DESC LIMIT $2`,
      [req.user.id, limit],
    );
    res.json({ decisions: rows, count: rows.length });
  } catch (err) {
    console.error('GET /ai/decisions error:', err.message);
    res.status(500).json({ error: 'Failed to fetch decisions' });
  }
});

// ─── Overrides ──────────────────────────────────────────────────────────────

const ALLOWED_OVERRIDE_KINDS = ['run_now', 'skip_next', 'pause_until'];

router.post('/pumps/:id/override', async (req, res) => {
  try {
    const { kind, payload, expires_at } = req.body;
    if (!ALLOWED_OVERRIDE_KINDS.includes(kind)) {
      return res.status(400).json({ error: `kind must be one of: ${ALLOWED_OVERRIDE_KINDS.join(', ')}` });
    }

    // Confirm pump exists + belongs to user.
    const { rows: pumpRows } = await db.query(
      `SELECT id FROM pumps WHERE id = $1 AND owner_id = $2`,
      [req.params.id, req.user.id],
    );
    if (pumpRows.length === 0) return res.status(404).json({ error: 'Pump not found' });

    const id = uuidv4();
    await db.query(
      `INSERT INTO ai_overrides (id, user_id, pump_id, kind, payload, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        id,
        req.user.id,
        req.params.id,
        kind,
        payload ? JSON.stringify(payload) : null,
        expires_at || null,
      ],
    );

    // For run_now we want immediate action — kick a scheduler tick rather
    // than wait for the next cron interval.
    if (kind === 'run_now') {
      tick().catch((e) => console.warn('Override tick failed:', e.message));
    }

    res.status(201).json({ id, message: 'Override queued' });
  } catch (err) {
    console.error('POST /ai/pumps/:id/override error:', err.message);
    res.status(500).json({ error: 'Failed to queue override' });
  }
});

// ─── Feedback ───────────────────────────────────────────────────────────────

router.post('/decisions/:id/feedback', async (req, res) => {
  try {
    const { feedback } = req.body;
    if (!['good', 'bad'].includes(feedback)) {
      return res.status(400).json({ error: "feedback must be 'good' or 'bad'" });
    }
    const { rows } = await db.query(
      `UPDATE ai_decisions SET feedback = $1
        WHERE id = $2 AND user_id = $3 RETURNING id`,
      [feedback, req.params.id, req.user.id],
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Decision not found' });
    res.json({ message: 'Feedback recorded' });
  } catch (err) {
    console.error('POST /ai/decisions/:id/feedback error:', err.message);
    res.status(500).json({ error: 'Failed to record feedback' });
  }
});

// ─── Dev: force a tick ──────────────────────────────────────────────────────

router.post('/tick', async (req, res) => {
  try {
    await tick();
    res.json({ message: 'Tick complete' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
