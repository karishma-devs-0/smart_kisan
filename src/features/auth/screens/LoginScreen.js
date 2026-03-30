import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../../../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../../constants/typography';
import { SPACING } from '../../../constants/spacing';
import LoginTabBar from '../components/LoginTabBar';
import EmailLoginForm from '../components/EmailLoginForm';
import PhoneLoginForm from '../components/PhoneLoginForm';
import UsernameLoginForm from '../components/UsernameLoginForm';
import { BORDER_RADIUS } from '../../../constants/layout';
import LanguageSelector, { LanguageButton } from '../../../components/common/LanguageSelector';
import { loginWithEmail, loginWithPhone, loginWithUsername, setLoginMethod } from '../slice/authSlice';
import { FIREBASE_ENABLED } from '../../../config/firebase.config';
import useGoogleAuth from '../hooks/useGoogleAuth';

const GoogleLogo = () => (
  <View style={styles.googleLogoWrap}>
    <Text style={styles.googleG}>
      <Text style={{ color: '#4285F4' }}>G</Text>
      <Text style={{ color: '#EA4335' }}>o</Text>
      <Text style={{ color: '#FBBC05' }}>o</Text>
      <Text style={{ color: '#4285F4' }}>g</Text>
      <Text style={{ color: '#34A853' }}>l</Text>
      <Text style={{ color: '#EA4335' }}>e</Text>
    </Text>
  </View>
);

const LoginScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { loading, error, loginMethod } = useSelector((state) => state.auth);
  const insets = useSafeAreaInsets();
  const [showLangPicker, setShowLangPicker] = useState(false);
  const { promptAsync, ready: googleReady } = useGoogleAuth();

  const handleTabChange = (tab) => {
    dispatch(setLoginMethod(tab));
  };

  const handleEmailLogin = ({ email, password }) => {
    dispatch(loginWithEmail({ email, password }));
  };

  const handlePhoneLogin = ({ phone, otp }) => {
    dispatch(loginWithPhone({ phone, otp }));
  };

  const handleUsernameLogin = ({ username, password }) => {
    dispatch(loginWithUsername({ username, password }));
  };

  const renderForm = () => {
    switch (loginMethod) {
      case 'email':
        return <EmailLoginForm onLogin={handleEmailLogin} loading={loading} />;
      case 'phone':
        return <PhoneLoginForm onLogin={handlePhoneLogin} loading={loading} />;
      case 'username':
        return <UsernameLoginForm onLogin={handleUsernameLogin} loading={loading} />;
      default:
        return <EmailLoginForm onLogin={handleEmailLogin} loading={loading} />;
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Language Selector Button */}
        <LanguageButton onPress={() => setShowLangPicker(true)} />

        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoIcon}>
            <MaterialCommunityIcons name="sprout" size={48} color={COLORS.white} />
          </View>
          <Text style={styles.logoText}>{t('common.appName')}</Text>
          <Text style={styles.logoSubtext}>{t('common.tagline')}</Text>
        </View>

        {/* Tab Bar */}
        <LoginTabBar activeTab={loginMethod} onTabChange={handleTabChange} />

        {/* Error message */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Form */}
        {renderForm()}

        {/* Google Sign In — below the form */}
        {FIREBASE_ENABLED && (
          <>
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>{t('login.orContinueWith')}</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.googleButton}
              onPress={() => promptAsync()}
              disabled={!googleReady || loading}
              activeOpacity={0.7}
            >
              <GoogleLogo />
              <Text style={styles.googleButtonText}>{t('login.googleSignIn')}</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Register link */}
        <View style={styles.registerRow}>
          <Text style={styles.registerText}>{t('login.noAccount')}</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.registerLink}>{t('login.register')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Language Picker Modal */}
      <LanguageSelector visible={showLangPicker} onClose={() => setShowLangPicker(false)} />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.xxl,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xxxl,
  },
  logoIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  logoText: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primary,
  },
  logoSubtext: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 4,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: FONT_SIZES.sm,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    paddingHorizontal: SPACING.md,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textTertiary,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: '#DADCE0',
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: 13,
    gap: 10,
  },
  googleLogoWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleG: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  googleButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: '#3C4043',
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING.xxl,
  },
  registerText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  registerLink: {
    fontSize: FONT_SIZES.md,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.semiBold,
  },
});

export default LoginScreen;
