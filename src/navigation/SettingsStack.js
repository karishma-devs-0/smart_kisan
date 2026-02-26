import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SettingsMainScreen from '../features/settings/screens/SettingsMainScreen';
import SettingsDetailScreen from '../features/settings/screens/SettingsDetailScreen';

const Stack = createNativeStackNavigator();

const SettingsStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#4CAF50' },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="SettingsMain" component={SettingsMainScreen} />
      <Stack.Screen name="SettingsDetail" component={SettingsDetailScreen} />
    </Stack.Navigator>
  );
};

export default SettingsStack;
