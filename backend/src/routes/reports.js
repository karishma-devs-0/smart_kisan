const express = require('express');
const router = express.Router();

const db = require('../config/db');

/**
 * Farm reports.
 *
 * The reports screens showed a fixed set of figures - 2,450 litres, 156 hours,
 * a 91.7% harvest efficiency - identical for every farmer, which is what the
 * testing team reported. Nothing was behind them.
 *
 * Everything here is worked out from what the farm has actually done. Water
 * comes from each pump's flow rate against the seconds it ran, energy from its
 * horsepower, and soil from the readings taken. Where there is no source for a
 * figure it is returned as null rather than filled in: harvest performance is
 * the honest example, since nothing in the app records a harvest yet.
 */

// 1 HP = 0.7457 kW.
const HP_TO_KW = 0.7457;

// A farmer's day is the one they are living in, not UTC's.
const FARM_TZ = process.env.FARM_TIMEZONE || 'Asia/Kolkata';

/**
 * Both ratings are VARCHAR columns. The app writes plain numbers but older
 * rows hold things like '5 HP', and a straight cast on one of those aborts the
 * whole query. Pull the leading number out instead.
 */
const NUM = (col) => `substring(${col} from '[0-9]+\\.?[0-9]*')::numeric`;

/** Soil Health Card bands, which is what an Indian farmer's report reads. */
function rateSoil(soil) {
  if (!soil) return null;

  const band = (value, low, high) => {
    if (value == null) return null;
    const n = Number(value);
    if (!Number.isFinite(n)) return null;
    return n < low ? 'Low' : n > high ? 'High' : 'Medium';
  };

  const moisture =
    soil.moisture == null
      ? null
      : Number(soil.moisture) < 30
        ? 'Low'
        : Number(soil.moisture) > 60
          ? 'High'
          : 'Adequate';

  const ph =
    soil.pH == null
      ? null
      : Number(soil.pH) < 6.0
        ? 'Acidic'
        : Number(soil.pH) > 8.0
          ? 'Alkaline'
          : 'Optimal';

  const n = band(soil.nitrogen, 280, 560);
  const p = band(soil.phosphorus, 10, 25);
  const k = band(soil.potassium, 120, 280);

  // One word for the three nutrients together, taking the worst of them:
  // a farmer acts on the one that is short, not on the average.
  const present = [n, p, k].filter(Boolean);
  const nutrients = present.length === 0
    ? null
    : present.includes('Low')
      ? 'Low'
      : present.includes('High')
        ? 'High'
        : 'Medium';

  // Overall is deliberately cautious: anything off counts against it, because
  // a report that says "Good" while nitrogen is short is worse than no report.
  const flags = [moisture, ph, nutrients].filter(Boolean);
  const overall = flags.length === 0
    ? null
    : flags.every((f) => f === 'Adequate' || f === 'Optimal' || f === 'Medium')
      ? 'Good'
      : flags.includes('Low')
        ? 'Needs attention'
        : 'Fair';

  return { overall, moisture, pH: ph, nutrients, n, p, k };
}

/** Percentage change, guarding the division so an empty first period is null. */
function change(now, before) {
  if (!before) return null;
  return Math.round(((now - before) / before) * 100);
}

