/**
 * Crop health and farm observations, worked out from the farm's own readings.
 *
 * The analytics screens previously showed a fixed set: Field A at 88, Field B
 * at 64 with "Low soil moisture", and four insights carrying confidence
 * figures like 92%. Identical for every farmer, which is what the testing team
 * reported as dummy data.
 *
 * Everything here is derived from what has actually been recorded - the soil
 * reading, the crops sown, the fields, and the weather forecast. Where there
 * is no reading there is no score: a field with no soil data is reported as
 * unknown rather than given a number, because a health index invented from
 * nothing is worse than an empty space.
 *
 * No confidence percentages. The old ones were decoration - there was no model
 * behind them to be confident about. Each observation instead says what it was
 * based on, which is the thing a farmer can actually check.
 */

// Soil Health Card bands, the same ones the server uses for the soil report,
// so the two cannot disagree.
const NUTRIENT_BANDS = {
  nitrogen: { low: 280, high: 560, label: 'Nitrogen' },
  phosphorus: { low: 10, high: 25, label: 'Phosphorus' },
  potassium: { low: 120, high: 280, label: 'Potassium' },
};

const MOISTURE_LOW = 30;
const MOISTURE_HIGH = 60;
const PH_LOW = 6.0;
const PH_HIGH = 8.0;

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

/**
 * A single field's health, 0-100, or null when there is nothing to score it
 * from.
 *
 * Starts at 100 and takes points off for each thing that is measurably wrong,
 * rather than starting low and awarding points, so a farm with good soil and
 * no problems reads as good without needing every possible reading present.
 */
function scoreField(soil) {
  if (!soil) return { healthIndex: null, status: 'unknown', issues: [] };

  const moisture = num(soil.moisture);
  const ph = num(soil.ph ?? soil.pH);
  const issues = [];
  let score = 100;
  let measured = 0;

  if (moisture !== null) {
    measured += 1;
    if (moisture < MOISTURE_LOW) {
      score -= 25;
      issues.push('Low soil moisture');
    } else if (moisture > MOISTURE_HIGH) {
      score -= 10;
      issues.push('Soil is waterlogged');
    }
  }

  if (ph !== null) {
    measured += 1;
    if (ph < PH_LOW) {
      score -= 15;
      issues.push('Soil is acidic');
    } else if (ph > PH_HIGH) {
      score -= 15;
      issues.push('Soil is alkaline');
    }
  }

  Object.entries(NUTRIENT_BANDS).forEach(([key, band]) => {
    const value = num(soil[key]);
    if (value === null) return;
    measured += 1;
    if (value < band.low) {
      score -= 15;
      issues.push(`${band.label} is low`);
    }
  });

  // Nothing was actually measured, so there is nothing to report.
  if (measured === 0) return { healthIndex: null, status: 'unknown', issues: [] };

  const healthIndex = Math.max(0, Math.min(100, Math.round(score)));
  const status = healthIndex >= 80 ? 'healthy' : healthIndex >= 60 ? 'warning' : 'critical';
  return { healthIndex, status, issues };
}

/**
 * Health per field, and an overall figure across the farm.
 *
 * The soil reading is farm-wide rather than per field - there is one sensor
 * set, not one per plot - so every field is scored against the same reading.
 * That is stated in `basis` so the number is not read as more precise than it
 * is.
 */
export function assessCropHealth({ fields = [], crops = [], soil = null } = {}) {
  const byField = fields.map((field) => {
    const crop = crops.find((c) => c.fieldId === field.id);
    const { healthIndex, status, issues } = scoreField(soil);
    return {
      fieldId: field.id,
      fieldName: field.name,
      cropType: crop?.name || null,
      healthIndex,
      status,
      issues,
    };
  });

  const scored = byField.filter((f) => f.healthIndex !== null);
  const overall = scored.length
    ? Math.round(scored.reduce((s, f) => s + f.healthIndex, 0) / scored.length)
    : null;

  return {
    overall,
    fields: byField,
    basis: soil
      ? 'Scored from the farm\'s latest soil reading. One reading covers the '
        + 'whole farm, so fields share a score until there is a sensor in each.'
      : 'No soil reading yet, so there is nothing to score.',
  };
}

