import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MySoilScreen from '../features/soil/screens/MySoilScreen';
import MoistureDetailScreen from '../features/soil/screens/MoistureDetailScreen';
import PhDetailScreen from '../features/soil/screens/PhDetailScreen';
import FertilizerDetailScreen from '../features/soil/screens/FertilizerDetailScreen';
import AddSoilReadingScreen from '../features/soil/screens/AddSoilReadingScreen';
import SoilHealthScreen from '../features/soil/screens/SoilHealthScreen';

const Stack = createNativeStackNavigator();

const SoilStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#4CAF50' },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="MySoil" component={MySoilScreen} />
      <Stack.Screen name="MoistureDetail" component={MoistureDetailScreen} />
      <Stack.Screen name="PhDetail" component={PhDetailScreen} />
      <Stack.Screen name="FertilizerDetail" component={FertilizerDetailScreen} />
      <Stack.Screen name="AddSoilReading" component={AddSoilReadingScreen} />
      <Stack.Screen name="SoilHealth" component={SoilHealthScreen} />
    </Stack.Navigator>
  );
};

export default SoilStack;
