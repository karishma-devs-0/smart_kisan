const express = require('express');
const router = express.Router();
const { getDb } = require('../config/firebase');
const admin = require('firebase-admin');

// ============================================================
// PUMP CRUD
// ============================================================

/**
 * GET /api/pumps - List all pumps for authenticated user
 */
router.get('/', async (req, res) => {
  try {
    const db = getDb();
    const snapshot = await db
      .collection('pumps')
      .where('ownerId', '==', req.user.uid)
      .orderBy('createdAt', 'desc')
      .get();

    const pumps = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json({ pumps, count: pumps.length });
  } catch (error) {
    console.error('GET /pumps error:', error);
    res.status(500).json({ error: 'Failed to fetch pumps' });
  }
});

/**
 * GET /api/pumps/:id - Get single pump details
 */
router.get('/:id', async (req, res) => {
  try {
    const db = getDb();
    const doc = await db.collection('pumps').doc(req.params.id).get();

    if (!doc.exists) return res.status(404).json({ error: 'Pump not found' });
    if (doc.data().ownerId !== req.user.uid)
      return res.status(403).json({ error: 'Not authorized' });

    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error('GET /pumps/:id error:', error);
    res.status(500).json({ error: 'Failed to fetch pump' });
  }
});

/**
 * POST /api/pumps - Add a new pump
 * Body: { name, type, powerRating, flowRate, location? }
 */
router.post('/', async (req, res) => {
  try {
    const { name, type, powerRating, flowRate, location } = req.body;

    if (!name) return res.status(400).json({ error: 'Pump name is required' });

    const db = getDb();
    const pumpData = {
      name,
      type: type || 'submersible',
      powerRating: powerRating || null,
      flowRate: flowRate || null,
      location: location || null,
      status: 'off',
      isOnline: true,
      ownerId: req.user.uid,
      lastAction: null,
      totalRunTime: 0, // in seconds
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection('pumps').add(pumpData);
    res.status(201).json({ id: docRef.id, ...pumpData, message: 'Pump created' });
  } catch (error) {
    console.error('POST /pumps error:', error);
    res.status(500).json({ error: 'Failed to create pump' });
  }
});

/**
 * PUT /api/pumps/:id - Update pump settings
 * Body: { name?, type?, powerRating?, flowRate?, location? }
 */
router.put('/:id', async (req, res) => {
  try {
    const db = getDb();
    const doc = await db.collection('pumps').doc(req.params.id).get();

    if (!doc.exists) return res.status(404).json({ error: 'Pump not found' });
    if (doc.data().ownerId !== req.user.uid)
      return res.status(403).json({ error: 'Not authorized' });

    const allowedFields = ['name', 'type', 'powerRating', 'flowRate', 'location'];
    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });
    updates.updatedAt = admin.firestore.FieldValue.serverTimestamp();

    await db.collection('pumps').doc(req.params.id).update(updates);
    res.json({ id: req.params.id, ...updates, message: 'Pump updated' });
  } catch (error) {
    console.error('PUT /pumps/:id error:', error);
    res.status(500).json({ error: 'Failed to update pump' });
  }
});

/**
 * DELETE /api/pumps/:id - Delete a pump
 */
router.delete('/:id', async (req, res) => {
  try {
    const db = getDb();
    const doc = await db.collection('pumps').doc(req.params.id).get();

    if (!doc.exists) return res.status(404).json({ error: 'Pump not found' });
    if (doc.data().ownerId !== req.user.uid)
      return res.status(403).json({ error: 'Not authorized' });

    await db.collection('pumps').doc(req.params.id).delete();
    res.json({ message: 'Pump deleted' });
  } catch (error) {
    console.error('DELETE /pumps/:id error:', error);
    res.status(500).json({ error: 'Failed to delete pump' });
  }
});

// ============================================================
// PUMP CONTROL
// ============================================================

