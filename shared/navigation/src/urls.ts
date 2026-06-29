export type AppSegment = 'home' | 'blog' | 'quiz';

export interface SiteUrlsConfig {
    appSegment: AppSegment;
    baseUrl: string;
    production: {
        portfolio: string;
        blog: string;
        quiz: string;
    };
}

export interface CrossAppUrls {
    portfolio: string;
    blog: string;
    quiz: string;
}

function withTrailingSlash(url: string): string {
    return url.endsWith('/') ? url : `${url}/`;
}

export function createSiteUrls(config: SiteUrlsConfig): CrossAppUrls {
    const base = withTrailingSlash(config.baseUrl);
    const stripped = base.replace(/\/$/, '');
    const segmentPattern = new RegExp(`/${config.appSegment}$`);

    if (segmentPattern.test(stripped)) {
        const repoBase = stripped.replace(segmentPattern, '');
        return {
            portfolio: `${repoBase}/home/`,
            blog: `${repoBase}/blog/`,
            quiz: `${repoBase}/quiz/`,
        };
    }

    return {
        portfolio: withTrailingSlash(config.production.portfolio),
        blog: withTrailingSlash(config.production.blog),
        quiz: withTrailingSlash(config.production.quiz),
    };
}

export function assetUrl(base: string, path: string): string {
    const normalized = path.startsWith('/') ? path.slice(1) : path;
    return `${withTrailingSlash(base)}${normalized}`;
}

export function isExternalUrl(href: string): boolean {
    return href.startsWith('http');
}

export function externalLinkAttrs(href: string): Record<string, string> {
    return isExternalUrl(href) ? { rel: 'noopener noreferrer', target: '_blank' } : {};
}

export function isNavLinkActive(pathname: string, href: string, base: string): boolean {
    if (isExternalUrl(href) || href.includes('#')) return false;

    const normalizedPath = withTrailingSlash(pathname);
    const normalizedHref = withTrailingSlash(href);
    const normalizedBase = withTrailingSlash(base);

    if (normalizedHref === normalizedBase) {
        return normalizedPath === normalizedBase;
    }

    return normalizedPath.startsWith(normalizedHref);
}
