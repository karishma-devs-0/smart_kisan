import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { COLORS } from '../../../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../../constants/typography';
import { SPACING } from '../../../constants/spacing';
import { BORDER_RADIUS } from '../../../constants/layout';

const metrics = [
  { label: 'Water Consumption', value: '2,450', unit: 'L', change: -5, icon: 'water', color: COLORS.info },
  { label: 'Total Run Hours', value: '156', unit: 'hrs', change: 8, icon: 'clock-outline', color: COLORS.primary },
  { label: 'Pump Runtime', value: '8.5', unit: 'hrs/day', change: -2, icon: 'water-pump', color: COLORS.success },
  { label: 'Mixing Ratio', value: '85', unit: '%', change: 3, icon: 'flask', color: COLORS.warning },
];

const MetricReportsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}><MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textPrimary} /></TouchableOpacity>
        <Text style={styles.titlePrefix}>Only</Text><Text style={styles.titleText}> Reports</Text>
      </View>
      <Text style={styles.sectionTitle}>General Metrics</Text>
      <View style={styles.grid}>
        {metrics.map((m, i) => (
          <View key={i} style={styles.metricCard}>
            <MaterialCommunityIcons name={m.icon} size={24} color={m.color} />
            <Text style={styles.metricValue}>{m.value}</Text>
            <Text style={styles.metricUnit}>{m.unit}</Text>
            <Text style={styles.metricLabel}>{m.label}</Text>
            <View style={[styles.changeBadge, { backgroundColor: m.change >= 0 ? COLORS.success + '20' : COLORS.danger + '20' }]}>
              <MaterialCommunityIcons name={m.change >= 0 ? 'arrow-up' : 'arrow-down'} size={12} color={m.change >= 0 ? COLORS.success : COLORS.danger} />
              <Text style={[styles.changeText, { color: m.change >= 0 ? COLORS.success : COLORS.danger }]}>{Math.abs(m.change)}%</Text>
            </View>
          </View>
        ))}
      </View>
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
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.xl },
  backBtn: { marginRight: SPACING.md, padding: SPACING.xs },
  titlePrefix: { fontSize: FONT_SIZES.xxl, fontWeight: FONT_WEIGHTS.bold, color: COLORS.primary },
  titleText: { fontSize: FONT_SIZES.xxl, fontWeight: FONT_WEIGHTS.bold, color: COLORS.textPrimary },
  sectionTitle: { fontSize: FONT_SIZES.lg, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.textPrimary, marginBottom: SPACING.lg },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md },
  metricCard: { width: '47%', backgroundColor: COLORS.background, borderRadius: BORDER_RADIUS.lg, padding: SPACING.lg, alignItems: 'center', gap: SPACING.xs },
  metricValue: { fontSize: FONT_SIZES.xxl, fontWeight: FONT_WEIGHTS.bold, color: COLORS.textPrimary },
  metricUnit: { fontSize: FONT_SIZES.sm, color: COLORS.textTertiary, marginTop: -4 },
  metricLabel: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, textAlign: 'center' },
  changeBadge: { flexDirection: 'row', alignItems: 'center', borderRadius: BORDER_RADIUS.full, paddingHorizontal: SPACING.sm, paddingVertical: 2, gap: 2 },
  changeText: { fontSize: FONT_SIZES.xs, fontWeight: FONT_WEIGHTS.semiBold },
  exportBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.md, paddingVertical: SPACING.lg, marginTop: SPACING.xxl, gap: SPACING.sm },
  exportText: { fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.white },
});

export default MetricReportsScreen;
