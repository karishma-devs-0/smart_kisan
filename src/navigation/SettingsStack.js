import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SettingsMainScreen from '../features/settings/screens/SettingsMainScreen';
import SettingsDetailScreen from '../features/settings/screens/SettingsDetailScreen';
import UserProfileScreen from '../features/settings/screens/UserProfileScreen';
import MarketplaceHomeScreen from '../features/marketplace/screens/MarketplaceHomeScreen';
import MandiPricesScreen from '../features/marketplace/screens/MandiPricesScreen';
import ListingDetailScreen from '../features/marketplace/screens/ListingDetailScreen';
import CreateListingScreen from '../features/marketplace/screens/CreateListingScreen';
import ChatScreen from '../features/marketplace/screens/ChatScreen';
import ChatListScreen from '../features/marketplace/screens/ChatListScreen';
import CropRecommendScreen from '../features/cropRecommend/screens/CropRecommendScreen';
import CropRecommendInputScreen from '../features/cropRecommend/screens/CropRecommendInputScreen';
import CropRecommendDetailScreen from '../features/cropRecommend/screens/CropRecommendDetailScreen';
import DiseaseDetectionHomeScreen from '../features/diseaseDetection/screens/DiseaseDetectionHomeScreen';
import ScanResultScreen from '../features/diseaseDetection/screens/ScanResultScreen';
import FertilizerCalculatorScreen from '../features/fertilizerCalc/screens/FertilizerCalculatorScreen';
import NotificationSettingsScreen from '../features/settings/screens/NotificationSettingsScreen';
import GovernmentSchemesScreen from '../features/schemes/screens/GovernmentSchemesScreen';
import SchemeDetailScreen from '../features/schemes/screens/SchemeDetailScreen';

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
      <Stack.Screen name="UserProfile" component={UserProfileScreen} />
      <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
      {/* Marketplace */}
      <Stack.Screen name="Marketplace" component={MarketplaceHomeScreen} />
      <Stack.Screen name="MandiPrices" component={MandiPricesScreen} />
      <Stack.Screen name="ListingDetail" component={ListingDetailScreen} />
      <Stack.Screen name="CreateListing" component={CreateListingScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="ChatList" component={ChatListScreen} />
      {/* Crop Recommendation */}
      <Stack.Screen name="CropRecommend" component={CropRecommendScreen} />
      <Stack.Screen name="CropRecommendInput" component={CropRecommendInputScreen} />
      <Stack.Screen name="CropRecommendDetail" component={CropRecommendDetailScreen} />
      {/* Disease Detection */}
      <Stack.Screen name="DiseaseDetection" component={DiseaseDetectionHomeScreen} />
      <Stack.Screen name="ScanResult" component={ScanResultScreen} />
      {/* Fertilizer Calculator */}
      <Stack.Screen name="FertilizerCalculator" component={FertilizerCalculatorScreen} />
      {/* Government Schemes */}
      <Stack.Screen name="GovernmentSchemes" component={GovernmentSchemesScreen} />
      <Stack.Screen name="SchemeDetail" component={SchemeDetailScreen} />
    </Stack.Navigator>
  );
};

export default SettingsStack;
