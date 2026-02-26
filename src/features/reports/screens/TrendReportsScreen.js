import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../../constants/typography';
import { SPACING } from '../../../constants/spacing';
import { BORDER_RADIUS } from '../../../constants/layout';

const TrendReportsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [timeRange, setTimeRange] = useState('daily');

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}><MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textPrimary} /></TouchableOpacity>
        <Text style={styles.titlePrefix}>Only</Text><Text style={styles.titleText}> Reports</Text>
      </View>
      <View style={styles.tabRow}>
        {['daily', 'weekly', 'monthly'].map((t) => (
          <TouchableOpacity key={t} style={[styles.tab, timeRange === t && styles.tabActive]} onPress={() => setTimeRange(t)}>
            <Text style={[styles.tabText, timeRange === t && styles.tabTextActive]}>{t.charAt(0).toUpperCase() + t.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.sectionTitle}>Pump Runtime</Text>
      <View style={styles.chartCard}>
        <View style={styles.chartArea}>
          {[6, 8, 7.5, 9, 8.5, 7, 8].map((v, i) => (
            <View key={i} style={styles.chartColumn}>
              <View style={[styles.chartBar, { height: `${(v / 10) * 100}%` }]} />
              <Text style={styles.chartLabel}>{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}</Text>
            </View>
          ))}
        </View>
      </View>
      <Text style={styles.sectionTitle}>Water Usage Trend</Text>
      <View style={styles.chartCard}>
        <View style={styles.chartArea}>
          {[200, 250, 220, 280, 240, 210, 260].map((v, i) => (
            <View key={i} style={styles.chartColumn}>
              <View style={[styles.chartBarBlue, { height: `${(v / 300) * 100}%` }]} />
              <Text style={styles.chartLabel}>{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}</Text>
            </View>
          ))}
        </View>
      </View>
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
  tabRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.xl },
  tab: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.full, backgroundColor: COLORS.background },
  tabActive: { backgroundColor: COLORS.primary },
  tabText: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, fontWeight: FONT_WEIGHTS.medium },
  tabTextActive: { color: COLORS.white },
  sectionTitle: { fontSize: FONT_SIZES.lg, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.textPrimary, marginBottom: SPACING.md },
  chartCard: { backgroundColor: COLORS.background, borderRadius: BORDER_RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.xxl },
  chartArea: { height: 140, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around' },
  chartColumn: { alignItems: 'center', flex: 1 },
  chartBar: { width: 24, borderRadius: 4, backgroundColor: COLORS.primary + '60', marginBottom: 4 },
  chartBarBlue: { width: 24, borderRadius: 4, backgroundColor: COLORS.info + '60', marginBottom: 4 },
  chartLabel: { fontSize: FONT_SIZES.xs, color: COLORS.textTertiary },
});

export default TrendReportsScreen;
