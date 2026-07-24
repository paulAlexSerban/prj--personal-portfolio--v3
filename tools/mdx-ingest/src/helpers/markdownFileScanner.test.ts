import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { markdownFilesScanner } from './markdownFileScanner.ts';
import { markdownParser } from './markdownParser.ts';
import { normalise } from './normalise.ts';
import { validateParsedFiles } from './validateParsedFiles.ts';

let fixtureRoot = '';

async function writeFile(relativePath: string, content: string): Promise<void> {
    const filePath = path.join(fixtureRoot, relativePath);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, content);
}

beforeEach(async () => {
    fixtureRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'mdx-ingest-'));
});

afterEach(async () => {
    if (fixtureRoot) {
        await fs.rm(fixtureRoot, { recursive: true, force: true });
    }
});

const postMdx = `---
title: My Post
status: published
date: 2024-03-01
---

Body
`;

const questionMdx = `---
question: What is 2+2?
status: published
---

## Answer

4
`;

const companionMdx = `---
title: Companion Title
status: published
---

Body
`;

describe('markdownFilesScanner', () => {
    it('collects parent content but not nested questions under posts', async () => {
        await writeFile('posts/2024/03/my-post/my-post.mdx', postMdx);
        await writeFile('posts/2024/03/my-post/questions/my-post--q1.mdx', questionMdx);

        const scanned = await markdownFilesScanner({ baseDir: fixtureRoot })();
        const posts = scanned.find((dir) => dir.typeName === 'posts');

        expect(posts?.files).toEqual(['2024/03/my-post/my-post.mdx']);
        expect(posts?.files).not.toContain('2024/03/my-post/questions/my-post--q1.mdx');
    });

    it('emits nested questions under a synthetic questions directory with publish-relative paths', async () => {
        await writeFile('posts/2024/03/my-post/my-post.mdx', postMdx);
        await writeFile('posts/2024/03/my-post/questions/my-post--q1.mdx', questionMdx);
        await writeFile('booknotes/2025/01/some-book/some-book.mdx', postMdx);
        await writeFile('booknotes/2025/01/some-book/questions/some-book--q1.mdx', questionMdx);

        const scanned = await markdownFilesScanner({ baseDir: fixtureRoot })();
        const questions = scanned.find((dir) => dir.typeName === 'questions');

        expect(questions?.path).toBe(fixtureRoot);
        expect(questions?.files).toEqual(expect.arrayContaining(['posts/2024/03/my-post/questions/my-post--q1.mdx', 'booknotes/2025/01/some-book/questions/some-book--q1.mdx']));
    });

    it('does not emit a questions directory when no nested questions exist', async () => {
        await writeFile('posts/2024/03/my-post/my-post.mdx', postMdx);

        const scanned = await markdownFilesScanner({ baseDir: fixtureRoot })();

        expect(scanned.find((dir) => dir.typeName === 'questions')).toBeUndefined();
    });

    it('excludes intermediary, flat cheat_sheet, and learning_plan from ordinary posts walk', async () => {
        await writeFile('posts/2024/03/my-post/my-post.mdx', postMdx);
        await writeFile('posts/2024/03/my-post/cheat_sheet.mdx', companionMdx);
        await writeFile('posts/2024/03/my-post/learning_plan/20hours.mdx', companionMdx);
        await writeFile('posts/2024/03/my-post/intermediary/scratch.md', '# scratch\n');

        const scanned = await markdownFilesScanner({ baseDir: fixtureRoot })();
        const posts = scanned.find((dir) => dir.typeName === 'posts');

        expect(posts?.files).toEqual(['2024/03/my-post/my-post.mdx']);
    });

    it('emits flat and folder cheat sheets under synthetic cheat_sheets directory', async () => {
        await writeFile('posts/2024/03/my-post/my-post.mdx', postMdx);
        await writeFile('posts/2024/03/my-post/cheat_sheet.mdx', companionMdx);
        await writeFile('posts/2024/03/my-post/cheat_sheet/extra.mdx', companionMdx);

        const scanned = await markdownFilesScanner({ baseDir: fixtureRoot })();
        const cheatSheets = scanned.find((dir) => dir.typeName === 'cheat_sheets');

        expect(cheatSheets?.path).toBe(fixtureRoot);
        expect(cheatSheets?.files).toEqual(expect.arrayContaining(['posts/2024/03/my-post/cheat_sheet.mdx', 'posts/2024/03/my-post/cheat_sheet/extra.mdx']));
    });

    it('emits learning plans under synthetic learning_plans directory', async () => {
        await writeFile('posts/2024/03/my-post/my-post.mdx', postMdx);
        await writeFile('posts/2024/03/my-post/learning_plan/20hours.mdx', companionMdx);

        const scanned = await markdownFilesScanner({ baseDir: fixtureRoot })();
        const learningPlans = scanned.find((dir) => dir.typeName === 'learning_plans');

        expect(learningPlans?.files).toEqual(['posts/2024/03/my-post/learning_plan/20hours.mdx']);
    });
});

