import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { COLORS } from '../../../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../../constants/typography';
import { SPACING } from '../../../constants/spacing';
import { BORDER_RADIUS } from '../../../constants/layout';
import { updateNotificationSettings } from '../slice/settingsSlice';
import { scheduleLocalNotification } from '../../../services/notifications';
import ScreenLayout from '../../../components/common/ScreenLayout';
import { useTranslation } from 'react-i18next';

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = ['00', '15', '30', '45'];

const NotificationSettingsScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const notifPrefs = useSelector((s) => s.settings.notificationPrefs);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const togglePref = (key) => {
    dispatch(updateNotificationSettings({ [key]: !notifPrefs[key] }));
  };

  const setDailySummaryTime = (time) => {
    dispatch(updateNotificationSettings({ dailySummaryTime: time }));
    setShowTimePicker(false);
  };

  const handleTestNotification = async () => {
    try {
      await scheduleLocalNotification({
        title: 'SmartKisan Test',
        body: 'Notifications are working correctly! You will receive farm alerts here.',
        data: { type: 'test' },
      });
      Alert.alert(
        t('notifications.testSent', 'Test Sent'),
        t('notifications.testSentDesc', 'A test notification has been sent. You should see it shortly.'),
      );
    } catch (error) {
      Alert.alert(
        t('notifications.testFailed', 'Test Failed'),
        t('notifications.testFailedDesc', 'Could not send test notification. Please check notification permissions.'),
      );
    }
  };

  const ToggleRow = ({ icon, label, description, value, onToggle }) => (
    <View style={styles.toggleRow}>
      <View style={styles.toggleIconContainer}>
        <MaterialCommunityIcons name={icon} size={22} color={COLORS.primary} />
      </View>
      <View style={styles.toggleContent}>
        <Text style={styles.toggleLabel}>{label}</Text>
        {description && <Text style={styles.toggleDesc}>{description}</Text>}
      </View>
      <TouchableOpacity style={[styles.toggle, value && styles.toggleOn]} onPress={onToggle}>
        <View style={[styles.toggleThumb, value && styles.toggleThumbOn]} />
      </TouchableOpacity>
    </View>
  );

  const formatTime = (time24) => {
    const [h, m] = time24.split(':');
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${hour12}:${m} ${ampm}`;
  };

  return (
    <ScreenLayout
      title={t('notifications.title', 'Notifications')}
      scrollable={true}
      showBack={true}
      onBack={() => navigation.goBack()}
    >
      {/* Alert Types */}
      <Text style={styles.sectionLabel}>{t('notifications.alertTypes', 'ALERT TYPES')}</Text>
      <View style={styles.card}>
        <ToggleRow
          icon="water-pump"
          label={t('notifications.irrigationReminders', 'Irrigation Reminders')}
          description={t('notifications.irrigationDesc', 'Get reminded when pumps are scheduled to run')}
          value={notifPrefs.irrigationReminders}
          onToggle={() => togglePref('irrigationReminders')}
        />
        <View style={styles.divider} />
        <ToggleRow
          icon="weather-lightning-rainy"
          label={t('notifications.weatherAlerts', 'Weather Alerts')}
          description={t('notifications.weatherDesc', 'Severe weather warnings for your farm area')}
          value={notifPrefs.weatherAlerts}
          onToggle={() => togglePref('weatherAlerts')}
        />
        <View style={styles.divider} />
        <ToggleRow
          icon="currency-inr"
          label={t('notifications.priceAlerts', 'Price Alerts')}
          description={t('notifications.priceDesc', 'Mandi price updates when targets are hit')}
          value={notifPrefs.priceAlerts}
          onToggle={() => togglePref('priceAlerts')}
        />
        <View style={styles.divider} />
        <ToggleRow
          icon="access-point"
          label={t('notifications.deviceAlerts', 'Device Alerts')}
          description={t('notifications.deviceDesc', 'IoT sensor disconnections and anomalies')}
          value={notifPrefs.deviceAlerts}
          onToggle={() => togglePref('deviceAlerts')}
        />
      </View>

      {/* Daily Summary */}
      <Text style={styles.sectionLabel}>{t('notifications.dailySummarySection', 'DAILY SUMMARY')}</Text>
      <View style={styles.card}>
        <ToggleRow
          icon="newspaper-variant-outline"
          label={t('notifications.dailySummary', 'Daily Summary')}
          description={t('notifications.dailySummaryDesc', 'Receive a daily overview of your farm status')}
          value={notifPrefs.dailySummary}
          onToggle={() => togglePref('dailySummary')}
        />
        {notifPrefs.dailySummary && (
          <>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.timeRow} onPress={() => setShowTimePicker(!showTimePicker)}>
              <View style={styles.toggleIconContainer}>
                <MaterialCommunityIcons name="clock-outline" size={22} color={COLORS.primary} />
              </View>
              <View style={styles.toggleContent}>
                <Text style={styles.toggleLabel}>{t('notifications.summaryTime', 'Summary Time')}</Text>
                <Text style={styles.toggleDesc}>{formatTime(notifPrefs.dailySummaryTime)}</Text>
              </View>
              <MaterialCommunityIcons
                name={showTimePicker ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={COLORS.textTertiary}
              />
            </TouchableOpacity>
            {showTimePicker && (
              <View style={styles.timePickerContainer}>
                <View style={styles.timePickerGrid}>
                  {HOURS.map((h) =>
                    MINUTES.map((m) => {
                      const timeVal = `${h}:${m}`;
                      const isSelected = notifPrefs.dailySummaryTime === timeVal;
                      return (
                        <TouchableOpacity
                          key={timeVal}
                          style={[styles.timeChip, isSelected && styles.timeChipActive]}
                          onPress={() => setDailySummaryTime(timeVal)}
                        >
                          <Text style={[styles.timeChipText, isSelected && styles.timeChipTextActive]}>
                            {formatTime(timeVal)}
                          </Text>
                        </TouchableOpacity>
                      );
                    }),
                  )}
                </View>
              </View>
            )}
          </>
        )}
      </View>

      {/* Test Notification */}
      <Text style={styles.sectionLabel}>{t('notifications.testSection', 'TEST')}</Text>
      <TouchableOpacity style={styles.testBtn} onPress={handleTestNotification}>
        <MaterialCommunityIcons name="bell-ring-outline" size={20} color={COLORS.white} />
        <Text style={styles.testBtnText}>{t('notifications.testNotification', 'Send Test Notification')}</Text>
      </TouchableOpacity>

      <Text style={styles.hintText}>
        {t(
          'notifications.hint',
          'Notifications are delivered via push when the app is in the background. Make sure system notifications are enabled for SmartKisan in your device settings.',
        )}
      </Text>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  sectionLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    marginTop: SPACING.lg,
    letterSpacing: 1,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  toggleIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleContent: {
    flex: 1,
  },
  toggleLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.textPrimary,
  },
  toggleDesc: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  toggleOn: {
    backgroundColor: COLORS.primaryLight,
  },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.white,
  },
  toggleThumbOn: {
    alignSelf: 'flex-end',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.divider,
    marginHorizontal: SPACING.lg,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  timePickerContainer: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  timePickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  timeChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.background,
    minWidth: 72,
    alignItems: 'center',
  },
  timeChipActive: {
    backgroundColor: COLORS.primary,
  },
  timeChipText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHTS.medium,
  },
  timeChipTextActive: {
    color: COLORS.white,
  },
  testBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.lg,
    gap: SPACING.sm,
  },
  testBtnText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.white,
  },
  hintText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textTertiary,
    marginTop: SPACING.lg,
    lineHeight: 18,
    paddingHorizontal: SPACING.xs,
  },
});

export default NotificationSettingsScreen;
