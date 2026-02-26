import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { COLORS } from '../../../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../../constants/typography';
import { SPACING } from '../../../constants/spacing';
import { BORDER_RADIUS } from '../../../constants/layout';

const PumpControlsScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { pumpId } = route.params || {};
  const pump = useSelector((s) => s.pumps.pumps.find((p) => p.id === pumpId)) || { name: 'Pump 1' };
  const [autoMode, setAutoMode] = useState(true);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>{pump.name}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Pump Controls</Text>
        {/* Auto Mode Toggle */}
        <View style={styles.controlCard}>
          <View style={styles.controlRow}>
            <MaterialCommunityIcons name="auto-fix" size={24} color={COLORS.primaryLight} />
            <View style={styles.controlInfo}>
              <Text style={styles.controlName}>Auto Mode</Text>
              <Text style={styles.controlDesc}>Automatically manage irrigation</Text>
            </View>
            <TouchableOpacity style={[styles.toggle, autoMode && styles.toggleOn]} onPress={() => setAutoMode(!autoMode)}>
              <View style={[styles.toggleThumb, autoMode && styles.toggleThumbOn]} />
            </TouchableOpacity>
          </View>
        </View>
        {/* Irrigation Settings */}
        <Text style={styles.sectionTitle}>Irrigation Schedule</Text>
        <View style={styles.controlCard}>
          <View style={styles.settingRow}><Text style={styles.settingLabel}>Lag</Text><Text style={styles.settingValue}>15 min</Text></View>
          <View style={styles.settingRow}><Text style={styles.settingLabel}>Duration</Text><Text style={styles.settingValue}>1h 30 min - Automatic</Text></View>
          <View style={styles.settingRow}><Text style={styles.settingLabel}>Interval</Text><Text style={styles.settingValue}>Every 6 hours</Text></View>
        </View>
        {/* Water Flow */}
        <Text style={styles.sectionTitle}>Water Flow</Text>
        <View style={styles.controlCard}>
          <View style={styles.flowRow}>
            <MaterialCommunityIcons name="water" size={24} color={COLORS.info} />
            <Text style={styles.flowValue}>24.5 L/min</Text>
          </View>
          <View style={styles.flowBar}><View style={[styles.flowFill, { width: '65%' }]} /></View>
        </View>
      </ScrollView>
      <TouchableOpacity style={[styles.emergencyBtn, { marginBottom: insets.bottom + 8 }]} onPress={() => navigation.goBack()}>
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
  sectionTitle: { fontSize: FONT_SIZES.lg, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.textPrimary, marginBottom: SPACING.md, marginTop: SPACING.lg },
  controlCard: { backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.md },
  controlRow: { flexDirection: 'row', alignItems: 'center' },
  controlInfo: { flex: 1, marginLeft: SPACING.md },
  controlName: { fontSize: FONT_SIZES.lg, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.textPrimary },
  controlDesc: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: 2 },
  toggle: { width: 50, height: 28, borderRadius: 14, backgroundColor: COLORS.background, justifyContent: 'center', paddingHorizontal: 3 },
  toggleOn: { backgroundColor: COLORS.primaryLight },
  toggleThumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: COLORS.textSecondary },
  toggleThumbOn: { alignSelf: 'flex-end', backgroundColor: COLORS.white },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  settingLabel: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary },
  settingValue: { fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.medium, color: COLORS.textPrimary },
  flowRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.md },
  flowValue: { fontSize: FONT_SIZES.xl, fontWeight: FONT_WEIGHTS.bold, color: COLORS.info },
  flowBar: { height: 8, borderRadius: 4, backgroundColor: COLORS.background },
  flowFill: { height: '100%', borderRadius: 4, backgroundColor: COLORS.info },
  emergencyBtn: { position: 'absolute', bottom: 0, left: SPACING.lg, right: SPACING.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.danger, borderRadius: BORDER_RADIUS.md, paddingVertical: SPACING.lg, gap: SPACING.sm },
  emergencyText: { fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.white },
});

export default PumpControlsScreen;
