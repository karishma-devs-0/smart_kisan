require('dotenv').config();

const db = require('../config/db');

async function initDB() {
  try {

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
