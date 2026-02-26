import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../constants/typography';
import { SPACING } from '../../constants/spacing';

const DEFAULT_MODES = [
  { id: 'manual', label: 'Manual', icon: 'hand-back-right' },
  { id: 'automatic', label: 'Automatic', icon: 'auto-fix' },
  { id: 'timer', label: 'Timer', icon: 'timer-outline' },
  { id: 'schedule', label: 'Schedule', icon: 'calendar-clock' },
  { id: 'sensor', label: 'Sensor', icon: 'access-point' },
  { id: 'ai', label: 'AI Mode', icon: 'robot' },
];

const ModeSelector = ({
  selectedMode,
  onModeChange,
  modes = DEFAULT_MODES,
}) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {modes.map((mode) => {
        const isSelected = selectedMode === mode.id;
        return (
          <TouchableOpacity
            key={mode.id}
            style={styles.modeItem}
            onPress={() => onModeChange && onModeChange(mode.id)}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.iconCircle,
                isSelected && styles.iconCircleSelected,
              ]}
            >
              <MaterialCommunityIcons
                name={mode.icon}
                size={22}
                color={isSelected ? COLORS.white : COLORS.textTertiary}
              />
            </View>
            <Text
              style={[
                styles.label,
                isSelected && styles.labelSelected,
              ]}
            >
              {mode.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  modeItem: {
    alignItems: 'center',
    marginRight: SPACING.xl,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  iconCircleSelected: {
    backgroundColor: COLORS.primary,
  },
  label: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textTertiary,
    fontWeight: FONT_WEIGHTS.medium,
  },
  labelSelected: {
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.semiBold,
  },
});

export default ModeSelector;
