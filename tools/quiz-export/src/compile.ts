import { copyFile, mkdir, readdir } from 'node:fs/promises';
import path from 'node:path';
import { MARKDOWN_COMPILER_VERSION, compileContent, detectContentFormat, extractRelativeImagePaths, questionAssetUrl, rewriteImagePaths } from '@prj--personal-portfolio--v3/shared--markdown';
import type { CompileCache } from './cache.ts';
import { questionCacheKey } from './cache.ts';
import type { ContentFormat, ExportedQuestion, QuizData } from './contract.ts';
import { mapLimit } from './map-limit.ts';

const DEFAULT_CONCURRENCY = 32;
const DEFAULT_ASSETS_PUBLIC_BASE = '/data/assets/questions';

export interface CompileOptions {
    /** Content publish dir (…/publish) - enables asset copy + path rewrite. */
    contentDir?: string;
    /** Output dir for copied assets (…/public/data/assets/questions). */
    assetsOutDir?: string;
    /** Public URL prefix for assets. Default `/data/assets/questions`. */
    assetsPublicBase?: string;
    /** Asset and index problems are appended here. */
    warnings?: string[];
    /** Reuse compiled HTML across runs. Omit to compile everything. */
    cache?: CompileCache;
    /** Max questions with asset copies in flight. Default 32. */
    concurrency?: number;
}

interface CompiledFields {
    contentFormat: ContentFormat;
    stemHtml: string;
    explanationHtml: string;
    labelHtml: string[];
}

function errorMessage(err: unknown): string {
    return err instanceof Error ? err.message : String(err);
}

/**
 * One pass over the content tree: question slug -> source `.mdx` path.
 * Only files that sit directly in a directory named `questions` are indexed.
 */
export async function buildQuestionIndex(contentDir: string, warnings: string[] = []): Promise<Map<string, string>> {
    const index = new Map<string, string>();

    let entries;
    try {
        entries = await readdir(contentDir, { recursive: true, withFileTypes: true });
    } catch (err) {
        warnings.push(`cannot read directory ${contentDir}: ${errorMessage(err)}`);
        return index;
    }

    for (const entry of entries) {
        if (!entry.isFile() || !entry.name.endsWith('.mdx')) continue;
        const parent = entry.parentPath;
        if (!parent || path.basename(parent) !== 'questions') continue;

        const slug = entry.name.slice(0, -'.mdx'.length);
        const filePath = path.join(parent, entry.name);
        const existing = index.get(slug);
        if (existing) {
            warnings.push(`duplicate question slug "${slug}": keeping ${existing}, ignoring ${filePath}`);
            continue;
        }
        index.set(slug, filePath);
    }

    return index;
}

