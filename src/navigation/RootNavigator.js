import React from 'react';
import { useAppSelector } from '../hooks/useAppSelector';
import AuthStack from './AuthStack';
import MainTabNavigator from './MainTabNavigator';
import OnboardingScreen from '../features/onboarding/screens/OnboardingScreen';

const RootNavigator = () => {
  const { isAuthenticated, sessionRestored } = useAppSelector((state) => state.auth);
  const { completed: onboardingDone, loaded: onboardingLoaded } = useAppSelector(
    (state) => state.onboarding,
  );

  // Wait for session check before rendering anything
  if (!sessionRestored) return null;

  if (!isAuthenticated) {
    return <AuthStack />;
  }

  // Show onboarding if status is loaded and not yet completed
  if (onboardingLoaded && !onboardingDone) {
    return <OnboardingScreen />;
  }

  return <MainTabNavigator />;
};

export default RootNavigator;
