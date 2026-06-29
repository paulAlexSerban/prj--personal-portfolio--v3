import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from '@prj--personal-portfolio--v3/shared--db-schema';

export type DrizzleDb = ReturnType<typeof drizzle<typeof schema>>;

export const openConnection = (dbPath: string): DrizzleDb => {
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
    }

    const sqlite = new Database(dbPath);
    sqlite.pragma('journal_mode = WAL');
    sqlite.pragma('foreign_keys = ON');
    return drizzle(sqlite, { schema });
};

export const closeConnection = (db: DrizzleDb): void => {
    db.$client.close();
};
