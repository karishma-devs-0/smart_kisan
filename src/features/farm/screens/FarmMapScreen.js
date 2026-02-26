import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { WebView } from 'react-native-webview';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../../constants/typography';
import { SPACING } from '../../../constants/spacing';
import { BORDER_RADIUS, TAB_BAR } from '../../../constants/layout';
import { MOCK_DEVICE_TYPES } from '../../devices/mock/devicesMockData';
import { fetchFields } from '../../fields/slice/fieldsSlice';
import { fetchDevices } from '../../devices/slice/devicesSlice';
import { generateMapHTML } from '../../../utils/leafletMap';

const CROP_ICONS = {
  Wheat: 'barley',
  'Bell Pepper': 'chili-mild',
  Cotton: 'flower',
  Tomato: 'food-apple',
  Soybean: 'seed',
};

const FarmMapScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const fields = useSelector((state) => state.fields.fields);
  const devices = useSelector((state) => state.devices.devices);

  useEffect(() => {
    dispatch(fetchFields());
    dispatch(fetchDevices());
  }, [dispatch]);

  const mapHTML = useMemo(() => {
    if (!fields.length && !devices.length) return null;
    return generateMapHTML({ fields, devices, interactive: true, zoom: 15 });
  }, [fields, devices]);

  const onlineCount = devices.filter((d) => d.status === 'online').length;
  const offlineCount = devices.filter((d) => d.status === 'offline').length;

  const legendItems = Object.entries(MOCK_DEVICE_TYPES).map(([key, val]) => ({
    type: key,
    label: key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    ...val,
  }));

  const tabBarPadding = TAB_BAR.height + TAB_BAR.marginBottom + Math.max(insets.bottom, 12) + 8;

  return (
    <View style={styles.container}>
      {/* Full-screen map */}
      <View style={styles.mapContainer}>
        {mapHTML ? (
          <WebView
            source={{ html: mapHTML }}
            style={styles.webview}
            scrollEnabled={false}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            originWhitelist={['*']}
          />
        ) : (
          <View style={styles.loadingMap}>
            <MaterialCommunityIcons name="map-search" size={48} color={COLORS.textTertiary} />
            <Text style={styles.loadingText}>Loading map...</Text>
          </View>
        )}
      </View>

      {/* Back button overlay */}
      <TouchableOpacity
        style={[styles.backButton, { top: insets.top + 12 }]}
        onPress={() => navigation.goBack()}
      >
        <MaterialCommunityIcons name="arrow-left" size={22} color={COLORS.textPrimary} />
      </TouchableOpacity>

      {/* Bottom sheet */}
      <View style={[styles.bottomSheet, { paddingBottom: tabBarPadding }]}>
        <View style={styles.handle} />

        {/* Summary stats */}
        <View style={styles.statsRow}>
          <View style={styles.statChip}>
            <MaterialCommunityIcons name="vector-square" size={16} color={COLORS.primaryLight} />
            <Text style={styles.statChipText}>{fields.length} Fields</Text>
          </View>
          <View style={styles.statChip}>
            <View style={[styles.statusDot, { backgroundColor: COLORS.success }]} />
            <Text style={styles.statChipText}>{onlineCount} Online</Text>
          </View>
          <View style={styles.statChip}>
            <View style={[styles.statusDot, { backgroundColor: COLORS.danger }]} />
            <Text style={styles.statChipText}>{offlineCount} Offline</Text>
          </View>
        </View>

        {/* Legend row */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.legendContent}
        >
          {/* Field marker legend */}
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.primaryLight }]} />
            <Text style={styles.legendLabel}>Field</Text>
          </View>
          {legendItems.map((item) => (
            <View key={item.type} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: item.color }]}>
                <MaterialCommunityIcons name={item.icon} size={10} color={COLORS.white} />
              </View>
              <Text style={styles.legendLabel}>{item.label}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Field list */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.fieldCardsContent}
        >
          {fields.map((field) => (
            <TouchableOpacity
              key={field.id}
              style={styles.fieldCard}
              onPress={() => navigation.navigate('FieldDetail', { field })}
              activeOpacity={0.7}
            >
              <View style={styles.fieldCardTop}>
                <View style={[styles.fieldCardIcon, {
                  backgroundColor: (field.status === 'harvested' ? COLORS.warning : COLORS.primaryLight) + '20',
                }]}>
                  <MaterialCommunityIcons
                    name={CROP_ICONS[field.crop] || 'sprout'}
                    size={20}
                    color={field.status === 'harvested' ? COLORS.warning : COLORS.primaryLight}
                  />
                </View>
                <Text style={styles.fieldCardName} numberOfLines={1}>{field.name}</Text>
              </View>
              <Text style={styles.fieldCardCrop}>{field.crop}</Text>
              <View style={styles.fieldCardBottom}>
                <Text style={styles.fieldCardArea}>{field.area} acres</Text>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, {
                    width: `${field.growthProgress}%`,
                    backgroundColor: field.status === 'harvested' ? COLORS.warning : COLORS.primaryLight,
                  }]} />
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  mapContainer: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
  loadingMap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.textTertiary,
  },
  backButton: {
    position: 'absolute',
    left: SPACING.lg,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.divider,
    alignSelf: 'center',
    marginBottom: SPACING.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    gap: SPACING.xs,
  },
  statChipText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHTS.medium,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendContent: {
    gap: SPACING.sm,
    paddingBottom: SPACING.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendLabel: {
    fontSize: 10,
    color: COLORS.textTertiary,
    fontWeight: FONT_WEIGHTS.medium,
  },
  fieldCardsContent: {
    gap: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  fieldCard: {
    width: 140,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
  },
  fieldCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  fieldCardIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldCardName: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textPrimary,
  },
  fieldCardCrop: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  fieldCardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldCardArea: {
    fontSize: 10,
    color: COLORS.textTertiary,
    fontWeight: FONT_WEIGHTS.medium,
  },
  progressBarBg: {
    width: 40,
    height: 3,
    borderRadius: 2,
    backgroundColor: COLORS.divider,
  },
  progressBarFill: {
    height: 3,
    borderRadius: 2,
  },
});

export default FarmMapScreen;
