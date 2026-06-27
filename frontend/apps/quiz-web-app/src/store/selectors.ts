import type { CardState, PostStats } from "./types";
import type { QuizState } from "./index";
import { buildQueue } from "../algorithms/queue";
import { todayISO } from "../utils/dates";

export interface QueueScope {
  /** Restrict to these post slugs. Defaults to all added posts. */
  postSlugs?: string[];
  /** Restrict to these question slugs (tag scope, single-card cram, etc.). */
  questionSlugs?: string[];
  /** Include scoped cards regardless of due date (cram / "study just this card"). */
  cram?: boolean;
  today?: string;
  now?: number;
  /** Ignore today's new/review caps ("study ahead" / cram). */
  ignoreLimits?: boolean;
}

/** Cram ordering: learning due → new → review → everything else. */
function sortCramQueue(cards: CardState[], now: number): CardState[] {
  const learning = cards
    .filter(
      (c) =>
        (c.cardType === "learning" || c.cardType === "relearning") && (c.learningDueAt ?? 0) <= now,
    )
    .sort((a, b) => (a.learningDueAt ?? 0) - (b.learningDueAt ?? 0));
  const newC = cards.filter((c) => c.cardType === "new");
  const review = cards.filter((c) => c.cardType === "review");
  const rest = cards.filter(
    (c) =>
      !learning.includes(c) &&
      !newC.includes(c) &&
      !review.includes(c) &&
      c.cardType !== "learning" &&
      c.cardType !== "relearning",
  );
  return [...learning, ...newC, ...review, ...rest];
}

/**
 * Compute the due study queue from store state. Joins added posts → their
 * card states, drops ignored questions, and applies SM-2 queue ordering.
 */
export function selectStudyQueue(state: QuizState, scope: QueueScope = {}): CardState[] {
  const today = scope.today ?? todayISO(0);
  const now = scope.now ?? Date.now();
  const postSet = new Set(scope.postSlugs ?? state.addedPosts);

  let cards = Object.values(state.cardStates).filter(
    (c) =>
      postSet.has(c.postSlug) &&
      !state.ignored[c.questionSlug] &&
      !state.suspended?.[c.questionSlug],
  );

  if (scope.questionSlugs?.length) {
    const slugSet = new Set(scope.questionSlugs);
    cards = cards.filter((c) => slugSet.has(c.questionSlug));
  }

  if (scope.cram) {
    return sortCramQueue(cards, now);
  }

  const daily = state.daily.date === today ? state.daily : { date: today, new: 0, reviews: 0 };

  return buildQueue(cards, {
    config: state.config,
    newStudiedToday: daily.new,
    reviewsStudiedToday: daily.reviews,
    today,
    now,
    settings: state.settings,
    ignoreLimits: scope.ignoreLimits,
  });
}

/** Per-post counts for the browse / study-set screens. Ignored questions are excluded from active counts. */
export function getPostStats(state: QuizState, postSlug: string, today = todayISO(0)): PostStats {
  const cards = Object.values(state.cardStates).filter((c) => c.postSlug === postSlug);
  const active = cards.filter((c) => !state.ignored[c.questionSlug]);
  return {
    total: cards.length,
    newCount: active.filter((c) => c.cardType === "new").length,
    learningCount: active.filter((c) => c.cardType === "learning" || c.cardType === "relearning")
      .length,
    reviewDueCount: active.filter((c) => c.cardType === "review" && c.dueDate <= today).length,
    ignoredCount: cards.filter((c) => state.ignored[c.questionSlug]).length,
  };
}

/** Total cards due across all (or scoped) added posts — for the progress screen. */
export function selectDueCount(state: QuizState, scope: QueueScope = {}): number {
  return selectStudyQueue(state, scope).length;
}
