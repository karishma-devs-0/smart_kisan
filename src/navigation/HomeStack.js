import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../features/home/screens/HomeScreen';
// Device Management
import DeviceListScreen from '../features/devices/screens/DeviceListScreen';
import DeviceDetailScreen from '../features/devices/screens/DeviceDetailScreen';
import ConnectedDevicesScreen from '../features/devices/screens/ConnectedDevicesScreen';
import DeviceConnectionScreen from '../features/devices/screens/DeviceConnectionScreen';
// Farm Management
import FarmManagementScreen from '../features/farm/screens/FarmManagementScreen';

const Stack = createNativeStackNavigator();

const HomeStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#4CAF50' },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="HomeMain" component={HomeScreen} />

      {/* ── Device Management ── */}
      <Stack.Screen name="DeviceList" component={DeviceListScreen} />
      <Stack.Screen name="DeviceDetail" component={DeviceDetailScreen} />
      <Stack.Screen name="ConnectedDevices" component={ConnectedDevicesScreen} />
      <Stack.Screen name="DeviceConnection" component={DeviceConnectionScreen} />

      {/* ── Farm Management ── */}
      <Stack.Screen name="FarmManagement" component={FarmManagementScreen} />
    </Stack.Navigator>
  );
};

export default HomeStack;
