const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

const router = express.Router();
const db = require('../config/db');
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');
const otpService = require('../services/otpService');
const { normalisePhone, isSmsConfigured } = require('../services/smsService');

const GOOGLE_CLIENT_ID =
  process.env.GOOGLE_WEB_CLIENT_ID ||
  '782177553731-bhnqmugdoekfsg421kraclnjpab96n6q.apps.googleusercontent.com';
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    const existing = await db.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({
        error: 'Email already exists',
      });
    }

    const hash = await bcrypt.hash(password, 10);

    const result = await db.query(
      `
      INSERT INTO users(
        email,
        phone_number,
        password_hash,
        first_name
      )
      VALUES($1,$2,$3,$4)
      RETURNING *
      `,
      [email, phone, hash, name]
    );

    const user = result.rows[0];

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '30d',
      }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.first_name,
        email: user.email,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: 'Registration failed',
    });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await db.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: 'Invalid credentials',
      });
    }

    const user = result.rows[0];

    const valid = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!valid) {
      return res.status(401).json({
        error: 'Invalid credentials',
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '30d',
      }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.first_name,
        email: user.email,
      },
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: 'Login failed',
    });
  }
});

// Google Sign-In — client sends the Google ID token, server verifies it
// with Google's public keys, then upserts the user and issues our own JWT.
// No Firebase involvement.
router.post('/google', async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ error: 'idToken required' });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return res.status(401).json({ error: 'Invalid Google token' });
    }

    const { email, name } = payload;

    // Look up existing user by email.
    let result = await db.query(
      'SELECT * FROM users WHERE email = $1',
      [email],
    );

    let user;
    if (result.rows.length === 0) {
      // First time — create the user with no password (SSO-only).
      const insert = await db.query(
        `INSERT INTO users(email, password_hash, first_name)
         VALUES($1, $2, $3)
         RETURNING *`,
        [email, '', name || email.split('@')[0]],
      );
      user = insert.rows[0];
    } else {
      user = result.rows[0];
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '30d' },
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.first_name,
        email: user.email,
      },
    });
  } catch (err) {
    console.error('Google auth error:', err.message);
    res.status(401).json({ error: 'Google sign-in failed' });
  }
});

// ============================================================
// DELETE ACCOUNT
// ============================================================
// Google Play requires an in-app deletion path, and "delete my account" has to
// mean the data goes too.
//
// There are no ON DELETE CASCADE constraints on the user-scoped tables, so
// removing only the `users` row would leave the profile, fields, crops,
// devices, pumps and soil history behind indefinitely. Every table is cleared
// explicitly, in one transaction, so a partial failure cannot leave an account
// half-deleted.
//
// Note the two different column names: the farm tables key on owner_id, the
// sensor/history tables on user_id.

router.delete('/delete-account', authMiddleware, async (req, res) => {

  const client = await pool.connect();

  try {

    const userId = req.user.id;

    await client.query('BEGIN');

    const byOwner = ['fields', 'crops', 'devices', 'pumps', 'pump_groups'];
    const byUser = ['user_profile', 'soil_current', 'soil_history', 'pump_history'];

    for (const table of byOwner) {
      await client.query(`DELETE FROM ${table} WHERE owner_id = $1`, [userId]);
    }

    for (const table of byUser) {
      await client.query(`DELETE FROM ${table} WHERE user_id = $1`, [userId]);
    }

    await client.query('DELETE FROM users WHERE id = $1', [userId]);

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Account deleted successfully',
    });

  } catch (error) {

    await client.query('ROLLBACK').catch(() => {});

    console.error('DELETE /auth/delete-account error:', error);

    res.status(500).json({
      error: 'Failed to delete account',
    });

  } finally {

    client.release();
  }
});

// ============================================================
// EMAIL ONE-TIME CODES
// ============================================================
// Three flows share one mechanism: signing in without a password, confirming an
// address at sign-up, and resetting a forgotten password. Until this existed a
// forgotten password meant a permanently lost account.

const signToken = (user) =>
  jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });

/**
 * Requests a code.
 *
 * Always answers the same way whether or not the address is registered. Saying
 * "no such account" would turn this endpoint into a way to test which email
 * addresses have signed up.
 */
router.post('/otp/request', async (req, res) => {
  try {
    const purpose = ['login', 'verify', 'reset'].includes(req.body.purpose)
      ? req.body.purpose
      : 'login';

    const rawPhone = req.body.phone;
    const rawEmail = req.body.email;

    // Phone and email are alternatives, not both. The rest of the handler is
    // identical for either, which is the point of resolving the target once.
    let target;
    let lookupColumn;
    let lookupValue;

    if (rawPhone) {
      const local = normalisePhone(rawPhone);
      if (!local) {
        return res.status(400).json({ error: 'Enter a valid 10-digit mobile number' });
      }
      if (!isSmsConfigured()) {
        // Said plainly rather than pretending to send. A farmer waiting for a
        // message that cannot arrive is worse than being told to use email.
        return res.status(503).json({
          error: 'SMS sign-in is not available yet. Please use your email address.',
        });
      }
      target = { phone: local };
      lookupColumn = 'phone_number';
      lookupValue = local;
    } else {
      const email = String(rawEmail || '').trim().toLowerCase();
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
        return res.status(400).json({ error: 'Enter a valid email address' });
      }
      target = { email };
      lookupColumn = 'email';
      lookupValue = email;
    }

    const { rows } = await db.query(
      `SELECT id FROM users WHERE ${lookupColumn} = $1`,
      [lookupValue]
    );
    const exists = rows.length > 0;

    // Sign-in and reset need an existing account; verification is for one being
    // created. Where the account is required and missing, we still reply as if
    // the code was sent — anything else turns this into a way to test which
    // addresses or numbers have registered.
    if ((purpose === 'login' || purpose === 'reset') && !exists) {
      return res.json({
        sent: true,
        expiresInMinutes: otpService.TTL_MINUTES,
        channel: rawPhone ? 'sms' : 'email',
      });
    }

    const result = await otpService.issue(target, purpose);
    res.json({ sent: true, ...result });
  } catch (error) {
    console.error('POST /auth/otp/request error:', error);
    res.status(500).json({ error: 'Could not send the code. Please try again.' });
  }
});

