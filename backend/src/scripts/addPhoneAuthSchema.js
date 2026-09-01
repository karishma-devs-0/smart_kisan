require('dotenv').config();

const db = require('../config/db');

/**
 * Extends one-time codes to phone numbers.
 *
 * auth_codes previously keyed on email alone. Rather than a second table, the
 * row now carries a channel and a recipient, so the same issue/verify logic
 * serves both without branching on storage.
 *
 * The existing email column is kept and backfilled into recipient, so codes in
 * flight during a deploy are not invalidated.
 *
 * Idempotent; safe to re-run.
 */
async function addPhoneAuthSchema() {
  try {
    await db.query(`
      ALTER TABLE auth_codes
      ADD COLUMN IF NOT EXISTS recipient VARCHAR(255)
    `);

    await db.query(`
      ALTER TABLE auth_codes
      ADD COLUMN IF NOT EXISTS channel VARCHAR(10) DEFAULT 'email'
    `);

    // Existing rows were all email; carry them across so nothing in flight is
    // orphaned by the change.
    await db.query(`
      UPDATE auth_codes
      SET recipient = email, channel = 'email'
      WHERE recipient IS NULL
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_auth_codes_recipient
        ON auth_codes (recipient, channel, purpose, created_at DESC)
    `);

    // Phone sign-in looks users up by number, so it needs to be unique and
    // indexed. Stored normalised to digits without the country code, which is
    // what the app sends after stripping +91, leading zeros, spaces and dashes.
    await db.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone
        ON users (phone_number)
        WHERE phone_number IS NOT NULL AND phone_number <> ''
    `);

    await db.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false
    `);

    console.log('✅ Phone auth schema added (auth_codes.recipient/channel, users.phone_verified)');
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

addPhoneAuthSchema();
