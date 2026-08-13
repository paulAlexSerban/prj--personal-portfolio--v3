import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

const newsCacheDir = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../content/news/cache');

/** Serve `content/news/cache/*.json` at `/news-data/` during `astro dev` (local / Docker). */
function localNewsDataPlugin() {
    return {
        name: 'local-news-data',
        configureServer(server) {
            server.middlewares.use((req, res, next) => {
                const raw = req.url?.split('?')[0] ?? '';
                const marker = '/news-data/';
                const idx = raw.indexOf(marker);
                if (idx === -1) {
                    next();
                    return;
                }
                const name = path.basename(raw.slice(idx + marker.length));
                if (!/^[a-z0-9-]+\.json$/i.test(name)) {
                    res.statusCode = 404;
                    res.end();
                    return;
                }
                const filePath = path.join(newsCacheDir, name);
                if (!fs.existsSync(filePath)) {
                    res.statusCode = 404;
                    res.end('Not found');
                    return;
                }
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                res.setHeader('Cache-Control', 'no-store');
                fs.createReadStream(filePath).pipe(res);
            });
        },
    };
}

export default defineConfig({
    site: process.env.ASTRO_SITE ?? 'https://news-feed.paulserban.eu',
    base: process.env.ASTRO_BASE ?? '/',
    output: 'static',
    trailingSlash: 'always',
    integrations: [
        react({
            include: ['**/frontend/sites/news-feed-site/**', '**/shared/ui/**', '**/shared/navigation/**'],
        }),
        sitemap(),
    ],
    vite: {
        server: {
            allowedHosts: true,
            hmr: process.env.ASTRO_HMR_HOST
                ? {
                      host: process.env.ASTRO_HMR_HOST,
                      clientPort: Number(process.env.ASTRO_HMR_CLIENT_PORT ?? 443),
                      protocol: process.env.ASTRO_HMR_PROTOCOL ?? 'wss',
                  }
                : undefined,
        },
        plugins: [tailwindcss(), localNewsDataPlugin()],
        resolve: {
            dedupe: ['react', 'react-dom'],
        },
        optimizeDeps: {
            include: ['react', 'react-dom', 'react/jsx-dev-runtime', 'react/jsx-runtime'],
        },
        ssr: {
            external: ['isomorphic-dompurify', 'jsdom'],
            noExternal: ['@prj--personal-portfolio--v3/shared--ui', '@prj--personal-portfolio--v3/shared--navigation'],
        },
    },
});
