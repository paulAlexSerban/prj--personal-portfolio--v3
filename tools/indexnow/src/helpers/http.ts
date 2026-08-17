export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;
export type Sleep = (ms: number) => Promise<void>;

export const defaultSleep: Sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function isSuccessStatus(status: number): boolean {
    return status === 200 || status === 202;
}

export function shouldRetryStatus(status: number): boolean {
    return status === 429 || status >= 500;
}
