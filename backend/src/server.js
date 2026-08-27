require('dotenv').config();

const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { rateLimit, ipKeyGenerator } = require('express-rate-limit');

// Socket.IO — real-time notification delivery
const { initSocket } = require('./socket/socketService');

// PostgreSQL Connection
const pool = require('./config/database');
const db = require('./config/db');

// MQTT
const { initMQTT } = require('./services/mqttService');

// Middleware
const authMiddleware = require('./middleware/auth');

// Routes
const authRoutes = require('./routes/auth');
const pumpRoutes = require('./routes/pumps');
const pumpGroupRoutes = require('./routes/pumpGroups');
const aiPumpRoutes = require('./routes/aiPump');
const fieldRoutes = require('./routes/fields');
const cropRoutes = require('./routes/crops');
const deviceRoutes = require('./routes/devices');
const soilRoutes = require('./routes/soil');
const profileRoutes = require('./routes/profile');

// AI scheduler
const { start: startAiScheduler } = require('./ai/runScheduler');

const app = express();

const PORT = process.env.PORT || 5000;

// Render (and most PaaS) terminate TLS at a single proxy in front of the app,
// so the client IP arrives in X-Forwarded-For. Without this, express-rate-limit
// v8 rejects the request with ERR_ERL_UNEXPECTED_X_FORWARDED_FOR, and every
// caller would otherwise be rate-limited as one shared proxy IP.
// '1' (trust exactly one hop) rather than `true` — `true` would let a client
// spoof X-Forwarded-For and slip the rate limiter.
app.set('trust proxy', 1);

// ============================================================
// SECURITY
// ============================================================

app.use(
  helmet({
    crossOriginResourcePolicy: false,
    crossOriginOpenerPolicy: false,
  })
);

// ============================================================
// CORS
// ============================================================

app.use(cors());

// ============================================================
// JSON PARSER
// ============================================================

// Explicit rather than relying on the default, so the limit is visible and
// cannot change under us on a dependency upgrade. Nothing this API accepts
// comes close to 100kb.
app.use(express.json({ limit: '100kb' }));

// ============================================================
// RATE LIMIT
// ============================================================

// General ceiling for ordinary API traffic.
app.use(
  '/api/',
  rateLimit({
    windowMs: 60 * 1000,
    max: 100,
  })
);

// Credential endpoints need a much tighter limit than the rest. Under the
// general rule an attacker gets 100 password guesses per minute per IP, which
// is ample for working through a common-password list. These endpoints are
// also the only ones that can be called without already holding a token.
//
// skipSuccessfulRequests means a legitimate user who signs in correctly does
// not spend their allowance, so only failed attempts count toward the limit.
// Keyed on the account being targeted, not just the caller's IP.
//
// Indian mobile carriers put large numbers of subscribers behind shared NAT
// addresses, so an IP-only limit means ten bad attempts from any one of them
// locks out everyone else on that carrier. Including the email confines the
// lockout to the account actually under attack, which is the thing worth
// protecting; the IP is still mixed in so an attacker cannot dodge the limit
// by cycling through invented addresses.
app.use(
  ['/api/auth/login', '/api/auth/register', '/api/auth/google'],
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    skipSuccessfulRequests: true,
    keyGenerator: (req) => {
      const ip = ipKeyGenerator(req.ip);
      const account =
        typeof req.body?.email === 'string'
          ? req.body.email.toLowerCase().trim()
          : 'anonymous';
      return `${ip}:${account}`;
    },
    message: { error: 'Too many attempts. Please try again in a few minutes.' },
  })
);

// ============================================================
// HEALTH ROUTE
// ============================================================

// The hosting platform polls this to decide whether the instance is healthy.
// It previously reported ok without checking anything, so an instance that had
// lost its database would keep serving traffic and every request would fail —
// the one situation the check exists to catch. A cheap SELECT 1 makes the
// answer mean something.
app.get('/api/health', async (req, res) => {
  const body = {
    status: 'ok',
    service: 'SmartKisan API',
    timestamp: new Date().toISOString(),
  };

  try {
    const started = Date.now();
    await db.query('SELECT 1');
    body.database = { status: 'ok', latencyMs: Date.now() - started };
  } catch (error) {
    body.status = 'degraded';
    body.database = { status: 'error', message: error.message };
    console.error('Health check: database unreachable —', error.message);
    return res.status(503).json(body);
  }

  res.json(body);
});

