import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../../../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../../constants/typography';
import { SPACING } from '../../../constants/spacing';
import { BORDER_RADIUS } from '../../../constants/layout';
import { TERMS_TEXT, PRIVACY_POLICY_TEXT } from '../content/legalTexts';

// Bump this version when the terms change to force re-consent.
export const CONSENT_VERSION_KEY = '@smartkisan:consent_v1';

const ConsentScreen = ({ onAccept }) => {
  const [scrolledToEnd, setScrolledToEnd] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleScroll = ({ nativeEvent }) => {
    if (scrolledToEnd) return;
    const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
    const distanceFromBottom = contentSize.height - (layoutMeasurement.height + contentOffset.y);
    if (distanceFromBottom < 40) setScrolledToEnd(true);
  };

  const handleAccept = async () => {
    setSubmitting(true);
    try {
      await AsyncStorage.setItem(CONSENT_VERSION_KEY, new Date().toISOString());
      onAccept();
    } catch (e) {
      // Even if storage fails, let them through — the gate isn't worth blocking.
      if (__DEV__) console.warn('[Consent] persist failed:', e.message);
      onAccept();
    }
  };

  const canProceed = scrolledToEnd && accepted && !submitting;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logoCircle}>
          <MaterialCommunityIcons name="sprout" size={28} color={COLORS.white} />
        </View>
        <Text style={styles.title}>Before you start</Text>
        <Text style={styles.subtitle}>
          Please review our Terms and Privacy Policy. Scroll to the bottom to continue.
        </Text>
      </View>

      <View style={styles.scrollFrame}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          onScroll={handleScroll}
          scrollEventThrottle={250}
          showsVerticalScrollIndicator={true}
        >
          <Text style={styles.docHeader}>Terms of Service</Text>
          <Text style={styles.docBody}>{TERMS_TEXT}</Text>

          <View style={styles.divider} />

          <Text style={styles.docHeader}>Privacy Policy</Text>
          <Text style={styles.docBody}>{PRIVACY_POLICY_TEXT}</Text>

          <View style={styles.endMarker}>
            <MaterialCommunityIcons
              name="check-circle-outline"
              size={20}
              color={COLORS.primary}
            />
            <Text style={styles.endMarkerText}>You've reached the end</Text>
          </View>
        </ScrollView>

        {!scrolledToEnd && (
          <View style={styles.scrollHint} pointerEvents="none">
            <MaterialCommunityIcons name="chevron-down" size={18} color={COLORS.white} />
            <Text style={styles.scrollHintText}>Scroll down to continue</Text>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={styles.checkboxRow}
        activeOpacity={0.7}
        onPress={() => scrolledToEnd && setAccepted(!accepted)}
        disabled={!scrolledToEnd}
      >
        <View
          style={[
            styles.checkbox,
            !scrolledToEnd && styles.checkboxDisabled,
            accepted && styles.checkboxChecked,
          ]}
        >
          {accepted && (
            <MaterialCommunityIcons name="check" size={18} color={COLORS.white} />
          )}
        </View>
        <Text
          style={[
            styles.checkboxLabel,
            !scrolledToEnd && styles.disabledText,
          ]}
        >
          I have read and agree to the Terms of Service and Privacy Policy
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, !canProceed && styles.buttonDisabled]}
        onPress={handleAccept}
        disabled={!canProceed}
        activeOpacity={0.85}
      >
        {submitting ? (
          <ActivityIndicator color={COLORS.white} />
        ) : (
          <Text style={styles.buttonText}>Accept and Continue</Text>
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: SPACING.lg,
  },
  header: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  logoCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  title: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: SPACING.md,
  },
  scrollFrame: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border || '#E0E0E0',
    marginVertical: SPACING.md,
    overflow: 'hidden',
    position: 'relative',
  },
  scrollContent: {
    padding: SPACING.md,
  },
  docHeader: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primary,
    marginBottom: SPACING.sm,
    marginTop: SPACING.xs,
  },
  docBody: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textPrimary,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border || '#E0E0E0',
    marginVertical: SPACING.lg,
  },
  endMarker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.lg,
    paddingTop: SPACING.md,
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: COLORS.border || '#E0E0E0',
  },
  endMarkerText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.medium,
  },
  scrollHint: {
    position: 'absolute',
    bottom: SPACING.md,
    alignSelf: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    left: '50%',
    transform: [{ translateX: -90 }],
    width: 180,
    justifyContent: 'center',
  },
  scrollHintText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.medium,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
  },
  checkboxDisabled: {
    borderColor: COLORS.border || '#BDBDBD',
  },
  checkboxLabel: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textPrimary,
    lineHeight: 18,
  },
  disabledText: {
    color: COLORS.textSecondary,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  buttonDisabled: {
    backgroundColor: COLORS.border || '#BDBDBD',
  },
  buttonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
  },
});

export default ConsentScreen;
