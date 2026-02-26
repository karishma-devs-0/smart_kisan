import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MyPumpsScreen from '../features/pumps/screens/MyPumpsScreen';
import PumpDetailScreen from '../features/pumps/screens/PumpDetailScreen';
import PumpTimerScreen from '../features/pumps/screens/PumpTimerScreen';
import TimerCountdownScreen from '../features/pumps/screens/TimerCountdownScreen';
import EditPumpScreen from '../features/pumps/screens/EditPumpScreen';
import EditPumpGroupsScreen from '../features/pumps/screens/EditPumpGroupsScreen';
import PumpGroupsScreen from '../features/pumps/screens/PumpGroupsScreen';
import PumpControlsScreen from '../features/pumps/screens/PumpControlsScreen';
import PumpIrrigationScreen from '../features/pumps/screens/PumpIrrigationScreen';
import SensorBasedScreen from '../features/pumps/screens/SensorBasedScreen';
import SoilMoistureControlScreen from '../features/pumps/screens/SoilMoistureControlScreen';

const Stack = createNativeStackNavigator();

const PumpStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#4CAF50' },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="MyPumps" component={MyPumpsScreen} />
      <Stack.Screen name="PumpDetail" component={PumpDetailScreen} />
      <Stack.Screen name="PumpTimer" component={PumpTimerScreen} />
      <Stack.Screen
        name="TimerCountdown"
        component={TimerCountdownScreen}
        options={{ gestureEnabled: false }}
      />
      <Stack.Screen
        name="EditPump"
        component={EditPumpScreen}
        options={{ presentation: 'modal', contentStyle: { backgroundColor: '#FFFFFF' } }}
      />
      <Stack.Screen
        name="EditPumpGroups"
        component={EditPumpGroupsScreen}
        options={{ presentation: 'modal', contentStyle: { backgroundColor: '#FFFFFF' } }}
      />
      <Stack.Screen name="PumpGroups" component={PumpGroupsScreen} />
      <Stack.Screen name="PumpControls" component={PumpControlsScreen} />
      <Stack.Screen name="PumpIrrigation" component={PumpIrrigationScreen} />
      <Stack.Screen name="SensorBased" component={SensorBasedScreen} />
      <Stack.Screen name="SoilMoistureControl" component={SoilMoistureControlScreen} />
    </Stack.Navigator>
  );
};

export default PumpStack;
