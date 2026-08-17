import { describe, expect, it, vi } from 'vitest';
import { INDEXNOW_ENDPOINT, type IndexNowPayload } from './payload.ts';
import { submitIndexNow } from './submit.ts';

const payload: IndexNowPayload = {
    host: 'paulserban.eu',
    key: 'abcd1234efgh5678',
    keyLocation: 'https://paulserban.eu/abcd1234efgh5678.txt',
    urlList: ['https://paulserban.eu/'],
};

describe('submitIndexNow', () => {
    it('treats 200 and 202 as success', async () => {
        const fetchImpl = vi.fn().mockResolvedValue(new Response('', { status: 202 }));
        await expect(submitIndexNow(payload, { fetch: fetchImpl, sleep: vi.fn() })).resolves.toBe(202);
        expect(fetchImpl).toHaveBeenCalledWith(
            INDEXNOW_ENDPOINT,
            expect.objectContaining({
                method: 'POST',
                headers: { 'Content-Type': 'application/json; charset=utf-8' },
            })
        );
        const body = JSON.parse(String(fetchImpl.mock.calls[0]?.[1]?.body));
        expect(body.host).toBe('paulserban.eu');
        expect(body.urlList).toEqual(['https://paulserban.eu/']);
    });

    it('retries 429 then succeeds', async () => {
        const fetchImpl = vi
            .fn()
            .mockResolvedValueOnce(new Response('slow down', { status: 429 }))
            .mockResolvedValueOnce(new Response('', { status: 200 }));
        const sleep = vi.fn().mockResolvedValue(undefined);

        await expect(submitIndexNow(payload, { fetch: fetchImpl, sleep, maxRetries: 2 })).resolves.toBe(200);
        expect(sleep).toHaveBeenCalled();
    });

    it('fails immediately on 4xx other than 429', async () => {
        const fetchImpl = vi.fn().mockResolvedValue(new Response('forbidden', { status: 403 }));
        const sleep = vi.fn();
        await expect(submitIndexNow(payload, { fetch: fetchImpl, sleep })).rejects.toThrow('status 403');
        expect(sleep).not.toHaveBeenCalled();
    });
});
