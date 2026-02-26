import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../constants/typography';
import { SPACING } from '../../constants/spacing';

const SoilStatIndicator = ({
  value,
  unit = '',
  label,
  color = COLORS.primary,
  size = 60,
}) => {
  return (
    <View style={styles.container}>
      <View
        style={[
          styles.circle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor: color,
            backgroundColor: color + '15',
          },
        ]}
      >
        <Text
          style={[
            styles.value,
            { fontSize: size * 0.25, color: color },
          ]}
        >
          {value}
          {unit ? (
            <Text style={[styles.unit, { fontSize: size * 0.17 }]}>{unit}</Text>
          ) : null}
        </Text>
      </View>
      {label && <Text style={styles.label}>{label}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  circle: {
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontWeight: FONT_WEIGHTS.bold,
    textAlign: 'center',
  },
  unit: {
    fontWeight: FONT_WEIGHTS.medium,
  },
  label: {
    marginTop: SPACING.xs,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHTS.medium,
    textAlign: 'center',
  },
});

export default SoilStatIndicator;
