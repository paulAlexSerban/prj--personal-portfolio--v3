import type { CardState, AppSettings, StudyConfig } from "../store/types";

const DEFAULT_DIFFICULTY_RANK = 2;

export interface QueueOpts {
  config: StudyConfig;
  newStudiedToday: number;
  reviewsStudiedToday: number;
  today: string;
  now: number;
  settings: AppSettings;
  /** When true, daily new/review caps are ignored (e.g. "study ahead"/cram). */
  ignoreLimits?: boolean;
  /** Explicit remaining new-card budget (overrides config − studied when set). */
  newBudget?: number;
  /** Explicit remaining review budget (overrides config − studied when set). */
  reviewBudget?: number;
  /** Question slug → difficulty rank (1 = beginner, 2 = intermediate, 3 = advanced). */
  difficultyMap?: Map<string, number>;
}

/** Sort new cards by difficulty rank (beginner → advanced). Stable when ranks tie. */
export function sortNewByDifficulty(
  cards: CardState[],
  difficultyMap?: Map<string, number>,
): CardState[] {
  if (!difficultyMap) return cards;
  return [...cards].sort((a, b) => {
    const ra = difficultyMap.get(a.questionSlug) ?? DEFAULT_DIFFICULTY_RANK;
    const rb = difficultyMap.get(b.questionSlug) ?? DEFAULT_DIFFICULTY_RANK;
    return ra - rb;
  });
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
        opts.newBudget ??
          (opts.settings.globalNewLimit ?? opts.config.newCardsPerDay) - opts.newStudiedToday,
      );
  const reviewLimit = opts.ignoreLimits
    ? cards.length
    : Math.max(
        0,
        opts.reviewBudget ??
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
  const newC = sortNewByDifficulty(
    cards.filter((c) => c.cardType === "new"),
    opts.difficultyMap,
  ).slice(0, newLimit);

  const order = opts.settings.studyOrder;
  let queue: CardState[];
  if (order === "new-first") queue = [...learning, ...newC, ...review];
  else if (order === "reviews-first") queue = [...learning, ...review, ...newC];
  else queue = [...learning, ...interleave(newC, review)];
  return queue;
}

/** Merge per-post sub-queues according to study order preference. */
export function mergePostQueues(
  queues: CardState[][],
  order: AppSettings["studyOrder"],
): CardState[] {
  if (queues.length === 0) return [];
  if (queues.length === 1) return queues[0];
  const learning = queues.flatMap((q) =>
    q.filter((c) => c.cardType === "learning" || c.cardType === "relearning"),
  );
  const newC = queues.flatMap((q) => q.filter((c) => c.cardType === "new"));
  const review = queues.flatMap((q) => q.filter((c) => c.cardType === "review"));
  if (order === "new-first") return [...learning, ...newC, ...review];
  if (order === "reviews-first") return [...learning, ...review, ...newC];
  return [...learning, ...interleave(newC, review)];
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
