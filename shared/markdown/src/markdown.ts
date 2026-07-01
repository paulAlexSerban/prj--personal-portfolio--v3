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

export interface CompileMarkdownOptions {
    inline?: boolean;
    reveal?: boolean;
}

function stripBlockWrapper(html: string): string {
    const trimmed = html.trim();
    const match = /^<p>([\s\S]*)<\/p>\n?$/i.exec(trimmed);
    return match ? match[1] : trimmed;
}

function createProcessor(opts: CompileMarkdownOptions = {}) {
    const { reveal = true } = opts;

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
    );
}

/** Compile markdown (post-MDX-preprocess) to sanitized HTML. */
export function compileMarkdown(src: string, opts: CompileMarkdownOptions = {}): string {
    const { inline = false } = opts;
    const processor = createProcessor(opts);
    const normalized = preprocessMath(src ?? '');
    let html = String(processor.processSync(normalized));

    if (inline) {
        html = stripBlockWrapper(html);
    }

    return sanitizeHtml(html);
}
