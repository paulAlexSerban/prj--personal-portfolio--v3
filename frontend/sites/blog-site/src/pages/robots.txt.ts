import type { APIRoute } from 'astro';

const PRODUCTION_HOST = 'blog.paulserban.eu';

export const GET: APIRoute = ({ site }) => {
    const isProd = site?.hostname === PRODUCTION_HOST;
    const sitemapUrl = site ? new URL(`${import.meta.env.BASE_URL.replace(/\/?$/, '/')}sitemap-index.xml`, site).href : '/sitemap-index.xml';
    const body = isProd ? `User-agent: *\nAllow: /\n\nSitemap: ${sitemapUrl}\n` : 'User-agent: *\nDisallow: /\n';

    return new Response(body, {
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
        },
    });
};
