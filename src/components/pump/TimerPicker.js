import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../constants/typography';
import { SPACING } from '../../constants/spacing';
import { BORDER_RADIUS } from '../../constants/layout';

const DEFAULT_PRESETS = [
  { label: '00:15:00', seconds: 900 },
  { label: '00:30:00', seconds: 1800 },
  { label: '01:00:00', seconds: 3600 },
];

const pad = (num) => String(num).padStart(2, '0');

const TimeColumn = ({ label, value, max, onIncrement, onDecrement }) => (
  <View style={styles.column}>
    <Text style={styles.columnLabel}>{label}</Text>
    <TouchableOpacity onPress={onIncrement} style={styles.arrowButton}>
      <MaterialCommunityIcons name="chevron-up" size={28} color={COLORS.primary} />
    </TouchableOpacity>
    <Text style={styles.timeValue}>{pad(value)}</Text>
    <TouchableOpacity onPress={onDecrement} style={styles.arrowButton}>
      <MaterialCommunityIcons name="chevron-down" size={28} color={COLORS.primary} />
    </TouchableOpacity>
  </View>
);

const TimerPicker = ({
  value = { hours: 0, minutes: 0, seconds: 0 },
  onChange,
  presets = DEFAULT_PRESETS,
}) => {
  const update = (field, delta, max) => {
    if (!onChange) return;
    const current = value[field] || 0;
    let next = current + delta;
    if (next < 0) next = max;
    if (next > max) next = 0;
    onChange({ ...value, [field]: next });
  };

  const handlePreset = (totalSeconds) => {
    if (!onChange) return;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    onChange({ hours, minutes, seconds });
  };

  return (
    <View style={styles.container}>
      <View style={styles.columnsRow}>
        <TimeColumn
          label="Hours"
          value={value.hours}
          max={23}
          onIncrement={() => update('hours', 1, 23)}
          onDecrement={() => update('hours', -1, 23)}
        />
        <Text style={styles.separator}>:</Text>
        <TimeColumn
          label="Minutes"
          value={value.minutes}
          max={59}
          onIncrement={() => update('minutes', 1, 59)}
          onDecrement={() => update('minutes', -1, 59)}
        />
        <Text style={styles.separator}>:</Text>
        <TimeColumn
          label="Seconds"
          value={value.seconds}
          max={59}
          onIncrement={() => update('seconds', 1, 59)}
          onDecrement={() => update('seconds', -1, 59)}
        />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.presetsRow}
      >
        {presets.map((preset) => (
          <TouchableOpacity
            key={preset.label}
            style={styles.presetChip}
            onPress={() => handlePreset(preset.seconds)}
            activeOpacity={0.7}
          >
            <Text style={styles.presetText}>{preset.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  columnsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  column: {
    alignItems: 'center',
    minWidth: 60,
  },
  columnLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHTS.medium,
    marginBottom: SPACING.xs,
  },
  arrowButton: {
    padding: SPACING.xs,
  },
  timeValue: {
    fontSize: FONT_SIZES.display,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
    minWidth: 50,
    textAlign: 'center',
  },
  separator: {
    fontSize: FONT_SIZES.display,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textSecondary,
    marginHorizontal: SPACING.sm,
    paddingTop: SPACING.xl,
  },
  presetsRow: {
    paddingHorizontal: SPACING.sm,
  },
  presetChip: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.primarySurface,
    borderRadius: BORDER_RADIUS.full,
    marginHorizontal: SPACING.xs,
  },
  presetText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.primary,
  },
});

export default TimerPicker;
