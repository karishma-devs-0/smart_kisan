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

// AI scheduler
const { start: startAiScheduler } = require('./ai/runScheduler');

const app = express();

const PORT = process.env.PORT || 5000;

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
