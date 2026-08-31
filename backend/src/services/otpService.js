/**
 * One-time codes for sign-in, address verification and password reset.
 *
 * Rules the whole design follows:
 *
 *   Stored hashed. For the few minutes it lives, a code is a credential — read
 *   access to the table would otherwise mean the ability to sign in as anyone.
 *
 *   Short-lived and single use. Consumed on first successful check, so a code
 *   read over someone's shoulder cannot be replayed.
 *
 *   Attempt-limited. Six digits is a million combinations, but without a cap an
 *   attacker only needs to be patient. Five wrong tries burns the code.
 *
 *   One live code per address and purpose. Requesting a new code invalidates
 *   the previous one, so an old message cannot be used later.
 */
const crypto = require('crypto');
const db = require('../config/db');
const { sendCode } = require('./mailService');

const CODE_LENGTH = 6;
const TTL_MINUTES = 10;
const MAX_ATTEMPTS = 5;

/**
 * crypto.randomInt rather than Math.random: the latter is predictable from
 * previous outputs, which for an authentication code means guessable.
 */
function generateCode() {
  const max = 10 ** CODE_LENGTH;
  return String(crypto.randomInt(0, max)).padStart(CODE_LENGTH, '0');
}

/**
 * SHA-256 rather than bcrypt here. The input is six digits with ten minutes of
 * life and five attempts, so an offline brute force is not the threat; the
 * threat is someone reading the table. A fast hash is sufficient and keeps
 * verification cheap.
 */
function hashCode(code) {
  return crypto.createHash('sha256').update(code).digest('hex');
}

const normalise = (email) => String(email || '').trim().toLowerCase();

/**
 * Issues a code and emails it.
 *
 * @param {'login'|'verify'|'reset'} purpose
 */
async function issue(email, purpose) {
  const address = normalise(email);
  const code = generateCode();
  const expires = new Date(Date.now() + TTL_MINUTES * 60 * 1000);

  // Retire any outstanding code first, so only the newest one works.
  await db.query(
    `UPDATE auth_codes SET consumed_at = NOW()
     WHERE email = $1 AND purpose = $2 AND consumed_at IS NULL`,
    [address, purpose]
  );

  await db.query(
    `INSERT INTO auth_codes (email, purpose, code_hash, expires_at)
     VALUES ($1, $2, $3, $4)`,
    [address, purpose, hashCode(code), expires]
  );

  await sendCode(address, code, purpose, TTL_MINUTES);
  return { expiresInMinutes: TTL_MINUTES };
}

/**
 * Checks a code and consumes it on success.
 *
 * @returns {{ok: true} | {ok: false, reason: string}}
 */
async function verify(email, code, purpose) {
  const address = normalise(email);
  const supplied = String(code || '').trim();

  const { rows } = await db.query(
    `SELECT * FROM auth_codes
     WHERE email = $1 AND purpose = $2 AND consumed_at IS NULL
     ORDER BY created_at DESC LIMIT 1`,
    [address, purpose]
  );

  const record = rows[0];
  if (!record) {
    return { ok: false, reason: 'No code was requested. Please request a new one.' };
  }

  if (new Date(record.expires_at) < new Date()) {
    return { ok: false, reason: 'That code has expired. Please request a new one.' };
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    await db.query('UPDATE auth_codes SET consumed_at = NOW() WHERE id = $1', [record.id]);
    return { ok: false, reason: 'Too many incorrect attempts. Please request a new code.' };
  }

  // timingSafeEqual so a wrong code cannot be narrowed down by how long the
  // comparison takes.
  const expected = Buffer.from(record.code_hash, 'hex');
  const actual = Buffer.from(hashCode(supplied), 'hex');
  const matches =
    expected.length === actual.length && crypto.timingSafeEqual(expected, actual);

  if (!matches) {
    await db.query('UPDATE auth_codes SET attempts = attempts + 1 WHERE id = $1', [record.id]);
    const left = MAX_ATTEMPTS - (record.attempts + 1);
    return {
      ok: false,
      reason:
        left > 0
          ? `Incorrect code. ${left} attempt${left === 1 ? '' : 's'} remaining.`
          : 'Too many incorrect attempts. Please request a new code.',
    };
  }

  await db.query('UPDATE auth_codes SET consumed_at = NOW() WHERE id = $1', [record.id]);
  return { ok: true };
}

/** Housekeeping for rows that can no longer be used. */
async function purgeExpired() {
  const r = await db.query(
    `DELETE FROM auth_codes
     WHERE expires_at < NOW() - INTERVAL '1 day' OR consumed_at < NOW() - INTERVAL '1 day'`
  );
  return r.rowCount;
}

module.exports = { issue, verify, purgeExpired, TTL_MINUTES, MAX_ATTEMPTS };
