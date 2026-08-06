const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

const router = express.Router();
const db = require('../config/db');
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');

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

module.exports = router;