/**
 * POST /api/pumps/:id/control - Turn pump ON or OFF
 * Body: { action: 'on' | 'off' }
 */
router.post('/:id/control', async (req, res) => {
  try {
    const { action } = req.body;
    if (!['on', 'off'].includes(action))
      return res.status(400).json({ error: 'Action must be "on" or "off"' });

    const db = getDb();
    const pumpRef = db.collection('pumps').doc(req.params.id);
    const doc = await pumpRef.get();

    if (!doc.exists) return res.status(404).json({ error: 'Pump not found' });
    if (doc.data().ownerId !== req.user.uid)
      return res.status(403).json({ error: 'Not authorized' });

    const pumpData = doc.data();
    const now = new Date();

    // Calculate run time if turning off
    let additionalRunTime = 0;
    if (action === 'off' && pumpData.status === 'on' && pumpData.lastTurnedOn) {
      const lastOn = pumpData.lastTurnedOn.toDate ? pumpData.lastTurnedOn.toDate() : new Date(pumpData.lastTurnedOn);
      additionalRunTime = Math.floor((now - lastOn) / 1000);
    }

    const updateData = {
      status: action,
      lastAction: action === 'on' ? 'turned_on' : 'turned_off',
      lastActionAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (action === 'on') {
      updateData.lastTurnedOn = admin.firestore.FieldValue.serverTimestamp();
    } else {
      updateData.lastTurnedOff = admin.firestore.FieldValue.serverTimestamp();
      updateData.totalRunTime = (pumpData.totalRunTime || 0) + additionalRunTime;
    }

    await pumpRef.update(updateData);

    // Log to history
    await db.collection('pumpHistory').add({
      pumpId: req.params.id,
      pumpName: pumpData.name,
      action,
      triggeredBy: 'manual',
      userId: req.user.uid,
      duration: action === 'off' ? additionalRunTime : null,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({
      id: req.params.id,
      status: action,
      message: `Pump turned ${action}`,
      runTime: action === 'off' ? additionalRunTime : null,
    });
  } catch (error) {
    console.error('POST /pumps/:id/control error:', error);
    res.status(500).json({ error: 'Failed to control pump' });
  }
});

/**
 * POST /api/pumps/:id/timer - Set auto-off timer
 * Body: { duration: <seconds> }
 */
router.post('/:id/timer', async (req, res) => {
  try {
    const { duration } = req.body;
    if (!duration || duration <= 0)
      return res.status(400).json({ error: 'Duration must be a positive number (seconds)' });

    const db = getDb();
    const pumpRef = db.collection('pumps').doc(req.params.id);
    const doc = await pumpRef.get();

    if (!doc.exists) return res.status(404).json({ error: 'Pump not found' });
    if (doc.data().ownerId !== req.user.uid)
      return res.status(403).json({ error: 'Not authorized' });

    const autoOffAt = new Date(Date.now() + duration * 1000);

    // Turn pump on and set timer
    await pumpRef.update({
      status: 'on',
      lastTurnedOn: admin.firestore.FieldValue.serverTimestamp(),
      lastAction: 'timer_started',
      lastActionAt: admin.firestore.FieldValue.serverTimestamp(),
      timer: {
        active: true,
        duration,
        startedAt: admin.firestore.FieldValue.serverTimestamp(),
        autoOffAt: admin.firestore.Timestamp.fromDate(autoOffAt),
      },
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Log to history
    await db.collection('pumpHistory').add({
      pumpId: req.params.id,
      pumpName: doc.data().name,
      action: 'timer_started',
      triggeredBy: 'timer',
      userId: req.user.uid,
      duration,
      autoOffAt: admin.firestore.Timestamp.fromDate(autoOffAt),
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({
      id: req.params.id,
      status: 'on',
      timer: { duration, autoOffAt: autoOffAt.toISOString() },
      message: `Pump on with ${duration}s timer`,
    });
  } catch (error) {
    console.error('POST /pumps/:id/timer error:', error);
    res.status(500).json({ error: 'Failed to set timer' });
  }
});

/**
 * POST /api/pumps/:id/schedule - Create a schedule
 * Body: { startTime: ISO string, stopTime: ISO string, repeat?: 'daily'|'weekly'|'none', days?: [0-6] }
 */
router.post('/:id/schedule', async (req, res) => {
  try {
    const { startTime, stopTime, repeat, days } = req.body;

    if (!startTime || !stopTime)
      return res.status(400).json({ error: 'startTime and stopTime required (ISO format)' });

    const start = new Date(startTime);
    const stop = new Date(stopTime);
    if (stop <= start)
      return res.status(400).json({ error: 'stopTime must be after startTime' });

    const db = getDb();
    const pumpDoc = await db.collection('pumps').doc(req.params.id).get();

    if (!pumpDoc.exists) return res.status(404).json({ error: 'Pump not found' });
    if (pumpDoc.data().ownerId !== req.user.uid)
      return res.status(403).json({ error: 'Not authorized' });

    const scheduleData = {
      pumpId: req.params.id,
      pumpName: pumpDoc.data().name,
      ownerId: req.user.uid,
      startTime: admin.firestore.Timestamp.fromDate(start),
      stopTime: admin.firestore.Timestamp.fromDate(stop),
      repeat: repeat || 'none',
      days: days || [],
      active: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection('pumpSchedules').add(scheduleData);

    res.status(201).json({
      id: docRef.id,
      ...scheduleData,
      startTime: start.toISOString(),
      stopTime: stop.toISOString(),
      message: 'Schedule created',
    });
  } catch (error) {
    console.error('POST /pumps/:id/schedule error:', error);
    res.status(500).json({ error: 'Failed to create schedule' });
  }
});

/**
 * GET /api/pumps/:id/schedules - Get all schedules for a pump
 */
router.get('/:id/schedules', async (req, res) => {
  try {
    const db = getDb();
    const snapshot = await db
      .collection('pumpSchedules')
      .where('pumpId', '==', req.params.id)
      .where('ownerId', '==', req.user.uid)
      .orderBy('createdAt', 'desc')
      .get();

    const schedules = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json({ schedules, count: schedules.length });
  } catch (error) {
    console.error('GET /pumps/:id/schedules error:', error);
    res.status(500).json({ error: 'Failed to fetch schedules' });
  }
});

/**
 * DELETE /api/pumps/:id/schedules/:scheduleId - Delete a schedule
 */
router.delete('/:id/schedules/:scheduleId', async (req, res) => {
  try {
    const db = getDb();
    const doc = await db.collection('pumpSchedules').doc(req.params.scheduleId).get();

    if (!doc.exists) return res.status(404).json({ error: 'Schedule not found' });
    if (doc.data().ownerId !== req.user.uid)
      return res.status(403).json({ error: 'Not authorized' });

    await db.collection('pumpSchedules').doc(req.params.scheduleId).delete();
    res.json({ message: 'Schedule deleted' });
  } catch (error) {
    console.error('DELETE schedule error:', error);
    res.status(500).json({ error: 'Failed to delete schedule' });
  }
});

// ============================================================
// PUMP HISTORY
// ============================================================

/**
 * GET /api/pumps/:id/history - Get pump action history
 * Query: ?limit=50&offset=0
 */
router.get('/:id/history', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const db = getDb();

    // Verify ownership
    const pumpDoc = await db.collection('pumps').doc(req.params.id).get();
    if (!pumpDoc.exists) return res.status(404).json({ error: 'Pump not found' });
    if (pumpDoc.data().ownerId !== req.user.uid)
      return res.status(403).json({ error: 'Not authorized' });

    const snapshot = await db
      .collection('pumpHistory')
      .where('pumpId', '==', req.params.id)
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();

    const history = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json({ history, count: history.length });
  } catch (error) {
    console.error('GET /pumps/:id/history error:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

module.exports = router;
