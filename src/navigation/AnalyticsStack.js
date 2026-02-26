import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import FarmAnalyticsScreen from '../features/analytics/screens/FarmAnalyticsScreen';
import NDVIMapScreen from '../features/analytics/screens/NDVIMapScreen';
import YieldPredictionScreen from '../features/analytics/screens/YieldPredictionScreen';
import FarmOverviewScreen from '../features/analytics/screens/FarmOverviewScreen';
import PlantDiseaseScreen from '../features/analytics/screens/PlantDiseaseScreen';

const Stack = createNativeStackNavigator();

const AnalyticsStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#F5F5F5' },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="FarmAnalytics" component={FarmAnalyticsScreen} />
      <Stack.Screen name="NDVIMap" component={NDVIMapScreen} />
      <Stack.Screen name="YieldPrediction" component={YieldPredictionScreen} />
      <Stack.Screen name="FarmOverview" component={FarmOverviewScreen} />
      <Stack.Screen name="PlantDisease" component={PlantDiseaseScreen} />
    </Stack.Navigator>
  );
};

export default AnalyticsStack;
