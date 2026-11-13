// ==============================================================================
// Grub2Day — Database Factory
// Returns configured database provider based on VITE_DB_TYPE
// ==============================================================================

import { IDatabaseProvider } from './dbInterface';
import { LocalNoSqlDb } from './localNoSqlDb';
import { FirestoreDbProvider } from './firestoreDb';
import { APP_CONFIG } from '../config/env';

let dbInstance: IDatabaseProvider | null = null;

export async function getDatabase(): Promise<IDatabaseProvider> {
  if (dbInstance) return dbInstance;

  if (APP_CONFIG.dbType === 'firestore') {
    dbInstance = new FirestoreDbProvider();
  } else {
    dbInstance = new LocalNoSqlDb();
  }

  await dbInstance.init();
  return dbInstance;
}
