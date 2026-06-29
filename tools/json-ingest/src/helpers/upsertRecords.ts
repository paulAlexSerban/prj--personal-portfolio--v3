import { experience as experienceTable, profile as profileTable, skills as skillsTable, pages as pagesTable } from '@prj--personal-portfolio--v3/shared--db-schema';
import { upsertWithLockCheck, type UpsertResult, type DrizzleDb } from '@prj--personal-portfolio--v3/shared--db';
import type { NormalisedRows } from './normalise.ts';

export type UpsertSummary = {
    inserted: number;
    updated: number;
    skipped: number;
};

type UpsertRecordsOptions = {
    db: DrizzleDb;
    rows: NormalisedRows;
    dryRun?: boolean;
};

const SYNC_SOURCE = 'json';

type UpsertRow = Record<string, unknown> & { slug: string };

export const upsertRecords = (options: UpsertRecordsOptions): UpsertSummary => {
    const { db, rows, dryRun = false } = options;
    const results: UpsertResult[] = [];

    for (const row of rows.profile) {
        results.push(upsertWithLockCheck(db, profileTable, { ...row, slug: row.slug ?? 'profile' } as UpsertRow, { dryRun, syncSource: SYNC_SOURCE }));
    }
    for (const row of rows.skills) {
        results.push(upsertWithLockCheck(db, skillsTable, row as UpsertRow, { dryRun, syncSource: SYNC_SOURCE }));
    }
    for (const row of rows.pages) {
        results.push(upsertWithLockCheck(db, pagesTable, row as UpsertRow, { dryRun, syncSource: SYNC_SOURCE }));
    }
    for (const row of rows.experience) {
        results.push(upsertWithLockCheck(db, experienceTable, row as UpsertRow, { dryRun, syncSource: SYNC_SOURCE }));
    }

    const summary: UpsertSummary = { inserted: 0, updated: 0, skipped: 0 };
    for (const r of results) {
        summary[r.outcome]++;
    }

    console.log(`[upsert] inserted=${summary.inserted}  updated=${summary.updated}  skipped=${summary.skipped}` + (dryRun ? '  (dry-run)' : ''));

    return summary;
};