router.get('/', async (req, res) => {
  try {
    const days = Math.min(Math.max(parseInt(req.query.days, 10) || 30, 1), 365);
    const userId = req.user.id;

    // ── Per day, over the window ─────────────────────────────────────────
    const { rows: daily } = await db.query(
      `
      SELECT
        -- Formatted to text here rather than returned as a date. A date
        -- column arrives in node as a JS Date at LOCAL midnight, so on a
        -- machine in IST it becomes the previous day at 18:30Z and
        -- toISOString() then reports the day before. Every report would have
        -- been dated one day early.
        to_char(h.timestamp AT TIME ZONE 'UTC' AT TIME ZONE $3, 'YYYY-MM-DD') AS day,
        COALESCE(SUM(h.duration), 0)::int AS seconds,
        COALESCE(SUM((h.duration / 60.0) * ${NUM('p.flow_rate')}), 0) AS litres,
        COALESCE(SUM((h.duration / 3600.0) * ${NUM('p.power_rating')} * $4), 0) AS kwh
      FROM pump_history h
      LEFT JOIN pumps p ON p.id = h.pump_id
      WHERE h.user_id = $1
        AND h.duration > 0
        AND h.timestamp >= NOW() - ($2 || ' days')::interval
      GROUP BY day
      ORDER BY day
      `,
      [userId, String(days), FARM_TZ, HP_TO_KW]
    );

    // ── The period before it, so a change can be reported ────────────────
    const { rows: prev } = await db.query(
      `
      SELECT
        COALESCE(SUM(h.duration), 0)::int AS seconds,
        COALESCE(SUM((h.duration / 60.0) * ${NUM('p.flow_rate')}), 0) AS litres
      FROM pump_history h
      LEFT JOIN pumps p ON p.id = h.pump_id
      WHERE h.user_id = $1
        AND h.duration > 0
        AND h.timestamp <  NOW() - ($2 || ' days')::interval
        AND h.timestamp >= NOW() - (($2::int * 2) || ' days')::interval
      `,
      [userId, String(days)]
    );

    // ── Per pump ─────────────────────────────────────────────────────────
    const { rows: pumps } = await db.query(
      `SELECT id, name, status, total_run_time_sec, last_turned_on
       FROM pumps WHERE owner_id = $1 ORDER BY name`,
      [userId]
    );

    const { rows: soilRows } = await db.query(
      'SELECT * FROM soil_current WHERE user_id = $1',
      [userId]
    );

    const waterDaily = daily.map((d) => ({
      date: d.day,
      liters: Math.round(Number(d.litres)),
    }));
    const hoursDaily = daily.map((d) => ({
      date: d.day,
      hours: Number((d.seconds / 3600).toFixed(2)),
    }));
    const energyDaily = daily.map((d) => ({
      date: d.day,
      kwh: Number(Number(d.kwh).toFixed(2)),
    }));

    // Weeks, so a month of daily points does not become an unreadable chart.
    const weekly = (rows, key) => {
      const buckets = [];
      for (let i = 0; i < rows.length; i += 7) {
        const slice = rows.slice(i, i + 7);
        buckets.push({
          date: `Week ${buckets.length + 1}`,
          [key]: Number(
            slice.reduce((s, r) => s + r[key], 0).toFixed(key === 'liters' ? 0 : 2)
          ),
        });
      }
      return buckets;
    };

    const totalSeconds = daily.reduce((s, d) => s + d.seconds, 0);
    const totalLitres = Math.round(daily.reduce((s, d) => s + Number(d.litres), 0));
    const totalKwh = Number(daily.reduce((s, d) => s + Number(d.kwh), 0).toFixed(1));
    const prevLitres = Math.round(Number(prev[0]?.litres || 0));
    const prevSeconds = prev[0]?.seconds || 0;

    const activeDays = daily.length;

    res.json({
      periodDays: days,
      // Lets the screens say "nothing recorded yet" rather than draw an empty
      // chart that looks like a fault.
      hasData: totalSeconds > 0,

      waterUsage: {
        daily: waterDaily,
        weekly: weekly(waterDaily, 'liters'),
        totalLiters: totalLitres,
      },
      runHours: {
        daily: hoursDaily,
        weekly: weekly(hoursDaily, 'hours'),
        total: Number((totalSeconds / 3600).toFixed(1)),
        sessions: daily.length,
      },
      energyUse: {
        daily: energyDaily,
        totalKwh,
      },

      pumpRuntime: pumps.map((p) => ({
        pumpId: p.id,
        name: p.name,
        status: p.status,
        totalHours: Number(((p.total_run_time_sec || 0) / 3600).toFixed(1)),
        lastRun: p.last_turned_on,
      })),

      soilCondition: rateSoil(soilRows[0]),

      generalMetrics: {
        waterConsumption: {
          value: totalLitres,
          unit: 'L',
          change: change(totalLitres, prevLitres),
        },
        totalRunHours: {
          value: Number((totalSeconds / 3600).toFixed(1)),
          unit: 'hrs',
          change: change(totalSeconds, prevSeconds),
        },
        pumpRuntime: {
          value: activeDays ? Number((totalSeconds / 3600 / activeDays).toFixed(1)) : 0,
          unit: 'hrs/day',
          change: null,
        },
        energyUse: { value: totalKwh, unit: 'kWh', change: null },
      },

      // Null on purpose. Nothing in the app records a sowing or a harvest, so
      // there is no yield to compare an estimate against. The previous screen
      // showed 2,400 estimated against 2,200 actual at 91.7% efficiency for
      // every farmer, which is exactly the kind of figure that gets believed.
      harvestPerformance: null,
    });
  } catch (error) {
    console.error('GET /reports error:', error);
    res.status(500).json({ error: 'Failed to build reports' });
  }
});

module.exports = router;
