import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { COLORS } from '../../../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../../constants/typography';
import { SPACING } from '../../../constants/spacing';
import { BORDER_RADIUS } from '../../../constants/layout';

const schedules = [
  { id: '1', name: 'Hand 1', time: '06:00 AM - 07:30 AM', duration: '1h 30m', status: 'completed' },
  { id: '2', name: 'Hand 2', time: '12:00 PM - 01:00 PM', duration: '1h 00m', status: 'active' },
  { id: '3', name: 'Hand 3', time: '06:00 PM - 07:00 PM', duration: '1h 00m', status: 'scheduled' },
];

const PumpIrrigationScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { pumpId } = route.params || {};
  const pump = useSelector((s) => s.pumps.pumps.find((p) => p.id === pumpId)) || { name: 'Pump 1' };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return COLORS.success;
      case 'active': return COLORS.info;
      case 'scheduled': return COLORS.warning;
      default: return COLORS.textSecondary;
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>{pump.name}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Irrigation Details</Text>
        <Text style={styles.subtitle}>Irrigation Schedule</Text>
        {schedules.map((s) => (
          <View key={s.id} style={styles.scheduleCard}>
            <View style={[styles.statusLine, { backgroundColor: getStatusColor(s.status) }]} />
            <View style={styles.scheduleInfo}>
              <Text style={styles.scheduleName}>{s.name}</Text>
              <Text style={styles.scheduleTime}>{s.time}</Text>
              <Text style={styles.scheduleDuration}>{s.duration}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(s.status) + '20' }]}>
              <Text style={[styles.statusText, { color: getStatusColor(s.status) }]}>{s.status}</Text>
            </View>
          </View>
        ))}
        <Text style={styles.sectionTitle}>Pump Status</Text>
        <View style={styles.statusCard}>
          <View style={styles.statusRow}><Text style={styles.statusLabel}>Status</Text><Text style={[styles.statusVal, { color: COLORS.success }]}>Running</Text></View>
          <View style={styles.statusRow}><Text style={styles.statusLabel}>Today Run Time</Text><Text style={styles.statusVal}>4.5 hrs</Text></View>
          <View style={styles.statusRow}><Text style={styles.statusLabel}>Water Delivered</Text><Text style={styles.statusVal}>2,450 L</Text></View>
          <View style={styles.statusRow}><Text style={styles.statusLabel}>Next Schedule</Text><Text style={styles.statusVal}>Hand 3 at 6:00 PM</Text></View>
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
  sectionTitle: { fontSize: FONT_SIZES.lg, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.textPrimary, marginBottom: SPACING.md, marginTop: SPACING.lg },
  subtitle: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary, marginBottom: SPACING.md },
  scheduleCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.md },
  statusLine: { width: 4, height: 48, borderRadius: 2, marginRight: SPACING.md },
  scheduleInfo: { flex: 1 },
  scheduleName: { fontSize: FONT_SIZES.lg, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.textPrimary },
  scheduleTime: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: 2 },
  scheduleDuration: { fontSize: FONT_SIZES.xs, color: COLORS.primaryLight, marginTop: 2 },
  statusBadge: { borderRadius: BORDER_RADIUS.full, paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs },
  statusText: { fontSize: FONT_SIZES.xs, fontWeight: FONT_WEIGHTS.semiBold, textTransform: 'capitalize' },
  statusCard: { backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg, padding: SPACING.lg },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  statusLabel: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary },
  statusVal: { fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.textPrimary },
  emergencyBtn: { position: 'absolute', bottom: 0, left: SPACING.lg, right: SPACING.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.danger, borderRadius: BORDER_RADIUS.md, paddingVertical: SPACING.lg, gap: SPACING.sm },
  emergencyText: { fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.white },
});

export default PumpIrrigationScreen;
