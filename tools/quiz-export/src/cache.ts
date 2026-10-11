import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { ContentFormat, ExportedQuestion } from './contract.ts';

export interface CachedCompile {
    contentFormat: ContentFormat;
    stemHtml: string;
    explanationHtml: string;
    /** Parallel to `ExportedQuestion.options`. */
    labelHtml: string[];
}

export interface CompileCacheStats {
    hits: number;
    misses: number;
}

export interface CompileCache {
    get(key: string): CachedCompile | undefined;
    set(key: string, value: CachedCompile): void;
    /** Persist entries touched this run. Untouched entries are dropped. */
    save(): Promise<void>;
    readonly stats: CompileCacheStats;
}

interface CacheFile {
    version: 1;
    compilerVersion: string;
    entries: Record<string, CachedCompile>;
}

function isCachedCompile(value: unknown): value is CachedCompile {
    if (!value || typeof value !== 'object') return false;
    const row = value as Partial<CachedCompile>;
    return (
        (row.contentFormat === 'markdown' || row.contentFormat === 'mdx') &&
        typeof row.stemHtml === 'string' &&
        typeof row.explanationHtml === 'string' &&
        Array.isArray(row.labelHtml) &&
        row.labelHtml.every((label) => typeof label === 'string')
    );
}

function isCacheFile(value: unknown, compilerVersion: string): value is CacheFile {
    if (!value || typeof value !== 'object') return false;
    const file = value as Partial<CacheFile>;
    return file.version === 1 && file.compilerVersion === compilerVersion && !!file.entries && typeof file.entries === 'object';
}

/** sha256 of compiler version, field sources, and the image rewrite map. */
export function questionCacheKey(
    question: Pick<ExportedQuestion, 'stem' | 'explanation' | 'options'>,
    rewrites: ReadonlyMap<string, string>,
    compilerVersion: string
): string {
    const hash = createHash('sha256');
    hash.update(compilerVersion);
    hash.update('\0');
    hash.update(question.stem);
    hash.update('\0');
    hash.update(question.explanation);
    hash.update('\0');
    for (const option of question.options) {
        hash.update(option.key);
        hash.update('\0');
        hash.update(option.label);
        hash.update('\0');
    }
    const pairs = [...rewrites.entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    for (const [from, to] of pairs) {
        hash.update(from);
        hash.update('\0');
        hash.update(to);
        hash.update('\0');
    }
    return hash.digest('hex');
}

/**
 * Load a compile cache. A missing file, a corrupt file, or a different
 * compiler version starts an empty cache. `save` rewrites the file.
 */
export async function openCompileCache(filePath: string, compilerVersion: string): Promise<CompileCache> {
    const entries = new Map<string, CachedCompile>();

    try {
        const parsed: unknown = JSON.parse(await readFile(filePath, 'utf8'));
        if (isCacheFile(parsed, compilerVersion)) {
            for (const [key, value] of Object.entries(parsed.entries)) {
                if (isCachedCompile(value)) entries.set(key, value);
            }
        }
    } catch {
        // Missing or unreadable cache starts empty.
    }

    const touched = new Set<string>();
    const stats: CompileCacheStats = { hits: 0, misses: 0 };

    return {
        stats,
        get(key) {
            const hit = entries.get(key);
            if (!hit) {
                stats.misses += 1;
                return undefined;
            }
            stats.hits += 1;
            touched.add(key);
            return hit;
        },
        set(key, value) {
            entries.set(key, value);
            touched.add(key);
        },
        async save() {
            const stored: Record<string, CachedCompile> = {};
            for (const key of touched) {
                const value = entries.get(key);
                if (value) stored[key] = value;
            }
            await mkdir(path.dirname(filePath), { recursive: true });
            const file: CacheFile = { version: 1, compilerVersion, entries: stored };
            await writeFile(filePath, JSON.stringify(file), 'utf8');
        },
    };
}
