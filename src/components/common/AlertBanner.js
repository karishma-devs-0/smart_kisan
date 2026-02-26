import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../constants/typography';
import { SPACING } from '../../constants/spacing';
import { BORDER_RADIUS } from '../../constants/layout';

const TYPE_CONFIG = {
  success: {
    backgroundColor: '#E8F5E9',
    iconColor: COLORS.success,
    textColor: '#1B5E20',
    icon: 'check-circle',
  },
  warning: {
    backgroundColor: '#FFF3E0',
    iconColor: COLORS.warning,
    textColor: '#E65100',
    icon: 'alert',
  },
  error: {
    backgroundColor: '#FFEBEE',
    iconColor: COLORS.danger,
    textColor: '#B71C1C',
    icon: 'alert-circle',
  },
  info: {
    backgroundColor: '#E3F2FD',
    iconColor: COLORS.info,
    textColor: '#0D47A1',
    icon: 'information',
  },
};

const AlertBanner = ({ message, type = 'info', onDismiss, visible = true }) => {
  if (!visible) return null;

  const config = TYPE_CONFIG[type] || TYPE_CONFIG.info;

  return (
    <View style={[styles.container, { backgroundColor: config.backgroundColor }]}>
      <MaterialCommunityIcons
        name={config.icon}
        size={20}
        color={config.iconColor}
        style={styles.icon}
      />
      <Text style={[styles.message, { color: config.textColor }]} numberOfLines={3}>
        {message}
      </Text>
      {onDismiss && (
        <TouchableOpacity
          onPress={onDismiss}
          style={styles.dismissButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialCommunityIcons
            name="close"
            size={18}
            color={config.textColor}
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.xs,
  },
  icon: {
    marginRight: SPACING.sm,
  },
  message: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.regular,
    lineHeight: 20,
  },
  dismissButton: {
    marginLeft: SPACING.sm,
    padding: SPACING.xs,
  },
});

export default AlertBanner;
