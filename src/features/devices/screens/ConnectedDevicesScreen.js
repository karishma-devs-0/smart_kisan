import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { COLORS } from '../../../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../../constants/typography';
import { SPACING } from '../../../constants/spacing';
import { BORDER_RADIUS, SHADOWS } from '../../../constants/layout';
import { fetchDevices } from '../slice/devicesSlice';
import { MOCK_DEVICE_TYPES } from '../mock/devicesMockData';

const CONNECTION_TYPES = {
  weather_station: 'WiFi',
  moisture_sensor: 'LoRa',
  pump_controller: 'WiFi',
  soil_sensor: 'LoRa',
  camera: 'WiFi',
  gateway: 'Ethernet',
};

const SignalQualityBar = ({ strength }) => {
  const bars = 4;
  const activeBars = Math.ceil((strength / 100) * bars);

  return (
    <View style={styles.signalBarContainer}>
      {Array.from({ length: bars }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.signalBar,
            {
              height: 6 + index * 4,
              backgroundColor: index < activeBars ? COLORS.success : COLORS.divider,
            },
          ]}
        />
      ))}
    </View>
  );
};

const ConnectedDeviceNode = ({ device, isGateway }) => {
  const deviceType = MOCK_DEVICE_TYPES[device.type] || { icon: 'devices', color: COLORS.textTertiary };
  const isOnline = device.status === 'online';
  const connectionType = CONNECTION_TYPES[device.type] || 'Unknown';

  return (
    <View
      style={[
        styles.deviceNode,
        isGateway && styles.gatewayNode,
        { borderColor: isOnline ? COLORS.success : COLORS.border },
      ]}
    >
      <View style={[styles.nodeIconContainer, { backgroundColor: deviceType.color + '15' }]}>
        <MaterialCommunityIcons
          name={deviceType.icon}
          size={isGateway ? 32 : 24}
          color={deviceType.color}
        />
      </View>
      <Text style={[styles.nodeName, isGateway && styles.gatewayName]} numberOfLines={1}>
        {device.name}
      </Text>
      <View style={styles.nodeConnectionRow}>
        <Text style={styles.nodeConnectionType}>{connectionType}</Text>
        {!isGateway && <SignalQualityBar strength={device.signalStrength} />}
      </View>
      <View style={[styles.nodeStatusIndicator, { backgroundColor: isOnline ? COLORS.success : COLORS.textTertiary }]} />
    </View>
  );
};

const ConnectedDevicesScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { devices } = useSelector((state) => state.devices);

  useEffect(() => {
    dispatch(fetchDevices());
  }, [dispatch]);

  const gateway = devices.find((d) => d.type === 'gateway');
  const connectedDevices = devices.filter((d) => d.type !== 'gateway');
  const onlineCount = devices.filter((d) => d.status === 'online').length;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.titlePrefix}>Connected</Text>
        <Text style={styles.titleText}> Devices</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Network Status Banner */}
        <View style={styles.networkBanner}>
          <MaterialCommunityIcons name="lan" size={20} color={COLORS.primary} />
          <Text style={styles.networkBannerText}>
            {onlineCount} of {devices.length} devices connected
          </Text>
        </View>

        {/* Network Topology */}
        <Text style={styles.sectionTitle}>Network Topology</Text>

        <View style={styles.topologyContainer}>
          {/* Gateway at center */}
          {gateway && (
            <View style={styles.gatewaySection}>
              <ConnectedDeviceNode device={gateway} isGateway />
            </View>
          )}

          {/* Connection lines from gateway */}
          <View style={styles.connectionLinesContainer}>
            <View style={styles.verticalLine} />
            <View style={styles.horizontalLine} />
          </View>

          {/* Connected devices grid */}
          <View style={styles.devicesGrid}>
            {connectedDevices.map((device) => (
              <View key={device.id} style={styles.deviceNodeWrapper}>
                <View style={styles.branchLine} />
                <ConnectedDeviceNode device={device} isGateway={false} />
              </View>
            ))}
          </View>
        </View>

        {/* Data Usage Summary */}
        <Text style={styles.sectionTitle}>Network Summary</Text>

        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <MaterialCommunityIcons name="upload" size={20} color={COLORS.info} />
              <Text style={styles.summaryItemLabel}>Uplink</Text>
              <Text style={styles.summaryItemValue}>12.4 MB</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <MaterialCommunityIcons name="download" size={20} color={COLORS.success} />
              <Text style={styles.summaryItemLabel}>Downlink</Text>
              <Text style={styles.summaryItemValue}>8.7 MB</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <MaterialCommunityIcons name="database" size={20} color={COLORS.warning} />
              <Text style={styles.summaryItemLabel}>Total Data</Text>
              <Text style={styles.summaryItemValue}>21.1 MB</Text>
            </View>
          </View>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <MaterialCommunityIcons name="clock-outline" size={20} color={COLORS.primary} />
              <Text style={styles.summaryItemLabel}>Avg Latency</Text>
              <Text style={styles.summaryItemValue}>45 ms</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <MaterialCommunityIcons name="refresh" size={20} color={COLORS.info} />
              <Text style={styles.summaryItemLabel}>Sync Rate</Text>
              <Text style={styles.summaryItemValue}>5 min</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <MaterialCommunityIcons name="alert-circle-outline" size={20} color={COLORS.danger} />
              <Text style={styles.summaryItemLabel}>Errors</Text>
              <Text style={styles.summaryItemValue}>2</Text>
            </View>
          </View>
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
  titlePrefix: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primary,
  },
  titleText: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxxxl,
  },
  networkBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primarySurface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.xl,
    gap: SPACING.sm,
  },
  networkBannerText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.primary,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  topologyContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  gatewaySection: {
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  connectionLinesContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  verticalLine: {
    width: 2,
    height: 24,
    backgroundColor: COLORS.border,
  },
  horizontalLine: {
    width: '80%',
    height: 2,
    backgroundColor: COLORS.border,
  },
  devicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: SPACING.md,
    paddingTop: SPACING.xs,
  },
  deviceNodeWrapper: {
    alignItems: 'center',
    width: '45%',
  },
  branchLine: {
    width: 2,
    height: 16,
    backgroundColor: COLORS.border,
    marginBottom: SPACING.xs,
  },
  deviceNode: {
    width: '100%',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 1.5,
    ...SHADOWS.sm,
  },
  gatewayNode: {
    width: 180,
    padding: SPACING.lg,
    borderWidth: 2,
    ...SHADOWS.md,
  },
  nodeIconContainer: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  nodeName: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  gatewayName: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
  },
  nodeConnectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  nodeConnectionType: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textTertiary,
  },
  signalBarContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },
  signalBar: {
    width: 4,
    borderRadius: 1,
  },
  nodeStatusIndicator: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  summaryCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryItemLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  summaryItemValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.divider,
  },
});

export default ConnectedDevicesScreen;
