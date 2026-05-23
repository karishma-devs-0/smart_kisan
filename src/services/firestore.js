// Firebase / Firestore has been removed from this project. This file is a
// stub kept for backwards compatibility with legacy `if (FIREBASE_ENABLED)`
// branches in api.js — those branches never execute (FIREBASE_ENABLED = false)
// but Metro still resolves the import statically. All methods reject so a
// regression that wires Firestore back in is loud, not silent.

const FIREBASE_REMOVED = () => {
  throw new Error('Firestore is no longer used — Firebase was removed from this project.');
};

export const firestoreService = {
  getAll: FIREBASE_REMOVED,
  getById: FIREBASE_REMOVED,
  create: FIREBASE_REMOVED,
  update: FIREBASE_REMOVED,
  remove: FIREBASE_REMOVED,
  setSingleton: FIREBASE_REMOVED,
  getSingleton: FIREBASE_REMOVED,
};
