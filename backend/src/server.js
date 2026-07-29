require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// PostgreSQL Connection
require('./config/database');

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

app.use(express.json());

// ============================================================
// RATE LIMIT
// ============================================================

app.use(
  '/api/',
  rateLimit({
    windowMs: 60 * 1000,
    max: 100,
  })
);

// ============================================================
// HEALTH ROUTE
// ============================================================

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'SmartKisan API',
    timestamp: new Date().toISOString(),
  });
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

app.listen(PORT, '0.0.0.0', () => {

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

module.exports = app;
