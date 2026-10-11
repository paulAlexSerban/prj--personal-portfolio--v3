import { createRequire } from 'node:module';
import type { DOMPurify } from 'dompurify';
import { SANITIZE_CONFIG } from './sanitize-config.ts';

const require = createRequire(import.meta.url);

/**
 * The jsdom window `isomorphic-dompurify` creates gets slower on every call.
 * Node keeps one window of its own for the whole process. Replacing that
 * window does not return the old one to GC, so it is not recycled.
 */
interface NodePurifier {
    sanitize: (html: string) => string;
}

let nodePurifier: NodePurifier | undefined;

function openNodePurifier(): NodePurifier {
    const { JSDOM } = require('jsdom') as { JSDOM: new (html: string) => { window: Window } };
    const createDOMPurify = require('dompurify') as (window: Window) => DOMPurify;
    const dom = new JSDOM('');
    const purify = createDOMPurify(dom.window);
    return {
        sanitize: (html: string) => String(purify.sanitize(html, SANITIZE_CONFIG)),
    };
}

export function nodeSanitizeHtml(html: string): string {
    nodePurifier ??= openNodePurifier();
    return nodePurifier.sanitize(html);
}
