# SmartKisan Backend

Node.js / Express API backing the SmartKisan app.

| | |
|---|---|
| Runtime | Node.js 20+ (Express 5) |
| Database | PostgreSQL (hosted on Neon) |
| Auth | JWT, bcrypt password hashing, Google ID-token verification |
| Real-time | MQTT (`mqtt`) + Socket.IO |
| Hosting | Render — `https://smartkisan-api.onrender.com` |

## Running it locally

```bash
cd backend
npm install
cp .env.example .env      # then fill in YOUR OWN values
npm run db:init           # create tables
npm run db:ai             # AI-pump tables
node src/scripts/addFarmSchema.js   # fields, crops, devices, profile, soil history
npm run dev               # starts on PORT, default 5000
```

Check it came up:

```bash
curl http://localhost:5000/api/health
```

Point the app at your local server by setting `EXPO_PUBLIC_API_URL` in the
project root `.env`:

```
EXPO_PUBLIC_API_URL=http://192.168.x.x:5000/api
```

Use your machine's LAN IP, not `localhost` — a phone cannot reach `localhost`.

## About the production .env

It is not shared, and you do not need it to test. Two of its values are
credentials rather than configuration:

- `DB_PASSWORD` — full read, write and delete on the live database
- `JWT_SECRET` — anyone holding it can mint a valid login token for **any**
  user account without knowing the password

Create your own database and your own JWT secret via `.env.example`. You get a
backend you can break freely, and a bug you find locally is reproducible
without risking live data.

If you need to test against live *data* rather than a live *server*, ask for a
QA account instead — that gives you a normal login without handing out
infrastructure credentials.

## API surface

All routes are prefixed `/api`. Everything except `/health` and `/auth/*`
requires `Authorization: Bearer <token>`.

| Route | Purpose |
|---|---|
| `POST /auth/register`, `/auth/login`, `/auth/google` | authentication |
| `DELETE /auth/delete-account` | account + all user data removal |
| `GET/POST/PUT/DELETE /fields`, `/crops`, `/devices` | farm records |
| `GET/POST /soil`, `GET /soil/history` | sensor readings |
| `GET/PUT /profile`, `POST /profile/onboarding` | farm profile, provisioning |
| `/pumps`, `/pump-groups`, `/ai` | pump control and AI scheduling |

Every route is scoped to the authenticated user; one account cannot read
another's rows.
