import type { Config } from 'dompurify';
import { ALLOWED_ATTR, ALLOWED_TAGS } from './allowlist.ts';

export const SANITIZE_CONFIG = {
    ALLOWED_TAGS: [...ALLOWED_TAGS],
    ALLOWED_ATTR: [...ALLOWED_ATTR],
} as Config;
