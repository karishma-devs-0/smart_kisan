/**
 * Password reset.
 *
 * A forgotten password used to mean a permanently lost account. The pieces
 * were all there — the server could issue and verify reset codes, and the
 * resetPassword thunk was wired to them — but nothing in the app reached any
 * of it: the "Forgot password?" link on the login form had no handler at all.
 *
 * Two stages in one screen rather than two, matching CodeLoginForm, so going
 * back to correct a mistyped address does not discard the code already typed.
 *
 * On success the server returns a session, so the user is signed straight in
 * and RootNavigator moves them on. There is deliberately no navigation call
 * for the success path — having just proved control of the address and chosen
 * the password, being asked to type it again would achieve nothing.
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS } from '../../../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../../constants/typography';
import { SPACING } from '../../../constants/spacing';
import { BORDER_RADIUS } from '../../../constants/layout';
import { requestLoginCode, resetPassword, clearError } from '../slice/authSlice';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const RESEND_SECONDS = 30;
const MIN_PASSWORD = 6; // matches what the server enforces

const ForgotPasswordScreen = ({ navigation, route }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { loading, error } = useSelector((s) => s.auth);

  // Carried over from the login form, so someone who typed their address and
  // then realised they had forgotten the password does not type it twice.
  const [email, setEmail] = useState(route?.params?.email || '');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [stage, setStage] = useState('email'); // email | reset
  const [localError, setLocalError] = useState(null);
  const [cooldown, setCooldown] = useState(0);
  const codeInput = useRef(null);

  // The error banner is shared with the login screen, so a failure from a
  // previous sign-in attempt would otherwise greet the user here.
  useEffect(() => {
    dispatch(clearError());
    return () => dispatch(clearError());
  }, [dispatch]);

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
    dispatch(clearError());

    const result = await dispatch(requestLoginCode({ email: address, purpose: 'reset' }));
    if (result.meta.requestStatus === 'fulfilled') {
      setStage('reset');
      setCooldown(RESEND_SECONDS);
      setTimeout(() => codeInput.current?.focus(), 250);
    }
  };

  const submit = () => {
    if (code.trim().length !== 6) {
      setLocalError(t('login.codeLength', 'Enter the 6-digit code'));
      return;
    }
    if (password.length < MIN_PASSWORD) {
      setLocalError(t('forgotPassword.tooShort', 'Password must be at least 6 characters'));
      return;
    }
    // Checked here as well as being a second field: a typo in a password the
    // user cannot see would otherwise lock them out again immediately.
    if (password !== confirm) {
      setLocalError(t('register.errors.passwordMismatch', 'Passwords do not match'));
      return;
    }
    setLocalError(null);
    dispatch(
      resetPassword({ email: email.trim().toLowerCase(), code: code.trim(), password }),
    );
  };

  const shownError = localError || error;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + SPACING.lg, paddingBottom: insets.bottom + SPACING.lg },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>

        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="lock-reset" size={36} color={COLORS.white} />
          </View>
          <Text style={styles.title}>{t('forgotPassword.title', 'Reset your password')}</Text>
        </View>

        {stage === 'email' ? (
          <View>
            <Text style={styles.lead}>
              {t(
                'forgotPassword.emailLead',
                'Enter your email address and we will send you a 6-digit code to reset your password.',
              )}
            </Text>

            <View style={styles.inputWrap}>
              <MaterialCommunityIcons name="email-outline" size={20} color={COLORS.textTertiary} />
              <TextInput
                style={styles.input}
                placeholder={t('login.emailPlaceholder', 'Email address')}
                placeholderTextColor={COLORS.textTertiary}
                value={email}
                onChangeText={(v) => {
                  setEmail(v);
                  setLocalError(null);
                }}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                onSubmitEditing={sendCode}
              />
            </View>

            {shownError ? <Text style={styles.error}>{shownError}</Text> : null}

            <TouchableOpacity style={styles.primary} onPress={sendCode} disabled={loading}>
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.primaryText}>{t('login.sendCode', 'Send code')}</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            {/* Worded to reveal nothing about whether the address is registered.
                The server answers a request identically either way, and saying
                otherwise here would give away which emails have accounts. */}
            <Text style={styles.lead}>
              {t('login.codeSentTo', 'If an account exists for {{email}}, a code is on its way.', {
                email,
              })}
            </Text>

            <View style={styles.inputWrap}>
              <MaterialCommunityIcons name="numeric" size={20} color={COLORS.textTertiary} />
              <TextInput
                ref={codeInput}
                style={[styles.input, styles.codeInput]}
                placeholder="------"
                placeholderTextColor={COLORS.textTertiary}
                value={code}
                onChangeText={(v) => {
                  setCode(v.replace(/\D/g, '').slice(0, 6));
                  setLocalError(null);
                }}
                keyboardType="number-pad"
                maxLength={6}
                autoComplete="one-time-code"
              />
            </View>

            <View style={styles.inputWrap}>
              <MaterialCommunityIcons name="lock-outline" size={20} color={COLORS.textTertiary} />
              <TextInput
                style={styles.input}
                placeholder={t('forgotPassword.newPassword', 'New password')}
                placeholderTextColor={COLORS.textTertiary}
                value={password}
                onChangeText={(v) => {
                  setPassword(v);
                  setLocalError(null);
                }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoComplete="new-password"
              />
              <TouchableOpacity onPress={() => setShowPassword((s) => !s)}>
                <MaterialCommunityIcons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={COLORS.textTertiary}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.inputWrap}>
              <MaterialCommunityIcons
                name="lock-check-outline"
                size={20}
                color={COLORS.textTertiary}
              />
              <TextInput
                style={styles.input}
                placeholder={t('forgotPassword.confirmPassword', 'Confirm new password')}
                placeholderTextColor={COLORS.textTertiary}
                value={confirm}
                onChangeText={(v) => {
                  setConfirm(v);
                  setLocalError(null);
                }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                onSubmitEditing={submit}
              />
            </View>

            {shownError ? <Text style={styles.error}>{shownError}</Text> : null}

            <TouchableOpacity style={styles.primary} onPress={submit} disabled={loading}>
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.primaryText}>
                  {t('forgotPassword.submit', 'Reset password')}
                </Text>
              )}
            </TouchableOpacity>

            <View style={styles.footerRow}>
              <TouchableOpacity
                onPress={() => {
                  setStage('email');
                  setCode('');
                  setLocalError(null);
                }}
              >
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
        )}

        <View style={styles.backRow}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.link}>{t('forgotPassword.backToLogin', 'Back to sign in')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.white },
  scroll: { flexGrow: 1, paddingHorizontal: SPACING.xl },
  backButton: { alignSelf: 'flex-start', padding: SPACING.xs },
  header: { alignItems: 'center', marginTop: SPACING.lg, marginBottom: SPACING.xxl },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
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
  error: { fontSize: FONT_SIZES.sm, color: COLORS.danger, marginBottom: SPACING.sm },
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
  backRow: { alignItems: 'center', marginTop: SPACING.xxl },
});

export default ForgotPasswordScreen;
