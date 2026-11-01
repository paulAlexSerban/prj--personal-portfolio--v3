/**
 * Run `fn` over `items` with at most `limit` calls in flight.
 * Results are returned in input order. The cursor advances synchronously,
 * so the bound holds on a single thread without a lock.
 */
export async function mapLimit<T, R>(items: readonly T[], limit: number, fn: (item: T, index: number) => Promise<R>): Promise<R[]> {
    if (items.length === 0) return [];

    const width = Math.max(1, Math.min(limit, items.length));
    const results = new Array<R>(items.length);
    let cursor = 0;

    const worker = async (): Promise<void> => {
        for (;;) {
            const index = cursor;
            cursor += 1;
            if (index >= items.length) return;
            results[index] = await fn(items[index]!, index);
        }
    };

    await Promise.all(Array.from({ length: width }, () => worker()));
    return results;
}
