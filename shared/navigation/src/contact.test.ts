import { describe, expect, it } from 'vitest';
import { CONTACT_EMAIL, CONTACT_MAILTO, decodeFromBase64, encodeToBase64 } from './contact.ts';

describe('contact base64 helpers', () => {
    it('round-trips mailto through encode/decode', () => {
        const encoded = encodeToBase64(CONTACT_MAILTO);
        expect(encoded).not.toContain(CONTACT_EMAIL);
        expect(encoded).not.toContain('mailto:');
        expect(decodeFromBase64(encoded)).toBe(CONTACT_MAILTO);
    });

    it('preserves the mailto: prefix', () => {
        const decoded = decodeFromBase64(encodeToBase64(CONTACT_MAILTO));
        expect(decoded.startsWith('mailto:')).toBe(true);
        expect(decoded).toBe(`mailto:${CONTACT_EMAIL}`);
    });

    it('matches the known v2 encoding for the production mailto', () => {
        expect(encodeToBase64('mailto:paul.alex.serban@gmail.com')).toBe('bWFpbHRvOnBhdWwuYWxleC5zZXJiYW5AZ21haWwuY29t');
    });
});
