import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { COLORS } from '../../../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../../constants/typography';
import { SPACING } from '../../../constants/spacing';
import { BORDER_RADIUS } from '../../../constants/layout';
import { fetchGroups } from '../slice/pumpsSlice';

const PumpGroupsScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { groups, pumps } = useSelector((state) => state.pumps);
  const [expandedGroup, setExpandedGroup] = useState(null);

  useEffect(() => { dispatch(fetchGroups()); }, [dispatch]);

  const getPumpsForGroup = (groupId) => {
    const group = groups.find((g) => g.id === groupId);
    if (!group) return [];
    return pumps.filter((p) => group.pumpIds.includes(p.id));
  };

  const renderGroup = ({ item }) => {
    const isExpanded = expandedGroup === item.id;
    const groupPumps = getPumpsForGroup(item.id);
    return (
      <View style={styles.groupCard}>
        <TouchableOpacity style={styles.groupHeader} onPress={() => setExpandedGroup(isExpanded ? null : item.id)}>
          <View style={styles.groupIconContainer}>
            <MaterialCommunityIcons name="sprout" size={28} color={COLORS.primaryLight} />
          </View>
          <View style={styles.groupInfo}>
            <Text style={styles.groupName}>{item.name}</Text>
            <Text style={styles.groupPumpCount}>{groupPumps.length} pumps</Text>
          </View>
          <View style={styles.groupRight}>
            <View style={styles.moistureBadge}>
              <Text style={styles.moistureText}>{item.soilMoisture || 45}%</Text>
            </View>
            <MaterialCommunityIcons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={20} color={COLORS.textSecondary} />
          </View>
        </TouchableOpacity>
        {isExpanded && (
          <View style={styles.groupPumps}>
            {groupPumps.map((pump) => (
              <View key={pump.id} style={styles.pumpRow}>
                <MaterialCommunityIcons name="water-pump" size={18} color={pump.status === 'on' ? COLORS.primaryLight : COLORS.textSecondary} />
                <Text style={styles.pumpRowName}>{pump.name}</Text>
                <View style={[styles.statusDot, { backgroundColor: pump.status === 'on' ? COLORS.success : COLORS.pumpInactive }]} />
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Pump Groups</Text>
      </View>
      <FlatList
        data={groups}
        keyExtractor={(item) => item.id}
        renderItem={renderGroup}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={styles.emptyText}>No pump groups created yet</Text>}
      />
      <TouchableOpacity style={[styles.addButton, { marginBottom: insets.bottom + 16 }]} onPress={() => navigation.navigate('EditPumpGroups')}>
        <MaterialCommunityIcons name="plus" size={20} color={COLORS.white} />
        <Text style={styles.addButtonText}>Add new pump group</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: SPACING.lg },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md },
  title: { fontSize: FONT_SIZES.xxl, fontWeight: FONT_WEIGHTS.bold, color: COLORS.textPrimary },
  listContent: { padding: SPACING.lg, paddingBottom: 100 },
  groupCard: { backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg, marginBottom: SPACING.md, overflow: 'hidden' },
  groupHeader: { flexDirection: 'row', alignItems: 'center', padding: SPACING.lg },
  groupIconContainer: { width: 48, height: 48, borderRadius: 12, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md },
  groupInfo: { flex: 1 },
  groupName: { fontSize: FONT_SIZES.lg, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.textPrimary },
  groupPumpCount: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: 2 },
  groupRight: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  moistureBadge: { backgroundColor: COLORS.primary + '30', borderRadius: BORDER_RADIUS.full, paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs },
  moistureText: { fontSize: FONT_SIZES.sm, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.primaryLight },
  groupPumps: { borderTopWidth: 1, borderTopColor: COLORS.border, padding: SPACING.md },
  pumpRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.sm, gap: SPACING.md },
  pumpRowName: { flex: 1, fontSize: FONT_SIZES.md, color: COLORS.textPrimary },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  emptyText: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary, textAlign: 'center', marginTop: SPACING.xxxl },
  addButton: { position: 'absolute', bottom: 0, left: SPACING.lg, right: SPACING.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.md, paddingVertical: SPACING.lg, gap: SPACING.sm },
  addButtonText: { fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.white },
});

export default PumpGroupsScreen;
