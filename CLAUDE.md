# SmartKisan - Project Handover Context

> **Last Updated:** April 19, 2026
> **Project:** SmartKisan (Smart Farmer) - AI-powered farming app for Indian farmers
> **Owner:** Hbeonlabs Technologies Pvt. Ltd.
> **Repo:** https://github.com/karishma-devs-0/smart_kisan

---

## 1. Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native via **Expo SDK 54** (managed workflow) |
| Navigation | React Navigation v7 (native-stack + bottom-tabs) |
| State | Redux Toolkit (15 slices) |
| Language | JavaScript (no TypeScript) |
| Backend | **Firebase** (Auth + Firestore) on project `smartfarmerhbeon` |
| Real-Time | **MQTT** via `mqtt` npm package over WebSocket |
| i18n | i18next + react-i18next (10 Indian languages) |
| Charts | react-native-gifted-charts |
| Gauges | react-native-circular-progress |
| Icons | MaterialCommunityIcons from @expo/vector-icons |
| Maps | react-native-webview + Leaflet (NOT react-native-maps) |
| ML | Plant disease detection via HuggingFace Spaces (MobileNetV2) |
| Build | EAS Build (preview = APK, production = AAB) |

**Key Packages:** firebase@^12.10.0, mqtt@^5.15.1, expo-secure-store, expo-image-picker, expo-notifications, dayjs

---

## 2. Project Structure

