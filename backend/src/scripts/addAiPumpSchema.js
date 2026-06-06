/**
 * AI Pump migration — adds columns to the existing `pumps` table and creates
 * the `ai_decisions` audit table.
 *
 * Safe to run multiple times: every statement uses IF NOT EXISTS.
 *
 * Run with:  node backend/src/scripts/addAiPumpSchema.js
 */

require('dotenv').config();

const db = require('../config/db');

async function addAiPumpSchema() {
  try {
    // ─── 1. Extend `pumps` with AI-related fields ─────────────────────────
    // Config (farmer-set)
    await db.query(`ALTER TABLE pumps ADD COLUMN IF NOT EXISTS ai_enabled BOOLEAN DEFAULT false`);
    await db.query(`ALTER TABLE pumps ADD COLUMN IF NOT EXISTS ai_advisory_mode BOOLEAN DEFAULT true`);
    await db.query(`ALTER TABLE pumps ADD COLUMN IF NOT EXISTS linked_crop_id VARCHAR(100)`);
    await db.query(`ALTER TABLE pumps ADD COLUMN IF NOT EXISTS linked_field_id VARCHAR(100)`);
    await db.query(`ALTER TABLE pumps ADD COLUMN IF NOT EXISTS ai_min_moisture INTEGER`);
    await db.query(`ALTER TABLE pumps ADD COLUMN IF NOT EXISTS ai_max_moisture INTEGER`);

    // Safety rails — hard caps the engine respects on every decision.
    await db.query(`ALTER TABLE pumps ADD COLUMN IF NOT EXISTS max_runs_per_day INTEGER DEFAULT 3`);
    await db.query(`ALTER TABLE pumps ADD COLUMN IF NOT EXISTS max_run_minutes INTEGER DEFAULT 45`);
    await db.query(`ALTER TABLE pumps ADD COLUMN IF NOT EXISTS cooldown_minutes INTEGER DEFAULT 90`);

    // Soil + connectivity (read by the engine).
    await db.query(`ALTER TABLE pumps ADD COLUMN IF NOT EXISTS soil_type VARCHAR(50)`);
    await db.query(`ALTER TABLE pumps ADD COLUMN IF NOT EXISTS field_capacity_pct INTEGER`);
    await db.query(`ALTER TABLE pumps ADD COLUMN IF NOT EXISTS wilting_point_pct INTEGER`);
    await db.query(`ALTER TABLE pumps ADD COLUMN IF NOT EXISTS last_heartbeat_at TIMESTAMP`);

    // ─── 2. ai_decisions — full audit trail ───────────────────────────────
    // Every engine run writes a row here, executed or not. UI reads from this
    // table for the decision feed. `reason_key` + `reason_args` keeps the
    // text localizable (rendered at display time in the user's language).
    await db.query(`
      CREATE TABLE IF NOT EXISTS ai_decisions (
        id            VARCHAR(100) PRIMARY KEY,
        user_id       VARCHAR(100) NOT NULL,
        pump_id       VARCHAR(100) NOT NULL,
        decided_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        action        VARCHAR(20) NOT NULL,        -- 'run' | 'skip'
        duration_min  INTEGER,                     -- NULL when action = 'skip'
        reason_key    VARCHAR(80) NOT NULL,        -- e.g. 'skip_rain_expected'
        reason_args   JSONB,                       -- e.g. {"mm": 8}
        inputs_json   JSONB NOT NULL,              -- snapshot of all inputs
        overridden    BOOLEAN DEFAULT false,
        override_kind VARCHAR(20),                 -- 'run_now' | 'skip_next' | 'pause'
        executed      BOOLEAN DEFAULT false,
        executed_at   TIMESTAMP,
        feedback      VARCHAR(20)                  -- 'good' | 'bad' | NULL
      )
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_ai_decisions_pump_decided
        ON ai_decisions (pump_id, decided_at DESC)
    `);
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_ai_decisions_user_decided
        ON ai_decisions (user_id, decided_at DESC)
    `);

    // ─── 3. ai_overrides — one row per pending override ───────────────────
    // Farmer hits "Skip next" or "Run now" between cron ticks. The scheduler
    // checks this table before publishing its own command.
    await db.query(`
      CREATE TABLE IF NOT EXISTS ai_overrides (
        id          VARCHAR(100) PRIMARY KEY,
        user_id     VARCHAR(100) NOT NULL,
        pump_id     VARCHAR(100) NOT NULL,
        kind        VARCHAR(20) NOT NULL,          -- 'run_now' | 'skip_next' | 'pause_until'
        payload     JSONB,                         -- {"duration_min": 12} for run_now, etc.
        expires_at  TIMESTAMP,                     -- when this override is no longer honored
        consumed_at TIMESTAMP,                     -- set when scheduler honors it
        created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_ai_overrides_pump_pending
        ON ai_overrides (pump_id) WHERE consumed_at IS NULL
    `);

    console.log('AI Pump schema applied');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

addAiPumpSchema();
