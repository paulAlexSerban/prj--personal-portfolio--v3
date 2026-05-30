export { openConnection, closeConnection, type DrizzleDb } from './src/connection.ts';
export { runMigrations } from './src/migrate.ts';
export { upsertWithLockCheck, type UpsertOutcome, type UpsertResult } from './src/upsert.ts';
