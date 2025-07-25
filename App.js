import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import OnboardingScreen from './src/screens/OnboardingScreen';
import LoginScreen from './src/screens/Login/LoginScreen'; // Assuming LoginScreen is in a Login subdirectory now
import RegisterScreen from './src/screens/Login/RegisterScreen';
import WeatherScreen from './src/screens/WeatherScreen';
import SoilScreen from './src/screens/SoilScreen';
import CropScreen from './src/screens/CropScreen';
import AddPlantScreen from './src/screens/AddPlantScreen';
import PumpScreen from './src/screens/PumpScreen';
import AddPumpGroupScreen from './src/screens/AddPumpGroupScreen';
import AlertSettingsScreen from './src/screens/AlertSettingsScreen';
import AlertSeverityScreen from './src/screens/AlertSeverityScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Bottom tab navigator
const MainTabs = () => {
  const navigation = useNavigation();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Weather') {
            iconName = focused ? 'partly-sunny' : 'partly-sunny-outline';
          } else if (route.name === 'Crops') {
            iconName = focused ? 'leaf' : 'leaf-outline';
          } else if (route.name === 'Soil') {
            iconName = focused ? 'water' : 'water-outline';
          } else if (route.name === 'Pumps') {
            iconName = focused ? 'flash' : 'flash-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#6CAA64',
        tabBarInactiveTintColor: 'gray',
        headerShown: false
      })}
    >
      <Tab.Screen name="Home">
        {() => <WeatherScreen appBarSettings={() => navigation.navigate('AlertSettingsScreen')} />}
      </Tab.Screen>
      <Tab.Screen name="Weather">
        {() => <WeatherScreen appBarSettings={() => navigation.navigate('AlertSettingsScreen')} />}
      </Tab.Screen>
      <Tab.Screen name="Crops" component={CropScreen} />
      <Tab.Screen name="Soil" component={SoilScreen} />
      <Tab.Screen name="Pumps" component={PumpScreen} />
    </Tab.Navigator>
  );
};

export default function App() {
  const [showOnboarding, setShowOnboarding] = useState(true);

  // In a real app, you would check AsyncStorage here to see if onboarding is complete
  // For now, we'll use state to simulate the first launch

  // Function to call when onboarding is finished
  const handleOnboardingFinish = () => {
    setShowOnboarding(false);
    // In a real app, you would also set a flag in AsyncStorage here
  };

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {showOnboarding ? (
          <Stack.Screen name="Onboarding">
            {props => <OnboardingScreen {...props} onFinish={handleOnboardingFinish} />}
          </Stack.Screen>
        ) : (
          <Stack.Screen name="MainTabs" component={MainTabs} />
        )}
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="RegisterScreen" component={RegisterScreen} />
        <Stack.Screen name="WeatherScreen" component={WeatherScreen} />
        <Stack.Screen name="SoilScreen" component={SoilScreen} />
        <Stack.Screen name="AddPlantScreen" component={AddPlantScreen} />
        <Stack.Screen name="AddPumpGroupScreen" component={AddPumpGroupScreen} />
        <Stack.Screen name="AlertSettingsScreen" component={AlertSettingsScreen} />
        <Stack.Screen name="AlertSeverityScreen" component={AlertSeverityScreen} />
      </Stack.Navigator>
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}
