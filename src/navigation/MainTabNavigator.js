import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import CustomTabBar from './CustomTabBar';
import HomeStack from './HomeStack';
import PumpStack from './PumpStack';
import SoilStack from './SoilStack';
import WeatherStack from './WeatherStack';
import SettingsStack from './SettingsStack';

const Tab = createBottomTabNavigator();

const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        animation: 'fade',
      }}
    >
      <Tab.Screen name="HomeTab" component={HomeStack} />
      <Tab.Screen name="PumpsTab" component={PumpStack} />
      <Tab.Screen name="SoilTab" component={SoilStack} />
      <Tab.Screen name="WeatherTab" component={WeatherStack} />
      <Tab.Screen name="SettingsTab" component={SettingsStack} />
    </Tab.Navigator>
  );
};

export default MainTabNavigator;
