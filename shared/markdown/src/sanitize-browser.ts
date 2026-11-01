import DOMPurify from 'isomorphic-dompurify';
import { SANITIZE_CONFIG } from './sanitize-config.ts';

/** Browser fallback. Uses the page DOM, so it never loads `node:module` or jsdom. */
export function browserSanitizeHtml(html: string): string {
    return String(DOMPurify.sanitize(html, SANITIZE_CONFIG));
}
