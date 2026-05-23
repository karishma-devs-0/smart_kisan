import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Push token registration was removed from Expo Go in SDK 53. Detect Expo Go
// so we can skip that call there and avoid a red-screen on launch. Local
// notifications still work in Expo Go, so we keep the rest of the API live.
const isExpoGo = Constants.executionEnvironment === 'storeClient';

// Configure default notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Request permissions and get the Expo push token.
 * Returns the token string or null if permissions are denied.
 */
export async function registerForPushNotifications() {
  if (!Device.isDevice) {
    if (__DEV__) console.warn('Push notifications require a physical device');
    return null;
  }

  // Check existing permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    if (__DEV__) console.warn('Push notification permission not granted');
    return null;
  }

  // Android requires a notification channel — works in Expo Go and dev builds.
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'SmartKisan',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4CAF50',
    });
  }

  // Expo Go cannot register for remote push tokens since SDK 53. Skip the
  // call there so we don't red-screen on launch — local notifications still
  // work fine without a token.
  if (isExpoGo) {
    if (__DEV__) {
      console.log(
        '[notifications] Skipping push token registration in Expo Go. ' +
        'Build a dev client for full push support.',
      );
    }
    return null;
  }

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: '4fa6ae46-9da2-4bb5-ac0d-a8cd9a7a09bd',
    });
    return tokenData.data;
  } catch (err) {
    if (__DEV__) console.warn('[notifications] getExpoPushTokenAsync failed:', err.message);
    return null;
  }
}

/**
 * Schedule a local notification.
 * @param {Object} params
 * @param {string} params.title - Notification title
 * @param {string} params.body - Notification body text
 * @param {Object} [params.data] - Custom data payload
 * @param {Object} [params.trigger] - Scheduling trigger (null = immediate)
 */
export async function scheduleLocalNotification({ title, body, data = {}, trigger = null }) {
  return await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
    },
    trigger,
  });
}

/**
 * Cancel all scheduled notifications.
 */
export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Schedule an irrigation reminder for a specific pump.
 * @param {string} pumpName - Name of the pump
 * @param {string} time - Scheduled time string (e.g. "06:30 AM")
 */
export async function sendIrrigationReminder(pumpName, time) {
  return await scheduleLocalNotification({
    title: 'Irrigation Reminder',
    body: `Time to run "${pumpName}" at ${time}. Check soil moisture before starting.`,
    data: { type: 'irrigation_reminder', pumpName },
  });
}

/**
 * Send a weather alert notification.
 * @param {string} condition - Weather condition (e.g. "Heavy Rain", "Frost")
 * @param {'low'|'medium'|'high'|'critical'} severity - Alert severity level
 */
export async function sendWeatherAlert(condition, severity) {
  const severityLabels = {
    low: 'Advisory',
    medium: 'Watch',
    high: 'Warning',
    critical: 'Emergency',
  };
  const label = severityLabels[severity] || 'Alert';

  return await scheduleLocalNotification({
    title: `Weather ${label}: ${condition}`,
    body: `A ${severity} severity weather alert has been issued for your farm area. Take necessary precautions.`,
    data: { type: 'weather_alert', condition, severity },
  });
}

/**
 * Send a mandi price alert when a commodity hits the target price.
 * @param {string} commodity - Commodity name (e.g. "Wheat", "Rice")
 * @param {number} currentPrice - Current market price
 * @param {number} targetPrice - User's target price
 */
export async function sendPriceAlert(commodity, currentPrice, targetPrice) {
  const direction = currentPrice >= targetPrice ? 'reached' : 'dropped below';
  return await scheduleLocalNotification({
    title: `Price Alert: ${commodity}`,
    body: `${commodity} has ${direction} your target price. Current: \u20B9${currentPrice}/qtl (Target: \u20B9${targetPrice}/qtl)`,
    data: { type: 'price_alert', commodity, currentPrice, targetPrice },
  });
}
