const express = require('express');
const router = express.Router();

const db = require('../config/db');
const { nanoid } = require('nanoid');

// ============================================================
// GET ALL FIELDS
// ============================================================

router.get('/', async (req, res) => {

  try {

    const result = await db.query(
      `
      SELECT *
      FROM fields
      WHERE owner_id = $1
      ORDER BY created_at DESC
      `,
      [req.user.id]
    );

    res.json({
      fields: result.rows,
      count: result.rows.length,
    });

  } catch (error) {

    console.error('GET /fields error:', error);

    res.status(500).json({
      error: 'Failed to fetch fields',
    });
  }
});

// ============================================================
// GET SINGLE FIELD
// ============================================================

router.get('/:id', async (req, res) => {

  try {

    const result = await db.query(
      `
      SELECT *
      FROM fields
      WHERE id = $1
      AND owner_id = $2
      `,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {

      return res.status(404).json({
        error: 'Field not found',
      });
    }

    res.json({ field: result.rows[0] });

  } catch (error) {

    console.error('GET /fields/:id error:', error);

    res.status(500).json({
      error: 'Failed to fetch field',
    });
  }
});

// ============================================================
// CREATE FIELD
// ============================================================

router.post('/', async (req, res) => {

  try {

    const {
      name,
      area,
      areaUnit,
      soilType,
      cropName,
      latitude,
      longitude,
    } = req.body;

    if (!name) {

      return res.status(400).json({
        error: 'Field name is required',
      });
    }

    const id = `field_${nanoid(10)}`;

    const result = await db.query(
      `
      INSERT INTO fields
        (id, owner_id, name, area, area_unit,
         soil_type, crop_name, latitude, longitude)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
      `,
      [
        id,
        req.user.id,
        name,
        area || null,
        areaUnit || 'acre',
        soilType || null,
        cropName || null,
        latitude || null,
        longitude || null,
      ]
    );

    res.status(201).json({ field: result.rows[0] });

  } catch (error) {

    console.error('POST /fields error:', error);

    res.status(500).json({
      error: 'Failed to create field',
    });
  }
});

// ============================================================
// UPDATE FIELD
// ============================================================

router.put('/:id', async (req, res) => {

  try {

    const {
      name,
      area,
      areaUnit,
      soilType,
      cropName,
      latitude,
      longitude,
      status,
    } = req.body;

    // COALESCE keeps any column the caller omitted at its current value, so a
    // partial update doesn't blank out the rest of the row.
    const result = await db.query(
      `
      UPDATE fields
      SET name       = COALESCE($1, name),
          area       = COALESCE($2, area),
          area_unit  = COALESCE($3, area_unit),
          soil_type  = COALESCE($4, soil_type),
          crop_name  = COALESCE($5, crop_name),
          latitude   = COALESCE($6, latitude),
          longitude  = COALESCE($7, longitude),
          status     = COALESCE($8, status),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $9
      AND owner_id = $10
      RETURNING *
      `,
      [
        name ?? null,
        area ?? null,
        areaUnit ?? null,
        soilType ?? null,
        cropName ?? null,
        latitude ?? null,
        longitude ?? null,
        status ?? null,
        req.params.id,
        req.user.id,
      ]
    );

    if (result.rows.length === 0) {

      return res.status(404).json({
        error: 'Field not found',
      });
    }

    res.json({ field: result.rows[0] });

  } catch (error) {

    console.error('PUT /fields/:id error:', error);

    res.status(500).json({
      error: 'Failed to update field',
    });
  }
});

// ============================================================
// DELETE FIELD
// ============================================================

router.delete('/:id', async (req, res) => {

  try {

    const result = await db.query(
      `
      DELETE FROM fields
      WHERE id = $1
      AND owner_id = $2
      RETURNING id
      `,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {

      return res.status(404).json({
        error: 'Field not found',
      });
    }

    res.json({ success: true, id: result.rows[0].id });

  } catch (error) {

    console.error('DELETE /fields/:id error:', error);

    res.status(500).json({
      error: 'Failed to delete field',
    });
  }
});

module.exports = router;
