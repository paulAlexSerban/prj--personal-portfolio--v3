import {
    cheat_sheets,
    learning_plans,
    posts,
    type CheatSheetRow,
    type LearningPlanRow,
} from '@prj--personal-portfolio--v3/shared--db-schema';
import type { DrizzleDb } from '@prj--personal-portfolio--v3/shared--db';
import { and, asc, eq } from 'drizzle-orm';

import { isPublishedOnOrBefore, type BlogContentType } from '@/lib/queries/posts.ts';

/** Strip `{post_slug}--` prefix from a companion composite slug -> item slug for URLs. */
export function companionItemSlug(compositeSlug: string, postSlug: string): string {
    const prefix = `${postSlug}--`;
    return compositeSlug.startsWith(prefix) ? compositeSlug.slice(prefix.length) : compositeSlug;
}

export function getCheatSheetsForPost(db: DrizzleDb, postSlug: string): CheatSheetRow[] {
    return db
        .select()
        .from(cheat_sheets)
        .where(and(eq(cheat_sheets.post_slug, postSlug), eq(cheat_sheets.status, 'published')))
        .orderBy(asc(cheat_sheets.sort_order), asc(cheat_sheets.slug))
        .all();
}

export function getLearningPlansForPost(db: DrizzleDb, postSlug: string): LearningPlanRow[] {
    return db
        .select()
        .from(learning_plans)
        .where(and(eq(learning_plans.post_slug, postSlug), eq(learning_plans.status, 'published')))
        .orderBy(asc(learning_plans.sort_order), asc(learning_plans.slug))
        .all();
}

export function getCheatSheetBySlugs(
    db: DrizzleDb,
    postSlug: string,
    itemSlug: string,
): CheatSheetRow | undefined {
    const composite = `${postSlug}--${itemSlug}`;
    const row = db
        .select()
        .from(cheat_sheets)
        .where(
            and(
                eq(cheat_sheets.slug, composite),
                eq(cheat_sheets.post_slug, postSlug),
                eq(cheat_sheets.status, 'published'),
            ),
        )
        .get();
    return row;
}

export function getLearningPlanBySlugs(
    db: DrizzleDb,
    postSlug: string,
    itemSlug: string,
): LearningPlanRow | undefined {
    const composite = `${postSlug}--${itemSlug}`;
    return db
        .select()
        .from(learning_plans)
        .where(
            and(
                eq(learning_plans.slug, composite),
                eq(learning_plans.post_slug, postSlug),
                eq(learning_plans.status, 'published'),
            ),
        )
        .get();
}

type CompanionStaticPath = {
    params: { slug: string; itemSlug: string };
};

function companionStaticPaths(
    db: DrizzleDb,
    type: BlogContentType,
    table: typeof cheat_sheets | typeof learning_plans,
): CompanionStaticPath[] {
    const rows = db
        .select({
            postSlug: table.post_slug,
            compositeSlug: table.slug,
            postDate: posts.date,
            postType: posts.type,
        })
        .from(table)
        .innerJoin(posts, eq(table.post_slug, posts.slug))
        .where(and(eq(table.status, 'published'), eq(posts.type, type)))
        .all();

    return rows
        .filter((row) => isPublishedOnOrBefore(row.postDate))
        .map((row) => ({
            params: {
                slug: row.postSlug,
                itemSlug: companionItemSlug(row.compositeSlug, row.postSlug),
            },
        }));
}

export function getCheatSheetStaticPaths(db: DrizzleDb, type: BlogContentType): CompanionStaticPath[] {
    return companionStaticPaths(db, type, cheat_sheets);
}

export function getLearningPlanStaticPaths(db: DrizzleDb, type: BlogContentType): CompanionStaticPath[] {
    return companionStaticPaths(db, type, learning_plans);
}
