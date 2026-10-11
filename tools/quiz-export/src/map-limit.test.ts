import { describe, it, expect } from 'vitest';
import { mapLimit } from './map-limit.ts';

describe('mapLimit', () => {
    it('preserves order and caps in-flight work', async () => {
        let inFlight = 0;
        let peak = 0;
        const items = Array.from({ length: 20 }, (_, index) => index);

        const results = await mapLimit(items, 3, async (item) => {
            inFlight += 1;
            peak = Math.max(peak, inFlight);
            await new Promise((resolve) => setTimeout(resolve, 5));
            inFlight -= 1;
            return item * 2;
        });

        expect(results).toEqual(items.map((item) => item * 2));
        expect(peak).toBeLessThanOrEqual(3);
        expect(peak).toBeGreaterThan(1);
    });

    it('returns an empty array for no items', async () => {
        const results = await mapLimit([], 4, async (item: number) => item);
        expect(results).toEqual([]);
    });
});
