/**
 * Reports Engine — pure compute functions that turn raw data
 * (pump history, soil readings, crops, fields, devices) into the
 * aggregate shapes the report screens already expect.
 *
 * All functions:
 *   - Return shapes matching src/features/reports/mock/reportsMockData.js
 *   - Accept an optional `dateRange` of 'week' | 'month' | 'year' | 'all'
 *   - Are pure — no state, no I/O
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const rangeStart = (range) => {
  const now = new Date();
  switch (range) {
    case 'week': return new Date(now.getTime() - 7 * MS_PER_DAY);
    case 'month': return new Date(now.getTime() - 30 * MS_PER_DAY);
    case 'year': return new Date(now.getTime() - 365 * MS_PER_DAY);
    case 'all':
    default: return new Date(0);
  }
};

const withinRange = (ts, range) => new Date(ts) >= rangeStart(range);

// ─── Water Usage ────────────────────────────────────────────────────────────

export const computeWaterUsage = (pumpHistory = [], range = 'month') => {
  const filtered = pumpHistory.filter((h) => h.duration && withinRange(h.timestamp, range));
  // Assume 50 L/min flow rate if pump doesn't carry its own
  const totalLitres = filtered.reduce((sum, h) => {
    const flow = h.flowRate || 50; // L/min
    const mins = h.duration / 60;
    return sum + (flow * mins);
  }, 0);

  // Per-day buckets
  const perDay = {};
  for (const h of filtered) {
    const day = new Date(h.timestamp).toISOString().split('T')[0];
    const flow = h.flowRate || 50;
    const mins = h.duration / 60;
    perDay[day] = (perDay[day] || 0) + flow * mins;
  }

  const series = Object.entries(perDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, value]) => ({ date, value: Math.round(value) }));

  return {
    total: Math.round(totalLitres),
    unit: 'L',
    series,
    range,
  };
};

// ─── Run Hours ──────────────────────────────────────────────────────────────

export const computeRunHours = (pumpHistory = [], range = 'month') => {
  const filtered = pumpHistory.filter((h) => h.duration && withinRange(h.timestamp, range));
  const totalSeconds = filtered.reduce((sum, h) => sum + (h.duration || 0), 0);
  const totalHours = totalSeconds / 3600;
  const rangeDays = Math.max(1, (Date.now() - rangeStart(range).getTime()) / MS_PER_DAY);

  // Per-pump tallies
  const perPump = {};
  for (const h of filtered) {
    perPump[h.pumpId] = (perPump[h.pumpId] || 0) + (h.duration || 0);
  }
  const topPumpId = Object.entries(perPump).sort(([, a], [, b]) => b - a)[0]?.[0];

  return {
    total: Math.round(totalHours * 10) / 10,
    avgPerDay: Math.round((totalHours / rangeDays) * 10) / 10,
    topPumpId,
    topPumpHours: topPumpId ? Math.round((perPump[topPumpId] / 3600) * 10) / 10 : 0,
    range,
  };
};

// ─── Pump Runtime (last-7-days stacked per pump) ────────────────────────────

export const computePumpRuntime = (pumpHistory = []) => {
  const filtered = pumpHistory.filter((h) => h.duration && withinRange(h.timestamp, 'week'));
  const pumpIds = [...new Set(filtered.map((h) => h.pumpId))];

  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * MS_PER_DAY);
    const day = d.toISOString().split('T')[0];
    const entry = { date: day };
    for (const pid of pumpIds) {
      entry[pid] = 0;
    }
    days.push(entry);
  }

  for (const h of filtered) {
    const day = new Date(h.timestamp).toISOString().split('T')[0];
    const entry = days.find((d) => d.date === day);
    if (entry) entry[h.pumpId] = (entry[h.pumpId] || 0) + (h.duration / 3600);
  }

  return { pumpIds, days };
};

// ─── Soil Condition ─────────────────────────────────────────────────────────

const deltaTrend = (readings, metric) => {
  if (!readings.length) return null;
  const sorted = [...readings].sort((a, b) => new Date(a.date) - new Date(b.date));
  const latest = sorted[sorted.length - 1][metric];
  const earliest = sorted[0][metric];
  if (latest == null || earliest == null) return null;
  return {
    current: latest,
    delta: Math.round((latest - earliest) * 100) / 100,
    direction: latest > earliest ? 'up' : latest < earliest ? 'down' : 'flat',
  };
};

export const computeSoilCondition = (soilReadings = [], range = 'month') => {
  const filtered = soilReadings.filter((r) => r.date && withinRange(r.date, range));
  return {
    moisture: deltaTrend(filtered, 'moisture'),
    pH: deltaTrend(filtered, 'pH'),
    nitrogen: deltaTrend(filtered, 'nitrogen'),
    phosphorus: deltaTrend(filtered, 'phosphorus'),
    potassium: deltaTrend(filtered, 'potassium'),
    sampleCount: filtered.length,
    range,
  };
};

// ─── Harvest Performance ────────────────────────────────────────────────────

export const computeHarvestPerformance = (crops = []) => {
  const harvested = crops.filter((c) => c.status === 'harvested');
  if (!harvested.length) {
    return { crops: [], totalRevenue: 0, avgYieldDelta: 0 };
  }

  const rows = harvested.map((c) => {
    const expected = c.expectedYield || 0;
    const actual = c.actualYield || 0;
    const deltaPct = expected > 0 ? Math.round(((actual - expected) / expected) * 100) : 0;
    const revenue = (c.actualYield || 0) * (c.pricePerUnit || 0);
    return {
      id: c.id,
      name: c.name,
      variety: c.variety,
      expectedYield: expected,
      actualYield: actual,
      deltaPct,
      revenue: Math.round(revenue),
    };
  });

  const totalRevenue = rows.reduce((sum, r) => sum + r.revenue, 0);
  const avgDelta = rows.length
    ? Math.round(rows.reduce((sum, r) => sum + r.deltaPct, 0) / rows.length)
    : 0;

  return { crops: rows, totalRevenue, avgYieldDelta: avgDelta };
};

// ─── General Metrics ────────────────────────────────────────────────────────

export const computeGeneralMetrics = (pumps = [], fields = [], devices = []) => {
  const activeFields = fields.filter((f) => f.status === 'active').length;
  const totalAcres = fields.reduce((sum, f) => sum + (parseFloat(f.area) || 0), 0);
  const activePumps = pumps.filter((p) => p.isRunning).length;
  const onlineDevices = devices.filter((d) => {
    if (!d.lastSeen) return false;
    return Date.now() - new Date(d.lastSeen).getTime() < 10 * 60 * 1000; // seen in last 10m
  }).length;

  return {
    activeFields,
    totalAcres: Math.round(totalAcres * 10) / 10,
    activePumps,
    totalPumps: pumps.length,
    onlineDevices,
    totalDevices: devices.length,
    uptimePct: devices.length ? Math.round((onlineDevices / devices.length) * 100) : 0,
  };
};

// ─── Top-level combiner ─────────────────────────────────────────────────────

export const computeAllReports = ({ pumpHistory = [], soilReadings = [], crops = [], pumps = [], fields = [], devices = [], range = 'month' } = {}) => ({
  waterUsage: computeWaterUsage(pumpHistory, range),
  runHours: computeRunHours(pumpHistory, range),
  pumpRuntime: computePumpRuntime(pumpHistory),
  soilCondition: computeSoilCondition(soilReadings, range),
  harvestPerformance: computeHarvestPerformance(crops),
  generalMetrics: computeGeneralMetrics(pumps, fields, devices),
  computedAt: new Date().toISOString(),
  range,
});
