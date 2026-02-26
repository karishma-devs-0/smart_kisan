import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../constants/typography';
import { SPACING } from '../../constants/spacing';
import { BORDER_RADIUS } from '../../constants/layout';

const VARIANT_STYLES = {
  primary: {
    container: {
      backgroundColor: COLORS.primary,
      borderWidth: 0,
    },
    text: {
      color: COLORS.white,
    },
    iconColor: COLORS.white,
    loaderColor: COLORS.white,
  },
  secondary: {
    container: {
      backgroundColor: COLORS.white,
      borderWidth: 1.5,
      borderColor: COLORS.primary,
    },
    text: {
      color: COLORS.primary,
    },
    iconColor: COLORS.primary,
    loaderColor: COLORS.primary,
  },
  danger: {
    container: {
      backgroundColor: COLORS.danger,
      borderWidth: 0,
    },
    text: {
      color: COLORS.white,
    },
    iconColor: COLORS.white,
    loaderColor: COLORS.white,
  },
};

const Button = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  icon,
  fullWidth = false,
  style,
}) => {
  const variantStyle = VARIANT_STYLES[variant] || VARIANT_STYLES.primary;

  return (
    <TouchableOpacity
      style={[
        styles.container,
        variantStyle.container,
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variantStyle.loaderColor} />
      ) : (
        <View style={styles.content}>
          {icon && (
            <MaterialCommunityIcons
              name={icon}
              size={20}
              color={variantStyle.iconColor}
              style={styles.icon}
            />
          )}
          <Text style={[styles.text, variantStyle.text]}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: SPACING.sm,
  },
  text: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semiBold,
  },
});

export default Button;
