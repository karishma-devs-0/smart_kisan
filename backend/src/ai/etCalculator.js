/**
 * Reference evapotranspiration (ET0) using a simplified Hargreaves equation —
 * lighter than full Penman-Monteith, only needs Tmin/Tmax/Tmean + latitude.
 *
 * For v1 we treat ET0 as a single daily number. ETc (crop ET) = ET0 * Kc.
 *
 *   ET0 = 0.0023 * (Tmean + 17.8) * sqrt(Tmax - Tmin) * Ra
 *
 * where Ra is extraterrestrial radiation (MJ/m²/day). Ra varies with latitude
 * and day-of-year; we use a smooth seasonal approximation.
 *
 * Reference: FAO Irrigation and Drainage Paper 56, eqn 52 (Hargreaves).
 */

function dayOfYear(date = new Date()) {
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date - start) / 86400000);
}

// Extraterrestrial radiation at the given latitude on the given day.
// Output in MJ/m²/day (will be converted to mm/day equivalent via 0.408).
function extraterrestrialRadiation(latDeg, doy) {
  const lat = (latDeg * Math.PI) / 180;
  const dr  = 1 + 0.033 * Math.cos((2 * Math.PI * doy) / 365);
  const decl = 0.409 * Math.sin((2 * Math.PI * doy) / 365 - 1.39);
  const ws  = Math.acos(-Math.tan(lat) * Math.tan(decl));
  const Ra  = (24 * 60 / Math.PI) * 0.0820 * dr *
              (ws * Math.sin(lat) * Math.sin(decl) +
               Math.cos(lat) * Math.cos(decl) * Math.sin(ws));
  return Ra;
}

/**
 * Compute ET0 in mm/day.
 * @param {object} input
 * @param {number} input.tmin    Daily min temperature (°C)
 * @param {number} input.tmax    Daily max temperature (°C)
 * @param {number} input.latitude  Decimal degrees
 * @param {Date}   [input.date]  Defaults to today
 */
function calculateET0({ tmin, tmax, latitude, date }) {
  const safeTmin = Number.isFinite(tmin) ? tmin : 20;
  const safeTmax = Number.isFinite(tmax) ? tmax : 30;
  const tmean = (safeTmin + safeTmax) / 2;
  const doy = dayOfYear(date || new Date());
  const Ra = extraterrestrialRadiation(latitude ?? 22, doy); // default ≈ central India

  // 0.408 converts MJ/m²/day → mm/day equivalent.
  const et0 = 0.0023 * (tmean + 17.8) * Math.sqrt(Math.max(0, safeTmax - safeTmin)) * Ra * 0.408;
  return Math.max(0, et0);
}

/**
 * Crop ET (mm/day) = ET0 * Kc(growth stage).
 */
function calculateETc(et0, kc) {
  return Math.max(0, et0 * (kc ?? 1));
}

/**
 * Required water (litres) to satisfy ETc for the given field area (m²) over
 * the given number of days. 1 mm over 1 m² = 1 litre.
 */
function waterRequiredLitres(etcMm, areaM2, days = 1) {
  return etcMm * areaM2 * days;
}

/**
 * Pump run duration (minutes) needed to deliver `litres` at the given flow
 * rate (litres per minute).
 */
function durationMinutes(litres, flowRateLpm) {
  if (!flowRateLpm || flowRateLpm <= 0) return 0;
  return Math.ceil(litres / flowRateLpm);
}

module.exports = {
  calculateET0,
  calculateETc,
  waterRequiredLitres,
  durationMinutes,
};
