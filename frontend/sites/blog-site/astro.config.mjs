import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

export default defineConfig({
    site: 'https://blog.paulserban.eu',
    output: 'static',
    trailingSlash: 'always',
    integrations: [mdx(), react(), sitemap()],
    vite: {
        plugins: [tailwindcss()],
        ssr: {
            external: ['better-sqlite3', 'jsdom', 'isomorphic-dompurify'],
        },
    },
});
