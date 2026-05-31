import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import type { DrizzleDb } from './connection.ts';

export const runMigrations = (db: DrizzleDb, migrationsFolder: string): void => {
    migrate(db, { migrationsFolder });
};
