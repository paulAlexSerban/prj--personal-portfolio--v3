import type { CardState, StudyConfig, Rating, FsrsParams } from "../store/types";
import {
  runReview,
  scheduleLearning,
  scheduleReviewInterval,
  studyToday,
  type ApplyReviewOpts,
  type ReviewResult,
  type ReviewStrategy,
} from "./learning";
import { addDaysISO, daysBetween } from "../utils/dates";

/** FSRS-5 forgetting-curve constants. R(t) = (1 + FACTOR·t/S)^DECAY. */
export const DECAY = -0.5;
export const FACTOR = 19 / 81;

/** Published FSRS-5 default weights. */
export const DEFAULT_FSRS_PARAMS: FsrsParams = {
  w: [
    0.4072, 1.1829, 3.1262, 15.4722, 7.2102, 0.5316, 1.0651, 0.0589, 1.471, 0.1544, 1.007, 1.9395,
    0.11, 0.29, 2.27, 0.24, 2.9898, 0.51, 0.43,
  ],
  requestedRetention: 0.9,
  maximumInterval: 36500,
};

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Retrieval probability of a card with stability `S`, `elapsedDays` since review. */
export function predictedRetention(stability: number, elapsedDays: number): number {
  if (stability <= 0) return 0;
  return Math.pow(1 + (FACTOR * Math.max(0, elapsedDays)) / stability, DECAY);
}

/** Days until retrievability drops to `requestedRetention` for stability `S`. */
export function intervalFromStability(
  stability: number,
  requestedRetention: number,
  maximumInterval = 36500,
): number {
  const ivl = (stability / FACTOR) * (Math.pow(requestedRetention, 1 / DECAY) - 1);
  return clamp(Math.round(ivl), 1, maximumInterval);
}

/** Initial stability after the first rating (FSRS-5: w[0..3]). */
export function initStability(rating: Rating, w: number[]): number {
  return Math.max(0.1, w[rating - 1]);
}

/** Initial difficulty after the first rating, clamped to [1, 10]. */
export function initDifficulty(rating: Rating, w: number[]): number {
  return clamp(w[4] - Math.exp(w[5] * (rating - 1)) + 1, 1, 10);
}

function linearDamping(deltaD: number, difficulty: number): number {
  return (deltaD * (10 - difficulty)) / 9;
}

/** Difficulty update with linear damping + mean reversion toward D₀(Easy). */
export function nextDifficulty(difficulty: number, rating: Rating, w: number[]): number {
  const deltaD = -w[6] * (rating - 3);
  const damped = difficulty + linearDamping(deltaD, difficulty);
  const d0Easy = clamp(w[4] - Math.exp(w[5] * (4 - 1)) + 1, 1, 10);
  const reverted = w[7] * d0Easy + (1 - w[7]) * damped;
  return clamp(reverted, 1, 10);
}

/** Stability after a successful recall (rating 2/3/4). */
export function nextRecallStability(
  difficulty: number,
  stability: number,
  retrievability: number,
  rating: Rating,
  w: number[],
): number {
  const hardPenalty = rating === 2 ? w[15] : 1;
  const easyBonus = rating === 4 ? w[16] : 1;
  const inc =
    Math.exp(w[8]) *
    (11 - difficulty) *
    Math.pow(stability, -w[9]) *
    (Math.exp(w[10] * (1 - retrievability)) - 1) *
    hardPenalty *
    easyBonus;
  return stability * (1 + inc);
}

/** Stability after a lapse (rating 1). Never increases stability. */
export function nextForgetStability(
  difficulty: number,
  stability: number,
  retrievability: number,
  w: number[],
): number {
  const sf =
    w[11] *
    Math.pow(difficulty, -w[12]) *
    (Math.pow(stability + 1, w[13]) - 1) *
    Math.exp(w[14] * (1 - retrievability));
  return Math.max(0.1, Math.min(sf, stability));
}

function params(opts: ApplyReviewOpts): FsrsParams {
  return opts.fsrsParams ?? DEFAULT_FSRS_PARAMS;
}

function scheduleFromStability(
  card: CardState,
  stability: number,
  config: StudyConfig,
  opts: ApplyReviewOpts,
  p: FsrsParams,
) {
  const base = intervalFromStability(stability, p.requestedRetention, p.maximumInterval);
  scheduleReviewInterval(card, base, config, opts);
}

