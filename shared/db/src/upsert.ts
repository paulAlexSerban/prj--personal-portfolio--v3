import { eq, getTableColumns } from 'drizzle-orm';
import { SQLiteTable } from 'drizzle-orm/sqlite-core';
import type { DrizzleDb } from './connection.ts';

export type UpsertOutcome = 'inserted' | 'updated' | 'skipped';

export type UpsertResult = {
    slug: string;
    outcome: UpsertOutcome;
};

type RowWithSlug = Record<string, unknown> & {
    slug: string;
    sync_source?: string | null;
    locked?: boolean | null;
};

// Columns on the table as a plain record — drizzle exposes them at runtime
// even though the base SQLiteTable type doesn't declare them.
type TableColumns = Record<string, ReturnType<typeof getTableColumns>[string]>;

export const upsertWithLockCheck = (
    db: DrizzleDb,
    table: SQLiteTable,
    row: RowWithSlug,
    options?: { dryRun?: boolean; syncSource?: string },
): UpsertResult => {
    const cols = getTableColumns(table) as TableColumns;
    const syncSource = options?.syncSource ?? 'mdx';

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const slugCol   = cols['slug']!;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const lockedCol = cols['locked']!;

    const existing = db
        .select({ locked: lockedCol })
        .from(table)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .where(eq(slugCol as any, row.slug))
        .get() as { locked: boolean } | undefined;

    if (existing?.locked) {
        console.log(`  [skip] cms-owned: ${row.slug}`);
        return { slug: row.slug, outcome: 'skipped' };
    }

    const payload: RowWithSlug = { ...row, sync_source: syncSource, locked: false };
    const isNew = !existing;

    if (options?.dryRun) {
        console.log(`  [dry-run] would ${isNew ? 'insert' : 'update'}: ${row.slug}`);
        return { slug: row.slug, outcome: isNew ? 'inserted' : 'updated' };
    }

    const { id: _id, ...updateSet } = payload;
    void _id;

    db.insert(table)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .values(payload as any)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .onConflictDoUpdate({ target: slugCol as any, set: updateSet })
        .run();

    return { slug: row.slug, outcome: isNew ? 'inserted' : 'updated' };
};
