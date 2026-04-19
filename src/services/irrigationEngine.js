/**
 * Irrigation Scheduling Engine
 *
 * Uses simplified FAO Penman-Monteith method to calculate:
 * - Reference evapotranspiration (ET₀)
 * - Crop water demand (ETc = ET₀ × Kc)
 * - Irrigation schedule based on soil moisture deficit
 *
 * Inputs: weather forecast, soil data, active crops/fields
 */

// ─── Crop coefficients (Kc) by growth stage ─────────────────────────────────
// Source: FAO Irrigation and Drainage Paper 56

const CROP_KC = {
  'Rice':       { initial: 1.05, mid: 1.20, late: 0.90 },
  'Wheat':      { initial: 0.30, mid: 1.15, late: 0.25 },
  'Maize':      { initial: 0.30, mid: 1.20, late: 0.35 },
  'Cotton':     { initial: 0.35, mid: 1.20, late: 0.50 },
  'Soybean':    { initial: 0.40, mid: 1.15, late: 0.50 },
  'Sugarcane':  { initial: 0.40, mid: 1.25, late: 0.75 },
  'Potato':     { initial: 0.50, mid: 1.15, late: 0.75 },
  'Tomato':     { initial: 0.60, mid: 1.15, late: 0.80 },
  'Onion':      { initial: 0.70, mid: 1.05, late: 0.75 },
  'Groundnut':  { initial: 0.40, mid: 1.15, late: 0.60 },
  'Mustard':    { initial: 0.35, mid: 1.15, late: 0.35 },
  'Chilli':     { initial: 0.60, mid: 1.05, late: 0.90 },
  'Chickpea':   { initial: 0.40, mid: 1.00, late: 0.35 },
  'default':    { initial: 0.40, mid: 1.10, late: 0.50 },
};

// Soil water-holding capacity (mm/m depth)
const SOIL_WATER_CAPACITY = {
  'Sandy':      80,
  'Sandy Loam': 120,
  'Loamy':      160,
  'Silty':      180,
  'Clay':       150,
  'Clayey':     140,
  'Black':      170,
  'default':    150,
};

// ─── ET₀ Calculation (Simplified Hargreaves method) ─────────────────────────
// More practical for limited weather data than full Penman-Monteith

/**
 * Calculate reference evapotranspiration (ET₀) using Hargreaves method.
 *
 * @param {number} tempMin  - Min temperature (°C)
 * @param {number} tempMax  - Max temperature (°C)
 * @param {number} avgTemp  - Average temperature (°C)
 * @param {number} dayOfYear - Day of year (1-365)
 * @param {number} latitude - Latitude in degrees
 * @returns {number} ET₀ in mm/day
 */
function calculateET0(tempMin, tempMax, avgTemp, dayOfYear, latitude) {
  // Extraterrestrial radiation (Ra) approximation
  const latRad = (latitude * Math.PI) / 180;
  const solarDecl = 0.409 * Math.sin((2 * Math.PI * dayOfYear) / 365 - 1.39);
  const sunsetAngle = Math.acos(-Math.tan(latRad) * Math.tan(solarDecl));

  const dr = 1 + 0.033 * Math.cos((2 * Math.PI * dayOfYear) / 365);
  const Ra = ((24 * 60) / Math.PI) * 0.0820 * dr * (
    sunsetAngle * Math.sin(latRad) * Math.sin(solarDecl) +
    Math.cos(latRad) * Math.cos(solarDecl) * Math.sin(sunsetAngle)
  );

  // Hargreaves equation: ET₀ = 0.0023 × Ra × (T + 17.8) × (Tmax - Tmin)^0.5
  const tempRange = Math.max(tempMax - tempMin, 1);
  const et0 = 0.0023 * Ra * (avgTemp + 17.8) * Math.sqrt(tempRange);

  return Math.max(0, Math.round(et0 * 10) / 10); // mm/day, 1 decimal
}

/**
 * Adjust ET₀ based on humidity and wind (simplified correction).
 */
