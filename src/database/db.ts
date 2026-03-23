import { open, type DB } from '@op-engineering/op-sqlite';
import { Platform } from 'react-native';
import RNFS from 'react-native-blob-util';

const DB_NAME = 'policies.db';

let db: DB | null = null;

/**
 * On first launch, copy the pre-built policies.db from Android assets
 * to the app's writable documents directory. On subsequent launches,
 * just open the existing copy.
 */
export async function initDatabase(): Promise<DB> {
  if (db) return db;

  const docDir = RNFS.fs.dirs.DocumentDir;
  const dbPath = `${docDir}/${DB_NAME}`;

  // Check if DB already exists in writable storage
  const exists = await RNFS.fs.exists(dbPath);

  if (!exists) {
    // Copy from Android assets to writable directory
    if (Platform.OS === 'android') {
      await RNFS.fs.cp(
        RNFS.fs.asset(DB_NAME),
        dbPath,
      );
    }
  }

  db = open({ name: DB_NAME, location: docDir });

  // Enable WAL mode for better read performance
  db.execute('PRAGMA journal_mode = WAL;');
  db.execute('PRAGMA cache_size = -4000;'); // 4MB cache

  // Create favorites table if it doesn't exist
  db.execute(`
    CREATE TABLE IF NOT EXISTS favorites (
      policy_id TEXT PRIMARY KEY,
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    );
  `);

  return db;
}

export function getDatabase(): DB {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

export async function closeDatabase(): Promise<void> {
  if (db) {
    db.close();
    db = null;
  }
}

/**
 * Check if the bundled DB version is newer than the installed one.
 * Used for update detection when a new APK is installed.
 */
export async function checkForDbUpdate(): Promise<boolean> {
  try {
    const database = getDatabase();
    const result = database.execute('SELECT value FROM metadata WHERE key = ?', ['version']);
    const currentVersion = result.rows?._array?.[0]?.value;

    // Compare with expected version (could be passed from build config)
    // For now, return false — updates happen via new APK
    return false;
  } catch {
    return false;
  }
}
