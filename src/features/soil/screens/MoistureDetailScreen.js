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
import { BORDER_RADIUS } from '../../../constants/layout';
import { fetchMoistureHistory } from '../slice/soilSlice';

const MoistureDetailScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const soil = useSelector((state) => state.soil);
  const moistureHistory = soil.moistureHistory || [];
  const currentMoisture = soil.current?.moisture || 45;

  useEffect(() => {
    dispatch(fetchMoistureHistory());
  }, [dispatch]);

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
        <Text style={styles.title}>Moisture Details</Text>
      </View>

      {/* Crop indicator */}
      <View style={styles.cropTag}>
        <MaterialCommunityIcons name="sprout" size={16} color={COLORS.primaryLight} />
        <Text style={styles.cropName}>Bell Pepper</Text>
      </View>

      {/* Soil Moisture Content */}
      <View style={styles.moistureCard}>
        <Text style={styles.cardTitle}>Soil Moisture Content</Text>
        <Text style={styles.moistureSubtitle}>Current level 50%</Text>
        <View style={styles.gaugeContainer}>
          <View style={styles.gaugeOuter}>
            <View style={[styles.gaugeFill, { width: `${currentMoisture}%` }]} />
          </View>
          <Text style={styles.gaugeText}>{currentMoisture}%</Text>
        </View>
        <View style={styles.gaugeLabels}>
          <Text style={styles.gaugeLabelLow}>0%</Text>
          <Text style={styles.gaugeLabelHigh}>100%</Text>
        </View>
      </View>

      {/* Chart Placeholder */}
      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>Moisture over Time</Text>
          <View style={styles.chartTabs}>
            <TouchableOpacity style={styles.chartTabActive}>
              <Text style={styles.chartTabTextActive}>Daily</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.chartTab}>
              <Text style={styles.chartTabText}>Average</Text>
            </TouchableOpacity>
          </View>
        </View>
        {/* Chart area */}
        <View style={styles.chartArea}>
          {moistureHistory.length > 0 ? (
            <View style={styles.chartPlaceholder}>
              {moistureHistory.map((point, index) => (
                <View
                  key={index}
                  style={[
                    styles.chartBar,
                    {
                      height: `${point.value}%`,
                      backgroundColor: COLORS.chartMoisture + '80',
                    },
                  ]}
                />
              ))}
            </View>
          ) : (
            <View style={styles.chartEmpty}>
              <MaterialCommunityIcons name="chart-line" size={48} color={COLORS.textSecondary} />
              <Text style={styles.chartEmptyText}>Loading chart data...</Text>
            </View>
          )}
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Average</Text>
          <Text style={styles.statValue}>47%</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Min</Text>
          <Text style={styles.statValue}>38%</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Max</Text>
          <Text style={styles.statValue}>55%</Text>
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
  moistureCard: {
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
  moistureSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
  },
  gaugeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  gaugeOuter: {
    flex: 1,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.background,
    overflow: 'hidden',
  },
  gaugeFill: {
    height: '100%',
    borderRadius: 6,
    backgroundColor: COLORS.chartMoisture,
  },
  gaugeText: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.chartMoisture,
    minWidth: 50,
    textAlign: 'right',
  },
  gaugeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.xs,
  },
  gaugeLabelLow: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  gaugeLabelHigh: {
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
  chartBar: {
    width: 30,
    borderRadius: 4,
    minHeight: 8,
  },
  chartEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartEmptyText: {
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
    color: COLORS.chartMoisture,
  },
});

export default MoistureDetailScreen;
