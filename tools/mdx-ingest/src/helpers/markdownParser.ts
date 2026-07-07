import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import type { ScannedDirectory } from './markdownFileScanner.ts';

export type ContentType = 'post' | 'booknote' | 'snippet' | 'project' | 'coursework' | 'question';

export type ParsedFile = {
    slug: string;
    contentType: ContentType;
    frontmatter: Record<string, unknown>;
    body: string;
    filePath: string;
};

const CONTENT_TYPE_MAP: Record<string, ContentType> = {
    posts: 'post',
    booknotes: 'booknote',
    snippets: 'snippet',
    projects: 'project',
    coursework: 'coursework',
    questions: 'question',
};

const deriveSlug = (filePath: string): string => path.basename(filePath).replace(/\.(mdx?|md)$/, '');

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

                result.push({ slug, contentType, frontmatter: frontmatter as Record<string, unknown>, body, filePath });
            } catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                console.warn(`[markdownParser] Skipping "${filePath}": ${message}`);
                throw error;
            }
        }
    }

    return result;
};
