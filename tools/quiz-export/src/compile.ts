import { copyFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { compileContent, detectContentFormat, extractRelativeImagePaths, questionAssetUrl, rewriteImagePaths } from '@prj--personal-portfolio--v3/shared--markdown';
import type { ExportedQuestion, QuizData } from './contract.ts';

export interface CompileOptions {
    /** Content publish dir (…/publish) — enables asset copy + path rewrite. */
    contentDir?: string;
    /** Output dir for copied assets (…/public/data/assets/questions). */
    assetsOutDir?: string;
    /** Public URL prefix for assets. Default `/data/assets/questions`. */
    assetsPublicBase?: string;
}

async function copyAssetsForQuestion(
    question: ExportedQuestion,
    fields: string[],
    opts: Required<Pick<CompileOptions, 'contentDir' | 'assetsOutDir' | 'assetsPublicBase'>>
): Promise<Map<string, string>> {
    const rewrites = new Map<string, string>();
    const mdxPath = path.join(opts.contentDir, 'questions', `${question.slug}.mdx`);
    const mdxDir = path.dirname(mdxPath);

    const allPaths = new Set<string>();
    for (const field of fields) {
        for (const p of extractRelativeImagePaths(field)) allPaths.add(p);
    }
    if (allPaths.size === 0) return rewrites;

    const destDir = path.join(opts.assetsOutDir, question.slug);
    await mkdir(destDir, { recursive: true });

    for (const rel of allPaths) {
        const normalized = rel.replace(/^\.\//, '');
        const srcFile = path.resolve(mdxDir, normalized);
        const fileName = path.basename(normalized);
        const destFile = path.join(destDir, fileName);
        try {
            await copyFile(srcFile, destFile);
            rewrites.set(rel, questionAssetUrl(question.slug, fileName, opts.assetsPublicBase));
        } catch {
            // Source image missing — leave relative path; frontend may 404 gracefully.
        }
    }
    return rewrites;
}

function compileField(src: string, rewrites: Map<string, string>, inline = false): string {
    const rewritten = rewrites.size ? rewriteImagePaths(src, rewrites) : src;
    const format = detectContentFormat(rewritten);
    return compileContent(rewritten, { mdx: format === 'mdx', inline, reveal: true });
}

async function compileQuestion(question: ExportedQuestion, opts: CompileOptions): Promise<ExportedQuestion> {
    const fields = [question.stem, question.explanation, ...question.options.map((o) => o.label)];
    const hasAssets = Boolean(opts.contentDir && opts.assetsOutDir);
    const rewrites = hasAssets
        ? await copyAssetsForQuestion(question, fields, {
              contentDir: opts.contentDir!,
              assetsOutDir: opts.assetsOutDir!,
              assetsPublicBase: opts.assetsPublicBase ?? '/data/assets/questions',
          })
        : new Map<string, string>();

    const stemSrc = rewrites.size ? rewriteImagePaths(question.stem, rewrites) : question.stem;
    const explanationSrc = rewrites.size ? rewriteImagePaths(question.explanation, rewrites) : question.explanation;
    const contentFormat = [stemSrc, explanationSrc, ...question.options.map((o) => o.label)].some((s) => detectContentFormat(s) === 'mdx') ? 'mdx' : 'markdown';

    return {
        ...question,
        contentFormat,
        stemHtml: compileField(question.stem, rewrites),
        explanationHtml: compileField(question.explanation, rewrites),
        options: question.options.map((opt) => {
            const labelSrc = rewrites.size ? rewriteImagePaths(opt.label, rewrites) : opt.label;
            return {
                ...opt,
                labelHtml: compileContent(labelSrc, {
                    mdx: detectContentFormat(labelSrc) === 'mdx',
                    inline: true,
                    reveal: true,
                }),
            };
        }),
    };
}

/** Compile MDX/markdown fields to sanitized HTML and optionally copy image assets. */
export async function compileQuizData(data: QuizData, opts: CompileOptions = {}): Promise<QuizData> {
    const uniqueQuestions = new Map<string, ExportedQuestion>();
    for (const list of data.questionsByPost.values()) {
        for (const q of list) uniqueQuestions.set(q.slug, q);
    }

    const compiledEntries = await Promise.all([...uniqueQuestions.values()].map(async (q) => [q.slug, await compileQuestion(q, opts)] as const));
    const compiledBySlug = new Map(compiledEntries);

    const remap = (list: ExportedQuestion[]) => list.map((q) => compiledBySlug.get(q.slug)!);

    return {
        ...data,
        questionsByPost: new Map([...data.questionsByPost].map(([k, list]) => [k, remap(list)])),
        questionsByTag: new Map([...data.questionsByTag].map(([k, list]) => [k, remap(list)])),
    };
}
