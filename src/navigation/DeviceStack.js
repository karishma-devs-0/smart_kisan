import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DeviceListScreen from '../features/devices/screens/DeviceListScreen';
import DeviceDetailScreen from '../features/devices/screens/DeviceDetailScreen';
import ConnectedDevicesScreen from '../features/devices/screens/ConnectedDevicesScreen';
import DeviceConnectionScreen from '../features/devices/screens/DeviceConnectionScreen';
import CalibrationWizardScreen from '../features/devices/screens/CalibrationWizardScreen';
import AlertRulesScreen from '../features/devices/screens/AlertRulesScreen';
import AddAlertRuleScreen from '../features/devices/screens/AddAlertRuleScreen';

const Stack = createNativeStackNavigator();

const DeviceStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#F5F5F5' },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="DeviceList" component={DeviceListScreen} />
      <Stack.Screen name="DeviceDetail" component={DeviceDetailScreen} />
      <Stack.Screen name="ConnectedDevices" component={ConnectedDevicesScreen} />
      <Stack.Screen name="DeviceConnection" component={DeviceConnectionScreen} />
      <Stack.Screen name="CalibrationWizard" component={CalibrationWizardScreen} />
      <Stack.Screen name="AlertRules" component={AlertRulesScreen} />
      <Stack.Screen name="AddAlertRule" component={AddAlertRuleScreen} />
    </Stack.Navigator>
  );
};

export default DeviceStack;
