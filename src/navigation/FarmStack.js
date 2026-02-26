import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import FarmManagementScreen from '../features/farm/screens/FarmManagementScreen';
import ActiveTasksScreen from '../features/farm/screens/ActiveTasksScreen';

const Stack = createNativeStackNavigator();

const FarmStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#F5F5F5' },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="FarmManagement" component={FarmManagementScreen} />
      <Stack.Screen name="ActiveTasks" component={ActiveTasksScreen} />
    </Stack.Navigator>
  );
};

export default FarmStack;
