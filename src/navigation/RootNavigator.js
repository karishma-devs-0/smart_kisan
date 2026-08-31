import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppSelector } from '../hooks/useAppSelector';
import AuthStack from './AuthStack';
import MainTabNavigator from './MainTabNavigator';
import OnboardingScreen from '../features/onboarding/screens/OnboardingScreen';
import ConsentScreen, { CONSENT_VERSION_KEY } from '../features/auth/screens/ConsentScreen';


/**
 * Shown while the app is deciding which screen to open. Anything is better than
 * a blank screen here: the waits involved are network waits, and a white screen
 * is indistinguishable from a crash.
 */
const Booting = ({ message }) => (
  <View style={styles.booting}>
    <ActivityIndicator size="large" color={COLORS.primary} />
    {message ? <Text style={styles.bootingText}>{message}</Text> : null}
  </View>
);

const styles = StyleSheet.create({
  booting: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    gap: 12,
  },
  bootingText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
});

const RootNavigator = () => {
  const { isAuthenticated, sessionRestored } = useAppSelector((state) => state.auth);
  const { completed: onboardingDone, loaded: onboardingLoaded } = useAppSelector(
    (state) => state.onboarding,
  );

  // null = still loading, false = needs consent, true = consented
  const [consented, setConsented] = useState(null);

  useEffect(() => {
    AsyncStorage.getItem(CONSENT_VERSION_KEY)
      .then((value) => setConsented(!!value))
      .catch(() => setConsented(false));
  }, []);

  // Wait for both consent check and session check
  if (consented === null || !sessionRestored) return <Booting />;

  // Show consent screen first — must accept before seeing Login
  if (!consented) {
    return <ConsentScreen onAccept={() => setConsented(true)} />;
  }

  if (!isAuthenticated) {
    return <AuthStack />;
  }

  // Hold until the onboarding status is known. Letting an unknown status fall
  // through showed the dashboard for a moment before throwing a new user into
  // the setup wizard, which reads as the app glitching.
  //
  // This waits on a network call, and the server sleeps when idle, so the wait
  // can run to most of a minute. Returning null here rendered nothing at all —
  // a blank white screen with no indication the app was doing anything, which
  // is worse than the flicker it was meant to fix.
  if (!onboardingLoaded) {
    return <Booting message="Loading your farm…" />;
  }

  if (!onboardingDone) {
    return <OnboardingScreen />;
  }

  return <MainTabNavigator />;
};

export default RootNavigator;
