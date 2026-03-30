import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db, auth } from './firebase';

/**
 * Get a reference to a user-scoped subcollection.
 * Data structure: users/{uid}/{collectionName}/...
 */
const userCollection = (collectionName) => {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Not authenticated');
  return collection(db, 'users', uid, collectionName);
};

const userDoc = (collectionName, docId) => {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Not authenticated');
  return doc(db, 'users', uid, collectionName, docId);
};

export const firestoreService = {
  /**
   * Get all documents from a user-scoped collection.
   */
  getAll: async (collectionName) => {
    const snapshot = await getDocs(userCollection(collectionName));
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  },

  /**
   * Get a single document by ID.
   */
  getById: async (collectionName, id) => {
    const snap = await getDoc(userDoc(collectionName, id));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };
  },

  /**
   * Create a new document. If data has an `id` field, use it as the doc ID.
   */
  create: async (collectionName, data) => {
    const { id, ...rest } = data;
    if (id) {
      const ref = userDoc(collectionName, String(id));
      await setDoc(ref, rest);
      return { id: String(id), ...rest };
    }
    const ref = await addDoc(userCollection(collectionName), rest);
    return { id: ref.id, ...rest };
  },

  /**
   * Update an existing document by ID (merge).
   */
  update: async (collectionName, id, updates) => {
    await updateDoc(userDoc(collectionName, String(id)), updates);
    return { id, ...updates };
  },

  /**
   * Delete a document by ID.
   */
  remove: async (collectionName, id) => {
    await deleteDoc(userDoc(collectionName, String(id)));
    return { id };
  },

  /**
   * Set a singleton document (e.g., settings).
   */
  setSingleton: async (collectionName, docId, data) => {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error('Not authenticated');
    await setDoc(doc(db, 'users', uid, collectionName, docId), data, { merge: true });
    return data;
  },

  /**
   * Get a singleton document.
   */
  getSingleton: async (collectionName, docId) => {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error('Not authenticated');
    const snap = await getDoc(doc(db, 'users', uid, collectionName, docId));
    if (!snap.exists()) return null;
    return snap.data();
  },
};
