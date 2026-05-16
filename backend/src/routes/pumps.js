const express = require('express');
const router = express.Router();

const db = require('../config/db');
const { nanoid } = require('nanoid');

const { publishPumpStatus } = require('../services/mqttService');

// ============================================================
// GET ALL PUMPS
// ============================================================

router.get('/', async (req, res) => {

  try {

    const result = await db.query(
      `
      SELECT *
      FROM pumps
      WHERE owner_id = $1
      ORDER BY created_at DESC
      `,
      [req.user.id]
    );

    res.json({
      pumps: result.rows,
      count: result.rows.length,
    });

  } catch (error) {

    console.error(
      'GET /pumps error:',
      error
    );

    res.status(500).json({
      error: 'Failed to fetch pumps',
    });
  }
});

// ============================================================
// GET SINGLE PUMP
// ============================================================

router.get('/:id', async (req, res) => {

  try {

    const result = await db.query(
      `
      SELECT *
      FROM pumps
      WHERE id = $1
      AND owner_id = $2
      `,
      [
        req.params.id,
        req.user.id,
      ]
    );

    if (result.rows.length === 0) {

      return res.status(404).json({
        error: 'Pump not found',
      });
    }

    res.json(result.rows[0]);

  } catch (error) {

    console.error(
      'GET /pumps/:id error:',
      error
    );

    res.status(500).json({
      error: 'Failed to fetch pump',
    });
  }
});

// ============================================================
// CREATE PUMP
// ============================================================

router.post('/', async (req, res) => {

  try {

    const {
      name,
      type,
      powerRating,
      flowRate,
      location,
    } = req.body;

    if (!name) {

      return res.status(400).json({
        error: 'Pump name is required',
      });
    }

    const result = await db.query(
      `
      INSERT INTO pumps(
        owner_id,
        name,
        type,
        power_rating_hp,
        flow_rate_lpm,
        lat,
        lng,
        status,
        is_online,
        total_run_time_sec,
        created_at,
        updated_at
      )
      VALUES(
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW(),NOW()
      )
      RETURNING *
      `,
      [
        req.user.id,
        name,
        type || 'submersible',
        powerRating || null,
        flowRate || null,
        location?.lat || null,
        location?.lng || null,
        'off',
        false,
        0,
      ]
    );

    res.status(201).json({
      pump: result.rows[0],
      message: 'Pump created',
    });

  } catch (error) {

    console.error(
      'POST /pumps error:',
      error
    );

    res.status(500).json({
      error: 'Failed to create pump',
    });
  }
});

// ============================================================
// UPDATE PUMP
// ============================================================

router.put('/:id', async (req, res) => {

  try {

    const {
      name,
      type,
      powerRating,
      flowRate,
      location,
    } = req.body;

    const checkPump = await db.query(
      `
      SELECT *
      FROM pumps
      WHERE id = $1
      AND owner_id = $2
      `,
      [
        req.params.id,
        req.user.id,
      ]
    );

    if (checkPump.rows.length === 0) {

      return res.status(404).json({
        error: 'Pump not found',
      });
    }

    const result = await db.query(
      `
      UPDATE pumps
      SET
        name = $1,
        type = $2,
        power_rating_hp = $3,
        flow_rate_lpm = $4,
        lat = $5,
        lng = $6,
        updated_at = NOW()
      WHERE id = $7
      AND owner_id = $8
      RETURNING *
      `,
      [
        name,
        type,
        powerRating,
        flowRate,
        location?.lat || null,
        location?.lng || null,
        req.params.id,
        req.user.id,
      ]
    );

    res.json({
      pump: result.rows[0],
      message: 'Pump updated',
    });

  } catch (error) {

    console.error(
      'PUT /pumps/:id error:',
      error
    );

    res.status(500).json({
      error: 'Failed to update pump',
    });
  }
});

// ============================================================
// DELETE PUMP
// ============================================================

router.delete('/:id', async (req, res) => {

  try {

    await db.query(
      `
      DELETE FROM pump_group_mapping
      WHERE pump_id = $1
      `,
      [req.params.id]
    );

    const result = await db.query(
      `
      DELETE FROM pumps
      WHERE id = $1
      AND owner_id = $2
      RETURNING *
      `,
      [
        req.params.id,
        req.user.id,
      ]
    );

    if (result.rows.length === 0) {

      return res.status(404).json({
        error: 'Pump not found',
      });
    }

    res.json({
      message: 'Pump deleted',
    });

  } catch (error) {

    console.error(
      'DELETE /pumps/:id error:',
      error
    );

    res.status(500).json({
      error: 'Failed to delete pump',
    });
  }
});

// ============================================================
// CONTROL PUMP
// ============================================================

router.post('/:id/control', async (req, res) => {

  try {

    const { action } = req.body;

    if (!['on', 'off'].includes(action)) {

      return res.status(400).json({
        error: 'Action must be on or off',
      });
    }

    const pumpResult = await db.query(
      `
      SELECT *
      FROM pumps
      WHERE id = $1
      AND owner_id = $2
      `,
      [
        req.params.id,
        req.user.id,
      ]
    );

    if (pumpResult.rows.length === 0) {

      return res.status(404).json({
        error: 'Pump not found',
      });
    }

    const pump = pumpResult.rows[0];

    const now = new Date();

    let additionalRunTime = 0;

    // CALCULATE RUNTIME
    if (
      action === 'off' &&
      pump.status === 'on' &&
      pump.last_turned_on
    ) {

      additionalRunTime = Math.floor(
        (
          now -
          new Date(pump.last_turned_on)
        ) / 1000
      );
    }

    const result = await db.query(
      `
      UPDATE pumps
      SET
        status = $1,
        updated_at = NOW(),

        last_turned_on = CASE
          WHEN $1 = 'on'
          THEN NOW()
          ELSE last_turned_on
        END,

        last_turned_off = CASE
          WHEN $1 = 'off'
          THEN NOW()
          ELSE last_turned_off
        END,

        total_run_time_sec =
          total_run_time_sec + $2

      WHERE id = $3
      AND owner_id = $4

      RETURNING *
      `,
      [
        action,
        additionalRunTime,
        req.params.id,
        req.user.id,
      ]
    );

    // MQTT REALTIME UPDATE
    await publishPumpStatus(
      req.user.id,
      pump.id,
      {
        status: action,
      }
    );

    // SAVE HISTORY
    await db.query(
      `
      INSERT INTO pump_history(
        pump_id,
        user_id,
        action,
        triggered_by,
        duration_sec
      )
      VALUES($1,$2,$3,$4,$5)
      `,
      [
        pump.id,
        req.user.id,
        action,
        'manual',
        action === 'off'
          ? additionalRunTime
          : 0,
      ]
    );

    res.json({
      pump: result.rows[0],
      message: `Pump turned ${action}`,
    });

  } catch (error) {

    console.error(
      'POST /pumps/:id/control error:',
      error
    );

    res.status(500).json({
      error: 'Failed to control pump',
    });
  }
});

module.exports = router;
