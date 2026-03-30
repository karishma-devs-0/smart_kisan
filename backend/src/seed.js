/**
 * Seed script - populates Firestore with test pump data
 * Usage: node src/seed.js <userId>
 *
 * The userId should be a valid Firebase Auth UID.
 * You can find it in Firebase Console > Authentication > Users
 */
require('dotenv').config();
const { initializeFirebase, getDb } = require('./config/firebase');
const admin = require('firebase-admin');

initializeFirebase();

const SEED_PUMPS = [
  {
    name: 'Main Field Pump',
    type: 'submersible',
    powerRating: '5 HP',
    flowRate: '120 L/min',
    location: { lat: 30.7333, lng: 76.7794, label: 'Main Field' },
    status: 'off',
    isOnline: true,
    totalRunTime: 14400, // 4 hours
  },
  {
    name: 'Drip Irrigation Pump',
    type: 'centrifugal',
    powerRating: '2 HP',
    flowRate: '60 L/min',
    location: { lat: 30.7340, lng: 76.7800, label: 'Vegetable Plot' },
    status: 'off',
    isOnline: true,
    totalRunTime: 7200, // 2 hours
  },
  {
    name: 'Borewell Pump',
    type: 'submersible',
    powerRating: '7.5 HP',
    flowRate: '200 L/min',
    location: { lat: 30.7328, lng: 76.7785, label: 'Borewell - North' },
    status: 'off',
    isOnline: false,
    totalRunTime: 36000, // 10 hours
  },
  {
    name: 'Sprinkler System Pump',
    type: 'jet',
    powerRating: '3 HP',
    flowRate: '80 L/min',
    location: { lat: 30.7350, lng: 76.7810, label: 'Orchard' },
    status: 'off',
    isOnline: true,
    totalRunTime: 21600, // 6 hours
  },
];

async function seed(userId) {
  if (!userId) {
    console.error('Usage: node src/seed.js <userId>');
    console.error('Get userId from Firebase Console > Authentication > Users');
    process.exit(1);
  }

  const db = getDb();
  console.log(`Seeding data for user: ${userId}\n`);

  const pumpIds = [];

  // Create pumps
  for (const pump of SEED_PUMPS) {
    const docRef = await db.collection('pumps').add({
      ...pump,
      ownerId: userId,
      lastAction: null,
      lastTurnedOn: null,
      lastTurnedOff: null,
      timer: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    pumpIds.push(docRef.id);
    console.log(`  Created pump: ${pump.name} (${docRef.id})`);
  }

  // Create a pump group
  const groupRef = await db.collection('pumpGroups').add({
    name: 'All Field Pumps',
    pumpIds: [pumpIds[0], pumpIds[1]],
    ownerId: userId,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  console.log(`  Created group: All Field Pumps (${groupRef.id})`);

  // Create some history entries
  const actions = ['on', 'off', 'on', 'off', 'timer_started', 'off'];
  for (let i = 0; i < actions.length; i++) {
    const historyDate = new Date();
    historyDate.setHours(historyDate.getHours() - (actions.length - i) * 2);

    await db.collection('pumpHistory').add({
      pumpId: pumpIds[0],
      pumpName: SEED_PUMPS[0].name,
      action: actions[i],
      triggeredBy: actions[i] === 'timer_started' ? 'timer' : 'manual',
      userId,
      duration: actions[i] === 'off' ? Math.floor(Math.random() * 3600) + 600 : null,
      timestamp: admin.firestore.Timestamp.fromDate(historyDate),
    });
  }
  console.log(`  Created ${actions.length} history entries`);

  // Create a schedule
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(6, 0, 0, 0);
  const tomorrowStop = new Date(tomorrow);
  tomorrowStop.setHours(8, 0, 0, 0);

  await db.collection('pumpSchedules').add({
    pumpId: pumpIds[0],
    pumpName: SEED_PUMPS[0].name,
    ownerId: userId,
    startTime: admin.firestore.Timestamp.fromDate(tomorrow),
    stopTime: admin.firestore.Timestamp.fromDate(tomorrowStop),
    repeat: 'daily',
    days: [1, 2, 3, 4, 5], // weekdays
    active: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  console.log(`  Created schedule: Daily 6AM-8AM (weekdays)`);

  console.log('\nSeed complete! Firestore collections created:');
  console.log('  - pumps (4 documents)');
  console.log('  - pumpGroups (1 document)');
  console.log('  - pumpHistory (6 documents)');
  console.log('  - pumpSchedules (1 document)');
  process.exit(0);
}

const userId = process.argv[2];
seed(userId);
