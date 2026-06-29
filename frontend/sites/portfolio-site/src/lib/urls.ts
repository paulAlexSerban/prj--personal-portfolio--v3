/** Astro/Vite base URL — always ends with `/` (e.g. `/` or `/prj--personal-portfolio--v3/home/`). */
const base = import.meta.env.BASE_URL;

function withTrailingSlash(url: string): string {
    return url.endsWith('/') ? url : `${url}/`;
}

/** Blog/quiz on GitHub Pages DEV share the repo base; locally default to production subdomains. */
function siblingAppUrl(segment: 'blog' | 'quiz', productionUrl: string): string {
    if (base.endsWith('/home/')) {
        return base.replace(/\/home\/$/, `/${segment}/`);
    }
    return withTrailingSlash(productionUrl);
}

export const siteUrls = {
    home: base,
    experience: `${base}#experience`,
    portfolio: `${base}portfolio/`,
    portfolioProject: (slug: string) => `${base}portfolio/${slug}/`,
    cv: `${base}cv/`,
    blog: import.meta.env.PUBLIC_BLOG_URL ?? siblingAppUrl('blog', 'https://blog.paulserban.eu'),
    blogPost: (slug: string) => `${withTrailingSlash(import.meta.env.PUBLIC_BLOG_URL ?? siblingAppUrl('blog', 'https://blog.paulserban.eu'))}post/${slug}/`,
    quiz: import.meta.env.PUBLIC_QUIZ_URL ?? siblingAppUrl('quiz', 'https://quiz.paulserban.eu'),
} as const;

export function assetUrl(path: string): string {
    const normalized = path.startsWith('/') ? path.slice(1) : path;
    return `${base}${normalized}`;
}

export function isExternalUrl(href: string): boolean {
    return href.startsWith('http');
}

export function externalLinkAttrs(href: string): Record<string, string> {
    return isExternalUrl(href) ? { rel: 'noopener noreferrer', target: '_blank' } : {};
}

export function isNavLinkActive(pathname: string, href: string): boolean {
    if (isExternalUrl(href) || href.includes('#')) return false;

    const normalizedPath = withTrailingSlash(pathname);
    const normalizedHref = withTrailingSlash(href);

    if (normalizedHref === withTrailingSlash(base)) {
        return normalizedPath === withTrailingSlash(base);
    }

    return normalizedPath.startsWith(normalizedHref);
}
