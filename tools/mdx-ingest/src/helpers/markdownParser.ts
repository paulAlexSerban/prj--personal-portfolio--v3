import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import type { ScannedDirectory } from './markdownFileScanner.ts';

export type ContentType = 'post' | 'booknote' | 'snippet' | 'project' | 'coursework' | 'question' | 'cheat_sheet' | 'learning_plan';

export type ParsedFile = {
    slug: string;
    contentType: ContentType;
    frontmatter: Record<string, unknown>;
    body: string;
    filePath: string;
    /** Parent post slug derived from the path (questions, cheat sheets, learning plans). */
    parentPostSlug?: string;
};

const CONTENT_TYPE_MAP: Record<string, ContentType> = {
    posts: 'post',
    booknotes: 'booknote',
    snippets: 'snippet',
    projects: 'project',
    coursework: 'coursework',
    questions: 'question',
    cheat_sheets: 'cheat_sheet',
    learning_plans: 'learning_plan',
};

const COMPANION_DIR_NAMES = new Set(['cheat_sheet', 'learning_plan']);

const deriveSlug = (filePath: string): string => path.basename(filePath).replace(/\.(mdx?|md)$/, '');

const deriveParentPostSlug = (relativeFile: string): string | undefined => {
    const questionsSegment = `${path.sep}questions${path.sep}`;
    const questionsIdx = relativeFile.indexOf(questionsSegment);

    if (questionsIdx === -1) {
        return undefined;
    }

    const parentDir = relativeFile.slice(0, questionsIdx);
    return path.basename(parentDir);
};

/**
 * Parent post slug for cheat sheets / learning plans.
 * - Flat: `posts/2024/06/<slug>/cheat_sheet.mdx` → parent = `<slug>`
 * - Folder: `posts/2024/06/<slug>/cheat_sheet/<file>.mdx` → parent = `<slug>`
 * - Folder: `posts/2024/06/<slug>/learning_plan/<file>.mdx` → parent = `<slug>`
 */
const deriveCompanionParentSlug = (relativeFile: string): string | undefined => {
    const parentDir = path.dirname(relativeFile);
    const parentBasename = path.basename(parentDir);

    if (COMPANION_DIR_NAMES.has(parentBasename)) {
        return path.basename(path.dirname(parentDir));
    }

    // Flat cheat_sheet.mdx next to the post
    return parentBasename;
};

export const markdownParser = async (scannedDirectories: ScannedDirectory[]): Promise<ParsedFile[]> => {
    const result: ParsedFile[] = [];

    for (const directory of scannedDirectories) {
        const contentType = CONTENT_TYPE_MAP[directory.typeName];

        if (!contentType) {
            console.warn(`[markdownParser] Unknown content type "${directory.typeName}" — skipping directory`);
            continue;
        }

        for (const relativeFile of directory.files) {
            const filePath = path.join(directory.path, relativeFile);

            try {
                const raw = await fs.readFile(filePath, 'utf-8');
                const { data: frontmatter, content: body } = matter(raw);
                const slug = deriveSlug(relativeFile);
                let parentPostSlug: string | undefined;

                if (contentType === 'question') {
                    parentPostSlug = deriveParentPostSlug(relativeFile);
                } else if (contentType === 'cheat_sheet' || contentType === 'learning_plan') {
                    parentPostSlug = deriveCompanionParentSlug(relativeFile);
                }

                result.push({
                    slug,
                    contentType,
                    frontmatter: frontmatter as Record<string, unknown>,
                    body,
                    filePath,
                    parentPostSlug,
                });
            } catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                console.warn(`[markdownParser] Skipping "${filePath}": ${message}`);
                throw error;
            }
        }
    }

    return result;
};
