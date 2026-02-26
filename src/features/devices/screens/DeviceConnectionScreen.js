import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../../constants/typography';
import { SPACING } from '../../../constants/spacing';
import { BORDER_RADIUS, SHADOWS } from '../../../constants/layout';
import { MOCK_CONNECTION_PROTOCOLS } from '../mock/devicesMockData';

const MOCK_BLE_DEVICES = [
  { id: 'ble1', name: 'SmartKisan Sensor A', rssi: -45 },
  { id: 'ble2', name: 'SmartKisan Pump B', rssi: -62 },
  { id: 'ble3', name: 'SmartKisan Gateway', rssi: -78 },
];

const SignalStrengthVisual = ({ strength }) => {
  const totalBars = 5;
  const activeBars = Math.ceil((strength / 100) * totalBars);

  return (
    <View style={styles.signalVisualContainer}>
      <View style={styles.signalBars}>
        {Array.from({ length: totalBars }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.signalVisualBar,
              {
                height: 8 + index * 6,
                backgroundColor: index < activeBars
                  ? (activeBars >= 4 ? COLORS.success : activeBars >= 2 ? COLORS.warning : COLORS.danger)
                  : COLORS.divider,
              },
            ]}
          />
        ))}
      </View>
      <Text style={styles.signalPercentage}>{strength}%</Text>
    </View>
  );
};

const ProtocolCard = ({ protocol, enabled, onToggle }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'connected': return COLORS.success;
      case 'available': return COLORS.info;
      case 'disabled': return COLORS.textTertiary;
      default: return COLORS.textTertiary;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'connected': return 'Connected';
      case 'available': return 'Available';
      case 'disabled': return 'Disabled';
      default: return 'Unknown';
    }
  };

  return (
    <View style={styles.protocolCard}>
      <View style={styles.protocolHeader}>
        <View style={[styles.protocolIconContainer, { backgroundColor: getStatusColor(protocol.status) + '15' }]}>
          <MaterialCommunityIcons
            name={protocol.icon}
            size={24}
            color={getStatusColor(protocol.status)}
          />
        </View>
        <View style={styles.protocolInfo}>
          <Text style={styles.protocolName}>{protocol.name}</Text>
          <Text style={styles.protocolDescription} numberOfLines={2}>
            {protocol.description}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.toggle, enabled && styles.toggleOn]}
          onPress={onToggle}
        >
          <View style={[styles.toggleThumb, enabled && styles.toggleThumbOn]} />
        </TouchableOpacity>
      </View>
      <View style={styles.protocolStatusRow}>
        <View style={[styles.protocolStatusDot, { backgroundColor: getStatusColor(protocol.status) }]} />
        <Text style={[styles.protocolStatusText, { color: getStatusColor(protocol.status) }]}>
          {getStatusLabel(protocol.status)}
        </Text>
      </View>
    </View>
  );
};

const BleDeviceItem = ({ device }) => {
  const getSignalLevel = (rssi) => {
    if (rssi > -50) return { label: 'Excellent', color: COLORS.success };
    if (rssi > -65) return { label: 'Good', color: COLORS.primaryLight };
    if (rssi > -80) return { label: 'Fair', color: COLORS.warning };
    return { label: 'Weak', color: COLORS.danger };
  };

  const signal = getSignalLevel(device.rssi);

  return (
    <View style={styles.bleDeviceItem}>
      <MaterialCommunityIcons name="bluetooth" size={20} color={COLORS.info} />
      <View style={styles.bleDeviceInfo}>
        <Text style={styles.bleDeviceName}>{device.name}</Text>
        <Text style={[styles.bleDeviceSignal, { color: signal.color }]}>{signal.label} ({device.rssi} dBm)</Text>
      </View>
      <TouchableOpacity style={styles.bleConnectButton}>
        <Text style={styles.bleConnectText}>Pair</Text>
      </TouchableOpacity>
    </View>
  );
};

const DeviceConnectionScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();

  const [protocolToggles, setProtocolToggles] = useState({
    wifi: true,
    bluetooth: false,
    lora: true,
    zigbee: false,
  });

  const [wifiSsid, setWifiSsid] = useState('');
  const [wifiPassword, setWifiPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [discoveredDevices, setDiscoveredDevices] = useState([]);

  const handleToggleProtocol = (protocolId) => {
    setProtocolToggles((prev) => ({
      ...prev,
      [protocolId]: !prev[protocolId],
    }));
  };

  const handleScanBle = () => {
    setIsScanning(true);
    setDiscoveredDevices([]);
    setTimeout(() => {
      setDiscoveredDevices(MOCK_BLE_DEVICES);
      setIsScanning(false);
    }, 2000);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.titlePrefix}>Connection</Text>
        <Text style={styles.titleText}> Settings</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Signal Strength Indicator */}
        <View style={styles.signalCard}>
          <Text style={styles.signalCardTitle}>Current Signal Strength</Text>
          <SignalStrengthVisual strength={78} />
        </View>

        {/* Connection Protocols */}
        <Text style={styles.sectionTitle}>Connection Protocols</Text>

        {MOCK_CONNECTION_PROTOCOLS.map((protocol) => (
          <ProtocolCard
            key={protocol.id}
            protocol={protocol}
            enabled={protocolToggles[protocol.id]}
            onToggle={() => handleToggleProtocol(protocol.id)}
          />
        ))}

        {/* WiFi Details */}
        {protocolToggles.wifi && (
          <View>
            <Text style={styles.sectionTitle}>WiFi Configuration</Text>
            <View style={styles.formCard}>
              <Text style={styles.inputLabel}>Network Name (SSID)</Text>
              <View style={styles.inputContainer}>
                <MaterialCommunityIcons name="wifi" size={18} color={COLORS.textTertiary} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter WiFi network name"
                  placeholderTextColor={COLORS.textTertiary}
                  value={wifiSsid}
                  onChangeText={setWifiSsid}
                />
              </View>

              <Text style={[styles.inputLabel, { marginTop: SPACING.lg }]}>Password</Text>
              <View style={styles.inputContainer}>
                <MaterialCommunityIcons name="lock" size={18} color={COLORS.textTertiary} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter WiFi password"
                  placeholderTextColor={COLORS.textTertiary}
                  secureTextEntry={!showPassword}
                  value={wifiPassword}
                  onChangeText={setWifiPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <MaterialCommunityIcons
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color={COLORS.textTertiary}
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[
                  styles.connectWifiButton,
                  (!wifiSsid || !wifiPassword) && styles.connectWifiButtonDisabled,
                ]}
                disabled={!wifiSsid || !wifiPassword}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="wifi-check" size={20} color={COLORS.white} />
                <Text style={styles.connectWifiText}>Connect to WiFi</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* BLE Section */}
        {protocolToggles.bluetooth && (
          <View>
            <Text style={styles.sectionTitle}>Bluetooth Devices</Text>
            <View style={styles.formCard}>
              <TouchableOpacity
                style={styles.scanButton}
                onPress={handleScanBle}
                disabled={isScanning}
                activeOpacity={0.7}
              >
                {isScanning ? (
                  <ActivityIndicator size="small" color={COLORS.primary} />
                ) : (
                  <MaterialCommunityIcons name="bluetooth-connect" size={20} color={COLORS.primary} />
                )}
                <Text style={styles.scanButtonText}>
                  {isScanning ? 'Scanning...' : 'Scan for Devices'}
                </Text>
              </TouchableOpacity>

              {discoveredDevices.length > 0 && (
                <View style={styles.bleDevicesList}>
                  <Text style={styles.bleListTitle}>Discovered Devices</Text>
                  {discoveredDevices.map((device) => (
                    <BleDeviceItem key={device.id} device={device} />
                  ))}
                </View>
              )}

              {!isScanning && discoveredDevices.length === 0 && (
                <View style={styles.bleEmptyState}>
                  <MaterialCommunityIcons name="bluetooth-off" size={36} color={COLORS.textTertiary} />
                  <Text style={styles.bleEmptyText}>
                    Tap scan to search for nearby Bluetooth devices
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
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
  signalCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
    marginBottom: SPACING.xxl,
    ...SHADOWS.md,
  },
  signalCardTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
  },
  signalVisualContainer: {
    alignItems: 'center',
  },
  signalBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: SPACING.sm,
    height: 40,
  },
  signalVisualBar: {
    width: 12,
    borderRadius: 3,
  },
  signalPercentage: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
    marginTop: SPACING.sm,
  },
  protocolCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  protocolHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  protocolIconContainer: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  protocolInfo: {
    flex: 1,
  },
  protocolName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textPrimary,
  },
  protocolDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 18,
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
  protocolStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    gap: SPACING.xs,
  },
  protocolStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  protocolStatusText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.medium,
  },
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    ...SHADOWS.sm,
  },
  inputLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  textInput: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    paddingVertical: SPACING.xs,
  },
  connectWifiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.lg,
    marginTop: SPACING.xl,
    gap: SPACING.sm,
  },
  connectWifiButtonDisabled: {
    backgroundColor: COLORS.border,
  },
  connectWifiText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.white,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  scanButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.primary,
  },
  bleDevicesList: {
    marginTop: SPACING.xl,
  },
  bleListTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  bleDeviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    gap: SPACING.md,
  },
  bleDeviceInfo: {
    flex: 1,
  },
  bleDeviceName: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.textPrimary,
  },
  bleDeviceSignal: {
    fontSize: FONT_SIZES.xs,
    marginTop: 2,
  },
  bleConnectButton: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primarySurface,
  },
  bleConnectText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.primary,
  },
  bleEmptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xxxl,
  },
  bleEmptyText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textTertiary,
    textAlign: 'center',
    marginTop: SPACING.md,
    lineHeight: 22,
  },
});

export default DeviceConnectionScreen;
