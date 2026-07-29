const express = require('express');
const router = express.Router();

const db = require('../config/db');
const { nanoid } = require('nanoid');

// ============================================================
// GET ALL DEVICES
// ============================================================

router.get('/', async (req, res) => {

  try {

    const result = await db.query(
      `
      SELECT *
      FROM devices
      WHERE owner_id = $1
      ORDER BY created_at DESC
      `,
      [req.user.id]
    );

    res.json({
      devices: result.rows,
      count: result.rows.length,
      onlineCount: result.rows.filter((d) => d.is_online).length,
    });

  } catch (error) {

    console.error('GET /devices error:', error);

    res.status(500).json({
      error: 'Failed to fetch devices',
    });
  }
});

// ============================================================
// CREATE DEVICE
// ============================================================

router.post('/', async (req, res) => {

  try {

    const { name, type, model, fieldId } = req.body;

    if (!name) {

      return res.status(400).json({
        error: 'Device name is required',
      });
    }

    const id = `dev_${nanoid(10)}`;

    const result = await db.query(
      `
      INSERT INTO devices
        (id, owner_id, field_id, name, type, model)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
      `,
      [
        id,
        req.user.id,
        fieldId || null,
        name,
        type || 'sensor',
        model || null,
      ]
    );

    res.status(201).json({ device: result.rows[0] });

  } catch (error) {

    console.error('POST /devices error:', error);

    res.status(500).json({
      error: 'Failed to create device',
    });
  }
});

// ============================================================
// UPDATE DEVICE
// ============================================================

router.put('/:id', async (req, res) => {

  try {

    const { name, type, model, fieldId, isOnline, batteryPct } = req.body;

    const result = await db.query(
      `
      UPDATE devices
      SET name        = COALESCE($1, name),
          type        = COALESCE($2, type),
          model       = COALESCE($3, model),
          field_id    = COALESCE($4, field_id),
          is_online   = COALESCE($5, is_online),
          battery_pct = COALESCE($6, battery_pct),
          updated_at  = CURRENT_TIMESTAMP
      WHERE id = $7
      AND owner_id = $8
      RETURNING *
      `,
      [
        name ?? null,
        type ?? null,
        model ?? null,
        fieldId ?? null,
        isOnline ?? null,
        batteryPct ?? null,
        req.params.id,
        req.user.id,
      ]
    );

    if (result.rows.length === 0) {

      return res.status(404).json({
        error: 'Device not found',
      });
    }

    res.json({ device: result.rows[0] });

  } catch (error) {

    console.error('PUT /devices/:id error:', error);

    res.status(500).json({
      error: 'Failed to update device',
    });
  }
});

// ============================================================
// DELETE DEVICE
// ============================================================

router.delete('/:id', async (req, res) => {

  try {

    const result = await db.query(
      `
      DELETE FROM devices
      WHERE id = $1
      AND owner_id = $2
      RETURNING id
      `,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {

      return res.status(404).json({
        error: 'Device not found',
      });
    }

    res.json({ success: true, id: result.rows[0].id });

  } catch (error) {

    console.error('DELETE /devices/:id error:', error);

    res.status(500).json({
      error: 'Failed to delete device',
    });
  }
});

module.exports = router;