// ============================================================
// ACCOUNT DELETION LANDING PAGE
// ============================================================
// Google Play requires a publicly reachable URL describing how to delete an
// account, reachable without installing the app. Served here so it shares the
// API's domain and certificate.

app.get('/delete-account', (req, res) => {
  res.type('html').send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Delete your SmartKisan account</title>
    <style>
      body { font-family: system-ui, -apple-system, sans-serif; max-width: 40rem;
             margin: 0 auto; padding: 2rem 1.25rem; line-height: 1.6; color: #212121; }
      h1 { color: #2E7D32; font-size: 1.5rem; }
      ol { padding-left: 1.25rem; }
      .note { background: #F1F8E9; border-left: 4px solid #4CAF50;
              padding: 0.75rem 1rem; border-radius: 4px; }
    </style>
  </head>
  <body>
    <h1>Delete your SmartKisan account</h1>
    <p>You can delete your account and its data at any time from inside the app:</p>
    <ol>
      <li>Open SmartKisan and sign in.</li>
      <li>Go to <strong>More &rarr; Delete Account</strong>.</li>
      <li>Confirm. Your account is removed immediately.</li>
    </ol>
    <p class="note">
      Deleting your account permanently removes your profile, fields, crops,
      devices and pump history. This cannot be undone.
    </p>
    <p>If you cannot access the app, email
      <a href="mailto:ikrishmabhatia@gmail.com">ikrishmabhatia@gmail.com</a>
      from your registered address and we will delete the account for you.</p>
  </body>
</html>`);
});

// ============================================================
// AUTH ROUTES
// ============================================================

app.use('/api/auth', authRoutes);

// ============================================================
// PROTECTED ROUTES
// ============================================================

app.use(
  '/api/pumps',
  authMiddleware,
  pumpRoutes
);

app.use(
  '/api/pump-groups',
  authMiddleware,
  pumpGroupRoutes
);

app.use(
  '/api/ai',
  authMiddleware,
  aiPumpRoutes
);

app.use(
  '/api/fields',
  authMiddleware,
  fieldRoutes
);

app.use(
  '/api/crops',
  authMiddleware,
  cropRoutes
);

app.use(
  '/api/devices',
  authMiddleware,
  deviceRoutes
);

app.use(
  '/api/soil',
  authMiddleware,
  soilRoutes
);

app.use(
  '/api/profile',
  authMiddleware,
  profileRoutes
);

// ============================================================
// 404 HANDLER
// ============================================================

app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
  });
});

// ============================================================
// GLOBAL ERROR HANDLER
// ============================================================

app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);

  res.status(500).json({
    error: 'Internal server error',
  });
});

// ============================================================
// START SERVER
// ============================================================

// Socket.IO needs a raw HTTP server to attach to, so the app is wrapped rather
// than calling app.listen directly.
const server = http.createServer(app);

initSocket(server);

server.listen(PORT, '0.0.0.0', () => {

  // Initialize MQTT
  initMQTT();

  // Start the AI Pump scheduler loop
  startAiScheduler();

  console.log(
    `\n🚀 SmartKisan API running on port ${PORT}`
  );

  console.log(
    `Local: http://localhost:${PORT}/api/health`
  );

  console.log(
    `Auth API: http://localhost:${PORT}/api/auth`
  );

  console.log(
    `Pumps API: http://localhost:${PORT}/api/pumps\n`
  );
});


// ============================================================
// GRACEFUL SHUTDOWN
// ============================================================
// The platform sends SIGTERM on every deploy and before idling the instance,
// then kills the process shortly after. Without handling it, in-flight requests
// are dropped mid-response and the database pool is torn down without closing
// its connections — which on a connection-capped tier leaves sockets lingering
// server-side until they time out.
//
// Closing the HTTP server first stops new connections while letting current
// requests finish, then the pool is drained.

let shuttingDown = false;

async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`
${signal} received — shutting down`);

  // Backstop: if something refuses to settle, exit anyway rather than being
  // hard-killed mid-write.
  const failsafe = setTimeout(() => {
    console.error('Shutdown timed out — exiting');
    process.exit(1);
  }, 10000);
  failsafe.unref();

  server.close(async () => {
    try {
      await pool.end();
      console.log('Database pool closed');
    } catch (error) {
      console.error('Error closing pool:', error.message);
    }
    clearTimeout(failsafe);
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// An unhandled rejection leaves the process in an unknown state. Log it loudly
// rather than letting Node terminate on a stack trace with no context.
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason);
});

module.exports = app;
