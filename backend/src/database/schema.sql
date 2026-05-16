-- =========================================================
-- DROP OLD TYPES
-- =========================================================

DROP TYPE IF EXISTS role_enum CASCADE;
DROP TYPE IF EXISTS pump_status_enum CASCADE;
DROP TYPE IF EXISTS pump_type_enum CASCADE;
DROP TYPE IF EXISTS device_type_enum CASCADE;
DROP TYPE IF EXISTS crop_status_enum CASCADE;
DROP TYPE IF EXISTS repeat_type_enum CASCADE;
DROP TYPE IF EXISTS action_enum CASCADE;
DROP TYPE IF EXISTS triggered_by_enum CASCADE;
DROP TYPE IF EXISTS task_status_enum CASCADE;

-- =========================================================
-- ENUMS
-- =========================================================

CREATE TYPE role_enum AS ENUM (
  'farmer',
  'worker',
  'admin'
);

CREATE TYPE pump_status_enum AS ENUM (
  'on',
  'off'
);

CREATE TYPE pump_type_enum AS ENUM (
  'submersible',
  'centrifugal',
  'jet'
);

CREATE TYPE device_type_enum AS ENUM (
  'soil_sensor',
  'weather_station'
);

CREATE TYPE crop_status_enum AS ENUM (
  'growing',
  'harvested',
  'failed'
);

CREATE TYPE repeat_type_enum AS ENUM (
  'none',
  'daily',
  'weekly',
  'monthly'
);

CREATE TYPE action_enum AS ENUM (
  'on',
  'off',
  'timer_started',
  'timer_stopped'
);

CREATE TYPE triggered_by_enum AS ENUM (
  'manual',
  'timer',
  'sensor'
);

CREATE TYPE task_status_enum AS ENUM (
  'pending',
  'in_progress',
  'completed'
);

-- =========================================================
-- USERS
-- =========================================================

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone_number VARCHAR(20) UNIQUE,
  password_hash VARCHAR(255),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role role_enum DEFAULT 'farmer',
  auth_provider VARCHAR(50),
  google_sub VARCHAR(255) UNIQUE,
  avatar_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

-- =========================================================
-- OTPS
-- =========================================================

CREATE TABLE otps (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  otp_code VARCHAR(20) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

-- =========================================================
-- REFRESH TOKENS
-- =========================================================

CREATE TABLE refresh_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(500) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  revoked_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

-- =========================================================
-- SETTINGS
-- =========================================================

CREATE TABLE settings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  setting_key VARCHAR(255) NOT NULL,
  setting_value JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  UNIQUE(user_id, setting_key)
);

-- =========================================================
-- ONBOARDING PROFILE
-- =========================================================

CREATE TABLE onboarding_profile (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  farm_size_acres DECIMAL(10,2),
  primary_crop VARCHAR(255),
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

-- =========================================================
-- UPLOADS
-- =========================================================

CREATE TABLE uploads (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  entity_type VARCHAR(100),
  entity_id INTEGER,
  file_url VARCHAR(500) NOT NULL,
  file_type VARCHAR(100),
  file_size_bytes INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

-- =========================================================
-- FIELDS
-- =========================================================

CREATE TABLE fields (
  id SERIAL PRIMARY KEY,
  owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  area_size DECIMAL(10,2),
  boundary_json JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

-- =========================================================
-- CROPS
-- =========================================================

CREATE TABLE crops (
  id SERIAL PRIMARY KEY,
  field_id INTEGER REFERENCES fields(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  crop_type VARCHAR(255),
  planted_at TIMESTAMP,
  expected_harvest_at TIMESTAMP,
  water_requirement_mm DECIMAL(10,2),
  status crop_status_enum DEFAULT 'growing',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

-- =========================================================
-- FARM TASKS
-- =========================================================

CREATE TABLE farm_tasks (
  id SERIAL PRIMARY KEY,
  owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  field_id INTEGER REFERENCES fields(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
  due_date TIMESTAMP,
  status task_status_enum DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

-- =========================================================
-- DEVICES
-- =========================================================

CREATE TABLE devices (
  id SERIAL PRIMARY KEY,
  owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  field_id INTEGER REFERENCES fields(id) ON DELETE SET NULL,
  mac_address VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  device_type device_type_enum,
  battery_level INTEGER,
  is_online BOOLEAN DEFAULT FALSE,
  last_ping_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

-- =========================================================
-- SOIL CURRENT
-- =========================================================

CREATE TABLE soil_current (
  id SERIAL PRIMARY KEY,
  device_id INTEGER UNIQUE REFERENCES devices(id) ON DELETE CASCADE,
  nitrogen DECIMAL(10,2),
  phosphorus DECIMAL(10,2),
  potassium DECIMAL(10,2),
  moisture_percent DECIMAL(10,2),
  ph_level DECIMAL(10,2),
  temperature_c DECIMAL(10,2),
  last_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

-- =========================================================
-- SOIL READINGS
-- =========================================================

CREATE TABLE soil_readings (
  id SERIAL PRIMARY KEY,
  device_id INTEGER REFERENCES devices(id) ON DELETE CASCADE,
  nitrogen DECIMAL(10,2),
  phosphorus DECIMAL(10,2),
  potassium DECIMAL(10,2),
  moisture_percent DECIMAL(10,2),
  ph_level DECIMAL(10,2),
  temperature_c DECIMAL(10,2),
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

-- =========================================================
-- ALERT RULES
-- =========================================================

CREATE TABLE alert_rules (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  device_id INTEGER REFERENCES devices(id) ON DELETE SET NULL,
  metric VARCHAR(100) NOT NULL,
  operator VARCHAR(20) NOT NULL,
  threshold DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

-- =========================================================
-- PUMPS
-- =========================================================

CREATE TABLE pumps (
  id SERIAL PRIMARY KEY,
  owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  field_id INTEGER REFERENCES fields(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  type pump_type_enum,
  power_rating_hp DECIMAL(10,2),
  flow_rate_lpm DECIMAL(10,2),
  lat DECIMAL(10,7),
  lng DECIMAL(10,7),
  status pump_status_enum DEFAULT 'off',
  is_online BOOLEAN DEFAULT FALSE,
  total_run_time_sec INTEGER DEFAULT 0,
  last_turned_on TIMESTAMP,
  last_turned_off TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

-- =========================================================
-- PUMP GROUPS
-- =========================================================

CREATE TABLE pump_groups (
  id SERIAL PRIMARY KEY,
  owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

-- =========================================================
-- PUMP GROUP MAPPING
-- =========================================================

CREATE TABLE pump_group_mapping (
  group_id INTEGER REFERENCES pump_groups(id) ON DELETE CASCADE,
  pump_id INTEGER REFERENCES pumps(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  PRIMARY KEY(group_id, pump_id)
);

-- =========================================================
-- PUMP HISTORY
-- =========================================================

CREATE TABLE pump_history (
  id SERIAL PRIMARY KEY,
  pump_id INTEGER REFERENCES pumps(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action action_enum NOT NULL,
  triggered_by triggered_by_enum,
  duration_sec INTEGER,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

-- =========================================================
-- PUMP SCHEDULES
-- =========================================================

CREATE TABLE pump_schedules (
  id SERIAL PRIMARY KEY,
  pump_id INTEGER REFERENCES pumps(id) ON DELETE CASCADE,
  owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  start_time TIME NOT NULL,
  stop_time TIME NOT NULL,
  repeat_type repeat_type_enum DEFAULT 'daily',
  days_of_week JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

