import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

import { mdxComponents } from './src/lib/mdx-components.ts';

export default defineConfig({
    site: 'https://blog.paulserban.eu',
    output: 'static',
    trailingSlash: 'always',
    integrations: [mdx({ components: mdxComponents }), react(), sitemap()],
    vite: {
        plugins: [tailwindcss()],
        ssr: {
            external: ['better-sqlite3'],
        },
    },
});