/** Elapsed days since the card's last FSRS review (0 if unknown). */
function elapsedDays(card: CardState, today: string): number {
  if (!card.fsrsLastReview) return 0;
  return Math.max(0, daysBetween(card.fsrsLastReview, today));
}

/** FSRS-5 review behaviour: stability/difficulty model on review-state cards. */
export const fsrsStrategy: ReviewStrategy = {
  graduate(card, config, easy, opts) {
    const p = params(opts);
    const rating: Rating = easy ? 4 : 3;
    card.cardType = "review";
    card.repetitions = Math.max(card.repetitions, 1);
    card.learningStep = 0;
    card.learningDueAt = undefined;
    card.fsrsDifficulty = initDifficulty(rating, p.w);
    card.fsrsStability = initStability(rating, p.w);
    card.fsrsLastReview = studyToday(opts, opts.now ?? Date.now());
    scheduleFromStability(card, card.fsrsStability, config, opts, p);
  },

  relearnGraduate(card, config, opts) {
    const p = params(opts);
    card.cardType = "review";
    card.learningStep = 0;
    card.learningDueAt = undefined;
    card.fsrsLastReview = studyToday(opts, opts.now ?? Date.now());
    const stability = card.fsrsStability ?? initStability(3, p.w);
    card.fsrsStability = stability;
    scheduleFromStability(card, stability, config, opts, p);
  },

  review(card, rating, config, opts) {
    const p = params(opts);
    const now = opts.now ?? Date.now();
    const today = studyToday(opts, now);
    let stability = card.fsrsStability;
    let difficulty = card.fsrsDifficulty;
    // Guard: a review-state card without FSRS state (e.g. mid-migration).
    if (stability === undefined || difficulty === undefined) {
      stability = Math.max(0.1, card.interval || config.minimumInterval);
      difficulty = initDifficulty(rating, p.w);
    }
    const retrievability = predictedRetention(stability, elapsedDays(card, today));
    const newDifficulty = nextDifficulty(difficulty, rating, p.w);

    if (rating === 1) {
      card.lapses += 1;
      const sf = nextForgetStability(newDifficulty, stability, retrievability, p.w);
      card.fsrsStability = sf;
      card.fsrsDifficulty = newDifficulty;
      card.fsrsLastReview = today;
      card.cardType = "relearning";
      card.learningStep = 0;
      scheduleLearning(card, config.lapseSteps[0] ?? 10, now, opts);
      card.interval = intervalFromStability(sf, p.requestedRetention, config.maximumInterval);
      return;
    }

    const sr = nextRecallStability(newDifficulty, stability, retrievability, rating, p.w);
    card.fsrsStability = sr;
    card.fsrsDifficulty = newDifficulty;
    card.fsrsLastReview = today;
    card.repetitions += 1;
    scheduleFromStability(card, sr, config, opts, p);
  },
};

/** Apply an FSRS rating to a card. Pure function. */
export function applyReviewFsrs(
  card: CardState,
  rating: Rating,
  config: StudyConfig,
  opts: ApplyReviewOpts = {},
): ReviewResult {
  return runReview(card, rating, config, opts, fsrsStrategy);
}

/**
 * Seed FSRS state from an SM-2 card without resetting progress. Stability maps
 * from `interval`; difficulty maps linearly from `easeFactor`. Idempotent —
 * cards already carrying FSRS state, or not yet in review, are returned as-is.
 */
export function migrateToFsrs(card: CardState, config: StudyConfig): CardState {
  if (card.fsrsStability !== undefined && card.fsrsDifficulty !== undefined) return card;
  if (card.cardType !== "review") return card;
  const stability = Math.max(0.1, card.interval || config.minimumInterval);
  // EF 2.5 → D≈5.5, EF 1.3 → D 10 (clamped), EF 3.5 → D 1.
  const difficulty = clamp((3.5 - card.easeFactor) * (10 / 2.2) + 1, 1, 10);
  const lastReview = addDaysISO(card.dueDate, -Math.max(1, card.interval || 1));
  return {
    ...card,
    fsrsStability: stability,
    fsrsDifficulty: difficulty,
    fsrsLastReview: lastReview,
  };
}
