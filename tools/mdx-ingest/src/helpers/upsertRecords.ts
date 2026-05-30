import { eq, inArray } from 'drizzle-orm';
import {
    posts as postsTable,
    projects as projectsTable,
    coursework as courseworkTable,
    questions as questionsTable,
    tags as tagsTable,
    content_tags as contentTagsTable,
    question_tags as questionTagsTable,
} from '@prj--personal-portfolio--v3/shared--db-schema';
import { upsertWithLockCheck, type UpsertResult, type DrizzleDb } from '@prj--personal-portfolio--v3/shared--db';
import type { NormalisedRows } from './normalise.ts';

export type UpsertSummary = {
    inserted:       number;
    updated:        number;
    skipped:        number;
    tags:           number;
    contentLinks:   number;
    questionLinks:  number;
    questionsSkipped: number;
};

type UpsertRecordsOptions = {
    db:     DrizzleDb;
    rows:   NormalisedRows;
    dryRun?: boolean;
};

const upsertTags = (db: DrizzleDb, rows: NormalisedRows, dryRun: boolean): number => {
    if (dryRun) {
        console.log(`  [dry-run] would upsert ${rows.tags.length} tag(s)`);
        return rows.tags.length;
    }

    for (const tag of rows.tags) {
        db.insert(tagsTable)
            .values(tag)
            .onConflictDoNothing()
            .run();
    }

    return rows.tags.length;
};

const syncContentTags = (
    db: DrizzleDb,
    upsertedSlugs: Set<string>,
    rows: NormalisedRows,
    dryRun: boolean,
): number => {
    const links = rows.contentTags.filter((l) => upsertedSlugs.has(l.content_slug));

    if (dryRun) {
        console.log(`  [dry-run] would sync ${links.length} content tag link(s)`);
        return links.length;
    }

    for (const slug of upsertedSlugs) {
        if (rows.contentTags.some((l) => l.content_slug === slug)) {
            db.delete(contentTagsTable).where(eq(contentTagsTable.content_slug, slug)).run();
        }
    }

    for (const link of links) {
        db.insert(contentTagsTable).values(link).onConflictDoNothing().run();
    }

    return links.length;
};

const syncQuestionTags = (
    db: DrizzleDb,
    upsertedQuestionSlugs: Set<string>,
    rows: NormalisedRows,
    dryRun: boolean,
): number => {
    const links = rows.questionTags.filter((l) => upsertedQuestionSlugs.has(l.question_slug));

    if (dryRun) {
        console.log(`  [dry-run] would sync ${links.length} question tag link(s)`);
        return links.length;
    }

    for (const slug of upsertedQuestionSlugs) {
        if (rows.questionTags.some((l) => l.question_slug === slug)) {
            db.delete(questionTagsTable).where(eq(questionTagsTable.question_slug, slug)).run();
        }
    }

    for (const link of links) {
        db.insert(questionTagsTable).values(link).onConflictDoNothing().run();
    }

    return links.length;
};

const loadExistingPostSlugs = (db: DrizzleDb, slugs: string[]): Set<string> => {
    if (slugs.length === 0) return new Set();

    const rows = db
        .select({ slug: postsTable.slug })
        .from(postsTable)
        .where(inArray(postsTable.slug, slugs))
        .all();

    return new Set(rows.map((r) => r.slug));
};

export const upsertRecords = (options: UpsertRecordsOptions): UpsertSummary => {
    const { db, rows, dryRun = false } = options;

    const contentResults: UpsertResult[] = [];
    const questionResults: UpsertResult[] = [];

    for (const row of rows.posts) {
        contentResults.push(upsertWithLockCheck(db, postsTable, row, { dryRun }));
    }
    for (const row of rows.projects) {
        contentResults.push(upsertWithLockCheck(db, projectsTable, row, { dryRun }));
    }
    for (const row of rows.coursework) {
        contentResults.push(upsertWithLockCheck(db, courseworkTable, row, { dryRun }));
    }

    const upsertedContentSlugs = new Set(
        contentResults.filter((r) => r.outcome !== 'skipped').map((r) => r.slug),
    );

    const tagCount        = upsertTags(db, rows, dryRun);
    const contentLinkCount = syncContentTags(db, upsertedContentSlugs, rows, dryRun);

    // Questions require parent post to exist (FK on post_slug)
    const parentSlugs = [...new Set(rows.questions.map((q) => q.post_slug))];
    const existingPostSlugs = dryRun
        ? new Set(parentSlugs)   // assume all parents exist in dry-run
        : loadExistingPostSlugs(db, parentSlugs);

    let questionsSkipped = 0;

    for (const row of rows.questions) {
        if (!existingPostSlugs.has(row.post_slug)) {
            questionsSkipped++;
            console.warn(`  [skip] question "${row.slug}": parent post "${row.post_slug}" not found`);
            continue;
        }
        questionResults.push(upsertWithLockCheck(db, questionsTable, row, { dryRun }));
    }

    const upsertedQuestionSlugs = new Set(
        questionResults.filter((r) => r.outcome !== 'skipped').map((r) => r.slug),
    );

    const questionLinkCount = syncQuestionTags(db, upsertedQuestionSlugs, rows, dryRun);

    const summary: UpsertSummary = {
        inserted: 0,
        updated: 0,
        skipped: 0,
        tags: tagCount,
        contentLinks: contentLinkCount,
        questionLinks: questionLinkCount,
        questionsSkipped,
    };

    for (const r of [...contentResults, ...questionResults]) {
        summary[r.outcome]++;
    }

    console.log(
        `[upsert] inserted=${summary.inserted}  updated=${summary.updated}  skipped=${summary.skipped}  ` +
        `tags=${summary.tags}  contentLinks=${summary.contentLinks}  questionLinks=${summary.questionLinks}` +
        (questionsSkipped > 0 ? `  questionsSkipped=${questionsSkipped}` : '') +
        (dryRun ? '  (dry-run)' : ''),
    );

    return summary;
};
