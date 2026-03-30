import { useCallback, useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Alert, TurboModuleRegistry } from 'react-native';
import { GOOGLE_WEB_CLIENT_ID } from '../../../config/firebase.config';
import { loginWithGoogle } from '../slice/authSlice';

let GoogleSignin = null;
let statusCodes = null;
let configured = false;

function initGoogleSignin() {
  if (configured) return !!GoogleSignin;
  configured = true;

  // Check if native module exists before requiring — prevents Invariant Violation crash in Expo Go
  try {
    const nativeModule = TurboModuleRegistry.get('RNGoogleSignin');
    if (!nativeModule) {
      if (__DEV__) console.log('Google Sign-In: native module not available (Expo Go). Skipping.');
      return false;
    }
    const mod = require('@react-native-google-signin/google-signin');
    GoogleSignin = mod.GoogleSignin;
    statusCodes = mod.statusCodes;
    GoogleSignin.configure({
      webClientId: GOOGLE_WEB_CLIENT_ID,
    });
    return true;
  } catch {
    return false;
  }
}

export default function useGoogleAuth() {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    setAvailable(initGoogleSignin());
  }, []);

  const promptAsync = useCallback(async () => {
    if (!GoogleSignin) {
      Alert.alert('Google Sign-In', 'Google Sign-In is not available on this device.');
      return;
    }
    try {
      setLoading(true);
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const response = await GoogleSignin.signIn();
      // Try multiple paths — library versions return token in different locations
      const idToken = response?.data?.idToken || response?.idToken || response?.user?.idToken;
      if (idToken) {
        await dispatch(loginWithGoogle(idToken)).unwrap();
      } else {
        Alert.alert('Sign-In Failed', 'Could not get authentication token from Google. Please try again.');
        if (__DEV__) console.warn('Google Sign-In response:', JSON.stringify(response, null, 2));
      }
    } catch (error) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        // user cancelled
      } else if (error.code === statusCodes.IN_PROGRESS) {
        // already in progress
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert('Error', 'Google Play Services not available.');
      } else {
        Alert.alert('Sign-In Error', error?.message || 'Something went wrong. Please try again.');
        if (__DEV__) console.error('Google Sign-In error:', error);
      }
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  return {
    promptAsync,
    ready: available,
    loading,
  };
}
