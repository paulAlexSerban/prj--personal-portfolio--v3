import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

export default defineConfig({
    site: process.env.ASTRO_SITE ?? 'https://paulserban.eu',
    base: process.env.ASTRO_BASE ?? '/',
    output: 'static',
    trailingSlash: 'always',
    integrations: [
        mdx(),
        react({
            include: ['**/frontend/sites/portfolio-site/**', '**/shared/ui/**', '**/shared/navigation/**'],
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
        plugins: [tailwindcss()],
        resolve: {
            dedupe: ['react', 'react-dom'],
        },
        optimizeDeps: {
            include: ['react', 'react-dom', 'react/jsx-dev-runtime', 'react/jsx-runtime'],
        },
        ssr: {
            external: ['better-sqlite3', 'isomorphic-dompurify', 'jsdom'],
            noExternal: ['@prj--personal-portfolio--v3/shared--ui', '@prj--personal-portfolio--v3/shared--navigation'],
        },
    },
});
