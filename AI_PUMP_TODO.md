# AI Pump — Follow-up tasks

> Picking up from the AI Pump landing. Backend + frontend are wired end-to-end
> and the engine is ticking. These are the remaining low-hanging items, each
> small and self-contained.

---

## Status of what's already done (for context)

| Done | What |
|---|---|
| ✅ | Backend migration (`addAiPumpSchema.js`) — AI columns on `pumps` + new `ai_decisions` and `ai_overrides` tables |
| ✅ | Decision engine (`backend/src/ai/decisionEngine.js`) with safety rails |
| ✅ | ET calculator (`backend/src/ai/etCalculator.js`) — FAO-56 Hargreaves |
| ✅ | Rules module (`backend/src/ai/rules.js`) — Kc curves, moisture thresholds, 8 soil types |
| ✅ | Cron scheduler (`backend/src/ai/runScheduler.js`) — 15-min tick, override consumption, advisory mode |
| ✅ | API routes (`backend/src/routes/aiPump.js`) — config / decisions / override / feedback / dev tick |
| ✅ | Frontend Redux (`src/features/aiPump/slice/aiPumpSlice.js`) + thunks + MQTT live updates |
| ✅ | `AIControlCard` on PumpDetailScreen |
| ✅ | `AIPumpScreen` full dashboard (hero, safety chips, Run-now / Skip-next / Pause-24h, decision feed, feedback) |
| ✅ | MQTT `onAiDecisions` helper wired into App.js → Redux |
| ✅ | `flow_rate` input on EditPumpScreen (required for AI mode) |
| ✅ | Fixed React warning — dispatch out of `setRemainingSeconds` updater in TimerCountdownScreen |
| ✅ | Weather service — OpenWeatherMap primary, Open-Meteo fallback |
| ✅ | Backend `.env` set up for Docker Postgres + JWT + AI tick interval |

---

## Remaining tasks

### 1. English i18n keys for AI Pump (~25 min)

**Why:** The new AI Pump screens (`AIControlCard.js`, `AIPumpScreen.js`, `decisionReason.js`) currently hard-code English strings. Other locales follow a `t('key')` pattern in `src/i18n/locales/{lang}.js`. Pulling these strings into `en.js` under an `ai.*` namespace means Hindi / Punjabi / Marathi / etc. can be filled in incrementally without touching the screens.

**Where to start:**
- Open [src/i18n/locales/en.js](src/i18n/locales/en.js)
- Add a new top-level key `ai: { ... }` block
- Mirror the strings hard-coded in [src/features/aiPump/components/AIControlCard.js](src/features/aiPump/components/AIControlCard.js), [src/features/aiPump/screens/AIPumpScreen.js](src/features/aiPump/screens/AIPumpScreen.js), [src/features/aiPump/utils/decisionReason.js](src/features/aiPump/utils/decisionReason.js)
- Replace the hard-coded strings with `t('ai.something')` calls
- Don't bother with other languages yet — that's a later pass

**Suggested keys to start with:**
```js
ai: {
  control: 'AI Control',
  enable: 'Enable AI',
  advisoryMode: 'Advisory mode',
  advisoryOn: 'AI suggests but never runs the pump on its own.',
  advisoryOff: 'AI runs the pump automatically when conditions match.',
  setupNeeded: 'Setup needed',
  setupHint: 'Before enabling AI mode, please link a crop, a field, and set the pump flow rate.',
  latestDecision: 'Latest decision',
  noDecisionsYet: 'No decisions yet — first run within 15 minutes.',
  viewDashboard: 'View AI dashboard',
  disabledHint: 'When enabled, the AI uses soil moisture, weather, and crop stage to decide when to run this pump.',
  // ...
  reasons: {
    skipPumpOffline: 'Skipped — pump device offline (no heartbeat in {{hours}}h).',
    skipDailyCap: 'Skipped — already ran {{cap}} times today.',
    // ... etc, mirroring decisionReason.js TEMPLATES
  },
}
```

---

### 2. MQTT connection status chip on AIPumpScreen (~20 min)

**Why:** AI decisions flow over MQTT in real time. If the connection drops, the dashboard goes silent with no indication of why. A small chip ("Connected / Reconnecting / Offline") in the header reassures the farmer that live data is flowing.

**Where to start:**
- Header section of [src/features/aiPump/screens/AIPumpScreen.js](src/features/aiPump/screens/AIPumpScreen.js) (the `renderHeader` function)
- Reuse the existing helpers from [src/services/mqtt.js](src/services/mqtt.js):
  ```js
  import { getConnectionStatus, onConnectionStatusChange } from '../../../services/mqtt';
  ```
