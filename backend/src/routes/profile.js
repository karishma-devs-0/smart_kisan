const express = require('express');
const router = express.Router();

const db = require('../config/db');
const pool = require('../config/database');
const { nanoid } = require('nanoid');

// ============================================================
// GET PROFILE
// ============================================================
// Returns the onboarding profile plus live counts, so the dashboard can show
// the farm the user actually set up instead of hardcoded numbers.

router.get('/', async (req, res) => {

  try {

    const profileResult = await db.query(
      `
      SELECT *
      FROM user_profile
      WHERE user_id = $1
      `,
      [req.user.id]
    );

    const counts = await db.query(
      `
      SELECT
        (SELECT COUNT(*) FROM fields  WHERE owner_id = $1) AS field_count,
        (SELECT COUNT(*) FROM crops   WHERE owner_id = $1) AS crop_count,
        (SELECT COUNT(*) FROM pumps   WHERE owner_id = $1) AS pump_count,
        (SELECT COUNT(*) FROM devices WHERE owner_id = $1) AS device_count,
        (SELECT COUNT(*) FROM devices WHERE owner_id = $1 AND is_online) AS devices_online
      `,
      [req.user.id]
    );

    const row = counts.rows[0];

    res.json({
      profile: profileResult.rows[0] || null,
      onboarded: profileResult.rows.length > 0,
      counts: {
        fields: Number(row.field_count),
        crops: Number(row.crop_count),
        pumps: Number(row.pump_count),
        devices: Number(row.device_count),
        devicesOnline: Number(row.devices_online),
      },
    });

  } catch (error) {

    console.error('GET /profile error:', error);

    res.status(500).json({
      error: 'Failed to fetch profile',
    });
  }
});

// ============================================================
// COMPLETE ONBOARDING
// ============================================================
// Provisions the user's farm for real: writes the profile and creates the
// fields, crops and devices they described during setup. Everything happens in
// one transaction so a half-provisioned farm can't be left behind if any
// single insert fails.

router.post('/onboarding', async (req, res) => {

  const client = await pool.connect();

  try {

    const {
      farmName,
      farmType,
      farmSize,
      sizeBand,
      sizeUnit,
      locationName,
      latitude,
      longitude,
      language,
      fields = [],
      crops = [],
      devices = [],
    } = req.body;

    if (!farmName) {

      return res.status(400).json({
        error: 'Farm name is required',
      });
    }

    await client.query('BEGIN');

    // ── Profile (upsert so re-running onboarding updates rather than fails) ──
    const profileResult = await client.query(
      `
      INSERT INTO user_profile
        (user_id, farm_name, farm_type, farm_size, size_band, size_unit,
         location_name, latitude, longitude, language)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (user_id) DO UPDATE
      SET farm_name     = EXCLUDED.farm_name,
          farm_type     = EXCLUDED.farm_type,
          farm_size     = EXCLUDED.farm_size,
          size_band     = EXCLUDED.size_band,
          size_unit     = EXCLUDED.size_unit,
          location_name = EXCLUDED.location_name,
          latitude      = EXCLUDED.latitude,
          longitude     = EXCLUDED.longitude,
          language      = EXCLUDED.language,
          updated_at    = CURRENT_TIMESTAMP
      RETURNING *
      `,
      [
        req.user.id,
        farmName,
        farmType || null,
        farmSize || null,
        sizeBand || null,
        sizeUnit || 'acre',
        locationName || null,
        latitude || null,
        longitude || null,
        language || 'en',
      ]
    );

    // ── Fields ───────────────────────────────────────────────────────────────
    const createdFields = [];

    for (const f of fields) {
      if (!f?.name) continue;

      const result = await client.query(
        `
        INSERT INTO fields
          (id, owner_id, name, area, area_unit, soil_type,
           crop_name, latitude, longitude)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
        `,
        [
          `field_${nanoid(10)}`,
          req.user.id,
          f.name,
          f.area || null,
          f.areaUnit || sizeUnit || 'acre',
          f.soilType || null,
          f.cropName || null,
          f.latitude ?? latitude ?? null,
          f.longitude ?? longitude ?? null,
        ]
      );

      createdFields.push(result.rows[0]);
    }

    // ── Crops ────────────────────────────────────────────────────────────────
    // A crop may name the field it belongs to; map that to the id we just
    // generated so the association survives.
    const createdCrops = [];

    for (const c of crops) {
      if (!c?.name) continue;

      const match = createdFields.find((f) => f.name === c.fieldName);

      const result = await client.query(
        `
        INSERT INTO crops
          (id, owner_id, field_id, name, variety, season, area, sown_on, stage)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
        `,
        [
          `crop_${nanoid(10)}`,
          req.user.id,
          match?.id || null,
          c.name,
          c.variety || null,
          c.season || null,
          c.area || null,
          c.sownOn || null,
          c.stage || 'sown',
        ]
      );

      createdCrops.push(result.rows[0]);
    }

    // ── Devices ──────────────────────────────────────────────────────────────
    const createdDevices = [];

    for (const d of devices) {
      if (!d?.name) continue;

      const match = createdFields.find((f) => f.name === d.fieldName);

      const result = await client.query(
        `
        INSERT INTO devices
          (id, owner_id, field_id, name, type, model)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
        `,
        [
          `dev_${nanoid(10)}`,
          req.user.id,
          match?.id || null,
          d.name,
          d.type || 'sensor',
          d.model || null,
        ]
      );

      createdDevices.push(result.rows[0]);
    }

    await client.query('COMMIT');

    res.status(201).json({
      profile: profileResult.rows[0],
      fields: createdFields,
      crops: createdCrops,
      devices: createdDevices,
    });

  } catch (error) {

    await client.query('ROLLBACK').catch(() => {});

    console.error('POST /profile/onboarding error:', error);

    res.status(500).json({
      error: 'Failed to complete onboarding',
    });

  } finally {

    client.release();
  }
});

// ============================================================
// UPDATE PROFILE
// ============================================================

router.put('/', async (req, res) => {

  try {

    const {
      farmName,
      farmType,
      farmSize,
      sizeUnit,
      locationName,
      latitude,
      longitude,
      language,
    } = req.body;

    const result = await db.query(
      `
      UPDATE user_profile
      SET farm_name     = COALESCE($1, farm_name),
          farm_type     = COALESCE($2, farm_type),
          farm_size     = COALESCE($3, farm_size),
          size_unit     = COALESCE($4, size_unit),
          location_name = COALESCE($5, location_name),
          latitude      = COALESCE($6, latitude),
          longitude     = COALESCE($7, longitude),
          language      = COALESCE($8, language),
          updated_at    = CURRENT_TIMESTAMP
      WHERE user_id = $9
      RETURNING *
      `,
      [
        farmName ?? null,
        farmType ?? null,
        farmSize ?? null,
        sizeUnit ?? null,
        locationName ?? null,
        latitude ?? null,
        longitude ?? null,
        language ?? null,
        req.user.id,
      ]
    );

    if (result.rows.length === 0) {

      return res.status(404).json({
        error: 'Profile not found',
      });
    }

    res.json({ profile: result.rows[0] });

  } catch (error) {

    console.error('PUT /profile error:', error);

    res.status(500).json({
      error: 'Failed to update profile',
    });
  }
});

module.exports = router;
