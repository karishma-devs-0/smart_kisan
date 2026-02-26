import React, { useState, useEffect } from 'react';
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
import { BORDER_RADIUS } from '../../../constants/layout';
import { fetchPhHistory } from '../slice/soilSlice';

const MOCK_PH_HISTORY = [
  { label: 'Mon', value: 6.2 },
  { label: 'Tue', value: 6.5 },
  { label: 'Wed', value: 6.8 },
  { label: 'Thu', value: 6.3 },
  { label: 'Fri', value: 6.5 },
  { label: 'Sat', value: 6.7 },
  { label: 'Sun', value: 6.4 },
];

const PhDetailScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const soil = useSelector((state) => state.soil);
  const phHistory = soil.phHistory?.length > 0 ? soil.phHistory : MOCK_PH_HISTORY;
  const currentPh = soil.current?.pH || 6.5;
  const [activeTab, setActiveTab] = useState('Daily');

  useEffect(() => {
    dispatch(fetchPhHistory());
  }, [dispatch]);

  const phPosition = (currentPh / 14) * 100;

  const getPhColor = (ph) => {
    if (ph < 4) return '#F44336';
    if (ph < 6) return '#FF9800';
    if (ph <= 7) return '#4CAF50';
    if (ph <= 8) return '#2196F3';
    return '#9C27B0';
  };

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>pH Details</Text>
      </View>

      {/* Crop indicator */}
      <View style={styles.cropTag}>
        <MaterialCommunityIcons name="sprout" size={16} color={COLORS.primaryLight} />
        <Text style={styles.cropName}>Bell Pepper</Text>
      </View>

      {/* pH Level Card */}
      <View style={styles.phCard}>
        <Text style={styles.cardTitle}>Soil pH</Text>
        <View style={styles.phValueRow}>
          <Text style={styles.phValue}>{currentPh}</Text>
          <Text style={styles.phUnit}> mol/L</Text>
        </View>
        <Text style={styles.phDescription}>
          Recommended pH for most crops: 6.0-7.0
        </Text>

        {/* pH Level Bar */}
        <View style={styles.phBarContainer}>
          <View style={styles.phBar}>
            <View style={[styles.phSegment, { flex: 1, backgroundColor: '#F44336' }]} />
            <View style={[styles.phSegment, { flex: 1, backgroundColor: '#FF5722' }]} />
            <View style={[styles.phSegment, { flex: 1, backgroundColor: '#FF9800' }]} />
            <View style={[styles.phSegment, { flex: 1, backgroundColor: '#FFC107' }]} />
            <View style={[styles.phSegment, { flex: 1, backgroundColor: '#CDDC39' }]} />
            <View style={[styles.phSegment, { flex: 1, backgroundColor: '#4CAF50' }]} />
            <View style={[styles.phSegment, { flex: 1, backgroundColor: '#009688' }]} />
            <View style={[styles.phSegment, { flex: 1, backgroundColor: '#00BCD4' }]} />
            <View style={[styles.phSegment, { flex: 1, backgroundColor: '#2196F3' }]} />
            <View style={[styles.phSegment, { flex: 1, backgroundColor: '#3F51B5' }]} />
            <View style={[styles.phSegment, { flex: 1, backgroundColor: '#673AB7' }]} />
            <View style={[styles.phSegment, { flex: 1, backgroundColor: '#9C27B0' }]} />
            <View style={[styles.phSegment, { flex: 1, backgroundColor: '#E91E63' }]} />
            <View style={[styles.phSegment, { flex: 1, backgroundColor: '#880E4F' }]} />
          </View>
          {/* Marker */}
          <View style={[styles.phMarker, { left: `${phPosition}%` }]}>
            <View style={styles.phMarkerTriangle} />
            <Text style={styles.phMarkerText}>{currentPh}</Text>
          </View>
        </View>
        <View style={styles.phBarLabels}>
          <Text style={styles.phBarLabel}>0</Text>
          <Text style={styles.phBarLabel}>Acidic</Text>
          <Text style={styles.phBarLabel}>7</Text>
          <Text style={styles.phBarLabel}>Alkaline</Text>
          <Text style={styles.phBarLabel}>14</Text>
        </View>
      </View>

      {/* Chart Section */}
      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>pH graph over time</Text>
          <View style={styles.chartTabs}>
            <TouchableOpacity
              style={activeTab === 'Daily' ? styles.chartTabActive : styles.chartTab}
              onPress={() => setActiveTab('Daily')}
            >
              <Text style={activeTab === 'Daily' ? styles.chartTabTextActive : styles.chartTabText}>
                Daily
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={activeTab === 'Average' ? styles.chartTabActive : styles.chartTab}
              onPress={() => setActiveTab('Average')}
            >
              <Text style={activeTab === 'Average' ? styles.chartTabTextActive : styles.chartTabText}>
                Average
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bar Chart */}
        <View style={styles.chartArea}>
          <View style={styles.chartPlaceholder}>
            {phHistory.map((point, index) => (
              <View key={index} style={styles.chartBarWrapper}>
                <View
                  style={[
                    styles.chartBar,
                    {
                      height: `${(point.value / 14) * 100}%`,
                      backgroundColor: getPhColor(point.value),
                    },
                  ]}
                />
                <Text style={styles.chartBarLabel}>{point.label}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Soil Image Placeholder */}
      <View style={styles.soilImageCard}>
        <View style={styles.soilImagePlaceholder}>
          <MaterialCommunityIcons name="sprout" size={48} color={COLORS.primaryLight} />
          <Text style={styles.soilImageText}>Soil Sample</Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Average</Text>
          <Text style={styles.statValue}>6.5</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Min</Text>
          <Text style={styles.statValue}>6.2</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Max</Text>
          <Text style={styles.statValue}>6.8</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  backButton: {
    marginRight: SPACING.md,
    padding: SPACING.xs,
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
  },
  cropTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  cropName: {
    fontSize: FONT_SIZES.md,
    color: COLORS.primaryLight,
    fontWeight: FONT_WEIGHTS.medium,
  },
  phCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    marginBottom: SPACING.xl,
  },
  cardTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  phValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: SPACING.sm,
  },
  phValue: {
    fontSize: FONT_SIZES.display,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.chartPH,
  },
  phUnit: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  phDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xxl,
  },
  phBarContainer: {
    marginBottom: SPACING.sm,
    position: 'relative',
    paddingTop: SPACING.xxl,
  },
  phBar: {
    flexDirection: 'row',
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
  },
  phSegment: {
    height: '100%',
  },
  phMarker: {
    position: 'absolute',
    top: 0,
    alignItems: 'center',
    marginLeft: -12,
  },
  phMarkerTriangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: COLORS.textPrimary,
  },
  phMarkerText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHTS.bold,
    marginBottom: 2,
  },
  phBarLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.xs,
  },
  phBarLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  chartCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    marginBottom: SPACING.xl,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  chartTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textPrimary,
  },
  chartTabs: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  chartTab: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  chartTabActive: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primary,
  },
  chartTabText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  chartTabTextActive: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.white,
    fontWeight: FONT_WEIGHTS.medium,
  },
  chartArea: {
    height: 160,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  chartPlaceholder: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    paddingHorizontal: SPACING.sm,
  },
  chartBarWrapper: {
    alignItems: 'center',
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
  },
  chartBar: {
    width: 24,
    borderRadius: 4,
    minHeight: 8,
  },
  chartBarLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  soilImageCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    marginBottom: SPACING.xl,
    alignItems: 'center',
  },
  soilImagePlaceholder: {
    width: '100%',
    height: 140,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  soilImageText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  statValue: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.chartPH,
  },
});

export default PhDetailScreen;