- Local state pattern (same as MyPumpsScreen, see [src/features/pumps/screens/MyPumpsScreen.js:215](src/features/pumps/screens/MyPumpsScreen.js#L215)):
  ```js
  const [mqttStatus, setMqttStatus] = useState(getConnectionStatus());
  useEffect(() => onConnectionStatusChange(setMqttStatus), []);
  ```
- Render a small pill in the header — green dot + "Connected", amber + "Reconnecting", grey + "Offline"

---

### 3. Backend README — `backend/README.md` (~20 min)

**Why:** Onboarding a new collaborator (Rishab, Rohit) to the backend currently requires asking "what env vars do I need? how do I get Postgres going? what scripts do I run?" — all of which is in our heads or scattered. A short README in `backend/` makes them self-sufficient.

**Where to start:** Create [backend/README.md](backend/README.md) with these sections:

```markdown
# SmartKisan Backend

Node + Express API, PostgreSQL, MQTT bridge for pump control, AI Pump scheduler.

## Prerequisites

- Node 18+
- Docker Desktop (for local Postgres) OR a Postgres instance you already run

## Setup

1. Install deps:
   ```
   npm install
   ```

2. Start a Postgres container (skip if you already have Postgres):
   ```
   docker run -d --name smartkisan-pg \
     -e POSTGRES_USER=smartkisan \
     -e POSTGRES_PASSWORD=smartkisan_dev \
     -e POSTGRES_DB=smartkisan \
     -p 5432:5432 postgres:16
   ```

3. Create `.env` with:
   ```
   PORT=5000
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=smartkisan
   DB_USER=smartkisan
   DB_PASSWORD=smartkisan_dev
   JWT_SECRET=<any random string>
   GOOGLE_WEB_CLIENT_ID=782177553731-bhnqmugdoekfsg421kraclnjpab96n6q.apps.googleusercontent.com
   MQTT_BROKER_URL=mqtt://broker.hivemq.com:1883
   AI_TICK_SECONDS=900
   ```

4. Apply migrations:
   ```
   npm run db:init    # base pump tables
   npm run db:ai      # AI Pump columns + ai_decisions + ai_overrides
   ```

5. Start the server:
   ```
   npm run dev
   ```

## Endpoints

- `GET  /api/health`
- `POST /api/auth/{register,login,google}`
- `GET/POST/PUT/DELETE /api/pumps[/:id]`
- `POST /api/pumps/:id/control`
- `GET/PATCH /api/ai/pumps/:id/config`
- `GET /api/ai/decisions`
- `POST /api/ai/pumps/:id/override`
- `POST /api/ai/decisions/:id/feedback`
- `POST /api/ai/tick`  (dev — forces a scheduler tick immediately)

## MQTT topics

App ↔ device topic structure documented at the top of `src/services/mqttService.js`.
```

---

### 4. Empty / loading state polish on AIPumpScreen (~15 min)

**Why:** First-impression matters. When a user opens AIPumpScreen before any AI config has loaded, they currently see a small spinner that isn't centered. When the decision feed is empty, they see plain text. Five minutes of polish makes it look intentional rather than half-done.

**Where to start:** [src/features/aiPump/screens/AIPumpScreen.js](src/features/aiPump/screens/AIPumpScreen.js)
- The `ListEmptyComponent` currently shows either a spinner or a text line
- Replace with a friendlier empty state: large grey icon, helpful one-liner, maybe a "How AI Pump works" link
- For loading: centered card with spinner + "Loading AI dashboard…"

---

### 5. Delete-confirmation dialog for schedules (~15 min)

**Why:** Pump schedules are currently deleted with a single tap, no confirmation. A user complained about accidentally deleting a schedule and having to re-create it. A simple `Alert.alert` with Cancel / Delete prevents this.

**Where to start:** [src/features/pumps/screens/PumpDetailScreen.js](src/features/pumps/screens/PumpDetailScreen.js) — search for `deleteSchedule` to find the call site, then wrap it:

```js
const handleDeleteSchedule = (scheduleId) => {
  Alert.alert(
    'Delete schedule?',
    'This will remove the schedule from this pump. You can re-create it any time.',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => dispatch(deleteSchedule({ pumpId, scheduleId })),
      },
    ],
  );
};
```

---

## How to test the full AI Pump flow end-to-end

1. **Start backend** (Postgres must be running):
   ```
   cd backend && npm run dev
   ```

2. **Start Metro:**
   ```
   npx expo start
   ```

3. **In the app:**
   - Log in
   - Go to **Pump** tab → tap a pump
   - Edit the pump and set the **Flow Rate (L/min)**
   - Back on PumpDetail, scroll to **AI Control** card
   - Toggle AI on — you may need to link a crop and field first (alert will tell you)
   - Tap **View AI dashboard** to open AIPumpScreen
   - Try Run-now / Skip-next / Pause-24h
   - To force an immediate decision instead of waiting 15 min:
     ```
     curl -X POST http://localhost:5000/api/ai/tick \
       -H "Authorization: Bearer <YOUR_JWT>"
     ```

## Known limitations to fix later (Phase 2+)

- Weather forecasts only flow into the engine if `EXPO_PUBLIC_OPENWEATHER_API_KEY` is set in the frontend; the backend's `loadWeather()` in `runScheduler.js` returns null today and the engine uses a ~4 mm/day fallback ET. Wire a server-side weather cache when time permits.
- Crop growth stage is set once at planting and never advanced — Kc varies dramatically between stages so this should auto-advance based on days-since-plant.
- Heartbeat from the pump device isn't published yet — the engine's `skip_pump_offline` rail will always fire `false` until real hardware starts publishing.
- Push notifications for AI decisions aren't wired (in-app MQTT works, OS-level push doesn't).

---

**Estimated total for the 5 remaining tasks: ~1h 35min.**
