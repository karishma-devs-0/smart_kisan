require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const { initializeFirebase } = require('./config/firebase');
const { initMQTT } = require('./services/mqttService');
const authMiddleware = require('./middleware/auth');
const pumpRoutes = require('./routes/pumps');
const pumpGroupRoutes = require('./routes/pumpGroups');

// Initialize Firebase Admin
initializeFirebase();

// Initialize MQTT broker connection
initMQTT();

const app = express();
const PORT = process.env.PORT || 5000;

// ============================================================
// MIDDLEWARE
// ============================================================

// Security headers
app.use(helmet());

// CORS - allow mobile app requests
app.use(cors({
  origin: '*', // Allow all origins for mobile app
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Parse JSON bodies
app.use(express.json());

// Rate limiting - 100 requests per minute per IP
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later' },
});
app.use('/api/', limiter);

// ============================================================
// ROUTES
// ============================================================

// Health check (no auth required)
app.get('/api/health', (req, res) => {
  const { getClient } = require('./services/mqttService');
  const mqttClient = getClient();
  res.json({
    status: 'ok',
    service: 'SmartKisan API',
    version: '1.0.0',
    mqtt: mqttClient?.connected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

// Protected routes
app.use('/api/pumps', authMiddleware, pumpRoutes);
app.use('/api/pump-groups', authMiddleware, pumpGroupRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ============================================================
// START SERVER
// ============================================================

app.listen(PORT, () => {
  console.log(`\n🚀 SmartKisan API running on http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}\n`);
});

module.exports = app;
