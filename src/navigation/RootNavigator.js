import React from 'react';
import { useAppSelector } from '../hooks/useAppSelector';
import AuthStack from './AuthStack';
import MainTabNavigator from './MainTabNavigator';
import OnboardingScreen from '../features/onboarding/screens/OnboardingScreen';

const RootNavigator = () => {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const { completed: onboardingDone, loaded: onboardingLoaded } = useAppSelector(
    (state) => state.onboarding,
  );

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
