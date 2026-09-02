require('dotenv').config();

/**
 * Verifies the password reset flow end to end.
 *
 * Kept out of e2eCheck.js because it needs database access: the code is
 * delivered by email and stored only as a hash, so there is no way to learn it
 * over HTTP. Instead the pending row is overwritten with the hash of a code we
 * choose, which stands in for the user reading the email — every other step,
 * including the verification, expiry and single-use rules, runs exactly as it
 * does in production.
 *
 * That database access is why this is local-only. e2eCheck.js remains safe to
 * point at production; this one is not.
 *
 * Usage:
 *   node scripts/checkPasswordReset.js
 *   API=http://localhost:5000/api node scripts/checkPasswordReset.js
 */

const crypto = require('crypto');
const db = require('../src/config/db');

const API = process.env.API || 'http://localhost:5000/api';
const KNOWN_CODE = '424242';

let failures = 0;
function record(step, ok, detail) {
  if (!ok) failures++;
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${step}${detail ? '  — ' + detail : ''}`);
}

async function call(method, path, { token, body } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* empty body */
  }
  return { status: res.status, data };
}

/** Stands in for the user opening the email. */
async function plantKnownCode(email) {
  const hash = crypto.createHash('sha256').update(KNOWN_CODE).digest('hex');
  const { rowCount } = await db.query(
    `UPDATE auth_codes SET code_hash = $1, attempts = 0
     WHERE recipient = $2 AND purpose = 'reset' AND consumed_at IS NULL`,
    [hash, email]
  );
  return rowCount;
}

async function main() {
  console.log(`\nPassword reset check against ${API}\n`);

  const email = `reset-check-${Date.now()}@example.com`;
  const OLD_PASSWORD = 'OldPass123';
  const NEW_PASSWORD = 'NewPass456';

  const reg = await call('POST', '/auth/register', {
    body: { name: 'Reset Check', email, phone: '9876500011', password: OLD_PASSWORD },
  });
  record('throwaway account created', reg.status < 300 && !!reg.data?.token, `HTTP ${reg.status}`);
  if (!reg.data?.token) return finish();

  // ── Requesting a code ────────────────────────────────────────────────────
  const req = await call('POST', '/auth/otp/request', {
    body: { email, purpose: 'reset' },
  });
  record('reset code requested', req.status === 200, `HTTP ${req.status}`);

  // An unregistered address must look identical, or this endpoint becomes a
  // way to discover which emails have accounts.
  const unknown = await call('POST', '/auth/otp/request', {
    body: { email: `nobody-${Date.now()}@example.com`, purpose: 'reset' },
  });
  record(
    'unknown address answers identically',
    unknown.status === req.status,
    `HTTP ${unknown.status} vs ${req.status}`
  );

  const planted = await plantKnownCode(email);
  record('a pending code exists to verify against', planted === 1, `${planted} row(s)`);
  if (planted !== 1) return finish();

  // ── Things that must be refused ──────────────────────────────────────────
  const short = await call('POST', '/auth/reset-password', {
    body: { email, code: KNOWN_CODE, password: 'abc' },
  });
  record('short password refused', short.status === 400, `HTTP ${short.status}`);

  const wrong = await call('POST', '/auth/reset-password', {
    body: { email, code: '000000', password: NEW_PASSWORD },
  });
  record('wrong code refused', wrong.status === 400, wrong.data?.error);

  // The failed attempt above must not have burned the real code.
  const stillValid = await db.query(
    `SELECT attempts, consumed_at FROM auth_codes
     WHERE recipient = $1 AND purpose = 'reset' ORDER BY created_at DESC LIMIT 1`,
    [email]
  );
  record(
    'a wrong guess counts an attempt without consuming the code',
    stillValid.rows[0]?.attempts === 1 && stillValid.rows[0]?.consumed_at === null,
    `attempts=${stillValid.rows[0]?.attempts}`
  );

  // ── The happy path ───────────────────────────────────────────────────────
  const done = await call('POST', '/auth/reset-password', {
    body: { email, code: KNOWN_CODE, password: NEW_PASSWORD },
  });
  record('password reset accepted', done.status === 200, `HTTP ${done.status}`);
  record('signed straight in afterwards', !!done.data?.token, done.data?.error || '');

  // ── What the reset must actually have changed ────────────────────────────
  const withNew = await call('POST', '/auth/login', {
    body: { email, password: NEW_PASSWORD },
  });
  record('new password works', withNew.status === 200, `HTTP ${withNew.status}`);

  const withOld = await call('POST', '/auth/login', {
    body: { email, password: OLD_PASSWORD },
  });
  record('old password no longer works', withOld.status === 401, `HTTP ${withOld.status}`);

  // Single use: someone reading the code over a shoulder must not be able to
  // replay it after the fact.
  const replay = await call('POST', '/auth/reset-password', {
    body: { email, code: KNOWN_CODE, password: 'Replayed789' },
  });
  record('the same code cannot be used twice', replay.status === 400, replay.data?.error);

  // ── Clean up ─────────────────────────────────────────────────────────────
  const token = withNew.data?.token || done.data?.token;
  const del = await call('DELETE', '/auth/delete-account', { token });
  record('throwaway account removed', del.status === 200, `HTTP ${del.status}`);
  await db.query(`DELETE FROM auth_codes WHERE recipient = $1`, [email]);

  return finish();
}

function finish() {
  console.log(
    `\n${failures === 0 ? 'All checks passed' : failures + ' check(s) failed'}\n`
  );
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
