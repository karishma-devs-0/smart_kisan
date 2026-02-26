import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../features/home/screens/HomeScreen';
import ComprehensiveReportScreen from '../features/reports/screens/ComprehensiveReportScreen';
import SoilHarvestReportScreen from '../features/reports/screens/SoilHarvestReportScreen';
import MetricReportsScreen from '../features/reports/screens/MetricReportsScreen';
import TrendReportsScreen from '../features/reports/screens/TrendReportsScreen';
import MyCropsScreen from '../features/crops/screens/MyCropsScreen';
import AddCropScreen from '../features/crops/screens/AddCropScreen';
// Device Management
import DeviceListScreen from '../features/devices/screens/DeviceListScreen';
import DeviceDetailScreen from '../features/devices/screens/DeviceDetailScreen';
import ConnectedDevicesScreen from '../features/devices/screens/ConnectedDevicesScreen';
import DeviceConnectionScreen from '../features/devices/screens/DeviceConnectionScreen';
// Analytics & AI
import FarmAnalyticsScreen from '../features/analytics/screens/FarmAnalyticsScreen';
import NDVIMapScreen from '../features/analytics/screens/NDVIMapScreen';
import YieldPredictionScreen from '../features/analytics/screens/YieldPredictionScreen';
import FarmOverviewScreen from '../features/analytics/screens/FarmOverviewScreen';
import PlantDiseaseScreen from '../features/analytics/screens/PlantDiseaseScreen';
// Farm Management
import FarmManagementScreen from '../features/farm/screens/FarmManagementScreen';
import ActiveTasksScreen from '../features/farm/screens/ActiveTasksScreen';
import FarmMapScreen from '../features/farm/screens/FarmMapScreen';
// Fields
import MyFieldsScreen from '../features/fields/screens/MyFieldsScreen';
import FieldDetailScreen from '../features/fields/screens/FieldDetailScreen';

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
      <Stack.Screen name="MyCrops" component={MyCropsScreen} />
      <Stack.Screen
        name="AddCrop"
        component={AddCropScreen}
        options={{ presentation: 'modal', contentStyle: { backgroundColor: '#FFFFFF' } }}
      />
      <Stack.Screen name="ComprehensiveReport" component={ComprehensiveReportScreen} />
      <Stack.Screen name="SoilHarvestReport" component={SoilHarvestReportScreen} />
      <Stack.Screen name="MetricReports" component={MetricReportsScreen} />
      <Stack.Screen name="TrendReports" component={TrendReportsScreen} />
      {/* Device Management */}
      <Stack.Screen name="DeviceList" component={DeviceListScreen} />
      <Stack.Screen name="DeviceDetail" component={DeviceDetailScreen} />
      <Stack.Screen name="ConnectedDevices" component={ConnectedDevicesScreen} />
      <Stack.Screen name="DeviceConnection" component={DeviceConnectionScreen} />
      {/* Analytics & AI */}
      <Stack.Screen name="FarmAnalytics" component={FarmAnalyticsScreen} />
      <Stack.Screen name="NDVIMap" component={NDVIMapScreen} />
      <Stack.Screen name="YieldPrediction" component={YieldPredictionScreen} />
      <Stack.Screen name="FarmOverview" component={FarmOverviewScreen} />
      <Stack.Screen name="PlantDisease" component={PlantDiseaseScreen} />
      {/* Farm Management */}
      <Stack.Screen name="FarmManagement" component={FarmManagementScreen} />
      <Stack.Screen name="FarmMap" component={FarmMapScreen} />
      <Stack.Screen name="ActiveTasks" component={ActiveTasksScreen} />
      {/* Fields */}
      <Stack.Screen name="MyFields" component={MyFieldsScreen} />
      <Stack.Screen name="FieldDetail" component={FieldDetailScreen} />
    </Stack.Navigator>
  );
};

export default HomeStack;
