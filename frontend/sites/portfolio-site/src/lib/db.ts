import path from 'node:path';

import {
    closeConnection,
    openConnection,
    type DrizzleDb,
} from '@prj--personal-portfolio--v3/shared--db';

export { closeConnection, type DrizzleDb };

const PORTFOLIO_SITE_ROOT = path.resolve(import.meta.dirname, '../..');
const DEFAULT_DB_PATH = path.resolve(PORTFOLIO_SITE_ROOT, '../../../database/output/content.db');

export function openDb(): DrizzleDb {
    const dbPath = process.env.DATABASE_PATH ?? DEFAULT_DB_PATH;
    return openConnection(dbPath);
}
