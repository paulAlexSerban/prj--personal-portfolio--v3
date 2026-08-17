import { describe, expect, it, vi } from 'vitest';
import { waitForKeyLocation } from './waitForKey.ts';

describe('waitForKeyLocation', () => {
    it('returns when GET is 200', async () => {
        const fetchImpl = vi.fn().mockResolvedValue(new Response('ok', { status: 200 }));
        const sleep = vi.fn();

        await waitForKeyLocation('https://paulserban.eu/key.txt', { fetch: fetchImpl, sleep, timeoutMs: 1000, intervalMs: 100 });

        expect(fetchImpl).toHaveBeenCalledTimes(1);
        expect(sleep).not.toHaveBeenCalled();
    });

    it('retries until 200', async () => {
        const fetchImpl = vi
            .fn()
            .mockResolvedValueOnce(new Response('', { status: 404 }))
            .mockResolvedValueOnce(new Response('ok', { status: 200 }));
        const sleep = vi.fn().mockResolvedValue(undefined);
        let now = 0;

        await waitForKeyLocation('https://paulserban.eu/key.txt', {
            fetch: fetchImpl,
            sleep,
            now: () => now,
            timeoutMs: 10_000,
            intervalMs: 1000,
        });

        expect(fetchImpl).toHaveBeenCalledTimes(2);
        expect(sleep).toHaveBeenCalledWith(1000);
        now = 0;
    });

    it('fails when the timeout elapses', async () => {
        const fetchImpl = vi.fn().mockResolvedValue(new Response('', { status: 404 }));
        let now = 0;

        await expect(
            waitForKeyLocation('https://paulserban.eu/key.txt', {
                fetch: fetchImpl,
                sleep: async () => {
                    now += 1000;
                },
                now: () => now,
                timeoutMs: 1500,
                intervalMs: 1000,
            })
        ).rejects.toThrow('keyLocation was not reachable');
    });
});
