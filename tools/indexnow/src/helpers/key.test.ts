import { describe, expect, it } from 'vitest';
import { redact, redactKey, validateKey } from './key.ts';

describe('validateKey', () => {
    it('accepts 8-128 alphanumeric and dash characters', () => {
        expect(validateKey('abcd1234')).toBe('abcd1234');
        expect(validateKey('  A1b2-C3d4  ')).toBe('A1b2-C3d4');
        expect(validateKey('a'.repeat(128))).toHaveLength(128);
    });

    it('rejects missing, short, long, or illegal keys', () => {
        expect(() => validateKey(undefined)).toThrow('INDEX_NOW_API_KEY is required');
        expect(() => validateKey('')).toThrow('INDEX_NOW_API_KEY is required');
        expect(() => validateKey('abc')).toThrow('8-128');
        expect(() => validateKey('a'.repeat(129))).toThrow('8-128');
        expect(() => validateKey('abcd12/4')).toThrow('8-128');
    });
});

describe('redactKey', () => {
    it('keeps only the last four characters', () => {
        expect(redactKey('indexnow-key-abcd')).toBe('***abcd');
    });

    it('replaces every occurrence of the key in a string', () => {
        const key = 'abcd1234efgh';
        expect(redact(key, key)).toBe('***efgh');
        expect(redact(`https://paulserban.eu/${key}.txt`, key)).toBe('https://paulserban.eu/***efgh.txt');
    });
});
