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
import { COLORS } from '../../../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../../constants/typography';
import { SPACING } from '../../../constants/spacing';
import LoginTabBar from '../components/LoginTabBar';
import EmailLoginForm from '../components/EmailLoginForm';
import PhoneLoginForm from '../components/PhoneLoginForm';
import UsernameLoginForm from '../components/UsernameLoginForm';
import { loginWithEmail, loginWithPhone, loginWithUsername, setLoginMethod } from '../slice/authSlice';

const LoginScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { loading, error, loginMethod } = useSelector((state) => state.auth);
  const insets = useSafeAreaInsets();

  const handleTabChange = (tab) => {
    dispatch(setLoginMethod(tab));
  };

  const handleEmailLogin = ({ email, password }) => {
    dispatch(loginWithEmail({ email, password }));
  };

  const handlePhoneLogin = ({ phone, otp }) => {
    dispatch(loginWithPhone({ phone, otp }));
  };

  const handleUsernameLogin = ({ username, email, password }) => {
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
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoIcon}>
            <MaterialCommunityIcons name="sprout" size={48} color={COLORS.white} />
          </View>
          <Text style={styles.logoText}>SmartKisan</Text>
          <Text style={styles.logoSubtext}>Precision Agriculture</Text>
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

        {/* Register link */}
        <View style={styles.registerRow}>
          <Text style={styles.registerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.registerLink}>Register</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
