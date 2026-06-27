import DOMPurify from 'isomorphic-dompurify';
import { ALLOWED_ATTR, ALLOWED_TAGS } from './allowlist.ts';

/** Sanitize HTML with the shared quiz allow-list. Works in Node (export) and browser (fallback). */
export function sanitizeHtml(html: string): string {
    return DOMPurify.sanitize(html, {
        ALLOWED_TAGS: [...ALLOWED_TAGS],
        ALLOWED_ATTR: [...ALLOWED_ATTR],
    });
}
