import fs from 'node:fs/promises';
import path from 'node:path';
import type { ScannedDirectory } from './jsonFileScanner.ts';

export type JsonContentType = 'profile' | 'skill' | 'page' | 'experience';

export type ParsedFile = {
    slug: string;
    contentType: JsonContentType;
    data: Record<string, unknown>;
    filePath: string;
};

const CONTENT_TYPE_MAP: Record<string, JsonContentType | undefined> = {
    profile: 'profile',
    skills: 'skill',
    pages: 'page',
    experience: 'experience',
};

const toSlug = (value: string): string =>
    value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

const deriveSlugFromPath = (filePath: string): string => path.basename(filePath).replace(/\.json$/, '');

const parseJsonFile = async (filePath: string, contentType: JsonContentType): Promise<ParsedFile[]> => {
    const raw = await fs.readFile(filePath, 'utf-8');
    const parsed: unknown = JSON.parse(raw);

    if (contentType === 'skill' || contentType === 'experience') {
        const key = contentType === 'skill' ? 'skills' : 'experience';
        const items = Array.isArray(parsed)
            ? parsed
            : typeof parsed === 'object' && parsed !== null && Array.isArray((parsed as Record<string, unknown>)[key])
              ? ((parsed as Record<string, unknown>)[key] as unknown[])
              : [parsed];

        return items.map((item, index) => {
            const data = (typeof item === 'object' && item !== null ? item : {}) as Record<string, unknown>;
            if (contentType === 'skill') {
                const name = typeof data['name'] === 'string' ? data['name'] : `skill-${index}`;
                return { slug: toSlug(name), contentType, data, filePath };
            }
            const slug =
                typeof data['slug'] === 'string' && data['slug'].length > 0
                    ? data['slug']
                    : toSlug(`${String(data['role'] ?? 'role')}-${String(data['company'] ?? index)}`);
            return { slug, contentType, data, filePath };
        });
    }

    const data = (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed) ? parsed : {}) as Record<string, unknown>;

    const slug = contentType === 'profile' ? 'profile' : typeof data['slug'] === 'string' && data['slug'].length > 0 ? data['slug'] : deriveSlugFromPath(filePath);

    return [{ slug, contentType, data, filePath }];
};

export const jsonParser = async (scannedDirectories: ScannedDirectory[]): Promise<ParsedFile[]> => {
    const result: ParsedFile[] = [];

    for (const directory of scannedDirectories) {
        const contentType = CONTENT_TYPE_MAP[directory.typeName];

        if (!contentType) {
            console.warn(`[jsonParser] Unknown content type "${directory.typeName}" — skipping directory`);
            continue;
        }

        for (const relativeFile of directory.files) {
            const filePath = path.join(directory.path, relativeFile);

            try {
                const parsed = await parseJsonFile(filePath, contentType);
                result.push(...parsed);
            } catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                console.warn(`[jsonParser] Skipping "${filePath}": ${message}`);
            }
        }
    }

    return result;
};
