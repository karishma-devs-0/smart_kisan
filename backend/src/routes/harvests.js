const express = require('express');
const router = express.Router();

const db = require('../config/db');
const { nanoid } = require('nanoid');
const { str, handle, ValidationError } = require('../middleware/validate');

/**
 * Harvest records.
 *
 * What actually came off the field, which nothing recorded until now. Two
 * things depend on it: harvest performance on the reports screen, which had no
 * actual yield to set against the estimate, and yield prediction, which had
 * nothing to learn from.
 */

// Everything is normalised to quintals, the unit Indian mandi prices and
// yields are quoted in, so records entered in different units still add up.
const TO_QUINTAL = {
  quintal: 1,
  kg: 0.01,
  tonne: 10,
  maund: 0.4,        // the 40 kg maund still used across north India
};

const TO_ACRE = {
  acre: 1,
  hectare: 2.47105,
  bigha: 0.625,      // varies by state; the common 1 bigha = 0.625 acre
};

const UNITS = Object.keys(TO_QUINTAL);
const AREA_UNITS = Object.keys(TO_ACRE);
const QUALITY = ['premium', 'good', 'average', 'poor'];

// Dates are selected as text throughout. A date column arrives in node as a
// JS Date at local midnight, so on a machine in IST it becomes the previous
// day at 18:30Z and every harvest reads as the day before the one entered.
const DATE_COLS =
  "to_char(sown_on, 'YYYY-MM-DD') AS sown_on, "
  + "to_char(harvested_on, 'YYYY-MM-DD') AS harvested_on";


const oneOf = (value, allowed, fallback) =>
  allowed.includes(String(value || '').toLowerCase())
    ? String(value).toLowerCase()
    : fallback;

/** A date the app cannot parse sorts unpredictably and displays as Invalid Date. */
function parseDate(value, field) {
  if (value === undefined || value === null || value === '') return null;
  const d = new Date(value);
  if (isNaN(d.getTime())) {
    throw new ValidationError(`${field} is not a valid date`);
  }
  return d.toISOString().slice(0, 10);
}

function positive(value, field, { required = false } = {}) {
  if (value === undefined || value === null || value === '') {
    if (required) {
      throw new ValidationError(`${field} is required`);
    }
    return null;
  }
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) {
    throw new ValidationError(`${field} must be a number greater than zero`);
  }
  return n;
}

// ============================================================
// LIST
// ============================================================

router.get('/', async (req, res) => {
  try {
    const params = [req.user.id];
    let where = 'WHERE owner_id = $1';
    if (req.query.crop) {
      params.push(req.query.crop);
      where += ` AND LOWER(crop_name) = LOWER($${params.length})`;
    }

    const { rows } = await db.query(
      // Qualified, because selecting * alongside the text-cast aliases gives
      // two columns of each date name and an unqualified ORDER BY is then
      // ambiguous.
      `SELECT *, ${DATE_COLS} FROM harvests ${where}
       ORDER BY harvests.harvested_on DESC, harvests.created_at DESC`,
      params
    );
    res.json({ harvests: rows, count: rows.length });
  } catch (error) {
    console.error('GET /harvests error:', error);
    res.status(500).json({ error: 'Failed to fetch harvests' });
  }
});

// ============================================================
// YIELD SUMMARY, PER CROP
// ============================================================
// Declared before GET /:id or that route matches "summary" as an id.

