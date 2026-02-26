import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { COLORS } from '../../../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../../constants/typography';
import { SPACING } from '../../../constants/spacing';
import { BORDER_RADIUS, SHADOWS } from '../../../constants/layout';
import { fetchReports } from '../slice/reportsSlice';

const ComprehensiveReportScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const reports = useSelector((s) => s.reports);

  useEffect(() => { dispatch(fetchReports()); }, [dispatch]);

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.titlePrefix}>The</Text>
        <Text style={styles.titleText}> Report</Text>
      </View>
      <Text style={styles.period}>Last 30 Days</Text>
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <MaterialCommunityIcons name="water" size={24} color={COLORS.info} />
          <Text style={styles.statValue}>1,485</Text>
          <Text style={styles.statUnit}>Liters</Text>
          <Text style={styles.statLabel}>Water Usage</Text>
        </View>
        <View style={styles.statCard}>
          <MaterialCommunityIcons name="clock-outline" size={24} color={COLORS.primary} />
          <Text style={styles.statValue}>2,600</Text>
          <Text style={styles.statUnit}>Hours</Text>
          <Text style={styles.statLabel}>Run Hours</Text>
        </View>
      </View>
      {/* Chart */}
      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>Water Usage Trend</Text>
          <View style={styles.chartTabs}>
            <TouchableOpacity style={styles.tabActive}><Text style={styles.tabTextActive}>Daily</Text></TouchableOpacity>
            <TouchableOpacity style={styles.tab}><Text style={styles.tabText}>Average</Text></TouchableOpacity>
          </View>
        </View>
        <View style={styles.chartArea}>
          {[180, 220, 195, 210, 240, 200, 230].map((v, i) => (
            <View key={i} style={[styles.chartBar, { height: `${(v / 250) * 100}%` }]} />
          ))}
        </View>
      </View>
      {/* Detailed Reports */}
      <Text style={styles.sectionTitle}>Detailed Reports</Text>
      <TouchableOpacity style={styles.reportRow} onPress={() => navigation.navigate('MetricReports')}>
        <MaterialCommunityIcons name="chart-bar" size={22} color={COLORS.primary} />
        <Text style={styles.reportLabel}>Pump Performance Analysis</Text>
        <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.textTertiary} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.reportRow} onPress={() => navigation.navigate('TrendReports')}>
        <MaterialCommunityIcons name="chart-line" size={22} color={COLORS.info} />
        <Text style={styles.reportLabel}>Water Consumption Details</Text>
        <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.textTertiary} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.reportRow} onPress={() => navigation.navigate('SoilHarvestReport')}>
        <MaterialCommunityIcons name="leaf" size={22} color={COLORS.success} />
        <Text style={styles.reportLabel}>Soil & Harvest Report</Text>
        <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.textTertiary} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.exportBtn}>
        <MaterialCommunityIcons name="download" size={20} color={COLORS.white} />
        <Text style={styles.exportText}>Export Reports</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  content: { padding: SPACING.lg, paddingBottom: SPACING.xxxxl },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.xs },
  backBtn: { marginRight: SPACING.md, padding: SPACING.xs },
  titlePrefix: { fontSize: FONT_SIZES.xxl, fontWeight: FONT_WEIGHTS.bold, color: COLORS.primary },
  titleText: { fontSize: FONT_SIZES.xxl, fontWeight: FONT_WEIGHTS.bold, color: COLORS.textPrimary },
  period: { fontSize: FONT_SIZES.sm, color: COLORS.textTertiary, marginBottom: SPACING.xl },
  statsRow: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.xl },
  statCard: { flex: 1, backgroundColor: COLORS.background, borderRadius: BORDER_RADIUS.lg, padding: SPACING.lg, alignItems: 'center', gap: SPACING.xs },
  statValue: { fontSize: FONT_SIZES.xxxl, fontWeight: FONT_WEIGHTS.bold, color: COLORS.textPrimary },
  statUnit: { fontSize: FONT_SIZES.sm, color: COLORS.textTertiary, marginTop: -4 },
  statLabel: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
  chartCard: { backgroundColor: COLORS.background, borderRadius: BORDER_RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.xl },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg },
  chartTitle: { fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.textPrimary },
  chartTabs: { flexDirection: 'row', gap: SPACING.sm },
  tab: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: BORDER_RADIUS.full },
  tabActive: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: BORDER_RADIUS.full, backgroundColor: COLORS.primary },
  tabText: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
  tabTextActive: { fontSize: FONT_SIZES.sm, color: COLORS.white, fontWeight: FONT_WEIGHTS.medium },
  chartArea: { height: 120, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around' },
  chartBar: { width: 28, borderRadius: 4, backgroundColor: COLORS.primary + '60' },
  sectionTitle: { fontSize: FONT_SIZES.lg, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.textPrimary, marginBottom: SPACING.md },
  reportRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background, borderRadius: BORDER_RADIUS.md, padding: SPACING.lg, marginBottom: SPACING.md, gap: SPACING.md },
  reportLabel: { flex: 1, fontSize: FONT_SIZES.md, color: COLORS.textPrimary },
  exportBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.md, paddingVertical: SPACING.lg, marginTop: SPACING.xl, gap: SPACING.sm },
  exportText: { fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.white },
});

export default ComprehensiveReportScreen;
