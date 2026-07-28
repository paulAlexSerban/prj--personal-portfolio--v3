import { createHash } from 'node:crypto';
import { sanitizeHtml } from '@prj--personal-portfolio--v3/shared--markdown';
import type { CachedNewsItem } from './types.ts';

const SUMMARY_MAX = 280;

export function makeSlug(guid: string, link: string): string {
    const seed = (guid || link).trim();
    return createHash('sha256').update(seed).digest('hex').slice(0, 24);
}

export function normalizeLink(link: string): string {
    try {
        const url = new URL(link.trim());
        url.hash = '';
        // Drop trailing slash for comparison, keep path otherwise.
        let href = url.href;
        if (href.endsWith('/') && url.pathname !== '/') {
            href = href.slice(0, -1);
        }
        return href;
    } catch {
        return link.trim().replace(/\/$/, '');
    }
}

function isPlaceholderHost(link: string): boolean {
    try {
        const hostname = new URL(link.trim()).hostname.toLowerCase();
        return hostname === 'example.com' || hostname === 'www.example.com';
    } catch {
        return false;
    }
}

function toPlainText(raw: string): string {
    const sanitized = sanitizeHtml(raw);
    return sanitized
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, ' ')
        .trim();
}

export function plainSummary(raw: string | undefined | null, max = SUMMARY_MAX): string {
    if (!raw) return '';
    const text = toPlainText(raw);
    if (text.length <= max) return text;
    return `${text.slice(0, max - 1)}…`;
}

export function sanitizeTitle(raw: string): string {
    return toPlainText(raw) || 'Untitled';
}

export type RawFeedItem = {
    title?: string;
    link?: string;
    guid?: string;
    isoDate?: string;
    pubDate?: string;
    contentSnippet?: string;
    content?: string;
    summary?: string;
};

export function normalizeItem(item: RawFeedItem, source: string, sourceUrl: string): CachedNewsItem | null {
    const link = item.link?.trim();
    if (!link) return null;
    if (isPlaceholderHost(link)) return null;

    const guid = String(item.guid ?? link).trim();
    const publishedAt = item.isoDate ?? (item.pubDate ? new Date(item.pubDate).toISOString() : null);
    const summarySource = item.contentSnippet ?? item.summary ?? item.content ?? '';

    return {
        slug: makeSlug(guid, link),
        guid,
        title: sanitizeTitle(item.title ?? ''),
        link,
        source,
        sourceUrl,
        summary: plainSummary(summarySource),
        publishedAt: publishedAt && !Number.isNaN(Date.parse(publishedAt)) ? publishedAt : null,
    };
}

export function retentionCutoffMs(retentionDays: number, now = Date.now()): number {
    return now - retentionDays * 24 * 60 * 60 * 1000;
}

export function isWithinRetention(publishedAt: string | null, cutoffMs: number): boolean {
    if (!publishedAt) return true; // keep undated items; capped later by MAX_ITEMS
    const t = Date.parse(publishedAt);
    if (Number.isNaN(t)) return true;
    return t >= cutoffMs;
}

export function sortByPublishedDesc(items: CachedNewsItem[]): CachedNewsItem[] {
    return [...items].sort((a, b) => {
        const ta = a.publishedAt ? Date.parse(a.publishedAt) : 0;
        const tb = b.publishedAt ? Date.parse(b.publishedAt) : 0;
        return tb - ta;
    });
}
