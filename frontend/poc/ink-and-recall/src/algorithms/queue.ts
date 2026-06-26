import type { Card, Deck, AppSettings } from "../store/types";

export interface QueueOpts {
  newStudiedToday: number;
  reviewsStudiedToday: number;
  today: string;
  now: number;
  settings: AppSettings;
}

export function buildQueue(deck: Deck, allCards: Card[], opts: QueueOpts): Card[] {
  const cards = allCards.filter((c) => c.deckId === deck.id && !c.suspended);
  const newLimit = Math.max(
    0,
    (opts.settings.globalNewLimit ?? deck.config.newCardsPerDay) - opts.newStudiedToday,
  );
  const reviewLimit = Math.max(
    0,
    (opts.settings.globalReviewLimit ?? deck.config.maxReviewsPerDay) - opts.reviewsStudiedToday,
  );

  const learning = cards
    .filter(
      (c) =>
        (c.cardType === "learning" || c.cardType === "relearning") &&
        (c.learningDueAt ?? 0) <= opts.now,
    )
    .sort((a, b) => (a.learningDueAt ?? 0) - (b.learningDueAt ?? 0));
  const review = cards
    .filter((c) => c.cardType === "review" && c.dueDate <= opts.today)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, reviewLimit);
  const newC = cards.filter((c) => c.cardType === "new").slice(0, newLimit);

  const order = opts.settings.studyOrder;
  let queue: Card[];
  if (order === "new-first") queue = [...learning, ...newC, ...review];
  else if (order === "reviews-first") queue = [...learning, ...review, ...newC];
  else queue = [...learning, ...interleave(newC, review)];
  return queue;
}

function interleave<T>(a: T[], b: T[]): T[] {
  const out: T[] = [];
  const n = Math.max(a.length, b.length);
  for (let i = 0; i < n; i++) {
    if (i < b.length) out.push(b[i]);
    if (i < a.length) out.push(a[i]);
  }
  return out;
}
