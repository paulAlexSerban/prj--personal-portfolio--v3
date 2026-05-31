import type { ContentType, ParsedFile } from './markdownParser.ts';

export type SkippedFile = {
    filePath: string;
    slug: string;
    contentType: ContentType;
    reason: string;
};

export type ValidationResult = {
    valid: ParsedFile[];
    skipped: SkippedFile[];
};

const REQUIRED_FIELDS: Record<ContentType, string[]> = {
    post: ['title', 'status', 'date'],
    booknote: ['title', 'status', 'date'],
    snippet: ['title', 'status', 'date'],
    project: ['title', 'status'],
    coursework: ['title', 'status'],
    question: ['question', 'status'],
};

const isMissing = (value: unknown): boolean => value === undefined || value === null || value === '';

export const validateParsedFiles = (files: ParsedFile[]): ValidationResult => {
    const valid: ParsedFile[] = [];
    const skipped: SkippedFile[] = [];

    for (const file of files) {
        const required = REQUIRED_FIELDS[file.contentType];
        const missing = required.filter((field) => isMissing(file.frontmatter[field]));

        if (missing.length > 0) {
            const reason = `missing required frontmatter field(s): ${missing.join(', ')}`;
            console.warn(`[validateParsedFiles] Skipping "${file.filePath}": ${reason}`);
            skipped.push({ filePath: file.filePath, slug: file.slug, contentType: file.contentType, reason });
            continue;
        }

        valid.push(file);
    }

    if (skipped.length > 0) {
        console.warn(`[validateParsedFiles] ${skipped.length} file(s) skipped, ${valid.length} valid`);
    }

    return { valid, skipped };
};
