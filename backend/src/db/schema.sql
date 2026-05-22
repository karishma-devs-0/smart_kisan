-- SmartKisan local database schema
-- Engine: SQLite (better-sqlite3). Most types port to Postgres with minor swaps:
--   TEXT JSON columns -> JSONB
--   INTEGER booleans  -> BOOLEAN
--   datetime('now')   -> NOW()
--
-- All user-owned rows carry a user_id FK so we can scope queries the same way
-- Firestore scoped under users/{uid}/. Cascade deletes wipe a user cleanly.
--
-- IDs are TEXT (UUIDv4 from crypto.randomUUID() on the server) so the client
-- treats them as opaque strings — same shape as Firestore document IDs today.
--
-- Timestamps are ISO 8601 strings to match what the JS code already emits via
-- new Date().toISOString().

PRAGMA foreign_keys = ON;

-- ─── 1. AUTH ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id              TEXT PRIMARY KEY,
  email           TEXT UNIQUE NOT NULL,
  username        TEXT UNIQUE,
  phone           TEXT UNIQUE,
  password_hash   TEXT NOT NULL,                 -- bcrypt; empty string for SSO-only users
  name            TEXT,
  avatar_url      TEXT,
  google_sub      TEXT UNIQUE,                   -- Google id_token `sub` claim
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_users_email    ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  TEXT NOT NULL,                     -- SHA-256 of raw token; raw value never stored
  expires_at  TEXT NOT NULL,
  revoked_at  TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_refresh_user ON refresh_tokens(user_id);

-- ─── 2. ONBOARDING + SETTINGS (singletons per user) ─────────────────────────