```
smartFarmer/
├── App.js                          # Entry point: AuthGate, providers, network init
├── app.json                        # Expo config (slug: SmartKisan, package: com.smartkisan.app)
├── eas.json                        # EAS Build profiles (preview=APK, production=AAB)
├── backend/                        # Express.js backend (mostly unused, Firebase handles most)
│   └── .env                        # PORT, FIREBASE_SERVICE_ACCOUNT_PATH, MQTT config
├── plantDetection/                 # ML notebook + training scripts
│   ├── Plant_Disease_Detection.ipynb
│   ├── train_model.py
│   └── project_description.html
├── data/                           # PlantVillage dataset (NOT committed, in .gitignore)
├── important-tips/                 # Local docs, guides, daily reports (gitignored)
└── src/
    ├── config/
    │   └── firebase.config.js      # Firebase keys, GOOGLE_WEB_CLIENT_ID, MQTT broker URL, HuggingFace URL
    ├── constants/
    │   ├── colors.js               # COLORS object (green theme: primary=#2E7D32, primaryLight=#4CAF50)
    │   ├── typography.js           # FONT_SIZES (xs:10 to hero:48), FONT_WEIGHTS
    │   ├── spacing.js              # SPACING (xs:4 to xxxxl:40)
    │   └── layout.js              # BORDER_RADIUS, SHADOWS, CARD, TAB_BAR, SCREEN_HEADER
    ├── components/
    │   ├── common/                 # ScreenLayout, LanguageSelector, OfflineBanner, ScrollPicker, TimePickerModal, etc.
    │   ├── charts/                 # AppBarChart, AppLineChart, AppPieChart
    │   ├── gauges/                 # CircularGauge, WaterTankGauge
    │   ├── pump/                   # PumpCard, EmergencyStopButton, TimerDisplay, TimerPicker
    │   ├── weather/                # WeatherCard, ForecastDayCard
    │   ├── crop/                   # CropCard
    │   ├── soil/                   # SoilStatIndicator
    │   └── farm/                   # FarmMapWidget
    ├── features/                   # Feature-based architecture (each has screens/, slice/, mock/)
    │   ├── auth/                   # Login (email/phone/username/Google), Register
    │   │   ├── components/         # EmailLoginForm, PhoneLoginForm, UsernameLoginForm, LoginTabBar
    │   │   └── hooks/useGoogleAuth.js  # Manual OAuth with PKCE (no expo-auth-session)
    │   ├── pumps/                  # 12 screens: MyPumps, PumpDetail, Timer, Irrigation, SensorBased, etc.
    │   ├── crops/                  # MyCrops, AddCrop, CropRotation
    │   ├── soil/                   # MySoil, MoistureDetail, PhDetail, FertilizerDetail, SoilHealth
    │   ├── weather/                # WeatherToday, Forecast, Historical, Wind, Humidity, ETCalculator
    │   ├── settings/               # SettingsMain, UserProfile, NotificationSettings
    │   ├── home/                   # HomeScreen (dashboard with quick access tiles)
    │   ├── onboarding/             # OnboardingScreen (farm setup wizard)
    │   ├── analytics/              # FarmAnalytics, NDVIMap, YieldPrediction, PlantDisease
    │   ├── farm/                   # FarmManagement, FarmMap, ActiveTasks
    │   ├── fields/                 # MyFields, FieldDetail
    │   ├── devices/                # DeviceList, DeviceDetail, ConnectedDevices, CalibrationWizard, AlertRules
    │   ├── marketplace/            # MarketplaceHome, MandiPrices, CreateListing, Chat
    │   ├── cropRecommend/          # CropRecommendScreen, Input, Detail
    │   ├── diseaseDetection/       # DiseaseDetectionHome, ScanResult
    │   ├── reports/                # ComprehensiveReport, MetricReports, SoilHarvest, TrendReports
    │   ├── schemes/                # GovernmentSchemes, SchemeDetail
    │   └── fertilizerCalc/         # FertilizerCalculatorScreen
    ├── navigation/
    │   ├── RootNavigator.js        # Auth gate: not authenticated→AuthStack, not onboarded→Onboarding, else→MainTab
    │   ├── AuthStack.js            # Login, Register
    │   ├── MainTabNavigator.js     # 5 tabs: Home, Pump, Soil, Sky(Weather), More(Settings)
    │   ├── CustomTabBar.js         # Floating dark pill-shaped tab bar with animated transitions
    │   ├── HomeStack.js            # 22+ screens nested under Home tab
    │   ├── PumpStack.js            # 12 pump screens
    │   ├── SoilStack.js            # 6 soil screens
    │   ├── WeatherStack.js         # 6 weather screens
    │   └── SettingsStack.js        # 18 screens (settings + marketplace + crop recommend + disease detection + schemes)
    ├── services/
    │   ├── api.js                  # Central API layer: all services check FIREBASE_ENABLED, use firestore or mock data
    │   ├── firebase.js             # Firebase init (app, auth with AsyncStorage persistence, db)
    │   ├── firestore.js            # Generic CRUD helper: users/{uid}/{collection} scoping
    │   ├── cache.js                # AsyncStorage-based TTL cache (Redis-like: set/get/del/remember/delByPrefix)
    │   ├── mqtt.js                 # MQTT over WebSocket for real-time pump control + sensor data
    │   ├── weather.js              # OpenWeatherMap API client (needs API key)
    │   ├── seedData.js             # First-login Firestore seeding with mock data
    │   ├── secureAuth.js           # expo-secure-store token management + session persistence
    │   ├── network.js              # Network connectivity monitoring (expo-network)
    │   ├── notifications.js        # Push notifications via expo-notifications
    │   ├── backendApi.js           # Express backend HTTP client (mostly unused)
    │   ├── cropRecommendEngine.js  # Local crop recommendation algorithm
    │   └── irrigationEngine.js     # ET calculation + irrigation scheduling
    ├── store/
    │   └── store.js                # Redux store: 15 reducers + settingsPersistMiddleware
    ├── hooks/                      # useAppDispatch, useAppSelector, useTimer
    ├── i18n/
    │   ├── index.js                # i18next init with AsyncStorage language detector
    │   └── locales/                # en, hi, pa, mr, te, ta, kn, bn, gu, ml
    ├── utils/                      # formatters, leafletMap, mapUtils, mockDelay, validators
    └── style/                      # Legacy screen styles (mostly unused, styles are co-located now)
```

---

## 3. Architecture Patterns

### 3.1 Firebase Toggle
Every service in `api.js` checks `FIREBASE_ENABLED` (from `firebase.config.js`). When `true`, it uses `firestoreService` for real CRUD. When `false`, it returns mock data from `mock/` folders. This lets the app run without Firebase for development.

### 3.2 Data Flow
```
Screen → dispatch(asyncThunk) → api.js service → cache.remember() → firestoreService.getAll() → Firestore
                                                                   ↘ mock data (if FIREBASE_ENABLED=false)
```

