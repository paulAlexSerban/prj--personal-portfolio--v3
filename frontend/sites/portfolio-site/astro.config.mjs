import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

export default defineConfig({
    site: 'https://paulserban.eu',
    output: 'static',
    trailingSlash: 'always',
    integrations: [
        mdx(),
        react({
            include: ['**/frontend/sites/portfolio-site/**', '**/shared/ui/**'],
        }),
        sitemap(),
    ],
    vite: {
        plugins: [tailwindcss()],
        resolve: {
            dedupe: ['react', 'react-dom'],
        },
        optimizeDeps: {
            include: ['react', 'react-dom', 'react/jsx-dev-runtime', 'react/jsx-runtime'],
        },
        ssr: {
            external: ['better-sqlite3'],
            noExternal: ['@prj--personal-portfolio--v3/shared--ui'],
        },
    },
});
