require('dotenv').config();

const db = require('../config/db');

/**
 * Harvest records.
 *
 * The crops table already carries sown_on and expected_harvest, so a sowing
 * and an expectation are recorded. What was never recorded is what actually
 * came off the field.
 *
 * That absence is why two features could not exist. Harvest performance on the
 * reports screen had no actual yield to set against the estimate, and showed
 * 91.7% efficiency to every farmer instead. Yield prediction had nothing to
 * learn from. Both become possible from the first season recorded here.
 *
 * The crop name, field name and area are copied in rather than joined at read
 * time. A crop row is the current planting and gets edited or deleted between
 * seasons; a harvest is a historical fact and has to stay readable after the
 * crop that produced it is gone.
 *
 * Idempotent; safe to re-run.
 */
async function addHarvestSchema() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS harvests (
        id             VARCHAR(100) PRIMARY KEY,
        owner_id       VARCHAR(100) NOT NULL,
        crop_id        VARCHAR(100),
        field_id       VARCHAR(100),
        crop_name      VARCHAR(255) NOT NULL,
        variety        VARCHAR(255),
        field_name     VARCHAR(255),
        season         VARCHAR(50),
        sown_on        DATE,
        harvested_on   DATE NOT NULL,
        -- Stored as entered plus a normalised figure in quintals, so totals
        -- across records entered in different units still add up.
        quantity       REAL NOT NULL,
        unit           VARCHAR(20) DEFAULT 'quintal',
        quantity_qtl   REAL,
        area           REAL,
        area_unit      VARCHAR(20) DEFAULT 'acre',
        -- Yield per acre, worked out on write. A farmer compares seasons by
        -- yield rather than by total, and two fields of different sizes are
        -- otherwise not comparable.
        yield_per_acre REAL,
        quality        VARCHAR(50),
        expected_qtl   REAL,
        notes          TEXT,
        created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // The screens list a farmer's harvests newest first, and the yield history
    // is read per crop. One index covers both.
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_harvests_owner
        ON harvests (owner_id, crop_name, harvested_on DESC)
    `);

    console.log('✅ harvests table ready');
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

addHarvestSchema();
