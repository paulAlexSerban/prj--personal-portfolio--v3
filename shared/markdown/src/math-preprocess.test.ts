import { describe, it, expect } from 'vitest';
import { preprocessMath } from './math-preprocess.ts';
import { compileMarkdown } from './markdown.ts';

describe('preprocessMath', () => {
    it('normalizes single-line block math delimiters', () => {
        expect(preprocessMath('$$\\frac{a}{b}$$')).toContain('\n$$\n');
    });

    it('leaves fenced code untouched', () => {
        const src = '```ts\nconst x = `$5`;\n```';
        expect(preprocessMath(src)).toBe(src);
    });
});

describe('compileMarkdown — block math', () => {
    it('emits a block-math placeholder for $$…$$', () => {
        const html = compileMarkdown('$$\\frac{a}{b}$$');
        expect(html).toContain('<div class="math math-block">');
        expect(html).toContain('\\frac{a}{b}');
    });
});
