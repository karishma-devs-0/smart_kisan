import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../../../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../../constants/typography';
import { SPACING } from '../../../constants/spacing';

const TAB_KEYS = ['email', 'phone', 'username'];

const LoginTabBar = ({ activeTab, onTabChange }) => {
  const { t } = useTranslation();
  return (
    <View style={styles.container}>
      {TAB_KEYS.map((key) => {
        const isActive = activeTab === key;
        return (
          <TouchableOpacity
            key={key}
            style={[styles.tab, isActive && styles.activeTab]}
            onPress={() => onTabChange(key)}
          >
            <Text style={[styles.tabText, isActive && styles.activeTabText]}>
              {t(`login.${key}`)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 4,
    marginBottom: SPACING.xxl,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: COLORS.white,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tabText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.textTertiary,
  },
  activeTabText: {
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.semiBold,
  },
});

export default LoginTabBar;
