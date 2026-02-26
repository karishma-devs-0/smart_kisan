import React from 'react';
import { useAppSelector } from '../hooks/useAppSelector';
import AuthStack from './AuthStack';
import MainTabNavigator from './MainTabNavigator';

const RootNavigator = () => {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  return isAuthenticated ? <MainTabNavigator /> : <AuthStack />;
};

export default RootNavigator;
