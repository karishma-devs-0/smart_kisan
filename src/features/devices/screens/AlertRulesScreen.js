import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { COLORS } from '../../../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../../constants/typography';
import { SPACING } from '../../../constants/spacing';
import { BORDER_RADIUS, SHADOWS } from '../../../constants/layout';
import { removeAlertRule, toggleAlertRule } from '../slice/devicesSlice';

const SENSOR_CONFIG = {
  soil_ph: { icon: 'flask-outline', color: '#FF9800', label: 'Soil pH' },
  soil_moisture: { icon: 'water-percent', color: '#2196F3', label: 'Soil Moisture' },
  temperature: { icon: 'thermometer', color: '#F44336', label: 'Temperature' },
  humidity: { icon: 'water-outline', color: '#00BCD4', label: 'Humidity' },
  water_level: { icon: 'waves', color: '#1565C0', label: 'Water Level' },
};

const CONDITION_LABELS = {
  less_than: '<',
  greater_than: '>',
  equals: '=',
};

const UNIT_MAP = {
  soil_ph: '',
  soil_moisture: '%',
  temperature: '\u00B0C',
  humidity: '%',
  water_level: 'cm',
};

const AlertRuleCard = ({ rule, onToggle, onDelete }) => {
  const sensor = SENSOR_CONFIG[rule.sensorType] || { icon: 'alert', color: COLORS.textTertiary, label: rule.sensorType };
  const conditionSymbol = CONDITION_LABELS[rule.condition] || rule.condition;
  const unit = UNIT_MAP[rule.sensorType] || '';

  return (
    <View style={styles.ruleCard}>
      <View style={styles.ruleCardBody}>
        <View style={[styles.sensorIconContainer, { backgroundColor: sensor.color + '15' }]}>
          <MaterialCommunityIcons name={sensor.icon} size={24} color={sensor.color} />
        </View>
        <View style={styles.ruleInfo}>
          <Text style={styles.ruleSensorLabel}>{sensor.label}</Text>
          <Text style={styles.ruleCondition}>
            {conditionSymbol} {rule.threshold}{unit}
          </Text>
          <View style={styles.methodsRow}>
            {rule.methods.map((method) => (
              <View key={method} style={styles.methodBadge}>
                <MaterialCommunityIcons
                  name={method === 'app' ? 'bell-outline' : method === 'sms' ? 'message-text-outline' : 'whatsapp'}
                  size={12}
                  color={COLORS.primary}
                />
                <Text style={styles.methodText}>
                  {method === 'app' ? 'In-App' : method === 'sms' ? 'SMS' : 'WhatsApp'}
                </Text>
              </View>
            ))}
          </View>
        </View>
        <View style={styles.ruleActions}>
          <Switch
            value={rule.active}
            onValueChange={() => onToggle(rule.id)}
            trackColor={{ false: COLORS.divider, true: COLORS.primaryLight + '60' }}
            thumbColor={rule.active ? COLORS.primary : COLORS.textTertiary}
          />
          <TouchableOpacity
            onPress={() => onDelete(rule)}
            style={styles.deleteBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialCommunityIcons name="delete-outline" size={20} color={COLORS.danger} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const AlertRulesScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const alertRules = useSelector((state) => state.devices.alertRules);

  const handleToggle = (id) => {
    dispatch(toggleAlertRule(id));
  };

  const handleDelete = (rule) => {
    const sensor = SENSOR_CONFIG[rule.sensorType] || { label: rule.sensorType };
    Alert.alert(
      'Delete Alert Rule',
      `Remove the "${sensor.label}" alert rule?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => dispatch(removeAlertRule(rule.id)) },
      ],
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Alert Rules</Text>
      </View>

      <FlatList
        data={alertRules}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <AlertRuleCard rule={item} onToggle={handleToggle} onDelete={handleDelete} />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="bell-off-outline" size={64} color={COLORS.textSecondary} />
            <Text style={styles.emptyTitle}>No Alert Rules</Text>
            <Text style={styles.emptySubtitle}>
              Set up alerts to get notified when sensor readings cross your thresholds
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => navigation.navigate('AddAlertRule')}
              activeOpacity={0.8}
            >
              <Text style={styles.emptyButtonText}>Create Alert Rule</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* FAB */}
      {alertRules.length > 0 && (
        <TouchableOpacity
          style={[styles.fab, { bottom: insets.bottom + 20 }]}
          onPress={() => navigation.navigate('AddAlertRule')}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="plus" size={28} color={COLORS.white} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  backBtn: {
    marginRight: SPACING.md,
    padding: SPACING.xs,
  },
  headerTitle: {
    flex: 1,
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 100,
  },
  ruleCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  ruleCardBody: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sensorIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  ruleInfo: {
    flex: 1,
  },
  ruleSensorLabel: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textPrimary,
  },
  ruleCondition: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  methodsRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  methodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primarySurface,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
    gap: 3,
  },
  methodText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.medium,
  },
  ruleActions: {
    alignItems: 'center',
    gap: SPACING.sm,
  },
  deleteBtn: {
    padding: SPACING.xs,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxxl,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textPrimary,
    marginTop: SPACING.lg,
  },
  emptySubtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
    marginHorizontal: SPACING.xl,
  },
  emptyButton: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.md,
    marginTop: SPACING.xl,
  },
  emptyButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.white,
  },
  fab: {
    position: 'absolute',
    right: SPACING.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.lg,
  },
});

export default AlertRulesScreen;
