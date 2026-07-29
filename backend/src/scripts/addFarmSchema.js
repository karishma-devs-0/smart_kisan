require('dotenv').config();

const db = require('../config/db');

/**
 * Adds the tables backing the farm data that the app previously faked with
 * mock arrays: fields, crops, devices, the onboarding profile, and soil
 * history for the trend charts.
 *
 * `soil_current` already exists (created by initDb.js and written by the MQTT
 * sensor handler), so it is deliberately not recreated here.
 *
 * Idempotent — safe to re-run. Follows initDb.js: VARCHAR(100) ids to match
 * the nanoid/uuid strings the routes generate, and owner_id scoping so every
 * query can filter by the authenticated user.
 */
async function addFarmSchema() {
  try {
    // ── Onboarding profile ───────────────────────────────────────────────────
    // One row per user. Written when onboarding completes; read on every app
    // launch so the dashboard can show the farm the user actually set up.
    await db.query(`
      CREATE TABLE IF NOT EXISTS user_profile (
        user_id       VARCHAR(100) PRIMARY KEY,
        farm_name     VARCHAR(255),
        farm_type     VARCHAR(100),
        farm_size     REAL,
        size_unit     VARCHAR(20) DEFAULT 'acre',
        location_name VARCHAR(255),
        latitude      REAL,
        longitude     REAL,
        language      VARCHAR(10) DEFAULT 'en',
        onboarded_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Onboarding offers a size *band* ('small'/'medium'/...) rather than a
    // number, so keep the band alongside the numeric acreage: farm_size holds
    // exact acres when the user types them, size_band always holds the choice.
    await db.query(`
      ALTER TABLE user_profile
      ADD COLUMN IF NOT EXISTS size_band VARCHAR(20)
    `);

    // ── Fields ───────────────────────────────────────────────────────────────
    await db.query(`
      CREATE TABLE IF NOT EXISTS fields (
        id         VARCHAR(100) PRIMARY KEY,
        owner_id   VARCHAR(100) NOT NULL,
        name       VARCHAR(255) NOT NULL,
        area       REAL,
        area_unit  VARCHAR(20) DEFAULT 'acre',
        soil_type  VARCHAR(100),
        crop_name  VARCHAR(255),
        latitude   REAL,
        longitude  REAL,
        status     VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await db.query(
      `CREATE INDEX IF NOT EXISTS idx_fields_owner ON fields (owner_id)`
    );

    // ── Crops ────────────────────────────────────────────────────────────────
    await db.query(`
      CREATE TABLE IF NOT EXISTS crops (
        id               VARCHAR(100) PRIMARY KEY,
        owner_id         VARCHAR(100) NOT NULL,
        field_id         VARCHAR(100),
        name             VARCHAR(255) NOT NULL,
        variety          VARCHAR(255),
        season           VARCHAR(50),
        area             REAL,
        sown_on          DATE,
        expected_harvest DATE,
        stage            VARCHAR(100) DEFAULT 'sown',
        health           VARCHAR(50) DEFAULT 'good',
        created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await db.query(
      `CREATE INDEX IF NOT EXISTS idx_crops_owner ON crops (owner_id)`
    );

    // ── Devices (IoT sensors) ────────────────────────────────────────────────
    await db.query(`
      CREATE TABLE IF NOT EXISTS devices (
        id          VARCHAR(100) PRIMARY KEY,
        owner_id    VARCHAR(100) NOT NULL,
        field_id    VARCHAR(100),
        name        VARCHAR(255) NOT NULL,
        type        VARCHAR(100),
        model       VARCHAR(100),
        is_online   BOOLEAN DEFAULT false,
        battery_pct INTEGER,
        last_seen   TIMESTAMP,
        created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await db.query(
      `CREATE INDEX IF NOT EXISTS idx_devices_owner ON devices (owner_id)`
    );

    // ── Soil history ─────────────────────────────────────────────────────────
    // soil_current holds only the latest reading; the moisture/pH/NPK trend
    // charts need a time series, so the MQTT handler can append here too.
    await db.query(`
      CREATE TABLE IF NOT EXISTS soil_history (
        id             SERIAL PRIMARY KEY,
        user_id        VARCHAR(100) NOT NULL,
        moisture       REAL,
        temperature    REAL,
        "pH"           REAL,
        nitrogen       REAL,
        phosphorus     REAL,
        potassium      REAL,
        recorded_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await db.query(
      `CREATE INDEX IF NOT EXISTS idx_soil_history_user_time
         ON soil_history (user_id, recorded_at DESC)`
    );

    console.log('✅ Farm schema added (user_profile, fields, crops, devices, soil_history)');
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

addFarmSchema();
