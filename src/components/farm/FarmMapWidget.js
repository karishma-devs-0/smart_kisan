import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { WebView } from 'react-native-webview';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../constants/typography';
import { SPACING } from '../../constants/spacing';
import { BORDER_RADIUS } from '../../constants/layout';
import { generateMapHTML } from '../../utils/leafletMap';

const CANVAS_HEIGHT = 180;

const FarmMapWidget = ({ fields = [], devices = [], onPress }) => {
  const onlineCount = devices.filter((d) => d.status === 'online').length;
  const offlineCount = devices.filter((d) => d.status === 'offline').length;

  const mapHTML = useMemo(() => {
    if (!fields.length && !devices.length) return null;
    return generateMapHTML({ fields, devices, interactive: false, zoom: 14 });
  }, [fields, devices]);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialCommunityIcons name="map-outline" size={20} color={COLORS.primaryLight} />
          <Text style={styles.title}>My Farm</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.viewText}>View Map</Text>
          <MaterialCommunityIcons name="chevron-right" size={18} color={COLORS.primaryLight} />
        </View>
      </View>

      {/* Map Preview */}
      <View style={styles.mapPreview}>
        {mapHTML ? (
          <WebView
            source={{ html: mapHTML }}
            style={styles.webview}
            scrollEnabled={false}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            originWhitelist={['*']}
            pointerEvents="none"
          />
        ) : (
          <View style={styles.mapPlaceholder}>
            <MaterialCommunityIcons name="map-search" size={32} color={COLORS.textTertiary} />
          </View>
        )}
        {/* Tap overlay to prevent WebView from stealing touches */}
        <View style={styles.tapOverlay} />
      </View>

      {/* Summary Row */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <MaterialCommunityIcons name="vector-square" size={14} color={COLORS.primaryLight} />
          <Text style={styles.summaryText}>{fields.length} Fields</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <View style={[styles.statusDot, { backgroundColor: COLORS.success }]} />
          <Text style={styles.summaryText}>{onlineCount} Online</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <View style={[styles.statusDot, { backgroundColor: COLORS.danger }]} />
          <Text style={styles.summaryText}>{offlineCount} Offline</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  title: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textPrimary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primaryLight,
    fontWeight: FONT_WEIGHTS.medium,
  },
  mapPreview: {
    height: CANVAS_HEIGHT,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    marginBottom: SPACING.md,
  },
  webview: {
    flex: 1,
  },
  mapPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.divider,
  },
  tapOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  summaryText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHTS.medium,
  },
  summaryDivider: {
    width: 1,
    height: 12,
    backgroundColor: COLORS.divider,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

export default FarmMapWidget;
