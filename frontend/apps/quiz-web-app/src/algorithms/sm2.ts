import type { CardState, StudyConfig, Rating } from "../store/types";
import {
  runReview,
  scheduleLearning,
  scheduleReviewInterval,
  type ApplyReviewOpts,
  type ReviewResult,
  type ReviewStrategy,
} from "./learning";

export type { ApplyReviewOpts, ReviewResult } from "./learning";

/** SM-2 review behaviour: ease-factor + interval growth, lapses → relearning. */
export const sm2Strategy: ReviewStrategy = {
  graduate(card, config, easy, opts) {
    card.cardType = "review";
    card.repetitions = Math.max(card.repetitions, 1);
    card.learningStep = 0;
    card.learningDueAt = undefined;
    card.easeFactor = card.easeFactor || config.startingEaseFactor;
    const base = easy ? config.easyInterval : config.graduatingInterval;
    scheduleReviewInterval(card, base, config, opts);
  },

  relearnGraduate(card, config, opts) {
    card.cardType = "review";
    card.learningStep = 0;
    card.learningDueAt = undefined;
    const ivl = Math.max(config.minimumInterval, card.interval || config.minimumInterval);
    scheduleReviewInterval(card, ivl, config, opts);
  },

  review(card, rating, config, opts) {
    const now = opts.now ?? Date.now();
    let newEF = card.easeFactor;
    if (rating === 1) newEF = Math.max(1.3, card.easeFactor - 0.2);
    else if (rating === 2) newEF = Math.max(1.3, card.easeFactor - 0.15);
    else if (rating === 4) newEF = card.easeFactor + 0.15;

    if (rating === 1) {
      card.lapses += 1;
      card.cardType = "relearning";
      card.learningStep = 0;
      scheduleLearning(card, config.lapseSteps[0] ?? 10, now, opts);
      const newInterval = Math.max(
        config.minimumInterval,
        Math.floor(card.interval * config.lapseNewInterval),
      );
      card.interval = Math.min(newInterval, config.maximumInterval);
      card.easeFactor = newEF;
      return;
    }

    let newInterval: number;
    if (rating === 2)
      newInterval = Math.max(
        config.minimumInterval,
        Math.floor(card.interval * 1.2 * config.intervalModifier),
      );
    else if (rating === 3)
      newInterval = Math.max(
        config.minimumInterval,
        Math.floor(card.interval * newEF * config.intervalModifier),
      );
    else
      newInterval = Math.max(
        config.minimumInterval,
        Math.floor(card.interval * newEF * config.easyBonus * config.intervalModifier),
      );

    card.easeFactor = newEF;
    card.repetitions += 1;
    scheduleReviewInterval(card, newInterval, config, opts);
  },
};

/** Apply an SM-2 rating to a card and return the updated card. Pure function. */
export function applyReview(
  card: CardState,
  rating: Rating,
  config: StudyConfig,
  opts: ApplyReviewOpts = {},
): ReviewResult {
  return runReview(card, rating, config, opts, sm2Strategy);
}

/**
 * Migrate a card to SM-2 by dropping FSRS-only fields. SM-2 reads
 * `interval` / `easeFactor`, which are preserved, so this is lossless.
 */
export function migrateToSm2(card: CardState): CardState {
  if (card.fsrsStability === undefined && card.fsrsDifficulty === undefined) return card;
  const { fsrsStability, fsrsDifficulty, fsrsLastReview, ...rest } = card;
  void fsrsStability;
  void fsrsDifficulty;
  void fsrsLastReview;
  return rest;
}
