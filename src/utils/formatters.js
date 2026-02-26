import dayjs from 'dayjs';

export const formatDate = (date, format = 'DD MMM YYYY') => {
  return dayjs(date).format(format);
};

export const formatTime = (date, format = 'hh:mm A') => {
  return dayjs(date).format(format);
};

export const formatTemperature = (temp, unit = 'C') => {
  return `${Math.round(temp)}°${unit}`;
};

export const formatPercentage = (value) => {
  return `${Math.round(value)}%`;
};

export const formatDuration = (seconds) => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

export const formatLiters = (liters) => {
  if (liters >= 1000) {
    return `${(liters / 1000).toFixed(1)}K L`;
  }
  return `${liters} L`;
};

export const formatKWh = (kwh) => {
  if (kwh >= 1000) {
    return `${(kwh / 1000).toFixed(1)} MWh`;
  }
  return `${kwh.toFixed(1)} kWh`;
};

export const padZero = (num) => String(num).padStart(2, '0');
