const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

const router = express.Router();
const db = require('../config/db');
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');
const otpService = require('../services/otpService');

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
    const email = String(req.body.email || '').trim().toLowerCase();
    const purpose = ['login', 'verify', 'reset'].includes(req.body.purpose)
      ? req.body.purpose
      : 'login';

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      return res.status(400).json({ error: 'Enter a valid email address' });
    }

    const { rows } = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    const exists = rows.length > 0;

    // Sign-in and reset need an existing account; verification is for one being
    // created. Where the account is required and missing, we still reply as if
    // the code was sent.
    if ((purpose === 'login' || purpose === 'reset') && !exists) {
      return res.json({
        sent: true,
        expiresInMinutes: otpService.TTL_MINUTES,
      });
    }

    const { expiresInMinutes } = await otpService.issue(email, purpose);
    res.json({ sent: true, expiresInMinutes });
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
    const email = String(req.body.email || '').trim().toLowerCase();
    const result = await otpService.verify(email, req.body.code, 'login');
    if (!result.ok) return res.status(401).json({ error: result.reason });

    const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (!rows.length) return res.status(401).json({ error: 'Invalid credentials' });

    const user = rows[0];

    // Signing in via a code proves the address works, so the account is
    // confirmed as a side effect.
    await db.query('UPDATE users SET email_verified = true WHERE id = $1', [user.id]);

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

module.exports = router;
