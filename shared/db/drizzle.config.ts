import { defineConfig } from 'drizzle-kit';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const configDir = path.dirname(fileURLToPath(import.meta.url));

const databasePathConfig = process.env['DATABASE_PATH'] ?? '../../database/output/content.db';
const migrationsDirConfig = process.env['MIGRATIONS_DIR'] ?? '../../database/migrations';
const schemaPathConfig = process.env['SCHEMA_DIR'] ?? '../db-schema/index.ts';

const databasePath = path.resolve(configDir, databasePathConfig);
const migrationsDir = path.resolve(configDir, migrationsDirConfig);

const dbDir = path.dirname(databasePath);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}
if (!fs.existsSync(migrationsDir)) {
    fs.mkdirSync(migrationsDir, { recursive: true });
}

/** Drizzle Kit expects paths relative to cwd, not absolute paths. */
const toRelativeConfigPath = (p: string): string => (path.isAbsolute(p) ? path.relative(configDir, p) : p);

export default defineConfig({
    dialect: 'sqlite',
    schema: toRelativeConfigPath(schemaPathConfig),
    out: toRelativeConfigPath(migrationsDirConfig),
    dbCredentials: {
        url: toRelativeConfigPath(databasePathConfig),
    },
});
