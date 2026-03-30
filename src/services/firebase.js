import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { firebaseConfig, FIREBASE_ENABLED } from '../config/firebase.config';

let app = null;
let auth = null;
let db = null;

if (FIREBASE_ENABLED) {
  app = initializeApp(firebaseConfig);
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
  db = getFirestore(app);
}

export { app, auth, db, FIREBASE_ENABLED };
