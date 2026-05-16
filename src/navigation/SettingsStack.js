import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SettingsMainScreen from '../features/settings/screens/SettingsMainScreen';
import SettingsDetailScreen from '../features/settings/screens/SettingsDetailScreen';
import UserProfileScreen from '../features/settings/screens/UserProfileScreen';
import NotificationSettingsScreen from '../features/settings/screens/NotificationSettingsScreen';
import CropRecommendScreen from '../features/cropRecommend/screens/CropRecommendScreen';
import CropRecommendInputScreen from '../features/cropRecommend/screens/CropRecommendInputScreen';
import CropRecommendDetailScreen from '../features/cropRecommend/screens/CropRecommendDetailScreen';
import DiseaseDetectionHomeScreen from '../features/diseaseDetection/screens/DiseaseDetectionHomeScreen';
import ScanResultScreen from '../features/diseaseDetection/screens/ScanResultScreen';
import FertilizerCalculatorScreen from '../features/fertilizerCalc/screens/FertilizerCalculatorScreen';

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
      {/* ── Core Settings (Fully Working) ── */}
      <Stack.Screen name="SettingsMain" component={SettingsMainScreen} />
      <Stack.Screen name="SettingsDetail" component={SettingsDetailScreen} />
      <Stack.Screen name="UserProfile" component={UserProfileScreen} />
      <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />

      {/* ── AI Tools (Working) ── */}
      <Stack.Screen name="CropRecommend" component={CropRecommendScreen} />
      <Stack.Screen name="CropRecommendInput" component={CropRecommendInputScreen} />
      <Stack.Screen name="CropRecommendDetail" component={CropRecommendDetailScreen} />
      <Stack.Screen name="DiseaseDetection" component={DiseaseDetectionHomeScreen} />
      <Stack.Screen name="ScanResult" component={ScanResultScreen} />
      <Stack.Screen name="FertilizerCalculator" component={FertilizerCalculatorScreen} />
    </Stack.Navigator>
  );
};

export default SettingsStack;
