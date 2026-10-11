import rehypeStringify from 'rehype-stringify';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';
import { preprocessMath } from './math-preprocess.ts';
import { remarkMathPlaceholder } from './math.ts';
import { remarkCloze } from './remark-cloze.ts';
import { sanitizeHtml } from './sanitize.ts';

/** Bump when the same source can compile to different HTML. Quiz-export cache keys include this. */
export const MARKDOWN_COMPILER_VERSION = '1';

export interface CompileMarkdownOptions {
    inline?: boolean;
    reveal?: boolean;
}

function stripBlockWrapper(html: string): string {
    const trimmed = html.trim();
    const match = /^<p>([\s\S]*)<\/p>\n?$/i.exec(trimmed);
    return match ? match[1] : trimmed;
}

function createProcessor(reveal: boolean) {
    return (
        unified()
            .use(remarkParse)
            .use(remarkGfm)
            .use(remarkMath)
            .use(remarkMathPlaceholder)
            // Plugin tuple typing is wider than unified's overload union; runtime chain is valid.
            .use(remarkCloze as Parameters<ReturnType<typeof unified>['use']>[0], { reveal })
            .use(remarkRehype, { allowDangerousHtml: true })
            .use(rehypeStringify, { allowDangerousHtml: true })
            .freeze()
    );
}

const processors = new Map<boolean, ReturnType<typeof createProcessor>>();

function processorFor(reveal: boolean) {
    const existing = processors.get(reveal);
    if (existing) return existing;
    const created = createProcessor(reveal);
    processors.set(reveal, created);
    return created;
}

/** Compile markdown (post-MDX-preprocess) to sanitized HTML. */
export function compileMarkdown(src: string, opts: CompileMarkdownOptions = {}): string {
    const { inline = false, reveal = true } = opts;
    const normalized = preprocessMath(src ?? '');
    let html = String(processorFor(reveal).processSync(normalized));

    if (inline) {
        html = stripBlockWrapper(html);
    }

    return sanitizeHtml(html);
}
