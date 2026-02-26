import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../../constants/typography';
import { SPACING } from '../../../constants/spacing';
import { BORDER_RADIUS } from '../../../constants/layout';

const WindDetailScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.titlePrefix}>The</Text>
        <Text style={styles.titleText}> Weather</Text>
      </View>
      <Text style={styles.subtitle}>Wind Speed</Text>
      <Text style={styles.location}>Nagpur, Maharashtra · Today</Text>
      <View style={styles.bigValueCard}>
        <MaterialCommunityIcons name="weather-windy" size={40} color={COLORS.textSecondary} />
        <Text style={styles.bigValue}>13 km/h</Text>
        <Text style={styles.bigLabel}>Current Wind Speed</Text>
      </View>
      {/* Chart */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Wind Speed Over Time</Text>
        <View style={styles.chartArea}>
          {[8, 10, 13, 15, 12, 11, 9, 13, 14, 12, 10, 8].map((v, i) => (
            <View key={i} style={[styles.chartBar, { height: `${(v / 20) * 100}%` }]} />
          ))}
        </View>
      </View>
      {/* Stats */}
      <View style={styles.statsGrid}>
        <View style={styles.statRow}><MaterialCommunityIcons name="compass" size={20} color={COLORS.textSecondary} /><Text style={styles.statLabel}>Wind Direction</Text><Text style={styles.statValue}>East</Text></View>
        <View style={styles.statRow}><MaterialCommunityIcons name="water-percent" size={20} color={COLORS.info} /><Text style={styles.statLabel}>Humidity</Text><Text style={styles.statValue}>71%</Text></View>
        <View style={styles.statRow}><MaterialCommunityIcons name="thermometer" size={20} color={COLORS.warning} /><Text style={styles.statLabel}>Temperature</Text><Text style={styles.statValue}>40°C</Text></View>
        <View style={styles.statRow}><MaterialCommunityIcons name="weather-windy" size={20} color={COLORS.textSecondary} /><Text style={styles.statLabel}>Wind Speed</Text><Text style={styles.statValue}>13km/h</Text></View>
      </View>
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
  subtitle: { fontSize: FONT_SIZES.lg, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.textPrimary, marginBottom: SPACING.xs },
  location: { fontSize: FONT_SIZES.sm, color: COLORS.textTertiary, marginBottom: SPACING.xl },
  bigValueCard: { alignItems: 'center', backgroundColor: COLORS.background, borderRadius: BORDER_RADIUS.lg, padding: SPACING.xxxl, marginBottom: SPACING.xl, gap: SPACING.md },
  bigValue: { fontSize: FONT_SIZES.display, fontWeight: FONT_WEIGHTS.bold, color: COLORS.textPrimary },
  bigLabel: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary },
  chartCard: { backgroundColor: COLORS.background, borderRadius: BORDER_RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.xl },
  chartTitle: { fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.textPrimary, marginBottom: SPACING.md },
  chartArea: { height: 120, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around' },
  chartBar: { width: 16, borderRadius: 4, backgroundColor: COLORS.primary + '50' },
  statsGrid: { backgroundColor: COLORS.background, borderRadius: BORDER_RADIUS.lg, overflow: 'hidden' },
  statRow: { flexDirection: 'row', alignItems: 'center', padding: SPACING.lg, borderBottomWidth: 1, borderBottomColor: COLORS.divider, gap: SPACING.md },
  statLabel: { flex: 1, fontSize: FONT_SIZES.md, color: COLORS.textPrimary },
  statValue: { fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.textPrimary },
});

export default WindDetailScreen;