function adjustET0(et0, humidity, windSpeed) {
  let factor = 1.0;

  // High humidity reduces ET
  if (humidity > 80) factor *= 0.85;
  else if (humidity > 70) factor *= 0.92;
  else if (humidity < 40) factor *= 1.10;

  // Wind increases ET
  if (windSpeed > 5) factor *= 1.10;
  else if (windSpeed > 3) factor *= 1.05;

  return Math.round(et0 * factor * 10) / 10;
}

// ─── Irrigation Schedule Generator ──────────────────────────────────────────

/**
 * Generate irrigation schedule for fields based on weather forecast and soil data.
 *
 * @param {Object} params
 * @param {Array}  params.forecast    - Weather forecast array [{ dt, temp: {min,max}, humidity, wind_speed }]
 * @param {Object} params.soilData    - Current soil data { moisture, texture, temperature }
 * @param {Array}  params.fields      - Fields array [{ id, name, cropType, area (ha), plantedDate }]
 * @param {Object} params.location    - { lat, lng }
 * @returns {Array} Irrigation schedule entries
 */
export function generateIrrigationSchedule({ forecast, soilData, fields, location }) {
  const lat = location?.lat || 21.1; // default Nagpur
  const today = new Date();
  const dayOfYear = Math.floor(
    (today - new Date(today.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24),
  );

  // Calculate daily ET₀ from forecast
  const dailyET0 = [];
  const forecastDays = forecast?.length ? forecast.slice(0, 7) : [];

  for (let i = 0; i < 7; i++) {
    const day = forecastDays[i];
    if (day) {
      const tempMin = day.temp?.min || day.tempMin || 20;
      const tempMax = day.temp?.max || day.tempMax || 35;
      const avgTemp = (tempMin + tempMax) / 2;
      const humidity = day.humidity || 60;
      const windSpeed = day.wind_speed || day.windSpeed || 2;
      const rainProb = day.pop || day.rainProbability || 0;
      const rainAmount = day.rain || 0;

      let et0 = calculateET0(tempMin, tempMax, avgTemp, dayOfYear + i, lat);
      et0 = adjustET0(et0, humidity, windSpeed);

      dailyET0.push({ et0, rainAmount, rainProb, humidity, date: addDays(today, i) });
    } else {
      // No forecast data — estimate from soil temperature
      const avgTemp = soilData?.temperature || 28;
      const et0 = calculateET0(avgTemp - 5, avgTemp + 5, avgTemp, dayOfYear + i, lat);
      dailyET0.push({ et0, rainAmount: 0, rainProb: 0, humidity: 60, date: addDays(today, i) });
    }
  }

  const currentMoisture = soilData?.moisture || 45;
  const soilTexture = soilData?.texture || 'Loamy';
  const waterCapacity = SOIL_WATER_CAPACITY[soilTexture] || SOIL_WATER_CAPACITY.default;

  // Field capacity and wilting point (simplified)
  const fieldCapacity = waterCapacity; // mm/m
  const wiltingPoint = fieldCapacity * 0.4;
  const availableWater = fieldCapacity - wiltingPoint; // total available water
  const managementDepletionFraction = 0.5; // irrigate when 50% of available water is used
  const triggerMoisture = wiltingPoint + availableWater * (1 - managementDepletionFraction);

  // Generate schedule for each field
  const schedule = [];

  // If no fields provided, generate generic schedules based on common crops
  const activeFields = fields?.length ? fields : [
    { id: '1', name: 'Field A', cropType: 'Wheat', area: 2 },
    { id: '2', name: 'Field B', cropType: 'Rice', area: 1.5 },
    { id: '3', name: 'Field C', cropType: 'Maize', area: 3 },
  ];

  activeFields.forEach((field) => {
    const cropName = normalizeCropName(field.cropType || 'default');
    const kc = CROP_KC[cropName] || CROP_KC.default;
    const currentKc = kc.mid; // assume mid-season for now

    // Track moisture through the forecast period
    let soilMoistureMM = (currentMoisture / 100) * fieldCapacity;
    let scheduleId = 0;

    dailyET0.forEach((day, i) => {
      const etc = day.et0 * currentKc; // crop water demand mm/day
      const effectiveRain = day.rainAmount * 0.8; // 80% effective

      // Update soil moisture
      soilMoistureMM = soilMoistureMM - etc + effectiveRain;
      soilMoistureMM = Math.min(soilMoistureMM, fieldCapacity);

      // Check if irrigation is needed
      if (soilMoistureMM < triggerMoisture) {
        // How much to apply to bring back to field capacity
        const deficit = fieldCapacity - soilMoistureMM;
        const waterAmountPerHa = Math.round(deficit * 10); // liters per ha (1mm = 10 m³/ha = 10000 L/ha, simplified)
        const totalWater = Math.round(waterAmountPerHa * (field.area || 1));
        const duration = Math.round(totalWater / 60); // minutes (approx 60 L/min flow rate)

        // Determine priority
        let priority = 'low';
        if (soilMoistureMM < wiltingPoint * 1.2) priority = 'high';
        else if (soilMoistureMM < triggerMoisture * 0.9) priority = 'medium';

        // Skip if heavy rain expected (>70% chance, >5mm)
        if (day.rainProb > 0.7 && day.rainAmount > 5) {
          return;
        }

        // Recommend early morning irrigation
        const irrigDate = new Date(day.date);
        irrigDate.setHours(6, 0, 0, 0);

        schedule.push({
          id: `${field.id}_${++scheduleId}`,
          fieldName: field.name,
          cropType: field.cropType || cropName,
          nextIrrigation: irrigDate.toISOString(),
          duration: Math.max(15, Math.min(duration, 180)), // 15 min to 3 hours
          waterAmount: totalWater,
          priority,
          aiRecommended: true,
          et0: day.et0,
          etc: Math.round(etc * 10) / 10,
          soilMoisturePercent: Math.round((soilMoistureMM / fieldCapacity) * 100),
          reason: buildReason(priority, soilMoistureMM, fieldCapacity, day),
        });

        // After irrigation, soil moisture returns to field capacity
        soilMoistureMM = fieldCapacity;
      }
    });
  });

  // Sort by priority (high first) then by date
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  schedule.sort((a, b) => {
    const p = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (p !== 0) return p;
    return new Date(a.nextIrrigation) - new Date(b.nextIrrigation);
  });

  return schedule;
}

/**
 * Calculate daily ET summary for display.
 */
export function calculateETSummary(forecast, location) {
  const lat = location?.lat || 21.1;
  const today = new Date();
  const dayOfYear = Math.floor(
    (today - new Date(today.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24),
  );

  return (forecast || []).slice(0, 7).map((day, i) => {
    const tempMin = day.temp?.min || day.tempMin || 20;
    const tempMax = day.temp?.max || day.tempMax || 35;
    const avgTemp = (tempMin + tempMax) / 2;
    const humidity = day.humidity || 60;

    let et0 = calculateET0(tempMin, tempMax, avgTemp, dayOfYear + i, lat);
    et0 = adjustET0(et0, humidity, day.wind_speed || 2);

    return {
      date: addDays(today, i).toISOString().split('T')[0],
      et0,
      tempMin: Math.round(tempMin),
      tempMax: Math.round(tempMax),
      humidity,
      rain: day.rain || 0,
    };
  });
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function normalizeCropName(name) {
  if (!name) return 'default';
  // Try exact match first
  if (CROP_KC[name]) return name;
  // Try partial match
  for (const key of Object.keys(CROP_KC)) {
    if (name.toLowerCase().includes(key.toLowerCase())) return key;
  }
  return 'default';
}

function buildReason(priority, moistureMM, fieldCapacity, day) {
  const moisturePercent = Math.round((moistureMM / fieldCapacity) * 100);
  if (priority === 'high') {
    return `Soil moisture critically low (${moisturePercent}%) — immediate irrigation needed`;
  }
  if (day.et0 > 5) {
    return `High evapotranspiration (${day.et0} mm/day) depleting soil moisture rapidly`;
  }
  return `Soil moisture below threshold (${moisturePercent}%) — scheduled irrigation`;
}
