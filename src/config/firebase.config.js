// Firebase configuration for SmartKisan

export const firebaseConfig = {
  apiKey: 'AIzaSyDr0lw7pG8dQC4ZG1OotSeTXfHr7pp-Z00',
  authDomain: 'smartfarmerhbeon.firebaseapp.com',
  projectId: 'smartfarmerhbeon',
  storageBucket: 'smartfarmerhbeon.firebasestorage.app',
  messagingSenderId: '782177553731',
  appId: '1:782177553731:web:c298387794e2fd1f5433f6',
  measurementId: 'G-GE1DY5MV1X',
};

export const FIREBASE_ENABLED = true;

// Google OAuth Web Client ID (from Firebase Console → Authentication → Google provider)
export const GOOGLE_WEB_CLIENT_ID =
  '782177553731-bhnqmugdoekfsg421kraclnjpab96n6q.apps.googleusercontent.com';

// HuggingFace Spaces API URL for plant disease detection
export const HUGGINGFACE_SPACE_URL = 'https://karishma-bhatia-smartkisan-plant-disease.hf.space';

// OpenWeatherMap API key (free tier: 1000 calls/day)
// Set via .env or replace with your own key
export const OPENWEATHER_API_KEY = process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY || '';

// MQTT Broker Configuration
// Default: HiveMQ public broker (for testing). Replace with your own broker for production.
// For HiveMQ Cloud: wss://YOUR_CLUSTER.s1.eu.hivemq.cloud:8884/mqtt
export const MQTT_BROKER_URL = 'wss://broker.hivemq.com:8884/mqtt';
export const MQTT_USERNAME = ''; // Set for authenticated brokers
export const MQTT_PASSWORD = ''; // Set for authenticated brokers
