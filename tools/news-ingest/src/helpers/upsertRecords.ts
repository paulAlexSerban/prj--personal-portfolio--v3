import { news_items } from '@prj--personal-portfolio--v3/shared--db-schema';
import { upsertWithLockCheck, type DrizzleDb } from '@prj--personal-portfolio--v3/shared--db';
import { and, eq, notInArray } from 'drizzle-orm';
import type { NormalisedNews } from './normalise.ts';

export async function upsertNewsItems(opts: { db: DrizzleDb; data: NormalisedNews; dryRun: boolean }): Promise<void> {
    const { db, data, dryRun } = opts;
    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    for (const row of data.rows) {
        const result = upsertWithLockCheck(db, news_items, row, { dryRun, syncSource: 'rss' });
        if (result.outcome === 'inserted') inserted += 1;
        else if (result.outcome === 'updated') updated += 1;
        else skipped += 1;
    }

    console.log(`[news-ingest] upsert: inserted=${inserted} updated=${updated} skipped=${skipped}`);

    pruneAbsentFromCache(db, data.slugs, dryRun);
}

/** Drop unlocked RSS rows that are no longer present in the latest cache files. */
function pruneAbsentFromCache(db: DrizzleDb, liveSlugs: Set<string>, dryRun: boolean): void {
    if (liveSlugs.size === 0) {
        // Empty cache: remove all unlocked rss rows so stale sources don't linger forever.
        if (dryRun) {
            const count = db
                .select({ slug: news_items.slug })
                .from(news_items)
                .where(and(eq(news_items.locked, false), eq(news_items.sync_source, 'rss')))
                .all().length;
            console.log(`[news-ingest] dry-run prune: would delete all ${count} unlocked rss rows (empty cache)`);
            return;
        }
        const result = db
            .delete(news_items)
            .where(and(eq(news_items.locked, false), eq(news_items.sync_source, 'rss')))
            .run();
        console.log(`[news-ingest] prune: deleted ${result.changes} unlocked rss rows (empty cache)`);
        return;
    }

    const slugList = [...liveSlugs];
    const stale = db
        .select({ slug: news_items.slug })
        .from(news_items)
        .where(and(eq(news_items.locked, false), eq(news_items.sync_source, 'rss'), notInArray(news_items.slug, slugList)))
        .all();

    if (stale.length === 0) {
        console.log('[news-ingest] prune: nothing to remove');
        return;
    }

    if (dryRun) {
        console.log(`[news-ingest] dry-run prune: would delete ${stale.length} rows absent from cache`);
        return;
    }

    const result = db
        .delete(news_items)
        .where(and(eq(news_items.locked, false), eq(news_items.sync_source, 'rss'), notInArray(news_items.slug, slugList)))
        .run();
    console.log(`[news-ingest] prune: deleted ${result.changes} rows absent from cache`);
}
