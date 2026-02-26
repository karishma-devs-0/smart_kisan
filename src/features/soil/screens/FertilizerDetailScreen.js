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
import { fetchFertilizerHistory } from '../slice/soilSlice';

const MOCK_FERTILIZER_HISTORY = [
  { label: 'Mon', n: 42, p: 28, k: 22 },
  { label: 'Tue', n: 45, p: 30, k: 25 },
  { label: 'Wed', n: 48, p: 32, k: 20 },
  { label: 'Thu', n: 40, p: 27, k: 28 },
  { label: 'Fri', n: 45, p: 30, k: 25 },
  { label: 'Sat', n: 50, p: 35, k: 23 },
  { label: 'Sun', n: 44, p: 29, k: 26 },
];

const NPK_DATA = [
  { label: 'Nitrogen (N)', value: 45, color: COLORS.chartNPK_N, icon: 'leaf' },
  { label: 'Phosphorus (P)', value: 30, color: COLORS.chartNPK_P, icon: 'flask' },
  { label: 'Potassium (K)', value: 25, color: COLORS.chartNPK_K, icon: 'atom' },
];

const FertilizerDetailScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const soil = useSelector((state) => state.soil);
  const fertilizerHistory = soil.fertilizerHistory?.length > 0
    ? soil.fertilizerHistory
    : MOCK_FERTILIZER_HISTORY;
  const [activeTab, setActiveTab] = useState('Daily');
  const [selectedView, setSelectedView] = useState('NPK Overview');

  const currentN = soil.current?.nitrogen || 45;
  const currentP = soil.current?.phosphorus || 30;
  const currentK = soil.current?.potassium || 25;

  useEffect(() => {
    dispatch(fetchFertilizerHistory());
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
        <Text style={styles.title}>Fertilizer Details</Text>
      </View>

      {/* Crop Selector */}
      <View style={styles.viewSelector}>
        <TouchableOpacity
          style={[
            styles.viewTab,
            selectedView === 'Fertilizer K' && styles.viewTabActive,
          ]}
          onPress={() => setSelectedView('Fertilizer K')}
        >
          <Text
            style={[
              styles.viewTabText,
              selectedView === 'Fertilizer K' && styles.viewTabTextActive,
            ]}
          >
            Fertilizer K
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.viewTab,
            selectedView === 'NPK Overview' && styles.viewTabActive,
          ]}
          onPress={() => setSelectedView('NPK Overview')}
        >
          <Text
            style={[
              styles.viewTabText,
              selectedView === 'NPK Overview' && styles.viewTabTextActive,
            ]}
          >
            NPK Overview
          </Text>
        </TouchableOpacity>
      </View>

      {/* NPK Concentration */}
      <View style={styles.npkCard}>
        <Text style={styles.cardTitle}>NPK Concentration</Text>
        <Text style={styles.cardSubtitle}>Current nutrient levels in soil</Text>

        {NPK_DATA.map((nutrient, index) => (
          <View key={index} style={styles.npkItem}>
            <View style={styles.npkLabelRow}>
              <View style={styles.npkIconContainer}>
                <MaterialCommunityIcons name={nutrient.icon} size={18} color={nutrient.color} />
              </View>
              <Text style={styles.npkLabel}>{nutrient.label}</Text>
              <Text style={[styles.npkPercent, { color: nutrient.color }]}>{nutrient.value}%</Text>
            </View>
            <View style={styles.npkBarOuter}>
              <View
                style={[
                  styles.npkBarFill,
                  { width: `${nutrient.value}%`, backgroundColor: nutrient.color },
                ]}
              />
            </View>
          </View>
        ))}
      </View>

      {/* Chart Section */}
      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>Fertilizer level graph</Text>
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

        {/* Grouped Bar Chart */}
        <View style={styles.chartArea}>
          <View style={styles.chartPlaceholder}>
            {fertilizerHistory.map((point, index) => (
              <View key={index} style={styles.chartBarGroup}>
                <View style={styles.chartBarsRow}>
                  <View
                    style={[
                      styles.chartBar,
                      {
                        height: `${point.n}%`,
                        backgroundColor: COLORS.chartNPK_N + '80',
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.chartBar,
                      {
                        height: `${point.p}%`,
                        backgroundColor: COLORS.chartNPK_P + '80',
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.chartBar,
                      {
                        height: `${point.k}%`,
                        backgroundColor: COLORS.chartNPK_K + '80',
                      },
                    ]}
                  />
                </View>
                <Text style={styles.chartBarLabel}>{point.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Legend */}
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.chartNPK_N }]} />
            <Text style={styles.legendText}>N</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.chartNPK_P }]} />
            <Text style={styles.legendText}>P</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.chartNPK_K }]} />
            <Text style={styles.legendText}>K</Text>
          </View>
        </View>
      </View>

      {/* Stats Row */}
      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>Recommended vs Actual</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>N (Rec.)</Text>
            <Text style={[styles.statValue, { color: COLORS.chartNPK_N }]}>40-50%</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>N (Act.)</Text>
            <Text style={[styles.statValue, { color: COLORS.chartNPK_N }]}>{currentN}%</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>P (Rec.)</Text>
            <Text style={[styles.statValue, { color: COLORS.chartNPK_P }]}>25-35%</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>P (Act.)</Text>
            <Text style={[styles.statValue, { color: COLORS.chartNPK_P }]}>{currentP}%</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>K (Rec.)</Text>
            <Text style={[styles.statValue, { color: COLORS.chartNPK_K }]}>20-30%</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>K (Act.)</Text>
            <Text style={[styles.statValue, { color: COLORS.chartNPK_K }]}>{currentK}%</Text>
          </View>
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
  viewSelector: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.full,
    padding: SPACING.xs,
    marginBottom: SPACING.xl,
  },
  viewTab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    alignItems: 'center',
  },
  viewTabActive: {
    backgroundColor: COLORS.primary,
  },
  viewTabText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHTS.medium,
  },
  viewTabTextActive: {
    color: COLORS.white,
  },
  npkCard: {
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
  cardSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
  },
  npkItem: {
    marginBottom: SPACING.lg,
  },
  npkLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  npkIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  npkLabel: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHTS.medium,
  },
  npkPercent: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
  },
  npkBarOuter: {
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.background,
    overflow: 'hidden',
  },
  npkBarFill: {
    height: '100%',
    borderRadius: 4,
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
    paddingHorizontal: SPACING.xs,
  },
  chartBarGroup: {
    alignItems: 'center',
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
  },
  chartBarsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },
  chartBar: {
    width: 8,
    borderRadius: 2,
    minHeight: 4,
  },
  chartBarLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.xl,
    marginTop: SPACING.lg,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  statsCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
  },
  statsTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  statItem: {
    width: '46%',
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.md,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  statValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
  },
});

export default FertilizerDetailScreen;
