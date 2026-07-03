import type { CardState } from "../store/types";

/**
 * Keep the card currently being studied at the front of the queue.
 * Learning cards that become due mid-review are queued next, not shown immediately.
 */
export function pinActiveCardInQueue(
  queue: CardState[],
  activeSlug: string | null,
): CardState[] {
  if (!activeSlug || queue.length === 0) return queue;
  const idx = queue.findIndex((c) => c.questionSlug === activeSlug);
  if (idx <= 0) return queue;
  const pinned = queue[idx]!;
  const jumpedAhead = queue.slice(0, idx);
  const afterPinned = queue.slice(idx + 1);
  return [pinned, ...jumpedAhead, ...afterPinned];
}
