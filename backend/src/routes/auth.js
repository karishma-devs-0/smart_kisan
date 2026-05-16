const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const router = express.Router();
const db = require('../config/db');

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

module.exports = router;
