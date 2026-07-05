import type { CardState, PostStats } from "./types";
import type { QuizState } from "./index";
import { buildQueue, mergePostQueues, sortNewByDifficulty } from "../algorithms/queue";
import { getPostDaily, resolvePostConfig } from "../lib/postConfig";
import { todayISO, DEFAULT_DAY_START_HOUR } from "../utils/dates";

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
  /** Question slug → difficulty rank (1 = beginner, 2 = intermediate, 3 = advanced). */
  difficultyMap?: Map<string, number>;
}

/** Cram ordering: learning/relearning (due first) → new → review. */
function sortCramQueue(cards: CardState[], difficultyMap?: Map<string, number>): CardState[] {
  const learning = cards
    .filter((c) => c.cardType === "learning" || c.cardType === "relearning")
    .sort((a, b) => (a.learningDueAt ?? 0) - (b.learningDueAt ?? 0));
  const newC = sortNewByDifficulty(
    cards.filter((c) => c.cardType === "new"),
    difficultyMap,
  );
  const review = cards.filter((c) => c.cardType === "review");
  return [...learning, ...newC, ...review];
}

/**
 * Compute the due study queue from store state. Joins added posts → their
 * card states, drops ignored/suspended questions, and applies SM-2 queue ordering
 * with per-set and global daily limits.
 */
export function selectStudyQueue(state: QuizState, scope: QueueScope = {}): CardState[] {
  const dayStartHour = state.settings.dayStartHour ?? DEFAULT_DAY_START_HOUR;
  const now = scope.now ?? Date.now();
  const today = scope.today ?? todayISO(0, dayStartHour, now);
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
    return sortCramQueue(cards, scope.difficultyMap);
  }

  const globalDaily =
    state.daily.date === today ? state.daily : { date: today, new: 0, reviews: 0 };
  const globalNewCap = state.settings.globalNewLimit ?? state.config.newCardsPerDay;
  const globalReviewCap = state.settings.globalReviewLimit ?? state.config.maxReviewsPerDay;

  let globalNewLeft = scope.ignoreLimits
    ? Number.MAX_SAFE_INTEGER
    : Math.max(0, globalNewCap - globalDaily.new);
  let globalReviewLeft = scope.ignoreLimits
    ? Number.MAX_SAFE_INTEGER
    : Math.max(0, globalReviewCap - globalDaily.reviews);

  // Group eligible cards by post and build per-set sub-queues.
  const byPost = new Map<string, CardState[]>();
  for (const c of cards) {
    const list = byPost.get(c.postSlug) ?? [];
    list.push(c);
    byPost.set(c.postSlug, list);
  }

  const subQueues: CardState[][] = [];
  for (const [postSlug, postCards] of byPost) {
    const postConfig = resolvePostConfig(state.config, state.postConfigs?.[postSlug]);
    const postDaily = getPostDaily(state.dailyByPost ?? {}, postSlug, today);

    const postNewLeft = scope.ignoreLimits
      ? Number.MAX_SAFE_INTEGER
      : Math.max(0, postConfig.newCardsPerDay - postDaily.new);
    const postReviewLeft = scope.ignoreLimits
      ? Number.MAX_SAFE_INTEGER
      : Math.max(0, postConfig.maxReviewsPerDay - postDaily.reviews);

    const newBudget = Math.min(globalNewLeft, postNewLeft);
    const reviewBudget = Math.min(globalReviewLeft, postReviewLeft);

    const q = buildQueue(postCards, {
      config: postConfig,
      newStudiedToday: postDaily.new,
      reviewsStudiedToday: postDaily.reviews,
      today,
      now,
      settings: state.settings,
      ignoreLimits: scope.ignoreLimits,
      newBudget,
      reviewBudget,
      difficultyMap: scope.difficultyMap,
    });

    // Deduct global budget by what this sub-queue consumed.
    const newUsed = q.filter((c) => c.cardType === "new").length;
    const reviewUsed = q.filter((c) => c.cardType === "review").length;
    globalNewLeft -= newUsed;
    globalReviewLeft -= reviewUsed;

    subQueues.push(q);
  }

  return mergePostQueues(subQueues, state.settings.studyOrder);
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

/** Cards whose lapses meet or exceed the leech threshold. */
export function selectLeeches(state: QuizState): CardState[] {
  const threshold = state.settings.leechThreshold ?? 0;
  if (threshold <= 0) return [];
  const postSet = new Set(state.addedPosts);
  return Object.values(state.cardStates).filter(
    (c) => postSet.has(c.postSlug) && c.lapses >= threshold,
  );
}
