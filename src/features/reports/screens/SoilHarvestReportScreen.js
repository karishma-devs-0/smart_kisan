import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../../constants/typography';
import { SPACING } from '../../../constants/spacing';
import { BORDER_RADIUS } from '../../../constants/layout';

const SoilHarvestReportScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}><MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textPrimary} /></TouchableOpacity>
        <Text style={styles.titlePrefix}>The</Text><Text style={styles.titleText}> Report</Text>
      </View>
      <Text style={styles.sectionTitle}>Soil Condition Analysis</Text>
      <View style={styles.card}>
        {[{ label: 'Overall', value: 'Good', color: COLORS.success }, { label: 'Moisture', value: 'Adequate', color: COLORS.info }, { label: 'pH Level', value: 'Optimal', color: COLORS.success }, { label: 'Nutrients', value: 'Moderate', color: COLORS.warning }].map((item, i) => (
          <View key={i} style={styles.condRow}><Text style={styles.condLabel}>{item.label}</Text><View style={[styles.condBadge, { backgroundColor: item.color + '20' }]}><Text style={[styles.condValue, { color: item.color }]}>{item.value}</Text></View></View>
        ))}
      </View>
      <Text style={styles.sectionTitle}>Harvest Performance</Text>
      <View style={styles.card}>
        <View style={styles.harvestRow}><Text style={styles.harvestLabel}>Estimated Yield</Text><Text style={styles.harvestValue}>2,400 kg</Text></View>
        <View style={styles.harvestRow}><Text style={styles.harvestLabel}>Actual Yield</Text><Text style={styles.harvestValue}>2,200 kg</Text></View>
        <View style={styles.harvestRow}><Text style={styles.harvestLabel}>Efficiency</Text><Text style={[styles.harvestValue, { color: COLORS.success }]}>91.7%</Text></View>
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
  sectionTitle: { fontSize: FONT_SIZES.lg, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.textPrimary, marginBottom: SPACING.md },
  card: { backgroundColor: COLORS.background, borderRadius: BORDER_RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.xl },
  condRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  condLabel: { fontSize: FONT_SIZES.md, color: COLORS.textPrimary },
  condBadge: { borderRadius: BORDER_RADIUS.full, paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs },
  condValue: { fontSize: FONT_SIZES.sm, fontWeight: FONT_WEIGHTS.semiBold },
  harvestRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  harvestLabel: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary },
  harvestValue: { fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.bold, color: COLORS.textPrimary },
});

export default SoilHarvestReportScreen;
