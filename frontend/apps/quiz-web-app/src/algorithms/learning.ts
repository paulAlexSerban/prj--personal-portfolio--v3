import type { CardState, StudyConfig, Rating } from "../store/types";
import { todayISO, DEFAULT_DAY_START_HOUR } from "../utils/dates";
import { balanceDueDate } from "./fuzz";

export interface ApplyReviewOpts {
  now?: number;
  /** Seed for deterministic fuzz (defaults to question slug). */
  seed?: string;
  /** Due-date histogram for load balancing. */
  dueCounts?: Map<string, number>;
  dayStartHour?: number;
  /** Override study-day ISO (defaults to computed from now + dayStartHour). */
  today?: string;
  /** FSRS parameters (only used by the FSRS strategy). */
  fsrsParams?: import("../store/types").FsrsParams;
}

export interface ReviewResult {
  card: CardState;
  previousInterval: number;
  previousEaseFactor: number;
}

/**
 * Algorithm-specific behaviour for the review state and graduation. The
 * learning/relearning step machinery is shared (config-driven minutes), so a
 * scheduler only needs to define how a card behaves once it reaches review.
 */
export interface ReviewStrategy {
  /** Graduate a card from learning → review (`easy` = rated Easy at graduation). */
  graduate(card: CardState, config: StudyConfig, easy: boolean, opts: ApplyReviewOpts): void;
  /** Graduate a relearning card back to review. */
  relearnGraduate(card: CardState, config: StudyConfig, opts: ApplyReviewOpts): void;
  /** Handle a rating for a card already in the review state. */
  review(card: CardState, rating: Rating, config: StudyConfig, opts: ApplyReviewOpts): void;
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export function studyToday(opts: ApplyReviewOpts, now: number): string {
  return opts.today ?? todayISO(0, opts.dayStartHour ?? DEFAULT_DAY_START_HOUR, now);
}

/** Schedule an in-session learning/relearning step `minutes` from now. */
export function scheduleLearning(
  card: CardState,
  minutes: number,
  now: number,
  opts: ApplyReviewOpts,
) {
  card.learningDueAt = now + Math.round(minutes * 60_000);
  card.dueDate = studyToday(opts, now);
}

/**
 * Apply fuzz + load-balancing to a base interval (days) and write
 * `interval`/`dueDate` onto the card. Shared by all schedulers.
 */
export function scheduleReviewInterval(
  card: CardState,
  baseInterval: number,
  config: StudyConfig,
  opts: ApplyReviewOpts,
) {
  const today = studyToday(opts, opts.now ?? Date.now());
  const clamped = clamp(baseInterval, config.minimumInterval, config.maximumInterval);
  const { interval, dueDate } = balanceDueDate({
    baseInterval: clamped,
    seed: opts.seed ?? card.questionSlug,
    today,
    minimumInterval: config.minimumInterval,
    dueCounts: opts.dueCounts ?? new Map(),
  });
  card.interval = interval;
  card.dueDate = dueDate;
}

/** Run a review through the shared learning machinery + a scheduler strategy. */
export function runReview(
  card: CardState,
  rating: Rating,
  config: StudyConfig,
  opts: ApplyReviewOpts,
  strategy: ReviewStrategy,
): ReviewResult {
  const now = opts.now ?? Date.now();
  const previousInterval = card.interval;
  const previousEaseFactor = card.easeFactor;
  const next: CardState = { ...card, updatedAt: new Date(now).toISOString() };
  const ctx: ApplyReviewOpts = { ...opts, now, seed: opts.seed ?? card.questionSlug };

  if (card.cardType === "new" || card.cardType === "learning") {
    handleLearning(next, rating, config, ctx, card.cardType === "new", strategy);
  } else if (card.cardType === "relearning") {
    handleRelearning(next, rating, config, ctx, strategy);
  } else {
    strategy.review(next, rating, config, ctx);
  }
  return { card: next, previousInterval, previousEaseFactor };
}

function handleLearning(
  card: CardState,
  rating: Rating,
  config: StudyConfig,
  opts: ApplyReviewOpts,
  isNew: boolean,
  strategy: ReviewStrategy,
) {
  const now = opts.now ?? Date.now();
  const steps = config.learningSteps;
  if (isNew) card.cardType = "learning";
  if (rating === 1) {
    card.learningStep = 0;
    scheduleLearning(card, steps[0] ?? 1, now, opts);
    return;
  }
  if (rating === 4) {
    strategy.graduate(card, config, true, opts);
    return;
  }
  if (rating === 2) {
    const cur = steps[card.learningStep] ?? 1;
    const nxt = steps[card.learningStep + 1] ?? cur * 1.5;
    scheduleLearning(card, (cur + nxt) / 2, now, opts);
    return;
  }
  // Good
  if (card.learningStep + 1 >= steps.length) {
    strategy.graduate(card, config, false, opts);
  } else {
    card.learningStep += 1;
    scheduleLearning(card, steps[card.learningStep], now, opts);
  }
}

function handleRelearning(
  card: CardState,
  rating: Rating,
  config: StudyConfig,
  opts: ApplyReviewOpts,
  strategy: ReviewStrategy,
) {
  const now = opts.now ?? Date.now();
  const steps = config.lapseSteps;
  if (rating === 1) {
    card.learningStep = 0;
    scheduleLearning(card, steps[0] ?? 10, now, opts);
    return;
  }
  if (rating === 4 || card.learningStep + 1 >= steps.length || rating === 3) {
    if (rating === 3 && card.learningStep + 1 < steps.length) {
      card.learningStep += 1;
      scheduleLearning(card, steps[card.learningStep], now, opts);
      return;
    }
    strategy.relearnGraduate(card, config, opts);
    return;
  }
  // Hard — stay
  const cur = steps[card.learningStep] ?? 10;
  scheduleLearning(card, cur * 1.5, now, opts);
}
