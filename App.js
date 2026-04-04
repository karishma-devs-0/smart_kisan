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
import OfflineBanner from './src/components/common/OfflineBanner';
import { initNetworkListener } from './src/services/network';
import './src/i18n';

// Load settings immediately on app start (from AsyncStorage — no auth needed)
store.dispatch(loadSettings());

// Start monitoring network connectivity
initNetworkListener();

function AuthGate({ children }) {
  useEffect(() => {
    if (!FIREBASE_ENABLED || !auth) {
      if (__DEV__) console.log('[Auth] Firebase not enabled or auth not available');
      return;
    }
    if (__DEV__) console.log('[Auth] Setting up onAuthStateChanged listener');
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        if (__DEV__) console.log('[Auth] User signed in:', user.uid, user.email);
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
        seedUserData().catch((e) => {
          if (__DEV__) console.log('[Seed] Seed failed:', e.message);
        });

        // Connect MQTT for real-time device communication
        try {
          mqttConnect(user.uid);
          if (__DEV__) console.log('[MQTT] Connected with uid:', user.uid);
        } catch (e) {
          if (__DEV__) console.warn('[MQTT] Connect failed:', e.message);
        }
      } else {
        if (__DEV__) console.log('[Auth] User signed out');
        try { mqttDisconnect(); } catch (e) {}
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

    // Listen for incoming notifications (guard for Expo Go compatibility)
    try {
      if (Notifications.addNotificationReceivedListener) {
        notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
          if (__DEV__) console.log('Notification received:', notification.request.content.title);
        });
      }

      if (Notifications.addNotificationResponseReceivedListener) {
        responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
          const data = response.notification.request.content.data;
          if (__DEV__) console.log('Notification tapped:', data);
        });
      }
    } catch (e) {
      // Notifications not supported in this environment (Expo Go)
    }

    return () => {
      try {
        if (notificationListener.current?.remove) {
          notificationListener.current.remove();
        }
        if (responseListener.current?.remove) {
          responseListener.current.remove();
        }
      } catch (e) {
        // Cleanup failed — not critical
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
              {/* <OfflineBanner /> — disabled: unreliable in Expo Go */}
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
