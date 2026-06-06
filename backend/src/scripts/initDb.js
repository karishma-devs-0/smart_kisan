require('dotenv').config();

const db = require('../config/db');

async function initDB() {
  try {

    // Users table for the local auth route (email/password + Google Sign-In).
    // Matches the columns auth.js reads/writes: id, email, phone_number,
    // password_hash, first_name. id auto-generated via gen_random_uuid().
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone_number VARCHAR(50),
        password_hash VARCHAR(255) NOT NULL DEFAULT '',
        first_name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS pumps (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(100),
        power_rating VARCHAR(100),
        flow_rate VARCHAR(100),
        location TEXT,
        owner_id VARCHAR(100),
        status VARCHAR(20) DEFAULT 'off',
        is_online BOOLEAN DEFAULT true,
        last_action VARCHAR(100),
        last_turned_on TIMESTAMP,
        last_turned_off TIMESTAMP,
        total_run_time_sec INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS pump_groups (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        owner_id VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS pump_group_mapping (
        id SERIAL PRIMARY KEY,
        group_id VARCHAR(100),
        pump_id VARCHAR(100)
      )
    `);

    // Latest soil readings per user. The MQTT sensor handler upserts here,
    // and the AI engine reads moisture from this table.
    await db.query(`
      CREATE TABLE IF NOT EXISTS soil_current (
        user_id        VARCHAR(100) PRIMARY KEY,
        moisture       REAL,
        temperature    REAL,
        "pH"           REAL,
        nitrogen       REAL,
        phosphorus     REAL,
        potassium      REAL,
        ec             REAL,
        organic_carbon REAL,
        updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS pump_history (
        id SERIAL PRIMARY KEY,
        pump_id VARCHAR(100),
        pump_name VARCHAR(255),
        action VARCHAR(50),
        triggered_by VARCHAR(50),
        user_id VARCHAR(100),
        duration INTEGER,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Database initialized');

    process.exit();

  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

initDB();
