import React, { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { onAuthStateChanged } from 'firebase/auth';
import * as Notifications from 'expo-notifications';
import { store } from './src/store/store';
import RootNavigator from './src/navigation/RootNavigator';
import { restoreSession } from './src/features/auth/slice/authSlice';
import { loadSettings } from './src/features/settings/slice/settingsSlice';
import { loadOnboardingStatus } from './src/features/onboarding/slice/onboardingSlice';
import { FIREBASE_ENABLED, auth } from './src/services/firebase';
import { seedUserData } from './src/services/seedData';
import { connect as mqttConnect, disconnect as mqttDisconnect } from './src/services/mqtt';
import { registerForPushNotifications } from './src/services/notifications';
import ErrorBoundary from './src/components/common/ErrorBoundary';
import './src/i18n';

// Load settings immediately on app start (from AsyncStorage — no auth needed)
store.dispatch(loadSettings());

function AuthGate({ children }) {
  useEffect(() => {
    if (!FIREBASE_ENABLED || !auth) return;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const token = await user.getIdToken();
        store.dispatch(
          restoreSession({
            user: {
              id: user.uid,
              name: user.displayName || 'Farmer',
              email: user.email,
              phone: user.phoneNumber || '',
              avatar: user.photoURL || null,
            },
            token,
          }),
        );
        // Load onboarding status & seed Firestore on first login
        store.dispatch(loadOnboardingStatus());
        seedUserData().catch(() => {});

        // Connect MQTT for real-time device communication
        try { mqttConnect(user.uid); } catch (e) {
          if (__DEV__) console.warn('MQTT connect failed:', e);
        }
      } else {
        // User logged out
        try { mqttDisconnect(); } catch (e) {
          if (__DEV__) console.warn('MQTT disconnect failed:', e);
        }
      }
    });
    return unsubscribe;
  }, []);
  return children;
}

export default function App() {
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    // Register for push notifications
    registerForPushNotifications().catch(() => {});

    // Listen for incoming notifications while app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      // Notification received in foreground — can be logged or handled
      console.log('Notification received:', notification.request.content.title);
    });

    // Listen for user tapping on a notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      console.log('Notification tapped:', data);
      // Navigation based on notification type can be handled here
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <SafeAreaProvider>
          <ErrorBoundary>
            <NavigationContainer>
              <StatusBar style="auto" />
              <AuthGate>
                <RootNavigator />
              </AuthGate>
            </NavigationContainer>
          </ErrorBoundary>
        </SafeAreaProvider>
      </Provider>
    </GestureHandlerRootView>
  );
}
