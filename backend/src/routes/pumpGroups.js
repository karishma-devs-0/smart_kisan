const express = require('express');
const router = express.Router();
const { getDb } = require('../config/firebase');
const admin = require('firebase-admin');

/**
 * GET /api/pump-groups - List all pump groups for user
 */
router.get('/', async (req, res) => {
  try {
    const db = getDb();
    const snapshot = await db
      .collection('pumpGroups')
      .where('ownerId', '==', req.user.uid)
      .orderBy('createdAt', 'desc')
      .get();

    const groups = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json({ groups, count: groups.length });
  } catch (error) {
    console.error('GET /pump-groups error:', error);
    res.status(500).json({ error: 'Failed to fetch pump groups' });
  }
});

/**
 * POST /api/pump-groups - Create a pump group
 * Body: { name, pumpIds: [...] }
 */
router.post('/', async (req, res) => {
  try {
    const { name, pumpIds } = req.body;

    if (!name) return res.status(400).json({ error: 'Group name is required' });
    if (!pumpIds || !Array.isArray(pumpIds) || pumpIds.length === 0)
      return res.status(400).json({ error: 'At least one pump ID is required' });

    const db = getDb();

    // Verify all pumps belong to user
    for (const pumpId of pumpIds) {
      const pumpDoc = await db.collection('pumps').doc(pumpId).get();
      if (!pumpDoc.exists || pumpDoc.data().ownerId !== req.user.uid) {
        return res.status(400).json({ error: `Pump ${pumpId} not found or not authorized` });
      }
    }

    const groupData = {
      name,
      pumpIds,
      ownerId: req.user.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection('pumpGroups').add(groupData);
    res.status(201).json({ id: docRef.id, ...groupData, message: 'Group created' });
  } catch (error) {
    console.error('POST /pump-groups error:', error);
    res.status(500).json({ error: 'Failed to create group' });
  }
});

/**
 * PUT /api/pump-groups/:id - Update group
 * Body: { name?, pumpIds? }
 */
router.put('/:id', async (req, res) => {
  try {
    const db = getDb();
    const doc = await db.collection('pumpGroups').doc(req.params.id).get();

    if (!doc.exists) return res.status(404).json({ error: 'Group not found' });
    if (doc.data().ownerId !== req.user.uid)
      return res.status(403).json({ error: 'Not authorized' });

    const updates = {};
    if (req.body.name) updates.name = req.body.name;
    if (req.body.pumpIds) updates.pumpIds = req.body.pumpIds;
    updates.updatedAt = admin.firestore.FieldValue.serverTimestamp();

    await db.collection('pumpGroups').doc(req.params.id).update(updates);
    res.json({ id: req.params.id, ...updates, message: 'Group updated' });
  } catch (error) {
    console.error('PUT /pump-groups/:id error:', error);
    res.status(500).json({ error: 'Failed to update group' });
  }
});

/**
 * DELETE /api/pump-groups/:id - Delete group
 */
router.delete('/:id', async (req, res) => {
  try {
    const db = getDb();
    const doc = await db.collection('pumpGroups').doc(req.params.id).get();

    if (!doc.exists) return res.status(404).json({ error: 'Group not found' });
    if (doc.data().ownerId !== req.user.uid)
      return res.status(403).json({ error: 'Not authorized' });

    await db.collection('pumpGroups').doc(req.params.id).delete();
    res.json({ message: 'Group deleted' });
  } catch (error) {
    console.error('DELETE /pump-groups/:id error:', error);
    res.status(500).json({ error: 'Failed to delete group' });
  }
});

/**
 * POST /api/pump-groups/:id/control - Control all pumps in group
 * Body: { action: 'on' | 'off' }
 */
router.post('/:id/control', async (req, res) => {
  try {
    const { action } = req.body;
    if (!['on', 'off'].includes(action))
      return res.status(400).json({ error: 'Action must be "on" or "off"' });

    const db = getDb();
    const groupDoc = await db.collection('pumpGroups').doc(req.params.id).get();

    if (!groupDoc.exists) return res.status(404).json({ error: 'Group not found' });
    if (groupDoc.data().ownerId !== req.user.uid)
      return res.status(403).json({ error: 'Not authorized' });

    const { pumpIds, name: groupName } = groupDoc.data();
    const results = [];
    const batch = db.batch();

    for (const pumpId of pumpIds) {
      const pumpRef = db.collection('pumps').doc(pumpId);
      const pumpDoc = await pumpRef.get();

      if (pumpDoc.exists) {
        const pumpData = pumpDoc.data();
        const now = new Date();

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

        batch.update(pumpRef, updateData);

        // Log individually
        const historyRef = db.collection('pumpHistory').doc();
        batch.set(historyRef, {
          pumpId,
          pumpName: pumpData.name,
          action,
          triggeredBy: 'group',
          groupId: req.params.id,
          groupName,
          userId: req.user.uid,
          duration: action === 'off' ? additionalRunTime : null,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });

        results.push({ pumpId, name: pumpData.name, status: action });
      }
    }

    await batch.commit();

    res.json({
      groupId: req.params.id,
      action,
      pumpsControlled: results.length,
      results,
      message: `All pumps in "${groupName}" turned ${action}`,
    });
  } catch (error) {
    console.error('POST /pump-groups/:id/control error:', error);
    res.status(500).json({ error: 'Failed to control group' });
  }
});

module.exports = router;
