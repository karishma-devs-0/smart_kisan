require('dotenv').config();

const db = require('../config/db');

/**
 * Tables for email one-time codes: passwordless sign-in, address verification
 * and password reset.
 *
 * Codes are stored as a hash, never in plain text. A one-time code is a
 * credential for the few minutes it lives — anyone who could read the table
 * could sign in as any user, so it gets the same treatment as a password.
 *
 * Idempotent; safe to re-run.
 */
async function addAuthCodesSchema() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS auth_codes (
        id          SERIAL PRIMARY KEY,
        email       VARCHAR(255) NOT NULL,
        purpose     VARCHAR(20)  NOT NULL,  -- login | verify | reset
        code_hash   VARCHAR(255) NOT NULL,
        expires_at  TIMESTAMP    NOT NULL,
        attempts    INTEGER      DEFAULT 0,
        consumed_at TIMESTAMP,
        created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Lookups are always "the newest live code for this address and purpose".
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_auth_codes_lookup
        ON auth_codes (email, purpose, created_at DESC)
    `);

    // Expired rows are useless but accumulate; this makes cleaning them cheap.
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_auth_codes_expiry
        ON auth_codes (expires_at)
    `);

    // Whether the address has been confirmed. Existing accounts are marked
    // verified so that adding this does not lock out anyone already signed up.
    await db.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false
    `);
    await db.query(`
      UPDATE users SET email_verified = true WHERE email_verified IS NULL
    `);

    console.log('✅ Auth codes schema added (auth_codes, users.email_verified)');
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

addAuthCodesSchema();