/**
 * Plain observations a farmer can act on, each tied to a real reading.
 *
 * Returns an empty list when nothing is worth saying. Four cheerful insights
 * on a farm with no data is what the previous version did.
 */
export function buildInsights({ soil = null, forecast = [], crops = [], pumps = [] } = {}) {
  const out = [];
  const add = (type, title, description, basis, icon, color) =>
    out.push({ id: `${type}-${out.length + 1}`, type, title, description, basis, icon, color });

  const moisture = num(soil?.moisture);
  const rainSoon = (forecast || [])
    .slice(0, 3)
    .some((d) => num(d?.rain ?? d?.precipitation ?? d?.pop) > 0);

  if (moisture !== null && moisture < MOISTURE_LOW) {
    // Rain in the next three days changes the advice completely, so the two
    // are answered together rather than as separate contradictory tips.
    if (rainSoon) {
      add('warning', 'Soil is dry, but rain is forecast',
        `Soil moisture is ${moisture}%, below the ${MOISTURE_LOW}% mark. Rain is `
        + 'expected within three days, so consider waiting before irrigating.',
        `Soil reading ${moisture}% and the weather forecast`,
        'weather-rainy', '#2196F3');
    } else {
      add('recommendation', 'Irrigation needed',
        `Soil moisture is ${moisture}%, below the ${MOISTURE_LOW}% mark, and no `
        + 'rain is forecast in the next three days.',
        `Soil reading ${moisture}%`,
        'water-plus', '#2196F3');
    }
  } else if (moisture !== null && moisture > MOISTURE_HIGH) {
    add('warning', 'Soil is very wet',
      `Soil moisture is ${moisture}%. Holding water this long can damage roots. `
      + 'Check drainage before watering again.',
      `Soil reading ${moisture}%`,
      'water-alert', '#FF9800');
  }

  if (soil) {
    Object.entries(NUTRIENT_BANDS).forEach(([key, band]) => {
      const value = num(soil[key]);
      if (value !== null && value < band.low) {
        add('recommendation', `${band.label} is low`,
          `${band.label} is ${value}, below the ${band.low} mark for healthy `
          + 'growth. The fertiliser calculator can work out how much to apply.',
          `Soil reading ${value}`,
          'flask-outline', '#8BC34A');
      }
    });

    const ph = num(soil.ph ?? soil.pH);
    if (ph !== null && (ph < PH_LOW || ph > PH_HIGH)) {
      add('warning', ph < PH_LOW ? 'Soil is acidic' : 'Soil is alkaline',
        `Soil pH is ${ph}. Most crops take up nutrients best between ${PH_LOW} `
        + `and ${PH_HIGH}. Ask your Krishi Vigyan Kendra about correcting it.`,
        `Soil reading pH ${ph}`,
        'test-tube', '#FF9800');
    }
  }

  // Something worth knowing about the equipment, not just the soil.
  const offline = (pumps || []).filter((p) => p.isOnline === false);
  if (offline.length) {
    add('warning', `${offline.length} pump${offline.length > 1 ? 's' : ''} offline`,
      `${offline.map((p) => p.name).join(', ')} ${offline.length > 1 ? 'are' : 'is'} `
      + 'not reporting. Irrigation set to run automatically will not start.',
      'Device status',
      'access-point-off', '#F44336');
  }

  const upcoming = (crops || []).filter((c) => {
    if (!c.expectedHarvest) return false;
    const days = (new Date(c.expectedHarvest) - Date.now()) / 86400000;
    return days >= 0 && days <= 14;
  });
  upcoming.forEach((c) => {
    const days = Math.ceil((new Date(c.expectedHarvest) - Date.now()) / 86400000);
    add('info', `${c.name} harvest in ${days} day${days === 1 ? '' : 's'}`,
      `${c.name} is due to be harvested around ${new Date(c.expectedHarvest).toLocaleDateString()}.`,
      'Sowing date entered for this crop',
      'calendar-check', '#4CAF50');
  });

  return out;
}

export default { assessCropHealth, buildInsights };
