export const MOCK_WATER_USAGE = {
  daily: [
    { date: '2024-12-01', liters: 320 },
    { date: '2024-12-02', liters: 350 },
    { date: '2024-12-03', liters: 280 },
    { date: '2024-12-04', liters: 400 },
    { date: '2024-12-05', liters: 370 },
    { date: '2024-12-06', liters: 340 },
    { date: '2024-12-07', liters: 390 },
  ],
  weekly: [
    { date: 'Week 1', liters: 2200 },
    { date: 'Week 2', liters: 2450 },
    { date: 'Week 3', liters: 2100 },
    { date: 'Week 4', liters: 2350 },
  ],
  monthly: [
    { date: 'Jul', liters: 9500 },
    { date: 'Aug', liters: 10200 },
    { date: 'Sep', liters: 8800 },
    { date: 'Oct', liters: 7500 },
    { date: 'Nov', liters: 8200 },
    { date: 'Dec', liters: 9100 },
  ],
};

export const MOCK_RUN_HOURS = {
  daily: [
    { date: '2024-12-01', hours: 6.5 },
    { date: '2024-12-02', hours: 7.2 },
    { date: '2024-12-03', hours: 5.8 },
    { date: '2024-12-04', hours: 8.1 },
    { date: '2024-12-05', hours: 7.5 },
    { date: '2024-12-06', hours: 6.9 },
    { date: '2024-12-07', hours: 8.5 },
  ],
  weekly: [
    { date: 'Week 1', hours: 45 },
    { date: 'Week 2', hours: 50 },
    { date: 'Week 3', hours: 42 },
    { date: 'Week 4', hours: 48 },
  ],
  monthly: [
    { date: 'Jul', hours: 190 },
    { date: 'Aug', hours: 205 },
    { date: 'Sep', hours: 175 },
    { date: 'Oct', hours: 150 },
    { date: 'Nov', hours: 165 },
    { date: 'Dec', hours: 156 },
  ],
};

export const MOCK_PUMP_RUNTIME = [
  { pumpId: '1', name: 'Pump 1', totalHours: 320, lastRun: '2024-12-07T14:30:00' },
  { pumpId: '2', name: 'Pump 2', totalHours: 285, lastRun: '2024-12-07T16:00:00' },
  { pumpId: '3', name: 'Pump 3', totalHours: 410, lastRun: '2024-12-06T18:45:00' },
  { pumpId: '4', name: 'Pump 4', totalHours: 195, lastRun: '2024-12-07T10:15:00' },
  { pumpId: '5', name: 'Pump 5', totalHours: 350, lastRun: '2024-12-07T17:00:00' },
  { pumpId: '6', name: 'Pump 6', totalHours: 150, lastRun: '2024-12-05T12:30:00' },
];

export const MOCK_SOIL_CONDITION = {
  overall: 'Good',
  moisture: 'Adequate',
  pH: 'Optimal',
  nutrients: 'Moderate',
};

export const MOCK_HARVEST_PERFORMANCE = {
  estimatedYield: 2400,
  actualYield: 2200,
  efficiency: 91.7,
};

export const MOCK_GENERAL_METRICS = {
  waterConsumption: { value: 2450, unit: 'L', change: -5 },
  totalRunHours: { value: 156, unit: 'hrs', change: 8 },
  pumpRuntime: { value: 8.5, unit: 'hrs/day', change: -2 },
  mixingRatio: { value: 85, unit: '%', change: 3 },
};
