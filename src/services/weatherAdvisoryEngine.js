/**
 * Weather advice a farmer can act on today.
 *
 * The forecast screens showed the weather and left the farmer to work out what
 * it meant. These are the decisions the numbers actually drive: whether to
 * spray, whether the crop is about to be stressed by heat or frost, and
 * whether rain is coming that changes the plan.
 *
 * Every item says which day and which figure it came from. Advice a farmer
 * cannot trace back to something he can check is advice he has to take on
 * faith, and spraying costs money.
 *
 * Nothing here is invented when the forecast is short: each rule reads only
 * the days it was given.
 */

// ─── Thresholds ──────────────────────────────────────────────────────────────
// Chosen from ordinary extension-service guidance rather than tuned, and named
// so they can be argued with.

// Above this, spray drifts off the target and onto whatever is downwind.
const WIND_NO_SPRAY = 15;      // km/h
const WIND_MARGINAL = 10;      // km/h

// Rain soon after spraying washes it off before it works. Most contact
// products want a dry spell of about six hours.
const RAIN_WASHES_OFF_MM = 2;

// Sustained heat during flowering costs grain set in wheat and rice.
const HEAT_STRESS = 35;        // °C
const HEAT_SEVERE = 40;        // °C

// Frost damage in the north Indian rabi season.
const COLD_STRESS = 4;         // °C
const FROST = 0;               // °C

const HEAVY_RAIN_MM = 50;      // a day's fall that waterlogs and lodges crops

// Growing degree days: the warmth a crop has accumulated. Base 10°C suits
// wheat, maize and most of what these farmers grow; rice is usually taken at
// the same base for a rough figure.
const GDD_BASE = 10;

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

/**
 * A YYYY-MM-DD string is parsed as UTC midnight, while `new Date()` is local.
 * Subtracting one from the other in IST leaves five and a half hours that
 * round the wrong way, so every day was labelled as the one before it.
 * Compared as calendar strings instead, with the date built in local time.
 */
