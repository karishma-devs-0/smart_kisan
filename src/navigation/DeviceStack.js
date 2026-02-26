import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DeviceListScreen from '../features/devices/screens/DeviceListScreen';
import DeviceDetailScreen from '../features/devices/screens/DeviceDetailScreen';
import ConnectedDevicesScreen from '../features/devices/screens/ConnectedDevicesScreen';
import DeviceConnectionScreen from '../features/devices/screens/DeviceConnectionScreen';

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
    </Stack.Navigator>
  );
};

export default DeviceStack;
