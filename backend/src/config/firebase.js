const admin = require('firebase-admin');
const path = require('path');

let db;

function initializeFirebase() {
  try {
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

    if (serviceAccountPath) {
      const serviceAccount = require(path.resolve(serviceAccountPath));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } else {
      // Fallback: uses GOOGLE_APPLICATION_CREDENTIALS env var or default credentials
      admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID || 'smartfarmerhbeon',
      });
    }

    db = admin.firestore();
    console.log('Firebase Admin initialized successfully');
  } catch (error) {
    console.error('Firebase initialization error:', error.message);
    process.exit(1);
  }
}

function getDb() {
  if (!db) throw new Error('Firestore not initialized');
  return db;
}

function getAuth() {
  return admin.auth();
}

module.exports = { initializeFirebase, getDb, getAuth };
