import { describe, expect, it } from 'vitest';
import { buildPayload, keyLocationUrl, redactedPayload } from './payload.ts';
import { redact } from './key.ts';

const key = 'abcd1234efgh5678';
const site = 'https://paulserban.eu/';

describe('buildPayload', () => {
    it('builds a same-host IndexNow payload', () => {
        const payload = buildPayload({
            site,
            key,
            urls: ['https://paulserban.eu/', 'https://paulserban.eu/cv/'],
        });

        expect(payload).toEqual({
            host: 'paulserban.eu',
            key,
            keyLocation: 'https://paulserban.eu/abcd1234efgh5678.txt',
            urlList: ['https://paulserban.eu/', 'https://paulserban.eu/cv/'],
        });
        expect(new Set(payload.urlList.map((url) => new URL(url).hostname))).toEqual(new Set(['paulserban.eu']));
        expect(new URL(payload.keyLocation).hostname).toBe(payload.host);
    });

    it('drops URLs for other hosts and errors when none remain', () => {
        expect(() =>
            buildPayload({
                site,
                key,
                urls: ['https://blog.paulserban.eu/post/x/'],
            })
        ).toThrow('No URLs to submit');
    });
});

describe('keyLocationUrl / redactedPayload', () => {
    it('places the key file at the site origin', () => {
        expect(keyLocationUrl('https://blog.paulserban.eu', key)).toBe('https://blog.paulserban.eu/abcd1234efgh5678.txt');
    });

    it('redacts the key and keyLocation', () => {
        const payload = buildPayload({ site, key, urls: ['https://paulserban.eu/'] });
        const masked = redactedPayload(payload, (text) => redact(text, key));
        expect(masked['key']).toBe('***5678');
        expect(masked['keyLocation']).toBe('https://paulserban.eu/***5678.txt');
        expect(JSON.stringify(masked)).not.toContain(key);
    });
});