describe('nested question ingest pipeline', () => {
    it('parses nested questions with parentPostSlug from the path', async () => {
        await writeFile('posts/2024/03/my-post/my-post.mdx', postMdx);
        await writeFile('posts/2024/03/my-post/questions/my-post--q1.mdx', questionMdx);

        const scanned = await markdownFilesScanner({ baseDir: fixtureRoot })();
        const parsed = await markdownParser(scanned);
        const question = parsed.find((file) => file.contentType === 'question');

        expect(question).toMatchObject({
            slug: 'my-post--q1',
            contentType: 'question',
            parentPostSlug: 'my-post',
        });
    });

    it('skips questions when parent folder slug does not match filename post_slug', async () => {
        await writeFile('posts/2024/03/my-post/my-post.mdx', postMdx);
        await writeFile('posts/2024/03/my-post/questions/wrong-post--q1.mdx', questionMdx);

        const scanned = await markdownFilesScanner({ baseDir: fixtureRoot })();
        const parsed = await markdownParser(scanned);
        const validated = validateParsedFiles(parsed);
        const rows = normalise(validated.valid);

        expect(rows.questions).toHaveLength(0);
    });

    it('normalises matching nested questions into DB rows', async () => {
        await writeFile('posts/2024/03/my-post/my-post.mdx', postMdx);
        await writeFile('posts/2024/03/my-post/questions/my-post--q1.mdx', questionMdx);

        const scanned = await markdownFilesScanner({ baseDir: fixtureRoot })();
        const parsed = await markdownParser(scanned);
        const validated = validateParsedFiles(parsed);
        const rows = normalise(validated.valid);

        expect(rows.questions).toHaveLength(1);
        expect(rows.questions[0]).toMatchObject({
            slug: 'my-post--q1',
            post_slug: 'my-post',
        });
    });
});

describe('companion ingest pipeline', () => {
    it('parses flat cheat sheet with parentPostSlug from path', async () => {
        await writeFile('posts/2024/03/my-post/my-post.mdx', postMdx);
        await writeFile('posts/2024/03/my-post/cheat_sheet.mdx', companionMdx);

        const scanned = await markdownFilesScanner({ baseDir: fixtureRoot })();
        const parsed = await markdownParser(scanned);
        const cheatSheet = parsed.find((file) => file.contentType === 'cheat_sheet');

        expect(cheatSheet).toMatchObject({
            slug: 'cheat_sheet',
            contentType: 'cheat_sheet',
            parentPostSlug: 'my-post',
        });
    });

    it('parses folder learning plan with parentPostSlug from path', async () => {
        await writeFile('posts/2024/03/my-post/my-post.mdx', postMdx);
        await writeFile('posts/2024/03/my-post/learning_plan/20hours.mdx', companionMdx);

        const scanned = await markdownFilesScanner({ baseDir: fixtureRoot })();
        const parsed = await markdownParser(scanned);
        const plan = parsed.find((file) => file.contentType === 'learning_plan');

        expect(plan).toMatchObject({
            slug: '20hours',
            contentType: 'learning_plan',
            parentPostSlug: 'my-post',
        });
    });

    it('normalises companions into DB rows with composite slug', async () => {
        await writeFile('posts/2024/03/my-post/my-post.mdx', postMdx);
        await writeFile('posts/2024/03/my-post/cheat_sheet.mdx', companionMdx);
        await writeFile('posts/2024/03/my-post/learning_plan/20hours.mdx', companionMdx);

        const scanned = await markdownFilesScanner({ baseDir: fixtureRoot })();
        const parsed = await markdownParser(scanned);
        const validated = validateParsedFiles(parsed);
        const rows = normalise(validated.valid);

        expect(rows.cheatSheets).toHaveLength(1);
        expect(rows.cheatSheets[0]).toMatchObject({
            slug: 'my-post--cheat_sheet',
            post_slug: 'my-post',
            title: 'Companion Title',
            status: 'published',
        });
        expect(rows.learningPlans).toHaveLength(1);
        expect(rows.learningPlans[0]).toMatchObject({
            slug: 'my-post--20hours',
            post_slug: 'my-post',
        });
    });
});
