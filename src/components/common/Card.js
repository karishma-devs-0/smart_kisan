import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';
import { BORDER_RADIUS, SHADOWS, CARD } from '../../constants/layout';

const Card = ({ children, style, dark = false, onPress, noPadding = false }) => {
  const cardStyles = [
    styles.container,
    dark && styles.dark,
    noPadding && styles.noPadding,
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        style={cardStyles}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyles}>{children}</View>;
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: CARD.padding,
    ...SHADOWS.md,
  },
  dark: {
    backgroundColor: COLORS.darkCard,
  },
  noPadding: {
    padding: 0,
  },
});

export default Card;
