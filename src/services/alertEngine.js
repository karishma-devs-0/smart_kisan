/**
 * Alert Rules Engine
 *
 * Pure functions — evaluate a sensor reading against a list of rules
 * and return triggered alerts. Zero side effects; dispatch/notify is the caller's job.
 *
 * Rule shape:
 *   {
 *     id: string,
 *     name: string,
 *     metric: 'moisture' | 'pH' | 'nitrogen' | 'phosphorus' | 'potassium' | 'battery' | 'signal' | 'temperature' | 'ec',
 *     operator: '<' | '>' | '==' | '!=' | '<=' | '>=',
 *     threshold: number,
 *     severity: 'info' | 'warning' | 'critical',
 *     channels: Array<'push' | 'inapp' | 'sms' | 'email'>,
 *     enabled: boolean,
 *   }
 *
 * Alert shape:
 *   {
 *     ruleId: string,
 *     ruleName: string,
 *     metric: string,
 *     value: number,
 *     threshold: number,
 *     severity: string,
 *     message: string,
 *     timestamp: string (ISO),
 *   }
 */

const OPERATORS = {
  '<': (a, b) => a < b,
  '>': (a, b) => a > b,
  '<=': (a, b) => a <= b,
  '>=': (a, b) => a >= b,
  '==': (a, b) => a === b,
  '!=': (a, b) => a !== b,
};

const METRIC_UNITS = {
  moisture: '%',
  pH: '',
  nitrogen: '%',
  phosphorus: '%',
  potassium: '%',
  battery: '%',
  signal: 'dBm',
  temperature: '°C',
  ec: 'dS/m',
};

const buildMessage = (rule, value) => {
  const unit = METRIC_UNITS[rule.metric] || '';
  return `${rule.name}: ${rule.metric} = ${value}${unit} (threshold ${rule.operator} ${rule.threshold}${unit})`;
};

export const evaluate = (rule, reading) => {
  if (!rule.enabled) return null;
  const value = reading[rule.metric];
  if (value == null) return null;
  const op = OPERATORS[rule.operator];
  if (!op) return null;
  if (!op(value, rule.threshold)) return null;
  return {
    ruleId: rule.id,
    ruleName: rule.name,
    metric: rule.metric,
    value,
    threshold: rule.threshold,
    severity: rule.severity || 'warning',
    message: buildMessage(rule, value),
    timestamp: new Date().toISOString(),
    channels: rule.channels || ['inapp'],
  };
};

export const evaluateAll = (rules, reading) => {
  if (!Array.isArray(rules) || !reading) return [];
  const alerts = [];
  for (const rule of rules) {
    const alert = evaluate(rule, reading);
    if (alert) alerts.push(alert);
  }
  return alerts;
};

export const dedupKey = (alert) => {
  const date = alert.timestamp.split('T')[0];
  return `${alert.ruleId}-${date}`;
};

export const shouldNotify = (alert, history = []) => {
  const key = dedupKey(alert);
  return !history.includes(key);
};