### 3.3 Firestore Data Model
All user data is scoped under `users/{uid}/`:
```
users/{uid}/
  ├── pumps/          # Pump devices
  ├── pump_groups/    # Pump groupings
  ├── crops/          # Active crops
  ├── fields/         # Farm fields
  ├── devices/        # IoT sensors
  ├── farm_tasks/     # Task management
  ├── soil/current    # Latest soil readings (singleton)
  ├── settings/preferences  # User preferences (singleton)
  └── profile/onboarding    # Onboarding data (singleton)
```

### 3.4 Settings Persistence
Write-through pattern: every settings action triggers `saveSettings()` middleware which writes to both AsyncStorage (fast) and Firestore (durable). On app launch, settings load from AsyncStorage first (no auth needed), then Firestore overwrites when auth is ready.

### 3.5 MQTT Topics
```
smartkisan/{userId}/pump/{pumpId}/command    # App → Device (ON/OFF)
smartkisan/{userId}/pump/{pumpId}/status     # Device → App (status updates)
smartkisan/{userId}/pump/{pumpId}/timer      # App → Device (timer commands)
smartkisan/{userId}/sensors/{deviceId}/data  # Device → App (sensor readings)
smartkisan/{userId}/alerts                   # System → App (warnings)
```
**Broker:** Currently HiveMQ public broker (wss://broker.hivemq.com:8884/mqtt) — NOT production ready. Needs private broker.

### 3.6 Auth Flow
1. App starts → `AuthGate` in App.js listens to `onAuthStateChanged`
2. If user exists → `restoreSession` + `loadOnboardingStatus` + `seedUserData`
3. MQTT connects with user's UID
4. `RootNavigator` checks: not authed → Login, not onboarded → Onboarding, else → MainTab
5. Google Sign-In uses manual OAuth with PKCE (expo-auth-session was removed due to bundling issues)
6. Username login maps to `{username}@smartkisan.app` email internally

### 3.7 Weather with Location
Weather service accepts `location` from `settings.location`. Cache keys include lat/lng: `weather:current:${lat}:${lng}`. When location changes, `setLocation` reducer calls `cache.delByPrefix('weather:')` to invalidate all weather caches.

---

## 4. Redux Slices (15 total)

| Slice | Key State | Key Thunks |
|---|---|---|
| `auth` | isAuthenticated, user, token, sessionRestored, loginMethod | loginWithEmail, loginWithGoogle, register, logout |
| `pumps` | pumps[], groups[], activeTimers{}, schedules{}, history{} | fetchPumps, controlPump, startPumpTimer, saveSensorConfig |
| `crops` | crops[], rotationPlan | fetchCrops, addCrop, updateCrop, deleteCrop |
| `soil` | current, moistureHistory, phHistory, npkHistory | fetchSoilData, fetchMoistureHistory, etc. |
| `weather` | current, forecast[], historical, windHistory, humidityHistory | fetchCurrentWeather, fetchForecast, etc. |
| `settings` | language, notifications, units, location, loaded | loadSettings, saveSettings |
| `devices` | devices[], alertRules[] | fetchDevices |
| `reports` | waterUsage, runHours, soilCondition, harvestPerformance | fetchReports |
| `farm` | tasks[], categories[], growthTrends[] | fetchFarmData |
| `fields` | fields[], growthData[] | fetchFields |
| `analytics` | cropHealth, aiInsights[], ndviData, yieldPrediction | fetchAnalytics |
| `onboarding` | completed, loaded, profile | loadOnboardingStatus, completeOnboarding |
| `marketplace` | listings[], mandiPrices[], myListings[], chats[] | fetchListings, fetchMandiPrices |
| `cropRecommend` | recommendations[], soilParams, climateParams | fetchRecommendations |
| `diseaseDetection` | scanHistory[], diseases[] | (image upload to HuggingFace) |

---

## 5. UI Design System

- **Theme:** Light theme everywhere (dark theme was removed)
- **Header:** Green gradient (`COLORS.primaryLight` #4CAF50) + white rounded canvas via `ScreenLayout` component
- **Tab Bar:** Floating dark pill-shaped bar with 5 tabs: Home, Pump, Soil, Sky, More
- **Header Branding:** "My_" prefix pattern (green "My" + white title text)
- **Emergency Stop:** Red fixed-bottom button on pump control screens
- **Cards:** White, 16px border radius, subtle shadow
- **Inputs:** Gray background (#F5F5F5), 12px border radius, 52px height

---

## 6. Key Configuration Values

```javascript
// Firebase
projectId: 'smartfarmerhbeon'
appId: '1:782177553731:web:c298387794e2fd1f5433f6'

// Google OAuth
GOOGLE_WEB_CLIENT_ID: '782177553731-bhnqmugdoekfsg421kraclnjpab96n6q.apps.googleusercontent.com'
// Redirect URI (added to Google Cloud Console): https://auth.expo.io/@karishma_bhatia/SmartKisan

// HuggingFace (Plant Disease Detection)
HUGGINGFACE_SPACE_URL: 'https://karishma-devs-smartkisan-plant-disease.hf.space'

// MQTT (testing only)
MQTT_BROKER_URL: 'wss://broker.hivemq.com:8884/mqtt'

// EAS
owner: 'karishma_bhatia'
projectId: '4fa6ae46-9da2-4bb5-ac0d-a8cd9a7a09bd'
package: 'com.smartkisan.app'
```

---

## 7. Known Issues & Incomplete Work

### Blockers
1. **Google Sign-In not working in Expo Go** — the Expo auth proxy (`auth.expo.io`) fails to redirect back to the app. Works concept-wise but needs a dev build with `@react-native-google-signin/google-signin` for production.
2. **No real IoT hardware** — MQTT integration is tested with simulated data only. No physical ESP32/Arduino devices exist yet.
3. **Firebase Spark plan** — free tier will hit limits with real users. No Cloud Functions available.
4. **OpenWeatherMap API key** — not configured. Weather falls back to mock data.

### Pending UI Fixes
- Username login form still has email field (should be username + password only)
- Google Sign-In button should use proper Google logo SVG instead of MaterialCommunityIcons
- Login screen Google button placement needs to be below the form (currently done)

### Technical Debt
- `src/screens/` folder has legacy screens that are duplicates of feature-based ones — can be deleted
- `src/style/` folder has legacy styles — mostly unused
- Some navigation stacks (FarmStack, FieldsStack, AnalyticsStack, DeviceStack) exist as files but screens are nested under HomeStack instead
- `expo-auth-session` was removed but `expo-constants` was manually hoisted to fix bundling — `node_modules` may need a clean reinstall
- Pre-existing React warning: "Cannot update a component (MyPumpsScreen) while rendering a different component (TimerCountdownScreen)"

---

## 8. Development Setup

```bash
# Install dependencies
npm install

# Start Metro dev server
npx expo start

# Build APK (cloud)
eas build --platform android --profile preview

# Build AAB for Play Store
eas build --platform android --profile production
```

**Requirements:** Node.js 18+, Expo CLI, EAS CLI, Expo Go app on Android device

**Git Config (per-repo):**
```
user.name = karishma-devs-0
user.email = ikrishmabhatia@gmail.com
```

**GitHub:** Push requires `gh auth switch -u karishma-devs-0` if your local git is signed in under a different account.

---

## 9. Commit Guidelines

- NEVER add `Co-Authored-By` lines
- Project belongs to `karishma-devs-0` — do not reference Claude or other AI tools in commits
- Keep commit messages concise, focused on the "what" and "why"

---

## 10. File Glossary (Quick Reference)

| What you need | Where to find it |
|---|---|
| Add a new screen | Create in `src/features/{feature}/screens/`, add to appropriate navigation stack |
| Add a new API call | Add to `src/services/api.js` under the relevant service object |
| Add Firestore collection | Add CRUD in `api.js`, data auto-scoped to `users/{uid}/{collection}` |
| Change app colors | `src/constants/colors.js` |
| Add a translation key | `src/i18n/locales/en.js` (and other locale files) |
| Change tab bar | `src/navigation/CustomTabBar.js` + `MainTabNavigator.js` |
| Add Redux state | Create slice in `src/features/{feature}/slice/`, register in `src/store/store.js` |
| Add mock data | `src/features/{feature}/mock/{feature}MockData.js` |
| Configure Firebase | `src/config/firebase.config.js` |
| MQTT topics | `src/services/mqtt.js` (topic structure in comments at top) |