const localDateString = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const dayName = (date) => {
  const text = String(date || '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return String(date || '');

  const now = new Date();
  if (text === localDateString(now)) return 'today';

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (text === localDateString(tomorrow)) return 'tomorrow';

  // Built from the parts so the weekday is the one on the farmer's calendar.
  const [y, m, dd] = text.split('-').map(Number);
  return new Date(y, m - 1, dd).toLocaleDateString(undefined, { weekday: 'long' });
};

const rainOf = (day) =>
  num(day?.precipitation) ?? num(day?.rain) ?? null;

/**
 * When it is safe to spray over the next few days.
 *
 * Two things stop a spray: wind carrying it off target, and rain washing it
 * off before it acts. Both are in the forecast, so the app can answer it
 * rather than leaving a farmer to read wind speeds and guess.
 *
 * @returns {{days: object[], bestDay: object|null, note: string|null}}
 */
export function spraySchedule(forecast = []) {
  if (!forecast.length) {
    return { days: [], bestDay: null, note: 'No forecast available.' };
  }

  const days = forecast.slice(0, 7).map((day, i) => {
    const wind = num(day.windSpeed);
    const rainToday = rainOf(day);
    const rainNext = rainOf(forecast[i + 1]);

    const reasons = [];
    let verdict = 'good';

    if (wind !== null && wind > WIND_NO_SPRAY) {
      verdict = 'no';
      reasons.push(`wind ${wind} km/h carries spray off the field`);
    } else if (wind !== null && wind > WIND_MARGINAL) {
      verdict = 'caution';
      reasons.push(`wind ${wind} km/h, spray early before it picks up`);
    }

    if (rainToday !== null && rainToday >= RAIN_WASHES_OFF_MM) {
      verdict = 'no';
      reasons.push(`${rainToday} mm of rain expected`);
    } else if (rainNext !== null && rainNext >= RAIN_WASHES_OFF_MM) {
      if (verdict === 'good') verdict = 'caution';
      reasons.push(`rain the next day may wash it off`);
    }

    return {
      date: day.date,
      when: dayName(day.date),
      verdict,
      windSpeed: wind,
      rain: rainToday,
      reasons,
    };
  });

  const best = days.find((d) => d.verdict === 'good')
    || days.find((d) => d.verdict === 'caution')
    || null;

  return {
    days,
    bestDay: best,
    note: best
      ? null
      : 'No good spraying day in the next week - every day is either too '
        + 'windy or too wet.',
  };
}

/**
 * Heat, frost and heavy rain worth warning about, with the day named.
 */
export function stressAlerts(forecast = [], crops = []) {
  const alerts = [];
  const cropList = crops.map((c) => c.name).filter(Boolean).join(', ');

  forecast.slice(0, 7).forEach((day) => {
    const high = num(day.high);
    const low = num(day.low);
    const rain = rainOf(day);
    const when = dayName(day.date);

    if (high !== null && high >= HEAT_SEVERE) {
      alerts.push({
        kind: 'heat',
        severity: 'severe',
        date: day.date,
        title: `Severe heat ${when} - ${high}°C`,
        detail: 'Irrigate in the evening so the crop goes into the heat with '
          + 'water in the soil. Flowering crops lose grain set at this '
          + 'temperature.',
        basis: `Forecast high ${high}°C`,
      });
    } else if (high !== null && high >= HEAT_STRESS) {
      alerts.push({
        kind: 'heat',
        severity: 'warning',
        date: day.date,
        title: `Hot ${when} - ${high}°C`,
        detail: cropList
          ? `Watch ${cropList} for wilting in the afternoon. Water in the `
            + 'evening rather than at midday.'
          : 'Water in the evening rather than at midday.',
        basis: `Forecast high ${high}°C`,
      });
    }

    if (low !== null && low <= FROST) {
      alerts.push({
        kind: 'frost',
        severity: 'severe',
        date: day.date,
        title: `Frost ${when} - ${low}°C`,
        detail: 'Light irrigation the evening before raises the soil '
          + 'temperature overnight and can save a young crop.',
        basis: `Forecast low ${low}°C`,
      });
    } else if (low !== null && low <= COLD_STRESS) {
      alerts.push({
        kind: 'cold',
        severity: 'warning',
        date: day.date,
        title: `Cold night ${when} - ${low}°C`,
        detail: 'Close to frost. Watch young plants and consider watering in '
          + 'the evening.',
        basis: `Forecast low ${low}°C`,
      });
    }

    if (rain !== null && rain >= HEAVY_RAIN_MM) {
      alerts.push({
        kind: 'rain',
        severity: 'warning',
        date: day.date,
        title: `Heavy rain ${when} - ${rain} mm`,
        detail: 'Check drainage. Standing water damages roots, and a tall '
          + 'crop can go down in the wind that comes with it.',
        basis: `Forecast rainfall ${rain} mm`,
      });
    }
  });

  // Severe first, then by how soon.
  return alerts.sort((a, b) => {
    if (a.severity !== b.severity) return a.severity === 'severe' ? -1 : 1;
    return String(a.date).localeCompare(String(b.date));
  });
}

/**
 * Growing degree days accumulated over the forecast.
 *
 * How much warmth a crop has had, which predicts its stage better than days
 * since sowing does - a cold fortnight genuinely delays a crop.
 */
export function growingDegreeDays(forecast = [], base = GDD_BASE) {
  const days = forecast
    .map((d) => {
      const high = num(d.high);
      const low = num(d.low);
      if (high === null || low === null) return null;
      return { date: d.date, gdd: Math.max(0, (high + low) / 2 - base) };
    })
    .filter(Boolean);

  if (!days.length) return null;

  let running = 0;
  const series = days.map((d) => {
    running += d.gdd;
    return { date: d.date, gdd: Number(d.gdd.toFixed(1)), cumulative: Number(running.toFixed(1)) };
  });

  return {
    base,
    total: Number(running.toFixed(1)),
    days: series,
    note: `Warmth accumulated above ${base}°C over ${days.length} forecast days.`,
  };
}

/**
 * Rainfall for a calendar grid: one entry per forecast day with how much and
 * how heavy, so the screen can colour it without repeating the thresholds.
 */
export function rainOutlook(forecast = []) {
  const days = forecast.map((d) => {
    const mm = rainOf(d);
    return {
      date: d.date,
      mm,
      level: mm === null ? 'unknown'
        : mm >= HEAVY_RAIN_MM ? 'heavy'
        : mm >= 10 ? 'moderate'
        : mm >= RAIN_WASHES_OFF_MM ? 'light'
        : 'dry',
    };
  });

  const known = days.filter((d) => d.mm !== null);
  return {
    days,
    totalMm: known.length
      ? Number(known.reduce((s, d) => s + d.mm, 0).toFixed(1))
      : null,
    wetDays: known.filter((d) => d.mm >= RAIN_WASHES_OFF_MM).length,
  };
}

export default { spraySchedule, stressAlerts, growingDegreeDays, rainOutlook };
