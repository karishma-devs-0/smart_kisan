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
// TODAY'S RUN SUMMARY
// ============================================================
// What the dashboard's "Today" card shows. It previously showed
// activePumps * 1.5 hours, activePumps * 500 litres and activePumps * 3 kWh —
// invented arithmetic, which is why testers saw identical numbers at every
// login regardless of what the farm had done.
//
// The real figures come from pump_history, which records a duration each time
// a pump is switched off, joined to the pump for its rating:
//
//   litres = minutes run x flow_rate      (flow_rate is stored as L/min)
//   kWh    = hours run x HP x 0.7457      (power_rating is stored in HP)
//
// Declared before GET /:id, or that route matches "summary" as an id.

const HP_TO_KW = 0.7457;

// A farmer's day is the one they are living in, not UTC's. Without this a run
// at 7am IST falls on the previous UTC day and today's card reads zero all
// morning.
const FARM_TZ = process.env.FARM_TIMEZONE || 'Asia/Kolkata';

router.get('/summary/today', async (req, res) => {
  try {
    const { rows } = await db.query(
      `
      SELECT
        COALESCE(SUM(h.duration), 0)::int AS run_seconds,
        -- Both ratings are VARCHAR columns. The app writes plain numbers, but
        -- older rows hold things like '5 HP', and a straight ::numeric cast on
        -- one of those aborts the whole query with a 500. Pull the leading
        -- number out instead; anything unparseable becomes NULL and drops out
        -- of the SUM rather than taking the request down.
        COALESCE(SUM(
          (h.duration / 60.0)
          * substring(p.flow_rate from '[0-9]+\.?[0-9]*')::numeric
        ), 0) AS litres,
        COALESCE(SUM(
          (h.duration / 3600.0)
          * substring(p.power_rating from '[0-9]+\.?[0-9]*')::numeric
          * $2
        ), 0) AS kwh,
        COUNT(*)::int AS run_count,
        -- Runs whose pump has no usable rating: the litres and kWh above
        -- silently exclude them, so the app can say so rather than present a
        -- short total as complete.
        COUNT(*) FILTER (
          WHERE substring(p.flow_rate from '[0-9]+\.?[0-9]*') IS NULL
        )::int AS unrated_runs
      FROM pump_history h
      LEFT JOIN pumps p ON p.id = h.pump_id
      WHERE h.user_id = $1
        AND h.duration > 0
        AND (h.timestamp AT TIME ZONE 'UTC' AT TIME ZONE $3)::date
            = (NOW() AT TIME ZONE $3)::date
      `,
      [req.user.id, HP_TO_KW, FARM_TZ]
    );

    const totals = rows[0];

    // Pump counts come from the pumps table rather than the history, so the
    // card is correct on a farm that has not run anything today.
    const { rows: counts } = await db.query(
      `SELECT
         COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE status = 'on')::int AS active
       FROM pumps WHERE owner_id = $1`,
      [req.user.id]
    );

    res.json({
      summary: {
        runSeconds: totals.run_seconds,
        runHours: Number((totals.run_seconds / 3600).toFixed(2)),
        litres: Math.round(Number(totals.litres)),
        kwh: Number(Number(totals.kwh).toFixed(2)),
        runCount: totals.run_count,
        unratedRuns: totals.unrated_runs,
        activePumps: counts[0].active,
        totalPumps: counts[0].total,
        // The app needs to tell "nothing ran today" apart from "we cannot
        // work it out", and show a dash rather than a confident zero when a
        // pump has no flow rate or power rating recorded against it.
        hasData: totals.run_count > 0,
      },
    });
  } catch (error) {
    console.error('GET /pumps/summary/today error:', error);
    res.status(500).json({ error: 'Failed to load run summary' });
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

    // The columns are power_rating, flow_rate and location. This named
    // power_rating_hp, flow_rate_lpm, lat and lng — none of which exist — so
    // every attempt to add a pump answered 500. The app added it to local
    // state anyway, which is why a new pump showed up in the list and was gone
    // after a restart.
    //
    // id is a VARCHAR primary key with no default, so it has to be supplied.
    // location is TEXT and the app sends the field name, not coordinates.
    const result = await db.query(
      `
      INSERT INTO pumps(
        id,
        owner_id,
        name,
        type,
        power_rating,
        flow_rate,
        location,
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
        `pump_${nanoid(10)}`,
        req.user.id,
        name,
        type || 'submersible',
        powerRating != null ? String(powerRating) : null,
        flowRate != null ? String(flowRate) : null,
        typeof location === 'string' ? location : null,
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

    // Same wrong column names as the insert had. COALESCE so that editing one
    // field does not blank the others — the app sends only what its form holds.
    const result = await db.query(
      `
      UPDATE pumps
      SET
        name = COALESCE($1, name),
        type = COALESCE($2, type),
        power_rating = COALESCE($3, power_rating),
        flow_rate = COALESCE($4, flow_rate),
        location = COALESCE($5, location),
        updated_at = NOW()
      WHERE id = $6
      AND owner_id = $7
      RETURNING *
      `,
      [
        name ?? null,
        type ?? null,
        powerRating != null ? String(powerRating) : null,
        flowRate != null ? String(flowRate) : null,
        typeof location === 'string' ? location : null,
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
        -- $1 is cast explicitly because it is used both as the value assigned
        -- to status and as the left side of a comparison in the CASE arms
        -- below. Without the cast Postgres cannot settle on one type for it
        -- and rejects the statement outright: "inconsistent types deduced for
        -- parameter $1", which surfaced as a 500 on every pump on/off.
        status = $1::varchar,
        updated_at = NOW(),

        last_turned_on = CASE
          WHEN $1::varchar = 'on'
          THEN NOW()
          ELSE last_turned_on
        END,

        last_turned_off = CASE
          WHEN $1::varchar = 'off'
          THEN NOW()
          ELSE last_turned_off
        END,

        total_run_time_sec =
          total_run_time_sec + $2::int

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
    //
    // The column is `duration`; this wrote `duration_sec`, which does not
    // exist. Postgres rejected every insert, so not one pump run was ever
    // recorded — the table is empty. Worse, the throw happened before the
    // response inside the route's try, so a control request answered 500 after
    // it had already switched the pump and published the MQTT message: the app
    // reported a failure for something that had actually happened.
    //
    // Writing the history is secondary to controlling the pump, so it no
    // longer sits in the path that can fail the request. If the log write
    // breaks again, the pump still switches and the caller still gets its
    // answer.
    try {
      await db.query(
        `
        INSERT INTO pump_history(
          pump_id,
          pump_name,
          user_id,
          action,
          triggered_by,
          duration
        )
        VALUES($1,$2,$3,$4,$5,$6)
        `,
        [
          pump.id,
          pump.name,
          req.user.id,
          action,
          'manual',
          action === 'off'
            ? additionalRunTime
            : 0,
        ]
      );
    } catch (historyError) {
      console.error('pump_history write failed:', historyError.message);
    }

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
