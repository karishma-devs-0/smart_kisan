import React, {
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  View,
  ActivityIndicator,
  StyleSheet,
  Text,
} from 'react-native';

import { StatusBar } from 'expo-status-bar';
import { Provider, useSelector } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Notifications from 'expo-notifications';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { store } from './src/store/store';
import RootNavigator from './src/navigation/RootNavigator';
import {
  restoreSession,
  sessionCheckComplete,
} from './src/features/auth/slice/authSlice';
import {
  restorePersistedSession,
} from './src/services/secureAuth';
import { loadSettings } from './src/features/settings/slice/settingsSlice';
import { loadOnboardingStatus, resetOnboarding } from './src/features/onboarding/slice/onboardingSlice';
import { COLORS } from './src/constants/colors';
import {
  connect as mqttConnect,
  disconnect as mqttDisconnect,
  onAllPumpStatus,
  onAllSensorData,
  onAlerts,
  onAiDecisions,
} from './src/services/mqtt';
import { updatePumpStatusFromMQTT } from './src/features/pumps/slice/pumpsSlice';
import { receiveMqttDecision } from './src/features/aiPump/slice/aiPumpSlice';
import { registerForPushNotifications } from './src/services/notifications';
import ErrorBoundary from './src/components/common/ErrorBoundary';
import { initNetworkListener } from './src/services/network';
import './src/i18n';

// ─────────────────────────────────────────────────────────────
// Load app settings immediately (from AsyncStorage — no auth needed)
// ─────────────────────────────────────────────────────────────
store.dispatch(loadSettings());

// ─────────────────────────────────────────────────────────────
// Initialize network listener
// ─────────────────────────────────────────────────────────────
initNetworkListener();

// ─────────────────────────────────────────────────────────────
// Auth Gate — restores session from SecureStore (no Firebase)
// ─────────────────────────────────────────────────────────────
function AuthGate({ children }) {
  const [ready, setReady] = useState(false);
  // Watch Redux auth state so MQTT can connect on any login, not only on
  // session restore at app boot. Without this, mock-backdoor and first-time
  // logins skip MQTT entirely and pump commands fail with "Not connected".
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const userId = useSelector((state) => state.auth.user?.id);

  // Initial session restore from SecureStore — runs once on mount.
  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      try {
        if (__DEV__) console.log('[Auth] Restoring local session');

        const session = await restorePersistedSession();

        if (session) {
          if (__DEV__) console.log('[Auth] Session restored');
          store.dispatch(restoreSession(session));
          store.dispatch(loadOnboardingStatus());
        } else {
          if (__DEV__) console.log('[Auth] No local session found');
          store.dispatch(sessionCheckComplete());
        }
      } catch (error) {
        console.warn('[Auth] Initialization failed:', error.message);
        store.dispatch(sessionCheckComplete());
      } finally {
        if (mounted) setReady(true);
      }
    }

    initializeAuth();

    return () => {
      mounted = false;
      try { mqttDisconnect(); } catch (e) { /* ignore */ }
    };
  }, []);

  // MQTT connect/disconnect watcher — fires whenever auth state flips, so
  // login (fresh, restored, or mock) all get an MQTT connection, and logout
  // tears it down. Subscriptions are re-registered on every connect.
  useEffect(() => {
    if (isAuthenticated && userId) {
      // Re-fetch onboarding status on every auth change (fresh login OR session
      // restore). The initial session-restore branch only fires once on boot;
      // without this dispatch, a fresh login keeps onboarding.completed = false
      // and the user gets sent back to the onboarding wizard each time.
      store.dispatch(loadOnboardingStatus());
      try {
        mqttConnect(userId);
        if (__DEV__) console.log('[MQTT] Connected:', userId);

        onAllPumpStatus((pumpId, data) => {
          const status = typeof data === 'string' ? data : data?.status;
          if (status === 'on' || status === 'off') {
            store.dispatch(updatePumpStatusFromMQTT({ pumpId, status }));
          }
        });
        onAllSensorData((deviceId, data) => {
          if (__DEV__) console.log('[MQTT] Sensor:', deviceId, data);
        });
        onAlerts((alert) => {
          if (__DEV__) console.log('[MQTT] Alert:', alert);
        });
        onAiDecisions((pumpId, decision) => {
          if (__DEV__) console.log('[MQTT] AI decision:', pumpId, decision);
          store.dispatch(receiveMqttDecision({
            pumpId,
            decision: {
              id: `mqtt:${pumpId}:${decision.decidedAt}`,
              pump_id: pumpId,
              action: decision.action,
              duration_min: decision.durationMin,
              reason_key: decision.reasonKey,
              reason_args: decision.reasonArgs,
              decided_at: decision.decidedAt,
              executed: decision.executed,
            },
          }));
        });
      } catch (mqttError) {
        if (__DEV__) console.warn('[MQTT] Connection failed:', mqttError.message);
      }
    } else if (!isAuthenticated) {
      try { mqttDisconnect(); } catch (e) { /* ignore */ }
    }
  }, [isAuthenticated, userId]);

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

// ─────────────────────────────────────────────────────────────
// Main App
// ─────────────────────────────────────────────────────────────
export default function App() {
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    registerForPushNotifications().catch(() => {});

    try {
      if (Notifications.addNotificationReceivedListener) {
        notificationListener.current = Notifications.addNotificationReceivedListener(
          (notification) => {
            if (__DEV__) console.log('Notification received:', notification.request.content.title);
          }
        );
      }

      if (Notifications.addNotificationResponseReceivedListener) {
        responseListener.current = Notifications.addNotificationResponseReceivedListener(
          (response) => {
            const data = response.notification.request.content.data;
            if (__DEV__) console.log('Notification tapped:', data);
          }
        );
      }
    } catch (error) {
      console.warn('Notifications unavailable:', error.message);
    }

    return () => {
      try {
        if (notificationListener.current?.remove) notificationListener.current.remove();
        if (responseListener.current?.remove) responseListener.current.remove();
      } catch (error) { /* ignore */ }
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