router.get('/summary', async (req, res) => {
  try {
    const { rows } = await db.query(
      `
      SELECT
        crop_name,
        COUNT(*)::int                              AS harvests,
        ROUND(AVG(yield_per_acre)::numeric, 2)     AS avg_yield_per_acre,
        ROUND(MIN(yield_per_acre)::numeric, 2)     AS worst_yield_per_acre,
        ROUND(MAX(yield_per_acre)::numeric, 2)     AS best_yield_per_acre,
        ROUND(SUM(quantity_qtl)::numeric, 2)       AS total_quintals,
        to_char(MAX(harvested_on), 'YYYY-MM-DD')   AS last_harvest
      FROM harvests
      WHERE owner_id = $1 AND yield_per_acre IS NOT NULL
      GROUP BY crop_name
      ORDER BY crop_name
      `,
      [req.user.id]
    );

    // The most recent harvest of each crop against that crop's own average, so
    // a farmer can see whether the last season was better or worse than usual.
    const { rows: latest } = await db.query(
      `
      SELECT DISTINCT ON (crop_name)
        crop_name, yield_per_acre, quantity_qtl, expected_qtl,
        to_char(harvested_on, 'YYYY-MM-DD') AS harvested_on
      FROM harvests
      WHERE owner_id = $1
      ORDER BY crop_name, harvested_on DESC
      `,
      [req.user.id]
    );

    const byCrop = Object.fromEntries(latest.map((r) => [r.crop_name, r]));

    res.json({
      crops: rows.map((r) => {
        const last = byCrop[r.crop_name];
        const avg = Number(r.avg_yield_per_acre);
        const lastYield = last?.yield_per_acre != null ? Number(last.yield_per_acre) : null;
        return {
          cropName: r.crop_name,
          harvests: r.harvests,
          avgYieldPerAcre: avg,
          bestYieldPerAcre: Number(r.best_yield_per_acre),
          worstYieldPerAcre: Number(r.worst_yield_per_acre),
          totalQuintals: Number(r.total_quintals),
          lastHarvest: r.last_harvest,
          lastYieldPerAcre: lastYield,
          // Only meaningful once there is more than one season to compare.
          changeVsAverage:
            lastYield != null && avg && r.harvests > 1
              ? Math.round(((lastYield - avg) / avg) * 100)
              : null,
        };
      }),
      // Two seasons of a crop is the point at which a trend means anything.
      // Said plainly so the app does not have to guess.
      enoughForTrend: rows.some((r) => r.harvests >= 2),
    });
  } catch (error) {
    console.error('GET /harvests/summary error:', error);
    res.status(500).json({ error: 'Failed to build the yield summary' });
  }
});

// ============================================================
// CREATE
// ============================================================

router.post('/', handle(async (req, res) => {
  const cropName = str(req.body.cropName, { field: 'Crop name', required: true });
  const quantity = positive(req.body.quantity, 'Quantity', { required: true });
  const harvestedOn = parseDate(req.body.harvestedOn, 'Harvest date')
    || new Date().toISOString().slice(0, 10);
  const sownOn = parseDate(req.body.sownOn, 'Sowing date');

  if (sownOn && sownOn > harvestedOn) {
    return res.status(400).json({
      error: 'The harvest date cannot be before the sowing date',
    });
  }

  const unit = oneOf(req.body.unit, UNITS, 'quintal');
  const areaUnit = oneOf(req.body.areaUnit, AREA_UNITS, 'acre');
  const area = positive(req.body.area, 'Area');

  const quantityQtl = quantity * TO_QUINTAL[unit];
  const areaAcres = area ? area * TO_ACRE[areaUnit] : null;
  const yieldPerAcre = areaAcres ? quantityQtl / areaAcres : null;

  const expectedQtl = req.body.expectedQuintals != null
    ? positive(req.body.expectedQuintals, 'Expected yield')
    : null;

  const { rows } = await db.query(
    `INSERT INTO harvests(
       id, owner_id, crop_id, field_id, crop_name, variety, field_name, season,
       sown_on, harvested_on, quantity, unit, quantity_qtl, area, area_unit,
       yield_per_acre, quality, expected_qtl, notes
     )
     VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
     RETURNING *, ${DATE_COLS}`,
    [
      `harvest_${nanoid(10)}`,
      req.user.id,
      req.body.cropId || null,
      req.body.fieldId || null,
      cropName,
      str(req.body.variety, { field: 'Variety' }) || null,
      str(req.body.fieldName, { field: 'Field name' }) || null,
      str(req.body.season, { field: 'Season' }) || null,
      sownOn,
      harvestedOn,
      quantity,
      unit,
      quantityQtl,
      area,
      areaUnit,
      yieldPerAcre,
      req.body.quality ? oneOf(req.body.quality, QUALITY, 'good') : null,
      expectedQtl,
      str(req.body.notes, { field: 'Notes', max: 2000 }) || null,
    ]
  );

  res.status(201).json({ harvest: rows[0], message: 'Harvest recorded' });
}));

