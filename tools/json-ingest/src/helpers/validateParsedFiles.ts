import type { JsonContentType, ParsedFile } from './jsonParser.ts';

export type SkippedFile = {
    filePath: string;
    slug: string;
    contentType: JsonContentType;
    reason: string;
};

export type ValidationResult = {
    valid: ParsedFile[];
    skipped: SkippedFile[];
};

const REQUIRED_FIELDS: Record<JsonContentType, string[]> = {
    profile: ['name', 'headline', 'bio'],
    skill:   ['name', 'category'],
    page:    ['title', 'status'],
};

const isMissing = (value: unknown): boolean =>
    value === undefined || value === null || value === '';

export const validateParsedFiles = (files: ParsedFile[]): ValidationResult => {
    const valid: ParsedFile[] = [];
    const skipped: SkippedFile[] = [];

    for (const file of files) {
        const required = REQUIRED_FIELDS[file.contentType];
        const missing = required.filter((field) => isMissing(file.data[field]));

        if (missing.length > 0) {
            const reason = `missing required field(s): ${missing.join(', ')}`;
            console.warn(`[validateParsedFiles] Skipping "${file.filePath}" (${file.slug}): ${reason}`);
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
