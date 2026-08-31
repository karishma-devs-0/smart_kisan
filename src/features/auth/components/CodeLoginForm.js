/**
 * Sign in with a code sent by email — no password.
 *
 * Replaces the Phone and Username tabs, which could not work: there is no SMS
 * provider and no username lookup, so both simply reported themselves
 * unavailable. This gives the farmer a genuine second way in, and one that also
 * rescues an account whose password has been forgotten.
 *
 * Two steps in one component rather than two screens, so going back to correct
 * a mistyped address does not lose the entered code.
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { COLORS } from '../../../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../../constants/typography';
import { SPACING } from '../../../constants/spacing';
import { BORDER_RADIUS } from '../../../constants/layout';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const RESEND_SECONDS = 30;

const CodeLoginForm = ({ onRequestCode, onSubmitCode, loading }) => {
  const { t } = useTranslation();

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [stage, setStage] = useState('email'); // email | code
  const [localError, setLocalError] = useState(null);
  const [cooldown, setCooldown] = useState(0);
  const codeInput = useRef(null);

  // A resend cooldown stops someone tapping repeatedly while an email is in
  // flight, which would invalidate the code they are about to receive — each
  // new request retires the previous one.
  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const sendCode = async () => {
    const address = email.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(address)) {
      setLocalError(t('login.invalidEmail', 'Enter a valid email address'));
      return;
    }
    setLocalError(null);
    const ok = await onRequestCode(address);
    if (ok) {
      setStage('code');
      setCooldown(RESEND_SECONDS);
      setTimeout(() => codeInput.current?.focus(), 250);
    }
  };

  const submit = () => {
    if (code.trim().length !== 6) {
      setLocalError(t('login.codeLength', 'Enter the 6-digit code'));
      return;
    }
    setLocalError(null);
    onSubmitCode(email.trim().toLowerCase(), code.trim());
  };

  if (stage === 'email') {
    return (
      <View>
        <Text style={styles.lead}>
          {t('login.codeLead', 'We will email you a 6-digit code. No password needed.')}
        </Text>

        <View style={styles.inputWrap}>
          <MaterialCommunityIcons name="email-outline" size={20} color={COLORS.textTertiary} />
          <TextInput
            style={styles.input}
            placeholder={t('login.emailPlaceholder', 'Email address')}
            placeholderTextColor={COLORS.textTertiary}
            value={email}
            onChangeText={(v) => { setEmail(v); setLocalError(null); }}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            onSubmitEditing={sendCode}
          />
        </View>

        {localError ? <Text style={styles.error}>{localError}</Text> : null}

        <TouchableOpacity style={styles.primary} onPress={sendCode} disabled={loading}>
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.primaryText}>{t('login.sendCode', 'Send code')}</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View>
      {/* Worded so it reveals nothing about whether the address is registered —
          the server answers identically either way, and contradicting that here
          would give away which emails have accounts. */}
      <Text style={styles.lead}>
        {t('login.codeSentTo', 'If an account exists for {{email}}, a code is on its way.', {
          email,
        })}
      </Text>

      <View style={styles.inputWrap}>
        <MaterialCommunityIcons name="lock-outline" size={20} color={COLORS.textTertiary} />
        <TextInput
          ref={codeInput}
          style={[styles.input, styles.codeInput]}
          placeholder="------"
          placeholderTextColor={COLORS.textTertiary}
          value={code}
          onChangeText={(v) => { setCode(v.replace(/\D/g, '').slice(0, 6)); setLocalError(null); }}
          keyboardType="number-pad"
          maxLength={6}
          autoComplete="one-time-code"
          onSubmitEditing={submit}
        />
      </View>

      {localError ? <Text style={styles.error}>{localError}</Text> : null}

      <TouchableOpacity style={styles.primary} onPress={submit} disabled={loading}>
        {loading ? (
          <ActivityIndicator color={COLORS.white} />
        ) : (
          <Text style={styles.primaryText}>{t('login.verifyCode', 'Sign in')}</Text>
        )}
      </TouchableOpacity>

      <View style={styles.footerRow}>
        <TouchableOpacity onPress={() => { setStage('email'); setCode(''); setLocalError(null); }}>
          <Text style={styles.link}>{t('login.changeEmail', 'Change email')}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={sendCode} disabled={cooldown > 0 || loading}>
          <Text style={[styles.link, cooldown > 0 && styles.linkDisabled]}>
            {cooldown > 0
              ? t('login.resendIn', 'Resend in {{n}}s', { n: cooldown })
              : t('login.resend', 'Resend code')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  lead: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
    lineHeight: 20,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    height: 52,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: '#F5F5F5',
    marginBottom: SPACING.md,
  },
  input: { flex: 1, fontSize: FONT_SIZES.md, color: COLORS.textPrimary },
  codeInput: { letterSpacing: 8, fontWeight: FONT_WEIGHTS.bold },
  error: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.danger,
    marginBottom: SPACING.sm,
  },
  primary: {
    height: 52,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.sm,
  },
  primaryText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semiBold,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.lg,
  },
  link: { fontSize: FONT_SIZES.sm, color: COLORS.primary },
  linkDisabled: { color: COLORS.textTertiary },
});

export default CodeLoginForm;
