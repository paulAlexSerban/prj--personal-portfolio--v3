import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';

/** Shared remark plugins for Astro site MDX evaluate() calls. */
export const remarkPlugins = [remarkGfm] as const;

/** Shared rehype plugins for Astro site MDX evaluate() calls. */
export const rehypePlugins = [rehypeHighlight] as const;
