/**
 * Expected yield for the crops currently in the ground.
 *
 * This screen used to show fixed figures - wheat 3,200 kg at 88% confidence,
 * rice 4,100 at 74% - to every farmer, with no model behind the percentages.
 * It could not be anything else, because nothing recorded what came off a
 * field. Harvests are recorded now, so it can.
 *
 * WHAT THIS IS, PLAINLY
 * It is the farmer's own average yield per acre for that crop, multiplied by
 * the area planted. It is not a trained model and is not described as one. A
 * farmer's own land, seed and practice predict his next harvest better than a
 * national average does, and he can check the arithmetic, which matters more
 * than a decimal place he cannot.
 *
 * WHAT IT WILL NOT DO
 * Predict a crop it has never seen harvested. A crop with no history gets no
 * figure and says why. Inventing one is how the screen got into trouble in
 * the first place.
 */

// How much to trust a figure drawn from this many past harvests. Deliberately
// coarse words rather than a percentage: three harvests do not support "74%".
function confidenceFrom(harvests) {
  if (harvests >= 4) return { level: 'good', label: 'Based on several seasons' };
  if (harvests >= 2) return { level: 'fair', label: 'Based on a few seasons' };
  return { level: 'low', label: 'Based on one harvest only' };
}

/**
 * How much the crop's yield has moved about. A farmer whose wheat has come in
 * between 8 and 20 quintals an acre should be told the range, not a single
 * confident number.
 */
function spread(crop) {
  const best = Number(crop.bestYieldPerAcre);
  const worst = Number(crop.worstYieldPerAcre);
  if (!Number.isFinite(best) || !Number.isFinite(worst) || best === worst) return null;
  return { low: worst, high: best };
}

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
};

/**
 * @param {object[]} crops       what is planted now, from the crops screen
 * @param {object[]} yieldByCrop per-crop history from /harvests/summary
 * @returns {{crops: object[], note: string|null}}
 */
export function predictYield({ crops = [], yieldByCrop = [] } = {}) {
  if (!crops.length) {
    return {
      crops: [],
      note: 'Nothing is planted at the moment, so there is nothing to predict.',
    };
  }
  if (!yieldByCrop.length) {
    return {
      crops: [],
      note: 'No harvests recorded yet. Record one and the app can work out '
        + 'what to expect next season from your own land.',
    };
  }

  // Matched on name rather than crop id: this season's wheat is a different
  // row from last season's, and it is the crop that carries the yield, not
  // the planting.
  const history = {};
  yieldByCrop.forEach((c) => {
    if (c.cropName) history[c.cropName.trim().toLowerCase()] = c;
  });

  const out = [];
  const unknown = [];

  crops.forEach((crop) => {
    const past = history[(crop.name || '').trim().toLowerCase()];
    const area = num(crop.area);

    if (!past || !num(past.avgYieldPerAcre)) {
      unknown.push(crop.name);
      return;
    }

    const perAcre = Number(past.avgYieldPerAcre);
    const range = spread(past);

    out.push({
      cropName: crop.name,
      fieldId: crop.fieldId,
      area,
      areaUnit: 'acre',
      yieldPerAcre: perAcre,
      // Without an area there is still something useful to say - the yield
      // per acre - just not a total.
      predictedQuintals: area ? Number((perAcre * area).toFixed(1)) : null,
      rangeQuintals: area && range
        ? { low: Number((range.low * area).toFixed(1)),
            high: Number((range.high * area).toFixed(1)) }
        : null,
      basedOnHarvests: past.harvests,
      confidence: confidenceFrom(past.harvests),
      lastYieldPerAcre: past.lastYieldPerAcre ?? null,
      // Plain arithmetic the farmer can follow and check.
      workedOut: area
        ? `${perAcre} quintals an acre, your average across `
          + `${past.harvests} harvest${past.harvests === 1 ? '' : 's'}, over ${area} acres`
        : `${perAcre} quintals an acre, your average across `
          + `${past.harvests} harvest${past.harvests === 1 ? '' : 's'}`,
      needsArea: !area,
    });
  });

  let note = null;
  if (unknown.length) {
    note = `No prediction for ${unknown.join(', ')} - nothing has been `
      + 'harvested for it yet. Record a harvest and it will appear here.';
  }
  if (!out.length && !note) {
    note = 'No prediction yet. Record a harvest for a crop you are growing.';
  }

  return { crops: out, note };
}

export default { predictYield };
