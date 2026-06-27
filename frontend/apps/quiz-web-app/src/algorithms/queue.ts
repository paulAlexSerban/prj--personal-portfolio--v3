import type { CardState, AppSettings, StudyConfig } from "../store/types";

export interface QueueOpts {
  config: StudyConfig;
  newStudiedToday: number;
  reviewsStudiedToday: number;
  today: string;
  now: number;
  settings: AppSettings;
  /** When true, daily new/review caps are ignored (e.g. "study ahead"/cram). */
  ignoreLimits?: boolean;
}

/**
 * Build a study queue from a pre-filtered set of card states.
 * Caller is responsible for scoping `cards` to the desired study sets
 * (added posts) and excluding ignored questions.
 */
export function buildQueue(cards: CardState[], opts: QueueOpts): CardState[] {
  const newLimit = opts.ignoreLimits
    ? cards.length
    : Math.max(
        0,
        (opts.settings.globalNewLimit ?? opts.config.newCardsPerDay) - opts.newStudiedToday,
      );
  const reviewLimit = opts.ignoreLimits
    ? cards.length
    : Math.max(
        0,
        (opts.settings.globalReviewLimit ?? opts.config.maxReviewsPerDay) -
          opts.reviewsStudiedToday,
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
  let queue: CardState[];
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
