import { defaultSleep, type FetchLike, type Sleep } from './http.ts';

export type WaitForKeyOptions = {
    fetch?: FetchLike;
    sleep?: Sleep;
    now?: () => number;
    timeoutMs?: number;
    intervalMs?: number;
};

export async function waitForKeyLocation(url: string, options: WaitForKeyOptions = {}): Promise<void> {
    const fetchImpl = options.fetch ?? fetch;
    const sleep = options.sleep ?? defaultSleep;
    const now = options.now ?? Date.now;
    const timeoutMs = options.timeoutMs ?? 120_000;
    const intervalMs = options.intervalMs ?? 5_000;
    const deadline = now() + timeoutMs;
    let lastStatus: number | undefined;
    let lastError: string | undefined;

    while (now() <= deadline) {
        try {
            const response = await fetchImpl(url, { method: 'GET' });
            lastStatus = response.status;
            if (response.status === 200) {
                return;
            }
        } catch (error) {
            lastError = error instanceof Error ? error.message : String(error);
        }

        if (now() + intervalMs > deadline) {
            break;
        }
        await sleep(intervalMs);
    }

    const detail = lastStatus !== undefined ? `last status ${lastStatus}` : `last error ${lastError ?? 'unknown'}`;
    throw new Error(`keyLocation was not reachable within ${timeoutMs}ms (${detail})`);
}
