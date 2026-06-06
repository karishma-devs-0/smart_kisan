/**
 * AI Pump decision engine — pure function. No DB calls, no MQTT calls.
 *
 * Takes a snapshot of everything the engine needs (pump config, soil, weather,
 * crop, recent history) and returns a decision the scheduler will execute and
 * log. Keeping this pure makes it trivial to unit-test and to swap rule-based
 * for ML later without touching the scheduler.
 *
 * Output shape:
 *   {
 *     action: 'run' | 'skip',
 *     durationMin: number | null,         // only when action = 'run'
 *     reasonKey: string,                   // i18n key, e.g. 'skip_rain_expected'
 *     reasonArgs: object,                  // params for the key
 *     inputs: object,                      // snapshot for the audit trail
 *   }
 */

const { kcFor, moistureFor, soilFor } = require('./rules');
const { calculateET0, calculateETc, waterRequiredLitres, durationMinutes } = require('./etCalculator');

const HEARTBEAT_STALE_HOURS = 2;       // pump offline if no heartbeat in this window
const MOISTURE_STALE_HOURS  = 4;       // ignore moisture reading older than this

function hoursSince(iso) {
  if (!iso) return Infinity;
  const t = new Date(iso).getTime();
  if (isNaN(t)) return Infinity;
  return (Date.now() - t) / 3600000;
}

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

/**
 * @param {object} ctx
 * @param {object} ctx.pump       Row from `pumps` (with AI fields)
 * @param {object} ctx.crop       Row from `crops` linked to this pump, or null
 * @param {object} ctx.field      Row from `fields` linked to this pump, or null
 * @param {object} ctx.soil       Latest reading: { moisture, updated_at }, or null
 * @param {object} ctx.weather    { tmin, tmax, rainMm24h, latitude }, or null
 * @param {object} ctx.history    { runsToday: int, lastRunAt: iso|null }
 */
function decide(ctx) {
  const { pump, crop, field, soil, weather, history } = ctx;
  const cropName = crop?.name || field?.crop || 'default';
  const growthStage = crop?.growth_stage || field?.growth_stage || 'vegetative';
  const cropMoisture = moistureFor(cropName);
  const soilProps = soilFor(pump?.soil_type || field?.soil_type);

  const inputs = {
    cropName,
    growthStage,
    soilMoisture: soil?.moisture ?? null,
    soilUpdatedAt: soil?.updated_at ?? null,
    tmin: weather?.tmin ?? null,
    tmax: weather?.tmax ?? null,
    rainMm24h: weather?.rainMm24h ?? null,
    runsToday: history?.runsToday ?? 0,
    lastRunAt: history?.lastRunAt ?? null,
    flowRate: pump?.flow_rate ?? null,
    heartbeatAt: pump?.last_heartbeat_at ?? null,
  };

  // ─── Safety: pump offline ────────────────────────────────────────────────
  if (hoursSince(pump?.last_heartbeat_at) > HEARTBEAT_STALE_HOURS) {
    return skip('skip_pump_offline', { hours: HEARTBEAT_STALE_HOURS }, inputs);
  }

  // ─── Safety: hard daily run cap ──────────────────────────────────────────
  const maxRuns = pump?.max_runs_per_day ?? 3;
  if ((history?.runsToday ?? 0) >= maxRuns) {
    return skip('skip_daily_cap', { cap: maxRuns }, inputs);
  }

  // ─── Safety: cooldown ────────────────────────────────────────────────────
  const cooldownMin = pump?.cooldown_minutes ?? 90;
  if (history?.lastRunAt && hoursSince(history.lastRunAt) * 60 < cooldownMin) {
    return skip('skip_cooldown', { minutes: cooldownMin }, inputs);
  }

  // ─── Weather: rain expected → skip ───────────────────────────────────────
  const rainMm = weather?.rainMm24h ?? 0;
  if (rainMm >= 5) {
    return skip('skip_rain_expected', { mm: Math.round(rainMm) }, inputs);
  }

  // ─── Moisture: sensor present and trusted ────────────────────────────────
  const moistureFresh = hoursSince(soil?.updated_at) <= MOISTURE_STALE_HOURS;
  const moisture = soil?.moisture;
  const minM = pump?.ai_min_moisture ?? cropMoisture.min;
  const maxM = pump?.ai_max_moisture ?? cropMoisture.max;

  if (moistureFresh && Number.isFinite(moisture)) {
    if (moisture >= maxM) {
      return skip('skip_soil_wet', { moisture: Math.round(moisture), max: maxM }, inputs);
    }
    if (moisture < minM) {
      const duration = durationFromMoistureDeficit({
        moisture, fieldCapacity: soilProps.fieldCapacity, areaM2: m2(field?.area), flowRate: pump?.flow_rate,
      });
      const capped = clamp(duration, 5, pump?.max_run_minutes ?? 45);
      return run(capped, 'run_moisture_low', { moisture: Math.round(moisture), min: minM }, inputs);
    }
    // Moisture inside healthy band — fall through to ET / schedule check.
  }

  // ─── ET-based duration when moisture isn't actionable ────────────────────
  const hoursSinceLast = hoursSince(history?.lastRunAt);
  if (hoursSinceLast >= cropMoisture.maxHoursBetweenRuns) {
    const et0 = weather ? calculateET0({
      tmin: weather.tmin, tmax: weather.tmax, latitude: weather.latitude,
    }) : 4;                                              // fallback ~4 mm/day for India
    const etc = calculateETc(et0, kcFor(cropName, growthStage));
    const litres = waterRequiredLitres(etc, m2(field?.area), 1);
    const mins = durationMinutes(litres, pump?.flow_rate);
    const capped = clamp(mins || 15, 5, pump?.max_run_minutes ?? 45);
    return run(capped, 'run_scheduled_et', {
      hours: Math.round(hoursSinceLast),
      etc: Number(etc.toFixed(1)),
    }, inputs);
  }

  // ─── Sensor missing or stale + no schedule trigger → skip safely ─────────
  if (!moistureFresh) {
    return skip('skip_sensor_stale', { hours: MOISTURE_STALE_HOURS }, inputs);
  }
  return skip('skip_within_band', { moisture: Math.round(moisture ?? 0) }, inputs);
}

// ─── helpers ────────────────────────────────────────────────────────────────

function run(durationMin, reasonKey, reasonArgs, inputs) {
  return { action: 'run', durationMin, reasonKey, reasonArgs, inputs };
}

function skip(reasonKey, reasonArgs, inputs) {
  return { action: 'skip', durationMin: null, reasonKey, reasonArgs, inputs };
}

// Convert a `fields.area` (could be hectares, acres, or m²) into m². We treat
// values < 100 as hectares (rare to have a sub-100 m² field), otherwise m².
function m2(area) {
  if (!Number.isFinite(area) || area <= 0) return 1000;   // 0.1 ha default
  return area < 100 ? area * 10000 : area;
}

// Mm of water needed to bring `moisture` up to field capacity, converted to
// duration via flow rate.
function durationFromMoistureDeficit({ moisture, fieldCapacity, areaM2, flowRate }) {
  const deficitPct = Math.max(0, fieldCapacity - moisture);
  // Assume top 30 cm root zone. mm of water needed = deficit% × rootDepthMm.
  const mmNeeded = (deficitPct / 100) * 300;
  const litres = mmNeeded * areaM2;
  return durationMinutes(litres, flowRate);
}

module.exports = { decide };
