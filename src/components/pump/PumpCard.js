import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../constants/typography';
import { SPACING } from '../../constants/spacing';
import { BORDER_RADIUS, SHADOWS } from '../../constants/layout';
import Toggle from '../common/Toggle';
import Badge from '../common/Badge';

const PumpCard = React.memo(({ pump, onToggle, onPress, dark = false }) => {
  const { name, field, status, mode, type } = pump;
  const isOn = status === 'on' || status === true;

  const bgColor = dark ? COLORS.darkCard : COLORS.white;
  const textColor = dark ? COLORS.darkText : COLORS.textPrimary;
  const secondaryTextColor = dark ? COLORS.darkTextSecondary : COLORS.textSecondary;

  const pumpIcon = type === 'submersible' ? 'pump' : 'water-pump';

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: bgColor }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.left}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: isOn ? COLORS.primaryLight + '20' : (dark ? COLORS.darkBorder : COLORS.background) },
          ]}
        >
          <MaterialCommunityIcons
            name={pumpIcon}
            size={28}
            color={isOn ? COLORS.primaryLight : COLORS.pumpInactive}
          />
        </View>
      </View>
      <View style={styles.center}>
        <Text style={[styles.name, { color: textColor }]}>{name}</Text>
        <Text style={[styles.field, { color: secondaryTextColor }]}>{field}</Text>
        {mode && (
          <Badge
            text={mode}
            color={isOn ? COLORS.primaryLight : COLORS.pumpInactive}
            variant="outlined"
          />
        )}
      </View>
      <View style={styles.right}>
        <Toggle
          value={isOn}
          onValueChange={(val) => onToggle && onToggle(pump.id, val)}
          size="sm"
        />
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.sm,
    ...SHADOWS.md,
  },
  left: {
    marginRight: SPACING.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    flex: 1,
  },
  name: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semiBold,
    marginBottom: 2,
  },
  field: {
    fontSize: FONT_SIZES.sm,
    marginBottom: SPACING.xs,
  },
  right: {
    marginLeft: SPACING.md,
    alignItems: 'center',
  },
});

export default PumpCard;
