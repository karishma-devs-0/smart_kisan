// Firebase has been removed from this project. Auth runs through the local
// Express backend (see backend/src/routes/auth.js) and there is no Firestore
// usage anywhere active. This file is kept as a stub so legacy import sites
// resolve at bundle time. All exports are null/false.
//
// The `firebase` npm package is no longer a dependency.

export const app = null;
export const auth = null;
export const db = null;
export const FIREBASE_ENABLED = false;