async function copyAssetsForQuestion(
    question: ExportedQuestion,
    fields: string[],
    opts: Required<Pick<CompileOptions, 'assetsOutDir' | 'assetsPublicBase'>>,
    index: Map<string, string>,
    warnings: string[]
): Promise<Map<string, string>> {
    const rewrites = new Map<string, string>();
    const imagePaths = new Set<string>();
    for (const field of fields) {
        for (const imagePath of extractRelativeImagePaths(field)) imagePaths.add(imagePath);
    }
    if (imagePaths.size === 0) return rewrites;

    const mdxPath = index.get(question.slug);
    if (!mdxPath) {
        warnings.push(`question "${question.slug}" references an image but no source file was found`);
        return rewrites;
    }

    const mdxDir = path.dirname(mdxPath);
    const destDir = path.join(opts.assetsOutDir, question.slug);
    await mkdir(destDir, { recursive: true });

    for (const rel of imagePaths) {
        const normalized = rel.replace(/^\.\//, '');
        const srcFile = path.resolve(mdxDir, normalized);
        const fileName = path.basename(normalized);
        const destFile = path.join(destDir, fileName);
        try {
            await copyFile(srcFile, destFile);
            rewrites.set(rel, questionAssetUrl(question.slug, fileName, opts.assetsPublicBase));
        } catch (err) {
            warnings.push(`question "${question.slug}": cannot copy ${srcFile}: ${errorMessage(err)}`);
        }
    }

    return rewrites;
}

function rewriteField(src: string, rewrites: Map<string, string>): string {
    return rewrites.size > 0 ? rewriteImagePaths(src, rewrites) : src;
}

/** Rewrite each field once, then compile it once. */
function compileFieldSet(question: ExportedQuestion, rewrites: Map<string, string>): CompiledFields {
    const stemSrc = rewriteField(question.stem, rewrites);
    const explanationSrc = rewriteField(question.explanation, rewrites);
    const optionSrcs = question.options.map((opt) => rewriteField(opt.label, rewrites));
    const sources = [stemSrc, explanationSrc, ...optionSrcs];
    const contentFormat: ContentFormat = sources.some((src) => detectContentFormat(src) === 'mdx') ? 'mdx' : 'markdown';

    return {
        contentFormat,
        stemHtml: compileContent(stemSrc, { mdx: detectContentFormat(stemSrc) === 'mdx', reveal: true }),
        explanationHtml: compileContent(explanationSrc, { mdx: detectContentFormat(explanationSrc) === 'mdx', reveal: true }),
        labelHtml: optionSrcs.map((src) =>
            compileContent(src, {
                mdx: detectContentFormat(src) === 'mdx',
                inline: true,
                reveal: true,
            })
        ),
    };
}

function withCompiled(question: ExportedQuestion, compiled: CompiledFields): ExportedQuestion {
    return {
        ...question,
        contentFormat: compiled.contentFormat,
        stemHtml: compiled.stemHtml,
        explanationHtml: compiled.explanationHtml,
        options: question.options.map((opt, index) => ({
            ...opt,
            labelHtml: compiled.labelHtml[index],
        })),
    };
}

async function compileQuestion(question: ExportedQuestion, opts: CompileOptions, index: Map<string, string>, warnings: string[]): Promise<ExportedQuestion> {
    const fields = [question.stem, question.explanation, ...question.options.map((opt) => opt.label)];
    const rewrites =
        opts.contentDir && opts.assetsOutDir
            ? await copyAssetsForQuestion(
                  question,
                  fields,
                  {
                      assetsOutDir: opts.assetsOutDir,
                      assetsPublicBase: opts.assetsPublicBase ?? DEFAULT_ASSETS_PUBLIC_BASE,
                  },
                  index,
                  warnings
              )
            : new Map<string, string>();

    const cache = opts.cache;
    if (cache) {
        const key = questionCacheKey(question, rewrites, MARKDOWN_COMPILER_VERSION);
        const hit = cache.get(key);
        if (hit) return withCompiled(question, hit);
        const compiled = compileFieldSet(question, rewrites);
        cache.set(key, compiled);
        return withCompiled(question, compiled);
    }

    return withCompiled(question, compileFieldSet(question, rewrites));
}

/** Compile MDX/markdown fields to sanitized HTML and optionally copy image assets. */
export async function compileQuizData(data: QuizData, opts: CompileOptions = {}): Promise<QuizData> {
    const warnings = opts.warnings ?? [];
    const index = opts.contentDir && opts.assetsOutDir ? await buildQuestionIndex(opts.contentDir, warnings) : new Map<string, string>();

    const uniqueQuestions = new Map<string, ExportedQuestion>();
    for (const list of data.questionsByPost.values()) {
        for (const question of list) uniqueQuestions.set(question.slug, question);
    }

    const compiledEntries = await mapLimit([...uniqueQuestions.values()], opts.concurrency ?? DEFAULT_CONCURRENCY, async (question) => {
        const compiled = await compileQuestion(question, opts, index, warnings);
        return [question.slug, compiled] as const;
    });
    const compiledBySlug = new Map(compiledEntries);

    const remap = (list: ExportedQuestion[]) => list.map((question) => compiledBySlug.get(question.slug)!);

    return {
        ...data,
        questionsByPost: new Map([...data.questionsByPost].map(([key, list]) => [key, remap(list)])),
        questionsByTag: new Map([...data.questionsByTag].map(([key, list]) => [key, remap(list)])),
    };
}
