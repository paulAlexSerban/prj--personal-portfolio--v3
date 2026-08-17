import { describe, expect, it } from 'vitest';
import { parseArgs } from './args.ts';

describe('parseArgs', () => {
    it('parses write-key mode', () => {
        expect(parseArgs(['--write-key', '--dist', './dist'])).toEqual({
            dist: './dist',
            site: undefined,
            dryRun: false,
            writeKey: true,
            submit: false,
        });
    });

    it('parses submit mode with site and dry-run', () => {
        expect(parseArgs(['--submit', '--dist', '/tmp/site', '--site', 'https://paulserban.eu', '--dry-run'])).toEqual({
            dist: '/tmp/site',
            site: 'https://paulserban.eu',
            dryRun: true,
            writeKey: false,
            submit: true,
        });
    });

    it('requires --dist', () => {
        expect(() => parseArgs(['--write-key'])).toThrow('--dist is required');
    });

    it('requires a mode flag', () => {
        expect(() => parseArgs(['--dist', './dist'])).toThrow('Specify --write-key and/or --submit');
    });

    it('requires --site with --submit', () => {
        expect(() => parseArgs(['--submit', '--dist', './dist'])).toThrow('--site is required with --submit');
    });

    it('rejects unknown flags', () => {
        expect(() => parseArgs(['--write-key', '--dist', './dist', '--nope'])).toThrow('Unknown flag: --nope');
    });

    it('ignores a leading -- separator from pnpm', () => {
        expect(parseArgs(['--', '--write-key', '--dist', './dist'])).toEqual({
            dist: './dist',
            site: undefined,
            dryRun: false,
            writeKey: true,
            submit: false,
        });
    });
});
