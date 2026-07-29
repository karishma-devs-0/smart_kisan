const express = require('express');
const router = express.Router();

const db = require('../config/db');

// ============================================================
// GET CURRENT SOIL READING
// ============================================================
// soil_current holds one row per user, upserted by the MQTT sensor handler.

router.get('/', async (req, res) => {

  try {

    const result = await db.query(
      `
      SELECT *
      FROM soil_current
      WHERE user_id = $1
      `,
      [req.user.id]
    );

    // No sensor has ever reported for this user. Return null rather than 404 —
    // "no readings yet" is a normal state for a freshly onboarded farm, and the
    // app renders an empty state for it.
    res.json({ soil: result.rows[0] || null });

  } catch (error) {

    console.error('GET /soil error:', error);

    res.status(500).json({
      error: 'Failed to fetch soil data',
    });
  }
});

// ============================================================
// GET SOIL HISTORY (for trend charts)
// ============================================================

router.get('/history', async (req, res) => {

  try {

    // Clamp days to a sane window so a bad query param can't ask Neon for the
    // entire table.
    const days = Math.min(
      Math.max(parseInt(req.query.days, 10) || 7, 1),
      365
    );

    const result = await db.query(
      `
      SELECT *
      FROM soil_history
      WHERE user_id = $1
      AND recorded_at >= NOW() - ($2 || ' days')::INTERVAL
      ORDER BY recorded_at ASC
      `,
      [req.user.id, String(days)]
    );

    res.json({
      history: result.rows,
      count: result.rows.length,
      days,
    });

  } catch (error) {

    console.error('GET /soil/history error:', error);

    res.status(500).json({
      error: 'Failed to fetch soil history',
    });
  }
});

// ============================================================
// RECORD A SOIL READING
// ============================================================
// Lets the app (or a simulator) push a reading without going through MQTT.
// Writes both the current snapshot and the history row.

router.post('/', async (req, res) => {

  try {

    const {
      moisture,
      temperature,
      pH,
      nitrogen,
      phosphorus,
      potassium,
    } = req.body;

    await db.query(
      `
      INSERT INTO soil_current
        (user_id, moisture, temperature, "pH",
         nitrogen, phosphorus, potassium, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id) DO UPDATE
      SET moisture    = COALESCE(EXCLUDED.moisture,    soil_current.moisture),
          temperature = COALESCE(EXCLUDED.temperature, soil_current.temperature),
          "pH"        = COALESCE(EXCLUDED."pH",        soil_current."pH"),
          nitrogen    = COALESCE(EXCLUDED.nitrogen,    soil_current.nitrogen),
          phosphorus  = COALESCE(EXCLUDED.phosphorus,  soil_current.phosphorus),
          potassium   = COALESCE(EXCLUDED.potassium,   soil_current.potassium),
          updated_at  = CURRENT_TIMESTAMP
      `,
      [
        req.user.id,
        moisture ?? null,
        temperature ?? null,
        pH ?? null,
        nitrogen ?? null,
        phosphorus ?? null,
        potassium ?? null,
      ]
    );

    await db.query(
      `
      INSERT INTO soil_history
        (user_id, moisture, temperature, "pH",
         nitrogen, phosphorus, potassium)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      `,
      [
        req.user.id,
        moisture ?? null,
        temperature ?? null,
        pH ?? null,
        nitrogen ?? null,
        phosphorus ?? null,
        potassium ?? null,
      ]
    );

    res.status(201).json({ success: true });

  } catch (error) {

    console.error('POST /soil error:', error);

    res.status(500).json({
      error: 'Failed to record soil reading',
    });
  }
});

module.exports = router;