CREATE TABLE IF NOT EXISTS onboarding_profile (
  user_id      TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  farm_name    TEXT,
  farm_type    TEXT,
  farm_size    REAL,                              -- area in user's preferred unit (see settings.units)
  location     TEXT,                              -- JSON: {name, lat, lng}
  language     TEXT,
  completed_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS settings (
  user_id           TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  language          TEXT    NOT NULL DEFAULT 'en',
  notifications     INTEGER NOT NULL DEFAULT 1,        -- boolean (0/1)
  units             TEXT    NOT NULL DEFAULT 'metric', -- 'metric' | 'imperial'
  offline_mode      INTEGER NOT NULL DEFAULT 0,
  data_sync_enabled INTEGER NOT NULL DEFAULT 1,
  location          TEXT    NOT NULL,                  -- JSON: {name, lat, lng}
  updated_at        TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ─── 3. FIELDS / CROPS ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS fields (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  area            REAL,
  crop            TEXT,                                -- denormalized crop name (matches mock shape)
  sowing_date     TEXT,
  growth_stage    TEXT,                                -- seedling|vegetative|flowering|maturity
  growth_progress INTEGER,                             -- 0–100
  soil_type       TEXT,
  irrigation_type TEXT,                                -- drip|sprinkler|flood
  last_irrigation TEXT,
  next_irrigation TEXT,
  status          TEXT NOT NULL DEFAULT 'active',      -- active|harvested|fallow
  lat             REAL,
  lng             REAL,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_fields_user ON fields(user_id);

CREATE TABLE IF NOT EXISTS crops (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  variety       TEXT,
  field         TEXT,                                -- field label (matches existing client shape)
  sowing_date   TEXT,                                -- 'YYYY-MM-DD'
  harvest_date  TEXT,
  status        TEXT NOT NULL DEFAULT 'growing',     -- growing|ready|harvested
  image_uri     TEXT,
  notes         TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_crops_user ON crops(user_id);

-- ─── 4. PUMPS ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pump_groups (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  field_image   TEXT,
  soil_moisture INTEGER,                             -- aggregated, may be null
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_pump_groups_user ON pump_groups(user_id);

CREATE TABLE IF NOT EXISTS pumps (
  id             TEXT PRIMARY KEY,
  user_id        TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  group_id       TEXT REFERENCES pump_groups(id) ON DELETE SET NULL,
  name           TEXT NOT NULL,
  field          TEXT,                              -- field label
  status         TEXT NOT NULL DEFAULT 'off',       -- on|off
  mode           TEXT NOT NULL DEFAULT 'manual',    -- manual|timer|schedule|sensor|ai|automatic
  hp             REAL,
  type           TEXT,                              -- submersible|centrifugal|jet
  image_uri      TEXT,
  soil_moisture  INTEGER,
  water_level    INTEGER,
  flow_rate      INTEGER NOT NULL DEFAULT 50,       -- L/min, used by history duration calc
  last_run       TEXT,
  next_run       TEXT,
  last_on_at     TEXT,                              -- set when status flips to 'on'; cleared on 'off'
  sensor_config  TEXT,                              -- JSON: thresholds for sensor mode
  created_at     TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_pumps_user  ON pumps(user_id);
CREATE INDEX IF NOT EXISTS idx_pumps_group ON pumps(group_id);

CREATE TABLE IF NOT EXISTS pump_schedules (
  id          TEXT PRIMARY KEY,
  pump_id     TEXT NOT NULL REFERENCES pumps(id) ON DELETE CASCADE,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  start_time  TEXT NOT NULL,                        -- 'HH:mm' (local clock)
  duration    INTEGER NOT NULL,                     -- minutes
  status      TEXT NOT NULL DEFAULT 'active',       -- active|inactive
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_schedules_pump ON pump_schedules(pump_id);

CREATE TABLE IF NOT EXISTS pump_history (
  id         TEXT PRIMARY KEY,
  pump_id    TEXT NOT NULL REFERENCES pumps(id) ON DELETE CASCADE,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status     TEXT NOT NULL,                         -- 'on' | 'off'
  duration   INTEGER,                               -- seconds, only on 'off' transitions
  flow_rate  INTEGER,                               -- snapshot at run time
  timestamp  TEXT NOT NULL                          -- ISO 8601
);

CREATE INDEX IF NOT EXISTS idx_history_pump_ts ON pump_history(pump_id, timestamp DESC);

-- ─── 5. DEVICES + ALERT RULES ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS devices (
  id               TEXT PRIMARY KEY,
  user_id          TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  field_id         TEXT REFERENCES fields(id) ON DELETE SET NULL,
  name             TEXT NOT NULL,
  type             TEXT NOT NULL,                   -- weather_station|moisture_sensor|pump_controller|soil_sensor|camera|gateway
  status           TEXT NOT NULL DEFAULT 'offline', -- online|offline
  battery_level    INTEGER,
  signal_strength  INTEGER,
  firmware_version TEXT,
  location         TEXT,
  lat              REAL,
  lng              REAL,
  last_sync        TEXT,
  created_at       TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_devices_user ON devices(user_id);

CREATE TABLE IF NOT EXISTS alert_rules (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_id   TEXT REFERENCES devices(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  sensor      TEXT NOT NULL,                        -- moisture|pH|nitrogen|phosphorus|potassium|temperature|ec|organicCarbon
  condition   TEXT NOT NULL,                        -- '<' | '>' | '==' | '<=' | '>='
  threshold   REAL NOT NULL,
  severity    TEXT NOT NULL DEFAULT 'warning',      -- info|warning|critical
  channels    TEXT NOT NULL,                        -- JSON array: ["push","sms","email"]
  enabled     INTEGER NOT NULL DEFAULT 1,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_alert_rules_user ON alert_rules(user_id);

-- ─── 6. SOIL ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS soil_current (
  user_id        TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  moisture       REAL,
  temperature    REAL,
  pH             REAL,
  nitrogen       REAL,
  phosphorus     REAL,
  potassium      REAL,
  ec             REAL,
  organic_carbon REAL,
  texture        TEXT,
  health_score   INTEGER,
  updated_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS soil_readings (
  id             TEXT PRIMARY KEY,
  user_id        TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_id      TEXT REFERENCES devices(id) ON DELETE SET NULL,
  field          TEXT,
  source         TEXT NOT NULL,                     -- sensor|manual|lab
  date           TEXT NOT NULL,                     -- ISO 8601
  moisture       REAL,
  temperature    REAL,
  pH             REAL,
  nitrogen       REAL,
  phosphorus     REAL,
  potassium      REAL,
  ec             REAL,
  organic_carbon REAL
);

CREATE INDEX IF NOT EXISTS idx_soil_readings_user_date ON soil_readings(user_id, date DESC);

-- ─── 7. FARM TASKS ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS farm_tasks (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  field_id    TEXT REFERENCES fields(id) ON DELETE SET NULL,
  field_name  TEXT,                                 -- denormalized; mock shape uses 'fieldName'
  title       TEXT NOT NULL,
  description TEXT,
  category    TEXT NOT NULL,                        -- sowing|harvesting|irrigation|fertilizing|spraying|weeding|monitoring|maintenance
  status      TEXT NOT NULL DEFAULT 'active',       -- active|pending|completed
  priority    TEXT NOT NULL DEFAULT 'medium',       -- low|medium|high
  due_date    TEXT,
  assignee    TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_tasks_user_due ON farm_tasks(user_id, due_date);

-- ─── 8. UPLOADS (replaces Firebase Storage) ─────────────────────────────────

CREATE TABLE IF NOT EXISTS uploads (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  folder       TEXT NOT NULL,                       -- 'crops'|'fields'|'soil'|'alerts' etc.
  filename     TEXT NOT NULL,
  mime_type    TEXT,
  size_bytes   INTEGER,
  storage_path TEXT NOT NULL,                       -- on-disk path or S3 key
  url          TEXT NOT NULL,                       -- public URL the client embeds
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_uploads_user ON uploads(user_id);