// ============================================================
// UPDATE
// ============================================================

router.put('/:id', handle(async (req, res) => {
  const existing = await db.query(
    'SELECT * FROM harvests WHERE id = $1 AND owner_id = $2',
    [req.params.id, req.user.id]
  );
  if (existing.rows.length === 0) {
    return res.status(404).json({ error: 'Harvest not found' });
  }
  const current = existing.rows[0];

  const quantity = req.body.quantity !== undefined
    ? positive(req.body.quantity, 'Quantity', { required: true })
    : Number(current.quantity);
  const unit = req.body.unit ? oneOf(req.body.unit, UNITS, current.unit) : current.unit;
  const area = req.body.area !== undefined
    ? positive(req.body.area, 'Area')
    : (current.area != null ? Number(current.area) : null);
  const areaUnit = req.body.areaUnit
    ? oneOf(req.body.areaUnit, AREA_UNITS, current.area_unit)
    : current.area_unit;

  const harvestedOn = req.body.harvestedOn !== undefined
    ? parseDate(req.body.harvestedOn, 'Harvest date')
    : current.harvested_on;
  const sownOn = req.body.sownOn !== undefined
    ? parseDate(req.body.sownOn, 'Sowing date')
    : current.sown_on;

  // Recomputed rather than trusted from the request, so the stored figures
  // cannot drift from the quantity and area they are derived from.
  const quantityQtl = quantity * TO_QUINTAL[unit];
  const areaAcres = area ? area * TO_ACRE[areaUnit] : null;
  const yieldPerAcre = areaAcres ? quantityQtl / areaAcres : null;

  const { rows } = await db.query(
    `UPDATE harvests
     SET crop_name      = COALESCE($1, crop_name),
         variety        = COALESCE($2, variety),
         field_name     = COALESCE($3, field_name),
         season         = COALESCE($4, season),
         sown_on        = $5,
         harvested_on   = $6,
         quantity       = $7,
         unit           = $8,
         quantity_qtl   = $9,
         area           = $10,
         area_unit      = $11,
         yield_per_acre = $12,
         quality        = COALESCE($13, quality),
         expected_qtl   = COALESCE($14, expected_qtl),
         notes          = COALESCE($15, notes),
         updated_at     = NOW()
     WHERE id = $16 AND owner_id = $17
     RETURNING *, ${DATE_COLS}`,
    [
      req.body.cropName ? str(req.body.cropName, { field: 'Crop name' }) : null,
      req.body.variety ?? null,
      req.body.fieldName ?? null,
      req.body.season ?? null,
      sownOn,
      harvestedOn,
      quantity,
      unit,
      quantityQtl,
      area,
      areaUnit,
      yieldPerAcre,
      req.body.quality ? oneOf(req.body.quality, QUALITY, current.quality) : null,
      req.body.expectedQuintals ?? null,
      req.body.notes ?? null,
      req.params.id,
      req.user.id,
    ]
  );

  res.json({ harvest: rows[0], message: 'Harvest updated' });
}));

// ============================================================
// DELETE
// ============================================================

router.delete('/:id', async (req, res) => {
  try {
    const { rows } = await db.query(
      'DELETE FROM harvests WHERE id = $1 AND owner_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Harvest not found' });
    res.json({ success: true, message: 'Harvest deleted' });
  } catch (error) {
    console.error('DELETE /harvests/:id error:', error);
    res.status(500).json({ error: 'Failed to delete the harvest' });
  }
});

module.exports = router;
