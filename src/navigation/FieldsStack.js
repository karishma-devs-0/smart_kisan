import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MyFieldsScreen from '../features/fields/screens/MyFieldsScreen';
import FieldDetailScreen from '../features/fields/screens/FieldDetailScreen';

const Stack = createNativeStackNavigator();

const FieldsStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#F5F5F5' },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="MyFields" component={MyFieldsScreen} />
      <Stack.Screen name="FieldDetail" component={FieldDetailScreen} />
    </Stack.Navigator>
  );
};

export default FieldsStack;
