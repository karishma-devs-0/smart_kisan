import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppSelector } from '../hooks/useAppSelector';
import AuthStack from './AuthStack';
import MainTabNavigator from './MainTabNavigator';
import OnboardingScreen from '../features/onboarding/screens/OnboardingScreen';
import ConsentScreen, { CONSENT_VERSION_KEY } from '../features/auth/screens/ConsentScreen';

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
  if (consented === null || !sessionRestored) return null;

  // Show consent screen first — must accept before seeing Login
  if (!consented) {
    return <ConsentScreen onAccept={() => setConsented(true)} />;
  }

  if (!isAuthenticated) {
    return <AuthStack />;
  }

  // Hold until the onboarding status is known. Previously an unknown status
  // fell through to the main app, so a newly signed-in user saw the dashboard
  // for a moment and was then thrown into the onboarding wizard once the
  // profile request came back — which reads as the app glitching right after a
  // login that already felt slow.
  if (!onboardingLoaded) {
    return null;
  }

  if (!onboardingDone) {
    return <OnboardingScreen />;
  }

  return <MainTabNavigator />;
};

export default RootNavigator;
