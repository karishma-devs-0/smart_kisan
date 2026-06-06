/**
 * Convert a decision's reason_key + reason_args into a plain-language string.
 *
 * Keys map 1:1 to what `decisionEngine.js` emits. When we wire i18n we'll add
 * these strings to `src/i18n/locales/*.js` under the `ai.reason.*` namespace
 * and read from t() instead — keeping the formatter function in one place
 * means the screens never need to know whether we're in English or Hindi.
 */

const TEMPLATES = {
  skip_pump_offline:    (a) => `Skipped — pump device offline (no heartbeat in ${a.hours}h).`,
  skip_daily_cap:       (a) => `Skipped — already ran ${a.cap} times today.`,
  skip_cooldown:        (a) => `Skipped — cooldown period (${a.minutes} min) not yet over.`,
  skip_rain_expected:   (a) => `Skipped — ${a.mm}mm of rain expected in the next 24 hours.`,
  skip_soil_wet:        (a) => `Skipped — soil moisture ${a.moisture}% is above the ${a.max}% target.`,
  skip_sensor_stale:    (a) => `Skipped — moisture sensor reading is stale (>${a.hours}h).`,
  skip_within_band:     (a) => `Skipped — soil moisture ${a.moisture}% is in the healthy range.`,
  skip_user_paused:     ()  => `Skipped — AI is paused by you.`,
  skip_user_requested:  ()  => `Skipped — you requested to skip the next run.`,

  run_moisture_low:       (a) => `Running — soil moisture ${a.moisture}% is below the ${a.min}% target.`,
  run_scheduled_et:       (a) => `Running — ${a.hours}h since last run, ET requirement ${a.etc}mm/day.`,
  run_scheduled_initial:  (a) => `Running — first scheduled run, ET requirement ${a.etc}mm/day.`,
  run_user_requested:     (a) => `Running — you requested ${a.minutes} min of irrigation.`,
};

export function formatReason(decision) {
  if (!decision?.reason_key) return '—';
  const template = TEMPLATES[decision.reason_key];
  if (!template) return decision.reason_key;
  const args = decision.reason_args || {};
  try {
    return template(args);
  } catch {
    return decision.reason_key;
  }
}

export function isRun(decision) {
  return decision?.action === 'run';
}

export function isSkip(decision) {
  return decision?.action === 'skip';
}
