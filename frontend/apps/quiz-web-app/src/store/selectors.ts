import type { CardState, PostStats } from "./types";
import type { QuizState } from "./index";
import { buildQueue } from "../algorithms/queue";
import { todayISO } from "../utils/dates";

export interface QueueScope {
  /** Restrict to these post slugs. Defaults to all added posts. */
  postSlugs?: string[];
  today?: string;
  now?: number;
  /** Ignore today's new/review caps ("study ahead" / cram). */
  ignoreLimits?: boolean;
}

/**
 * Compute the due study queue from store state. Joins added posts → their
 * card states, drops ignored questions, and applies SM-2 queue ordering.
 */
export function selectStudyQueue(state: QuizState, scope: QueueScope = {}): CardState[] {
  const today = scope.today ?? todayISO(0);
  const now = scope.now ?? Date.now();
  const postSet = new Set(scope.postSlugs ?? state.addedPosts);

  const cards = Object.values(state.cardStates).filter(
    (c) => postSet.has(c.postSlug) && !state.ignored[c.questionSlug],
  );

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
