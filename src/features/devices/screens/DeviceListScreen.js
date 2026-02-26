import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { COLORS } from '../../../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../../constants/typography';
import { SPACING } from '../../../constants/spacing';
import { BORDER_RADIUS, SHADOWS } from '../../../constants/layout';
import { fetchDevices, selectDevice } from '../slice/devicesSlice';
import { MOCK_DEVICE_TYPES } from '../mock/devicesMockData';

const formatLastSync = (isoString) => {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};

const formatTypeLabel = (type) => {
  return type
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const StatusSummaryCard = ({ count, label, color, icon }) => (
  <View style={[styles.summaryCard, { borderLeftColor: color, borderLeftWidth: 3 }]}>
    <MaterialCommunityIcons name={icon} size={20} color={color} />
    <Text style={[styles.summaryCount, { color }]}>{count}</Text>
    <Text style={styles.summaryLabel}>{label}</Text>
  </View>
);

const DeviceCard = React.memo(({ device, onPress }) => {
  const deviceType = MOCK_DEVICE_TYPES[device.type] || { icon: 'devices', color: COLORS.textTertiary };
  const isOnline = device.status === 'online';

  return (
    <TouchableOpacity
      style={styles.deviceCard}
      onPress={() => onPress(device)}
      activeOpacity={0.7}
    >
      <View style={[styles.deviceIconContainer, { backgroundColor: deviceType.color + '15' }]}>
        <MaterialCommunityIcons
          name={deviceType.icon}
          size={28}
          color={deviceType.color}
        />
      </View>
      <View style={styles.deviceInfo}>
        <View style={styles.deviceNameRow}>
          <Text style={styles.deviceName} numberOfLines={1}>{device.name}</Text>
          <View style={[styles.statusDot, { backgroundColor: isOnline ? COLORS.success : COLORS.danger }]} />
        </View>
        <Text style={styles.deviceType}>{formatTypeLabel(device.type)}</Text>
        <View style={styles.deviceMeta}>
          <View style={styles.metaItem}>
            <MaterialCommunityIcons name="battery" size={14} color={COLORS.textTertiary} />
            <Text style={styles.metaText}>{device.batteryLevel}%</Text>
          </View>
          <View style={styles.metaItem}>
            <MaterialCommunityIcons name="signal" size={14} color={COLORS.textTertiary} />
            <Text style={styles.metaText}>{device.signalStrength}%</Text>
          </View>
          <View style={styles.metaItem}>
            <MaterialCommunityIcons name="sync" size={14} color={COLORS.textTertiary} />
            <Text style={styles.metaText}>{formatLastSync(device.lastSync)}</Text>
          </View>
        </View>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.textTertiary} />
    </TouchableOpacity>
  );
});

const DeviceListScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { devices, loading } = useSelector((state) => state.devices);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    dispatch(fetchDevices());
  }, [dispatch]);

  const filteredDevices = devices.filter((device) =>
    device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    device.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    device.location.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const onlineCount = devices.filter((d) => d.status === 'online').length;
  const offlineCount = devices.filter((d) => d.status === 'offline').length;

  const handleDevicePress = useCallback((device) => {
    dispatch(selectDevice(device));
    navigation.navigate('DeviceDetail', { device });
  }, [dispatch, navigation]);

  const renderHeader = () => (
    <View>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <MaterialCommunityIcons name="magnify" size={20} color={COLORS.textTertiary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search devices..."
          placeholderTextColor={COLORS.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <MaterialCommunityIcons name="close-circle" size={18} color={COLORS.textTertiary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Status Summary */}
      <View style={styles.summaryRow}>
        <StatusSummaryCard
          count={onlineCount}
          label="Online"
          color={COLORS.success}
          icon="check-circle"
        />
        <StatusSummaryCard
          count={offlineCount}
          label="Offline"
          color={COLORS.danger}
          icon="close-circle"
        />
        <StatusSummaryCard
          count={devices.length}
          label="Total"
          color={COLORS.info}
          icon="devices"
        />
      </View>

      {/* Section Label */}
      <Text style={styles.sectionLabel}>All Devices</Text>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.titlePrefix}>My</Text>
        <Text style={styles.titleText}> Devices</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredDevices}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <DeviceCard device={item} onPress={handleDevicePress} />
          )}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No devices found</Text>
          }
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + 20 }]}
        onPress={() => {}}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name="plus" size={28} color={COLORS.white} />
      </TouchableOpacity>
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
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 100,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.lg,
    ...SHADOWS.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    marginLeft: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  summaryCount: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    marginTop: SPACING.xs,
  },
  summaryLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  sectionLabel: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  deviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  deviceIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  deviceName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textPrimary,
    flex: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  deviceType: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  deviceMeta: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.xs,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textTertiary,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textTertiary,
    textAlign: 'center',
    marginTop: SPACING.xxxl,
  },
  fab: {
    position: 'absolute',
    right: SPACING.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.lg,
  },
});

export default DeviceListScreen;
