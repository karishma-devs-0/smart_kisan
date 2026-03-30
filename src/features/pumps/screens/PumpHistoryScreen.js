import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../../../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../../constants/typography';
import { SPACING } from '../../../constants/spacing';
import { BORDER_RADIUS, SHADOWS } from '../../../constants/layout';
import { fetchPumpHistory } from '../slice/pumpsSlice';

const getActionIcon = (action) => {
  switch (action) {
    case 'on': return { name: 'power', color: COLORS.success };
    case 'off': return { name: 'power-off', color: COLORS.error };
    case 'timer_started': return { name: 'timer-outline', color: '#FF9800' };
    default: return { name: 'history', color: COLORS.textSecondary };
  }
};

const getActionLabel = (action, t) => {
  switch (action) {
    case 'on': return t('pumps.history.turnedOn', 'Turned ON');
    case 'off': return t('pumps.history.turnedOff', 'Turned OFF');
    case 'timer_started': return t('pumps.history.timerStarted', 'Timer Started');
    default: return action;
  }
};

const getTriggerLabel = (triggeredBy, t) => {
  switch (triggeredBy) {
    case 'manual': return t('pumps.history.manual', 'Manual');
    case 'timer': return t('pumps.history.timer', 'Timer');
    case 'group': return t('pumps.history.group', 'Group Control');
    case 'schedule': return t('pumps.history.schedule', 'Schedule');
    default: return triggeredBy;
  }
};

const formatDuration = (seconds) => {
  if (!seconds) return null;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
};

const formatTimestamp = (timestamp) => {
  if (!timestamp) return '';
  const date = timestamp._seconds
    ? new Date(timestamp._seconds * 1000)
    : new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (isToday) return `Today, ${time}`;
  return `${date.toLocaleDateString([], { day: 'numeric', month: 'short' })}, ${time}`;
};

const HistoryItem = ({ item, t }) => {
  const icon = getActionIcon(item.action);
  return (
    <View style={styles.historyCard}>
      <View style={[styles.iconCircle, { backgroundColor: icon.color + '20' }]}>
        <MaterialCommunityIcons name={icon.name} size={20} color={icon.color} />
      </View>
      <View style={styles.historyInfo}>
        <Text style={styles.actionLabel}>{getActionLabel(item.action, t)}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.triggerText}>{getTriggerLabel(item.triggeredBy, t)}</Text>
          {item.duration && (
            <Text style={styles.durationText}>
              {formatDuration(item.duration)}
            </Text>
          )}
          {item.groupName && (
            <Text style={styles.groupText}>{item.groupName}</Text>
          )}
        </View>
      </View>
      <Text style={styles.timeText}>{formatTimestamp(item.timestamp)}</Text>
    </View>
  );
};

const PumpHistoryScreen = ({ navigation, route }) => {
  const { pumpId } = route.params || {};
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();

  const pump = useSelector((state) =>
    state.pumps.pumps.find((p) => p.id === pumpId),
  ) || { name: 'Pump' };

  const history = useSelector((state) => state.pumps.history[pumpId] || []);
  const loading = useSelector((state) => state.pumps.loading);

  useEffect(() => {
    dispatch(fetchPumpHistory({ pumpId, limit: 50 }));
  }, [dispatch, pumpId]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{pump.name} — {t('pumps.history.title', 'History')}</Text>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primaryLight} />
        </View>
      ) : history.length === 0 ? (
        <View style={styles.centered}>
          <MaterialCommunityIcons name="history" size={64} color={COLORS.border} />
          <Text style={styles.emptyText}>{t('pumps.history.noHistory', 'No history yet')}</Text>
          <Text style={styles.emptySubtext}>
            {t('pumps.history.noHistoryDesc', 'Actions will appear here when you control this pump')}
          </Text>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <HistoryItem item={item} t={t} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
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
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
    marginLeft: SPACING.md,
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xxl,
  },
  emptyText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textSecondary,
    marginTop: SPACING.lg,
  },
  emptySubtext: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textTertiary,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  list: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  actionLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textPrimary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: 2,
  },
  triggerText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
    overflow: 'hidden',
  },
  durationText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.primaryLight,
    fontWeight: FONT_WEIGHTS.medium,
  },
  groupText: {
    fontSize: FONT_SIZES.xs,
    color: '#FF9800',
    fontWeight: FONT_WEIGHTS.medium,
  },
  timeText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textTertiary,
    textAlign: 'right',
    maxWidth: 100,
  },
});

export default PumpHistoryScreen;
