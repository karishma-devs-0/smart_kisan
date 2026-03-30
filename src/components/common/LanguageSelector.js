import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../constants/typography';
import { SPACING } from '../../constants/spacing';
import { BORDER_RADIUS } from '../../constants/layout';
import { AVAILABLE_LANGUAGES } from '../../features/settings/mock/settingsMockData';
import { setLanguage } from '../../features/settings/slice/settingsSlice';

const LanguageSelector = ({ visible, onClose }) => {
  const { i18n, t } = useTranslation();
  const dispatch = useDispatch();
  const currentLang = useSelector((s) => s.settings.language) || i18n.language;

  const handleSelect = (code) => {
    i18n.changeLanguage(code);
    dispatch(setLanguage(code));
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.container}>
          <Text style={styles.title}>{t('language.title')}</Text>
          <Text style={styles.subtitle}>{t('language.subtitle')}</Text>

          <ScrollView showsVerticalScrollIndicator={false}>
            {AVAILABLE_LANGUAGES.map((lang) => {
              const isActive = currentLang === lang.code;
              return (
                <TouchableOpacity
                  key={lang.code}
                  style={[styles.langOption, isActive && styles.langOptionActive]}
                  onPress={() => handleSelect(lang.code)}
                >
                  <View style={[styles.flagCircle, isActive && styles.flagCircleActive]}>
                    <Text style={[styles.flagText, isActive && styles.flagTextActive]}>{lang.flag}</Text>
                  </View>
                  <View style={styles.langTextContainer}>
                    <Text style={[styles.langLabel, isActive && styles.langLabelActive]}>{lang.nativeLabel}</Text>
                    <Text style={styles.langSublabel}>{lang.name}</Text>
                  </View>
                  {isActive && (
                    <MaterialCommunityIcons name="check-circle" size={24} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

export const LanguageButton = ({ onPress }) => {
  const currentLangCode = useSelector((s) => s.settings.language);
  const currentLang = AVAILABLE_LANGUAGES.find((l) => l.code === currentLangCode) || AVAILABLE_LANGUAGES[0];

  return (
    <TouchableOpacity style={styles.langButton} onPress={onPress}>
      <MaterialCommunityIcons name="translate" size={18} color={COLORS.primary} />
      <Text style={styles.langButtonText}>{currentLang.nativeLabel}</Text>
      <MaterialCommunityIcons name="chevron-down" size={16} color={COLORS.primary} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xxl,
  },
  container: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xxl,
    width: '100%',
    maxWidth: 340,
    maxHeight: '80%',
  },
  title: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textTertiary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  langOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
    backgroundColor: COLORS.background,
  },
  langOptionActive: {
    backgroundColor: COLORS.primary + '10',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  flagCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  flagCircleActive: {
    backgroundColor: COLORS.primary + '20',
  },
  flagText: {
    fontSize: 20,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textSecondary,
  },
  flagTextActive: {
    color: COLORS.primary,
  },
  langTextContainer: {
    flex: 1,
  },
  langLabel: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textPrimary,
  },
  langLabelActive: {
    color: COLORS.primary,
  },
  langSublabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
  langButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: COLORS.primary + '10',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    gap: 6,
    marginBottom: SPACING.lg,
  },
  langButtonText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.primary,
  },
});

export default LanguageSelector;
