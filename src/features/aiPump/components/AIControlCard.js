import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Switch, ActivityIndicator, Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { COLORS } from '../../../constants/colors';
import { SPACING } from '../../../constants/spacing';
import { FONT_SIZES, FONT_WEIGHTS } from '../../../constants/typography';
import { BORDER_RADIUS, SHADOWS } from '../../../constants/layout';
import {
  fetchAiConfig,
  updateAiConfig,
} from '../slice/aiPumpSlice';
import { formatReason } from '../utils/decisionReason';

/**
 * Compact card for PumpDetailScreen — shows AI status, lets the farmer toggle
 * AI mode, and previews the most recent decision. "View details" pushes to
 * AIPumpScreen for the full feed and overrides.
 */
export default function AIControlCard({ pumpId, navigation }) {
  const dispatch = useDispatch();
  const config = useSelector((s) => s.aiPump.configsByPumpId[pumpId]);
  const decisions = useSelector((s) => s.aiPump.decisionsByPumpId[pumpId] || []);
  const saving = useSelector((s) => s.aiPump.saving);
  const [enabling, setEnabling] = useState(false);

  useEffect(() => {
    if (pumpId) dispatch(fetchAiConfig(pumpId));
  }, [pumpId, dispatch]);

  const latest = decisions[0];

  const handleToggle = async (value) => {
    if (value && !canEnable(config)) {
      Alert.alert(
        'Setup needed',
        'Before enabling AI mode, please link a crop, a field, and set the pump flow rate.',
      );
      return;
    }
    setEnabling(true);
    try {
      await dispatch(updateAiConfig({
        pumpId,
        patch: { ai_enabled: value },
      })).unwrap();
    } catch (err) {
      Alert.alert('Could not update', err);
    } finally {
      setEnabling(false);
    }
  };

  const handleAdvisoryToggle = async (value) => {
    try {
      await dispatch(updateAiConfig({
        pumpId,
        patch: { ai_advisory_mode: value },
      })).unwrap();
    } catch (err) {
      Alert.alert('Could not update', err);
    }
  };

  if (!config) {
    return (
      <View style={styles.card}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <MaterialCommunityIcons name="brain" size={22} color={COLORS.primary} />
          <Text style={styles.title}>AI Control</Text>
        </View>
        <Switch
          value={!!config.ai_enabled}
          onValueChange={handleToggle}
          disabled={enabling || saving}
          trackColor={{ false: '#D0D0D0', true: COLORS.primaryLight }}
          thumbColor="#FFFFFF"
        />
      </View>

      {config.ai_enabled ? (
        <>
          <View style={styles.advisoryRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.advisoryLabel}>Advisory mode</Text>
              <Text style={styles.advisoryHint}>
                {config.ai_advisory_mode
                  ? 'AI suggests but never runs the pump on its own.'
                  : 'AI runs the pump automatically when conditions match.'}
              </Text>
            </View>
            <Switch
              value={!!config.ai_advisory_mode}
              onValueChange={handleAdvisoryToggle}
              trackColor={{ false: '#D0D0D0', true: COLORS.primaryLight }}
              thumbColor="#FFFFFF"
            />
          </View>

          {latest ? (
            <View style={styles.latestBox}>
              <Text style={styles.latestLabel}>Latest decision</Text>
              <Text style={styles.latestText}>{formatReason(latest)}</Text>
            </View>
          ) : (
            <Text style={styles.emptyText}>
              No decisions yet — first run within 15 minutes.
            </Text>
          )}

          <TouchableOpacity
            style={styles.detailsBtn}
            onPress={() => navigation.navigate('AIPump', { pumpId })}
          >
            <Text style={styles.detailsBtnText}>View AI dashboard</Text>
            <MaterialCommunityIcons name="arrow-right" size={18} color={COLORS.primary} />
          </TouchableOpacity>
        </>
      ) : (
        <Text style={styles.disabledHint}>
          When enabled, the AI uses soil moisture, weather, and crop stage to
          decide when to run this pump.
        </Text>
      )}
    </View>
  );
}

function canEnable(config) {
  if (!config) return false;
  return Boolean(config.linked_crop_id && config.linked_field_id && config.flow_rate);
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    ...SHADOWS.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  title: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textPrimary,
  },
  advisoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  advisoryLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.textPrimary,
  },
  advisoryHint: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
    marginRight: SPACING.sm,
  },
  latestBox: {
    backgroundColor: '#F5F7F4',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.md,
  },
  latestLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  latestText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
  },
  emptyText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
    fontStyle: 'italic',
  },
  detailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  detailsBtnText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.primary,
  },
  disabledHint: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
    lineHeight: 18,
  },
});
