// App-wide config for external services and feature flags.
//
// (File is still named `firebase.config.js` for historical reasons — Firebase
// itself has been removed. Renaming would touch ~10+ import paths so it's
// deferred to a follow-up refactor. The exports below are NOT Firebase.)

// Legacy flag — hardcoded false now that Firebase is gone. A few `if
// (FIREBASE_ENABLED)` dead branches across api.js and the slices still
// reference it; they never execute. Remove during the next cleanup pass.
export const FIREBASE_ENABLED = false;

// Google OAuth — Web Client ID used by @react-native-google-signin to
// obtain an ID token, which our backend (/api/auth/google) verifies and
// exchanges for a JWT.
export const GOOGLE_WEB_CLIENT_ID =
  '782177553731-bhnqmugdoekfsg421kraclnjpab96n6q.apps.googleusercontent.com';

// HuggingFace Spaces API URL for plant disease detection.
export const HUGGINGFACE_SPACE_URL = 'https://karishma-devs-smartkisan-plant-disease.hf.space';

// OpenWeatherMap API key (free tier: 1000 calls/day).
// Set via .env or replace with your own key.
export const OPENWEATHER_API_KEY = process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY || '';

// MQTT Broker.
// Default: HiveMQ public broker (testing only — INSECURE).
// For production, set EXPO_PUBLIC_MQTT_BROKER_URL or replace inline.
// For HiveMQ Cloud: wss://YOUR_CLUSTER.s1.eu.hivemq.cloud:8884/mqtt
export const MQTT_BROKER_URL = 'wss://broker.hivemq.com:8884/mqtt';
export const MQTT_USERNAME = ''; // Set for authenticated brokers
export const MQTT_PASSWORD = ''; // Set for authenticated brokers
