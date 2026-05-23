import { firestoreService } from './firestore';
import { auth } from './firebase';
import { MOCK_FIELDS } from '../features/fields/mock/fieldsMockData';
import { MOCK_DEVICES } from '../features/devices/mock/devicesMockData';
import { MOCK_PUMPS, MOCK_PUMP_GROUPS } from '../features/pumps/mock/pumpsMockData';
import { MOCK_CROPS } from '../features/crops/mock/cropsMockData';
import { MOCK_SOIL_CURRENT, MOCK_SOIL_READINGS, SOIL_CROPS } from '../features/soil/mock/soilMockData';
import { MOCK_FARM_TASKS } from '../features/farm/mock/farmMockData';

/**
 * Seeds Firestore with mock data on first login.
 * Only runs if the user has no fields (first-time indicator).
 *
 * No-ops when there's no Firebase user — auth now goes through the backend,
 * so Firestore seeding only applies when a Firebase session is still active.
 */
export async function seedUserData() {
  if (!auth?.currentUser?.uid) {
    if (__DEV__) {
      console.log('[seedData] Skipping — no Firebase user (auth runs through backend now)');
    }
    return;
  }

  try {
    const existing = await firestoreService.getAll('fields');
    if (existing.length > 0) return; // Already seeded

    const seedOps = [
      ...MOCK_FIELDS.map((f) => firestoreService.create('fields', f)),
      ...MOCK_DEVICES.map((d) => firestoreService.create('devices', d)),
      ...MOCK_PUMPS.map((p) => firestoreService.create('pumps', p)),
      ...MOCK_PUMP_GROUPS.map((g) => firestoreService.create('pump_groups', g)),
      ...MOCK_CROPS.map((c) => firestoreService.create('crops', c)),
      ...MOCK_FARM_TASKS.map((t) => firestoreService.create('farm_tasks', t)),
      firestoreService.setSingleton('soil', 'current', MOCK_SOIL_CURRENT),
      ...MOCK_SOIL_READINGS.map((r) => firestoreService.create('soil_readings', r)),
      ...SOIL_CROPS.slice(0, 2).map((c) => firestoreService.create('soil_crops', c)),
    ];

    await Promise.all(seedOps);
  } catch (e) {
    // Seeding is best-effort — app works without it (falls back to mock)
    if (__DEV__) console.warn('Data seeding failed:', e.message);
  }
}
