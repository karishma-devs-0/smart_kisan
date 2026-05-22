export const CROP_DURATIONS = {
  Rice: 120,
  Wheat: 130,
  Tomato: 80,
  Potato: 90,
  Cotton: 180,
  Maize: 110,
  Sugarcane: 365,
  Mustard: 100,
  Onion: 150,
  Chilli: 100,
  Soybean: 95,
  Groundnut: 100,
  'Bell Pepper': 90,
};

const DEFAULT_DURATION_DAYS = 120;

export const getDuration = (cropName) =>
  CROP_DURATIONS[cropName] || DEFAULT_DURATION_DAYS;

const daysBetween = (start, end) => {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
};

export const computeProgress = (sowingDate, cropName) => {
  if (!sowingDate) return 0;
  const duration = getDuration(cropName);
  const elapsed = daysBetween(sowingDate, new Date());
  const pct = (elapsed / duration) * 100;
  return Math.max(0, Math.min(100, Math.round(pct)));
};

export const computeStage = (sowingDate, cropName) => {
  const pct = computeProgress(sowingDate, cropName);
  if (pct < 20) return 'seedling';
  if (pct < 50) return 'vegetative';
  if (pct < 80) return 'flowering';
  return 'maturity';
};

export const projectHarvestDate = (sowingDate, cropName) => {
  if (!sowingDate) return null;
  const duration = getDuration(cropName);
  const harvest = new Date(sowingDate);
  harvest.setDate(harvest.getDate() + duration);
  return harvest.toISOString().split('T')[0];
};

export const daysToHarvest = (sowingDate, cropName) => {
  if (!sowingDate) return null;
  const harvest = projectHarvestDate(sowingDate, cropName);
  return daysBetween(new Date(), harvest);
};

export const harvestLabel = (sowingDate, cropName) => {
  const days = daysToHarvest(sowingDate, cropName);
  if (days == null) return '';
  if (days > 0) return `Harvest in ${days} day${days === 1 ? '' : 's'}`;
  if (days === 0) return 'Harvest today';
  return `Overdue by ${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'}`;
};
