import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../constants/typography';

const Badge = ({
  text,
  color = COLORS.primaryLight,
  variant = 'filled',
}) => {
  const isFilled = variant === 'filled';

  return (
    <View
      style={[
        styles.container,
        isFilled
          ? { backgroundColor: color }
          : { backgroundColor: 'transparent', borderWidth: 1, borderColor: color },
      ]}
    >
      <Text
        style={[
          styles.text,
          { color: isFilled ? COLORS.white : color },
        ]}
      >
        {text}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.medium,
  },
});

export default Badge;
