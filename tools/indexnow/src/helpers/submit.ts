import { INDEXNOW_ENDPOINT, type IndexNowPayload } from './payload.ts';
import { defaultSleep, isSuccessStatus, shouldRetryStatus, type FetchLike, type Sleep } from './http.ts';

export type SubmitOptions = {
    fetch?: FetchLike;
    sleep?: Sleep;
    maxRetries?: number;
};

class HttpStatusError extends Error {
    status: number;

    constructor(status: number, message: string) {
        super(message);
        this.name = 'HttpStatusError';
        this.status = status;
    }
}

export async function submitIndexNow(payload: IndexNowPayload, options: SubmitOptions = {}): Promise<number> {
    const fetchImpl = options.fetch ?? fetch;
    const sleep = options.sleep ?? defaultSleep;
    const maxRetries = options.maxRetries ?? 4;
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
        try {
            const response = await fetchImpl(INDEXNOW_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8',
                },
                body: JSON.stringify(payload),
            });

            if (isSuccessStatus(response.status)) {
                return response.status;
            }

            const body = await response.text().catch(() => '');
            throw new HttpStatusError(response.status, `IndexNow POST failed with status ${response.status}${body ? `: ${body.slice(0, 200)}` : ''}`);
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            const retryable = error instanceof HttpStatusError ? shouldRetryStatus(error.status) : true;
            if (!retryable || attempt === maxRetries) {
                throw lastError;
            }
        }

        await sleep(Math.min(2 ** attempt * 1000, 16_000));
    }

    throw lastError ?? new Error('IndexNow POST failed');
}
