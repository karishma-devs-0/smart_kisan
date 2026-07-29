const express = require('express');
const router = express.Router();

const db = require('../config/db');
const { nanoid } = require('nanoid');

// ============================================================
// GET ALL CROPS
// ============================================================

router.get('/', async (req, res) => {

  try {

    const result = await db.query(
      `
      SELECT *
      FROM crops
      WHERE owner_id = $1
      ORDER BY created_at DESC
      `,
      [req.user.id]
    );

    res.json({
      crops: result.rows,
      count: result.rows.length,
    });

  } catch (error) {

    console.error('GET /crops error:', error);

    res.status(500).json({
      error: 'Failed to fetch crops',
    });
  }
});

// ============================================================
// CREATE CROP
// ============================================================

router.post('/', async (req, res) => {

  try {

    const {
      name,
      variety,
      season,
      area,
      fieldId,
      sownOn,
      expectedHarvest,
      stage,
    } = req.body;

    if (!name) {

      return res.status(400).json({
        error: 'Crop name is required',
      });
    }

    const id = `crop_${nanoid(10)}`;

    const result = await db.query(
      `
      INSERT INTO crops
        (id, owner_id, field_id, name, variety, season,
         area, sown_on, expected_harvest, stage)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
      `,
      [
        id,
        req.user.id,
        fieldId || null,
        name,
        variety || null,
        season || null,
        area || null,
        sownOn || null,
        expectedHarvest || null,
        stage || 'sown',
      ]
    );

    res.status(201).json({ crop: result.rows[0] });

  } catch (error) {

    console.error('POST /crops error:', error);

    res.status(500).json({
      error: 'Failed to create crop',
    });
  }
});

// ============================================================
// UPDATE CROP
// ============================================================

router.put('/:id', async (req, res) => {

  try {

    const {
      name,
      variety,
      season,
      area,
      fieldId,
      sownOn,
      expectedHarvest,
      stage,
      health,
    } = req.body;

    const result = await db.query(
      `
      UPDATE crops
      SET name             = COALESCE($1, name),
          variety          = COALESCE($2, variety),
          season           = COALESCE($3, season),
          area             = COALESCE($4, area),
          field_id         = COALESCE($5, field_id),
          sown_on          = COALESCE($6, sown_on),
          expected_harvest = COALESCE($7, expected_harvest),
          stage            = COALESCE($8, stage),
          health           = COALESCE($9, health),
          updated_at       = CURRENT_TIMESTAMP
      WHERE id = $10
      AND owner_id = $11
      RETURNING *
      `,
      [
        name ?? null,
        variety ?? null,
        season ?? null,
        area ?? null,
        fieldId ?? null,
        sownOn ?? null,
        expectedHarvest ?? null,
        stage ?? null,
        health ?? null,
        req.params.id,
        req.user.id,
      ]
    );

    if (result.rows.length === 0) {

      return res.status(404).json({
        error: 'Crop not found',
      });
    }

    res.json({ crop: result.rows[0] });

  } catch (error) {

    console.error('PUT /crops/:id error:', error);

    res.status(500).json({
      error: 'Failed to update crop',
    });
  }
});

// ============================================================
// DELETE CROP
// ============================================================

router.delete('/:id', async (req, res) => {

  try {

    const result = await db.query(
      `
      DELETE FROM crops
      WHERE id = $1
      AND owner_id = $2
      RETURNING id
      `,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {

      return res.status(404).json({
        error: 'Crop not found',
      });
    }

    res.json({ success: true, id: result.rows[0].id });

  } catch (error) {

    console.error('DELETE /crops/:id error:', error);

    res.status(500).json({
      error: 'Failed to delete crop',
    });
  }
});

module.exports = router;
