import { describe, it, expect } from 'vitest';
import { questionCacheKey } from './cache.ts';
import type { ExportedQuestion } from './contract.ts';

function question(stem: string): Pick<ExportedQuestion, 'stem' | 'explanation' | 'options'> {
    return {
        stem,
        explanation: 'because',
        options: [{ key: 'a', label: 'one', isCorrect: true, sortOrder: 0 }],
    };
}

describe('questionCacheKey', () => {
    it('changes when the source or the rewrite map changes', () => {
        const base = questionCacheKey(question('What?'), new Map(), '1');
        expect(questionCacheKey(question('What?'), new Map(), '1')).toBe(base);
        expect(questionCacheKey(question('Why?'), new Map(), '1')).not.toBe(base);
        expect(questionCacheKey(question('What?'), new Map([['./a.png', '/data/a.png']]), '1')).not.toBe(base);
        expect(questionCacheKey(question('What?'), new Map(), '2')).not.toBe(base);
    });

    it('ignores rewrite insertion order', () => {
        const first = questionCacheKey(
            question('What?'),
            new Map([
                ['./a.png', '/a'],
                ['./b.png', '/b'],
            ]),
            '1'
        );
        const second = questionCacheKey(
            question('What?'),
            new Map([
                ['./b.png', '/b'],
                ['./a.png', '/a'],
            ]),
            '1'
        );
        expect(first).toBe(second);
    });
});
