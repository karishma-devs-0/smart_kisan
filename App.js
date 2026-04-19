import React, { useEffect, useRef, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { onAuthStateChanged } from 'firebase/auth';
import * as Notifications from 'expo-notifications';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { store } from './src/store/store';
import RootNavigator from './src/navigation/RootNavigator';
import { restoreSession, sessionCheckComplete } from './src/features/auth/slice/authSlice';
import { persistSession, restorePersistedSession, getFreshToken } from './src/services/secureAuth';
import { loadSettings } from './src/features/settings/slice/settingsSlice';
import { loadOnboardingStatus } from './src/features/onboarding/slice/onboardingSlice';
import { FIREBASE_ENABLED, auth } from './src/services/firebase';
import { seedUserData } from './src/services/seedData';
import { COLORS } from './src/constants/colors';
import {
  connect as mqttConnect,
  disconnect as mqttDisconnect,
  onAllPumpStatus,
  onAllSensorData,
  onAlerts,
} from './src/services/mqtt';
import { updatePumpStatusFromMQTT } from './src/features/pumps/slice/pumpsSlice';
import { registerForPushNotifications } from './src/services/notifications';
import ErrorBoundary from './src/components/common/ErrorBoundary';
import OfflineBanner from './src/components/common/OfflineBanner';
import { initNetworkListener } from './src/services/network';
import './src/i18n';``

// Load settings immediately on app start (from AsyncStorage — no auth needed)
store.dispatch(loadSettings());

// Start monitoring network connectivity
initNetworkListener();

function AuthGate({ children }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!FIREBASE_ENABLED || !auth) {
      // No Firebase — try restoring from SecureStore
      restorePersistedSession().then((session) => {
        if (session) {
          store.dispatch(restoreSession(session));
        } else {
          store.dispatch(sessionCheckComplete());
        }
        setReady(true);
      });
      return;
    }

    if (__DEV__) console.log('[Auth] Setting up onAuthStateChanged listener');
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        if (__DEV__) console.log('[Auth] User signed in:', user.uid, user.email);
        const token = await user.getIdToken();
        const appUser = {
          id: user.uid,
          name: user.displayName || 'Farmer',
          email: user.email,
          phone: user.phoneNumber || '',
          avatar: user.photoURL || null,
        };

        // Persist to SecureStore for offline session restore
        await persistSession(appUser, token);

        store.dispatch(restoreSession({ user: appUser, token }));
        store.dispatch(loadOnboardingStatus());
        seedUserData().catch((e) => {
          if (__DEV__) console.log('[Seed] Seed failed:', e.message);
        });

        // Connect MQTT for real-time device communication
        try {
          mqttConnect(user.uid);
          if (__DEV__) console.log('[MQTT] Connected with uid:', user.uid);

          onAllPumpStatus((pumpId, data) => {
            const status = typeof data === 'string' ? data : data?.status;
            if (status === 'on' || status === 'off') {
              store.dispatch(updatePumpStatusFromMQTT({ pumpId, status }));
            }
          });

          onAllSensorData((deviceId, data) => {
            if (__DEV__) console.log('[MQTT] Sensor data:', deviceId, data);
          });

          onAlerts((alert) => {
            if (__DEV__) console.log('[MQTT] Alert:', alert);
          });
        } catch (e) {
          if (__DEV__) console.warn('[MQTT] Connect failed:', e.message);
        }
      } else {
        if (__DEV__) console.log('[Auth] User signed out');
        store.dispatch(sessionCheckComplete());
        try { mqttDisconnect(); } catch (e) {}
      }
      setReady(true);
    });
    return unsubscribe;
  }, []);

  // Refresh Firebase token every 50 min (tokens expire after 1 hour)
  useEffect(() => {
    if (!FIREBASE_ENABLED || !ready) return;
    const interval = setInterval(() => {
      getFreshToken(true).catch(() => {});
    }, 50 * 60 * 1000);
    return () => clearInterval(interval);
  }, [ready]);

  if (!ready) {
    return (
      <View style={splashStyles.container}>
        <View style={splashStyles.icon}>
          <MaterialCommunityIcons name="sprout" size={48} color={COLORS.white} />
        </View>
        <Text style={splashStyles.title}>SmartKisan</Text>
        <ActivityIndicator size="large" color={COLORS.white} style={{ marginTop: 24 }} />
      </View>
    );
  }

  return children;
}

const splashStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.white,
  },
});

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
