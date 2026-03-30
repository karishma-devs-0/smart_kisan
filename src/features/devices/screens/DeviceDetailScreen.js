import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../../constants/typography';
import { SPACING } from '../../../constants/spacing';
import { BORDER_RADIUS, SHADOWS } from '../../../constants/layout';
import { useTranslation } from 'react-i18next';
import { MOCK_DEVICE_TYPES } from '../mock/devicesMockData';

const formatTypeLabel = (type) => {
  return type
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const formatLastSync = (isoString) => {
  const date = new Date(isoString);
  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const InfoCard = ({ icon, iconColor, label, value, children }) => (
  <View style={styles.infoCard}>
    <View style={styles.infoCardHeader}>
      <View style={[styles.infoIconContainer, { backgroundColor: iconColor + '15' }]}>
        <MaterialCommunityIcons name={icon} size={20} color={iconColor} />
      </View>
      <View style={styles.infoCardContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
    {children}
  </View>
);

const ReadingCard = ({ icon, iconColor, label, value, unit }) => (
  <View style={styles.readingCard}>
    <MaterialCommunityIcons name={icon} size={22} color={iconColor} />
    <Text style={styles.readingLabel}>{label}</Text>
    <Text style={[styles.readingValue, { color: iconColor }]}>
      {value}
      <Text style={styles.readingUnit}>{unit}</Text>
    </Text>
  </View>
);

const ProgressBar = ({ value, color }) => (
  <View style={styles.progressBarContainer}>
    <View style={[styles.progressBarFill, { width: `${Math.min(value, 100)}%`, backgroundColor: color }]} />
  </View>
);

const DeviceDetailScreen = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { device } = route.params || {};
  const insets = useSafeAreaInsets();

  const deviceType = MOCK_DEVICE_TYPES[device.type] || { icon: 'devices', color: COLORS.textTertiary };
  const isOnline = device.status === 'online';

  const getBatteryColor = (level) => {
    if (level > 60) return COLORS.success;
    if (level > 20) return COLORS.warning;
    return COLORS.danger;
  };

  const getSignalColor = (strength) => {
    if (strength > 70) return COLORS.success;
    if (strength > 40) return COLORS.warning;
    return COLORS.danger;
  };

  const renderTypeSpecificReadings = () => {
    switch (device.type) {
      case 'weather_station':
        return (
          <View>
            <Text style={styles.sectionTitle}>{t('devices.detail.liveReadings')}</Text>
            <View style={styles.readingsGrid}>
              <ReadingCard
                icon="thermometer"
                iconColor="#F44336"
                label={t('devices.detail.temperature')}
                value="32.5"
                unit=" °C"
              />
              <ReadingCard
                icon="water-percent"
                iconColor="#2196F3"
                label={t('devices.detail.humidity')}
                value="68"
                unit=" %"
              />
              <ReadingCard
                icon="weather-windy"
                iconColor="#607D8B"
                label={t('devices.detail.windSpeed')}
                value="12.3"
                unit=" km/h"
              />
              <ReadingCard
                icon="weather-pouring"
                iconColor="#1565C0"
                label={t('devices.detail.rainfall')}
                value="2.4"
                unit=" mm"
              />
            </View>
          </View>
        );

      case 'moisture_sensor':
        return (
          <View>
            <Text style={styles.sectionTitle}>{t('devices.detail.liveReadings')}</Text>
            <View style={styles.readingsGrid}>
              <ReadingCard
                icon="water-percent"
                iconColor="#4CAF50"
                label={t('devices.detail.currentMoisture')}
                value="42"
                unit=" %"
              />
              <ReadingCard
                icon="arrow-collapse-down"
                iconColor="#795548"
                label={t('devices.detail.depth')}
                value="30"
                unit=" cm"
              />
            </View>
          </View>
        );

      case 'pump_controller':
        return (
          <View>
            <Text style={styles.sectionTitle}>{t('devices.detail.liveReadings')}</Text>
            <View style={styles.readingsGrid}>
              <ReadingCard
                icon="power"
                iconColor="#4CAF50"
                label={t('devices.detail.pumpStatus')}
                value={t('common.running')}
                unit=""
              />
              <ReadingCard
                icon="clock-outline"
                iconColor="#FF9800"
                label={t('devices.detail.runtimeToday')}
                value="4.5"
                unit=" hrs"
              />
              <ReadingCard
                icon="water"
                iconColor="#2196F3"
                label={t('devices.detail.flowRate')}
                value="15.2"
                unit=" L/min"
              />
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{device.name}</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Device Status Card */}
        <View style={styles.statusCard}>
          <View style={[styles.statusIconContainer, { backgroundColor: deviceType.color + '15' }]}>
            <MaterialCommunityIcons
              name={deviceType.icon}
              size={40}
              color={deviceType.color}
            />
          </View>
          <View style={styles.statusInfo}>
            <Text style={styles.deviceName}>{device.name}</Text>
            <Text style={styles.deviceType}>{formatTypeLabel(device.type)}</Text>
            <View style={[styles.statusBadge, { backgroundColor: isOnline ? COLORS.success + '20' : COLORS.danger + '20' }]}>
              <View style={[styles.statusDot, { backgroundColor: isOnline ? COLORS.success : COLORS.danger }]} />
              <Text style={[styles.statusText, { color: isOnline ? COLORS.success : COLORS.danger }]}>
                {isOnline ? t('common.online') : t('common.offline')}
              </Text>
            </View>
          </View>
        </View>

        {/* Info Cards */}
        <Text style={styles.sectionTitle}>{t('devices.detail.deviceInfo')}</Text>

        <InfoCard
          icon="battery"
          iconColor={getBatteryColor(device.batteryLevel)}
          label={t('devices.detail.batteryLevel')}
          value={`${device.batteryLevel}%`}
        >
          <ProgressBar value={device.batteryLevel} color={getBatteryColor(device.batteryLevel)} />
        </InfoCard>

        <InfoCard
          icon="signal"
          iconColor={getSignalColor(device.signalStrength)}
          label={t('devices.detail.signalStrength')}
          value={`${device.signalStrength}%`}
        >
          <ProgressBar value={device.signalStrength} color={getSignalColor(device.signalStrength)} />
        </InfoCard>

        <InfoCard
          icon="cellphone-arrow-down"
          iconColor={COLORS.info}
          label={t('devices.detail.firmwareVersion')}
          value={`v${device.firmwareVersion}`}
        />

        <InfoCard
          icon="sync"
          iconColor={COLORS.primary}
          label={t('devices.detail.lastSync')}
          value={formatLastSync(device.lastSync)}
        />

        <InfoCard
          icon="map-marker"
          iconColor={COLORS.warning}
          label={t('devices.detail.location')}
          value={device.location}
        />

        {/* Type-specific readings */}
        {renderTypeSpecificReadings()}

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={styles.calibrateButton}
            onPress={() => navigation.navigate('CalibrationWizard', { deviceId: device.id })}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="tune-vertical" size={20} color={COLORS.white} />
            <Text style={styles.calibrateButtonText}>Calibrate</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.connectionButton}
            onPress={() => navigation.navigate('DeviceConnection')}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="cog-outline" size={20} color={COLORS.white} />
            <Text style={styles.connectionButtonText}>{t('devices.detail.connectionSettings')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.alertRulesButton}
            onPress={() => navigation.navigate('AlertRules')}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="bell-alert-outline" size={20} color={COLORS.primary} />
            <Text style={styles.alertRulesButtonText}>Alert Rules</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => {
              Alert.alert(
                t('devices.detail.removeDevice'),
                `Are you sure you want to remove ${device.name}?`,
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Remove', style: 'destructive', onPress: () => navigation.goBack() },
                ],
              );
            }}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="delete-outline" size={20} color={COLORS.danger} />
            <Text style={styles.removeButtonText}>{t('devices.detail.removeDevice')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  backBtn: {
    marginRight: SPACING.md,
    padding: SPACING.xs,
  },
  headerTitle: {
    flex: 1,
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxxxl,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    marginBottom: SPACING.xxl,
    ...SHADOWS.md,
  },
  statusIconContainer: {
    width: 72,
    height: 72,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.lg,
  },
  statusInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
  },
  deviceType: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    marginTop: SPACING.sm,
    gap: SPACING.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.semiBold,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
    marginTop: SPACING.sm,
  },
  infoCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  infoCardContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  infoValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: COLORS.divider,
    borderRadius: 3,
    marginTop: SPACING.md,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  readingsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  readingCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  readingLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  readingValue: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    marginTop: SPACING.xs,
  },
  readingUnit: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.regular,
  },
  actionsSection: {
    marginTop: SPACING.xl,
    gap: SPACING.md,
    marginBottom: SPACING.xxl,
  },
  calibrateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.info,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.lg,
    gap: SPACING.sm,
    ...SHADOWS.md,
  },
  calibrateButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.white,
  },
  connectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.lg,
    gap: SPACING.sm,
    ...SHADOWS.md,
  },
  connectionButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.white,
  },
  alertRulesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.lg,
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  alertRulesButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.primary,
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.lg,
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.danger,
  },
  removeButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.danger,
  },
});

export default DeviceDetailScreen;