/**
 * Verifies a sign-in code and returns a session.
 */
router.post('/otp/verify', async (req, res) => {
  try {
    const rawPhone = req.body.phone;
    const target = rawPhone
      ? { phone: rawPhone }
      : { email: String(req.body.email || '').trim().toLowerCase() };

    const result = await otpService.verify(target, req.body.code, 'login');
    if (!result.ok) return res.status(401).json({ error: result.reason });

    const column = rawPhone ? 'phone_number' : 'email';
    const { rows } = await db.query(
      `SELECT * FROM users WHERE ${column} = $1`,
      [result.recipient]
    );
    if (!rows.length) return res.status(401).json({ error: 'Invalid credentials' });

    const user = rows[0];

    // Signing in via a code proves control of that address or number, so the
    // corresponding field is confirmed as a side effect.
    await db.query(
      `UPDATE users SET ${rawPhone ? 'phone_verified' : 'email_verified'} = true WHERE id = $1`,
      [user.id]
    );

    res.json({
      token: signToken(user),
      user: { id: user.id, name: user.first_name, email: user.email },
    });
  } catch (error) {
    console.error('POST /auth/otp/verify error:', error);
    res.status(500).json({ error: 'Could not verify the code. Please try again.' });
  }
});

/**
 * Confirms an address at sign-up.
 */
router.post('/verify-email', async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const result = await otpService.verify(email, req.body.code, 'verify');
    if (!result.ok) return res.status(400).json({ error: result.reason });

    await db.query('UPDATE users SET email_verified = true WHERE email = $1', [email]);
    res.json({ verified: true });
  } catch (error) {
    console.error('POST /auth/verify-email error:', error);
    res.status(500).json({ error: 'Could not verify the address. Please try again.' });
  }
});

/**
 * Sets a new password against a reset code.
 */
router.post('/reset-password', async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: 'Password must be at least 6 characters' });
    }

    const result = await otpService.verify(email, req.body.code, 'reset');
    if (!result.ok) return res.status(400).json({ error: result.reason });

    const hash = await bcrypt.hash(password, 10);
    const updated = await db.query(
      'UPDATE users SET password_hash = $1, email_verified = true WHERE email = $2 RETURNING *',
      [hash, email]
    );

    if (!updated.rows.length) {
      return res.status(400).json({ error: 'Could not reset the password' });
    }

    // Signed straight in: they have just proved control of the address and set
    // the password, so making them type it again adds nothing.
    const user = updated.rows[0];
    res.json({
      token: signToken(user),
      user: { id: user.id, name: user.first_name, email: user.email },
    });
  } catch (error) {
    console.error('POST /auth/reset-password error:', error);
    res.status(500).json({ error: 'Could not reset the password. Please try again.' });
  }
});

// ============================================================
// UPDATE OWN ACCOUNT
// ============================================================
// Name and phone live on the user record; farm name and location live on the
// profile and are updated through PUT /api/profile. The profile screen edits
// both, so it calls both.
//
// Previously the app had nowhere to send these at all — the update was applied
// to local state only and discarded on restart, which is how it was reported.

router.put('/me', authMiddleware, async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    if (name.length > 255) {
      return res.status(400).json({ error: 'Name is too long' });
    }

    // Phone is optional, but if given it has to be a real number — this is the
    // field a future SMS sign-in would key on.
    let phone = null;
    if (req.body.phone) {
      phone = normalisePhone(req.body.phone);
      if (!phone) {
        return res.status(400).json({ error: 'Enter a valid 10-digit mobile number' });
      }

      // The number identifies an account, so it cannot be shared. Checked here
      // rather than relying on the unique index, so the caller gets a sentence
      // instead of a constraint violation.
      const taken = await db.query(
        'SELECT id FROM users WHERE phone_number = $1 AND id <> $2',
        [phone, req.user.id]
      );
      if (taken.rows.length) {
        return res.status(409).json({ error: 'That mobile number is already in use' });
      }
    }

    const { rows } = await db.query(
      `UPDATE users
       SET first_name = $1,
           phone_number = COALESCE($2, phone_number),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING id, email, first_name, phone_number`,
      [name, phone, req.user.id]
    );

    if (!rows.length) return res.status(404).json({ error: 'Account not found' });

    const user = rows[0];
    res.json({
      user: {
        id: user.id,
        name: user.first_name,
        email: user.email,
        phone: user.phone_number,
      },
    });
  } catch (error) {
    console.error('PUT /auth/me error:', error);
    res.status(500).json({ error: 'Could not update your details' });
  }
});

module.exports = router;
