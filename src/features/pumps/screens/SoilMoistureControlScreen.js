import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { COLORS } from '../../../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../../constants/typography';
import { SPACING } from '../../../constants/spacing';
import { BORDER_RADIUS } from '../../../constants/layout';

const SoilMoistureControlScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { pumpId } = route.params || {};
  const pump = useSelector((s) => s.pumps.pumps.find((p) => p.id === pumpId)) || { name: 'Pump 1', soilMoisture: 45 };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>{pump.name}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Moisture Gauge */}
        <View style={styles.gaugeCard}>
          <Text style={styles.cardTitle}>Soil Moisture Control</Text>
          <View style={styles.gaugeContainer}>
            <View style={styles.gaugeOuter}>
              <View style={styles.gaugeInner}>
                <Text style={styles.gaugeValue}>45%</Text>
              </View>
            </View>
          </View>
          <Text style={styles.modeText}>Stop Moisture at 60%</Text>
          <Text style={styles.modeSubtext}>Stop Mode: Auto Mode</Text>
        </View>
        {/* Moisture Chart */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Moisture over Time</Text>
            <View style={styles.chartTabs}>
              <TouchableOpacity style={styles.chartTabActive}><Text style={styles.chartTabTextActive}>Daily</Text></TouchableOpacity>
              <TouchableOpacity style={styles.chartTab}><Text style={styles.chartTabText}>Average</Text></TouchableOpacity>
            </View>
          </View>
          <View style={styles.chartArea}>
            {[42, 45, 48, 44, 41, 46, 45].map((val, i) => (
              <View key={i} style={[styles.chartBar, { height: `${val}%` }]} />
            ))}
          </View>
        </View>
        {/* Water Tank */}
        <View style={styles.tankCard}>
          <Text style={styles.cardTitle}>Water Tank Status</Text>
          <View style={styles.tankContainer}>
            <View style={styles.tank}>
              <View style={[styles.tankFill, { height: '78%' }]} />
              <Text style={styles.tankText}>780 Liters</Text>
            </View>
            <View style={styles.tankInfo}>
              <Text style={styles.tankLabel}>Capacity: 1000L</Text>
              <Text style={styles.tankLabel}>Fill Level: 78%</Text>
              <Text style={styles.tankLabel}>Status: Good</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: SPACING.lg },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md },
  title: { fontSize: FONT_SIZES.xxl, fontWeight: FONT_WEIGHTS.bold, color: COLORS.textPrimary },
  content: { padding: SPACING.lg, paddingBottom: SPACING.xxxxl },
  gaugeCard: { backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg, padding: SPACING.xl, alignItems: 'center', marginBottom: SPACING.lg },
  cardTitle: { fontSize: FONT_SIZES.lg, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.textPrimary, alignSelf: 'flex-start', marginBottom: SPACING.xl },
  gaugeContainer: { marginBottom: SPACING.xl },
  gaugeOuter: { width: 150, height: 150, borderRadius: 75, borderWidth: 10, borderColor: COLORS.chartMoisture + '30', alignItems: 'center', justifyContent: 'center' },
  gaugeInner: { width: 120, height: 120, borderRadius: 60, borderWidth: 10, borderColor: COLORS.chartMoisture, borderTopColor: 'transparent', alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '45deg' }] },
  gaugeValue: { fontSize: FONT_SIZES.xxxl, fontWeight: FONT_WEIGHTS.bold, color: COLORS.chartMoisture, transform: [{ rotate: '-45deg' }] },
  modeText: { fontSize: FONT_SIZES.md, color: COLORS.textPrimary, fontWeight: FONT_WEIGHTS.medium },
  modeSubtext: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: 4 },
  chartCard: { backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg, padding: SPACING.xl, marginBottom: SPACING.lg },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg },
  chartTitle: { fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.textPrimary },
  chartTabs: { flexDirection: 'row', gap: SPACING.sm },
  chartTab: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: BORDER_RADIUS.full },
  chartTabActive: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: BORDER_RADIUS.full, backgroundColor: COLORS.primary },
  chartTabText: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
  chartTabTextActive: { fontSize: FONT_SIZES.sm, color: COLORS.white, fontWeight: FONT_WEIGHTS.medium },
  chartArea: { height: 120, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around' },
  chartBar: { width: 28, borderRadius: 4, backgroundColor: COLORS.chartMoisture + '60' },
  tankCard: { backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg, padding: SPACING.xl },
  tankContainer: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xxl },
  tank: { width: 80, height: 120, borderRadius: BORDER_RADIUS.md, borderWidth: 2, borderColor: COLORS.info + '50', overflow: 'hidden', justifyContent: 'flex-end', alignItems: 'center' },
  tankFill: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: COLORS.info + '40' },
  tankText: { position: 'absolute', top: '40%', fontSize: FONT_SIZES.sm, fontWeight: FONT_WEIGHTS.bold, color: COLORS.info },
  tankInfo: { flex: 1, gap: SPACING.sm },
  tankLabel: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary },
});

export default SoilMoistureControlScreen;
