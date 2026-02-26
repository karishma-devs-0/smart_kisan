import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { COLORS } from '../../../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../../constants/typography';
import { SPACING } from '../../../constants/spacing';
import { BORDER_RADIUS } from '../../../constants/layout';

const SensorBasedScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { pumpId } = route.params || {};
  const pump = useSelector((s) => s.pumps.pumps.find((p) => p.id === pumpId)) || { name: 'Pump 1' };
  const [moistureEnabled, setMoistureEnabled] = useState(true);
  const [waterLevelEnabled, setWaterLevelEnabled] = useState(false);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>{pump.name}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Sensor-Based Control</Text>
        {/* Soil Moisture Control */}
        <View style={styles.sensorCard}>
          <View style={styles.sensorHeader}>
            <MaterialCommunityIcons name="water-percent" size={24} color={COLORS.chartMoisture} />
            <View style={styles.sensorInfo}>
              <Text style={styles.sensorName}>Soil Moisture Control</Text>
              <Text style={styles.sensorDesc}>Start at 30% · Stop at 60%</Text>
            </View>
            <TouchableOpacity style={[styles.toggle, moistureEnabled && styles.toggleOn]} onPress={() => setMoistureEnabled(!moistureEnabled)}>
              <View style={[styles.toggleThumb, moistureEnabled && styles.toggleThumbOn]} />
            </TouchableOpacity>
          </View>
          {moistureEnabled && (
            <View style={styles.thresholdContainer}>
              <View style={styles.thresholdBar}>
                <View style={styles.thresholdFill} />
                <View style={[styles.thresholdMarker, { left: '30%' }]}><Text style={styles.markerText}>30%</Text></View>
                <View style={[styles.thresholdMarker, { left: '60%' }]}><Text style={styles.markerText}>60%</Text></View>
              </View>
              <View style={styles.thresholdLabels}>
                <Text style={styles.thresholdLabel}>Start</Text>
                <Text style={styles.thresholdLabel}>Stop</Text>
              </View>
              <TouchableOpacity style={styles.detailButton} onPress={() => navigation.navigate('SoilMoistureControl', { pumpId })}>
                <Text style={styles.detailButtonText}>View Details</Text>
                <MaterialCommunityIcons name="chevron-right" size={16} color={COLORS.primaryLight} />
              </TouchableOpacity>
            </View>
          )}
        </View>
        {/* Water Level Control */}
        <View style={styles.sensorCard}>
          <View style={styles.sensorHeader}>
            <MaterialCommunityIcons name="waves" size={24} color={COLORS.info} />
            <View style={styles.sensorInfo}>
              <Text style={styles.sensorName}>Water Level Control</Text>
              <Text style={styles.sensorDesc}>Water Level at 65%</Text>
            </View>
            <TouchableOpacity style={[styles.toggle, waterLevelEnabled && styles.toggleOn]} onPress={() => setWaterLevelEnabled(!waterLevelEnabled)}>
              <View style={[styles.toggleThumb, waterLevelEnabled && styles.toggleThumbOn]} />
            </TouchableOpacity>
          </View>
          {waterLevelEnabled && (
            <View style={styles.thresholdContainer}>
              <View style={styles.waterLevelGauge}>
                <View style={[styles.waterFill, { height: '65%' }]} />
                <Text style={styles.waterLevelText}>65%</Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
      <TouchableOpacity style={[styles.emergencyBtn, { marginBottom: insets.bottom + 8 }]} onPress={() => {}}>
        <MaterialCommunityIcons name="stop-circle" size={20} color={COLORS.white} />
        <Text style={styles.emergencyText}>Emergency Stop this Pump</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: SPACING.lg },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md },
  title: { fontSize: FONT_SIZES.xxl, fontWeight: FONT_WEIGHTS.bold, color: COLORS.textPrimary },
  content: { padding: SPACING.lg, paddingBottom: 100 },
  sectionTitle: { fontSize: FONT_SIZES.lg, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.textPrimary, marginBottom: SPACING.lg },
  sensorCard: { backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.lg },
  sensorHeader: { flexDirection: 'row', alignItems: 'center' },
  sensorInfo: { flex: 1, marginLeft: SPACING.md },
  sensorName: { fontSize: FONT_SIZES.lg, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.textPrimary },
  sensorDesc: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: 2 },
  toggle: { width: 50, height: 28, borderRadius: 14, backgroundColor: COLORS.background, justifyContent: 'center', paddingHorizontal: 3 },
  toggleOn: { backgroundColor: COLORS.primaryLight },
  toggleThumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: COLORS.textSecondary },
  toggleThumbOn: { alignSelf: 'flex-end', backgroundColor: COLORS.white },
  thresholdContainer: { marginTop: SPACING.lg, paddingTop: SPACING.lg, borderTopWidth: 1, borderTopColor: COLORS.border },
  thresholdBar: { height: 12, borderRadius: 6, backgroundColor: COLORS.background, position: 'relative' },
  thresholdFill: { position: 'absolute', left: '30%', right: '40%', height: '100%', backgroundColor: COLORS.chartMoisture + '50', borderRadius: 6 },
  thresholdMarker: { position: 'absolute', top: -6, width: 2, height: 24, backgroundColor: COLORS.chartMoisture },
  markerText: { position: 'absolute', top: 28, fontSize: FONT_SIZES.xs, color: COLORS.chartMoisture, left: -12 },
  thresholdLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: SPACING.xxxl },
  thresholdLabel: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary },
  detailButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: SPACING.lg, gap: 4 },
  detailButtonText: { fontSize: FONT_SIZES.sm, color: COLORS.primaryLight, fontWeight: FONT_WEIGHTS.medium },
  waterLevelGauge: { width: 80, height: 100, borderRadius: BORDER_RADIUS.md, borderWidth: 2, borderColor: COLORS.info + '50', alignSelf: 'center', justifyContent: 'flex-end', overflow: 'hidden', alignItems: 'center' },
  waterFill: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: COLORS.info + '40', borderRadius: BORDER_RADIUS.sm },
  waterLevelText: { position: 'absolute', top: '50%', fontSize: FONT_SIZES.lg, fontWeight: FONT_WEIGHTS.bold, color: COLORS.info },
  emergencyBtn: { position: 'absolute', bottom: 0, left: SPACING.lg, right: SPACING.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.danger, borderRadius: BORDER_RADIUS.md, paddingVertical: SPACING.lg, gap: SPACING.sm },
  emergencyText: { fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.white },
});

export default SensorBasedScreen;
