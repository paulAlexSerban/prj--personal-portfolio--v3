import type {
  AppSettings,
  CardState,
  FsrsParams,
  Rating,
  SchedulerName,
  StudyConfig,
} from "../store/types";
import type { ApplyReviewOpts, ReviewResult } from "./learning";
import { applyReview as applyReviewSm2, migrateToSm2 } from "./sm2";
import {
  applyReviewFsrs,
  migrateToFsrs,
  intervalFromStability,
  predictedRetention,
  DEFAULT_FSRS_PARAMS,
} from "./fsrs";
import { formatInterval } from "./intervals";

export type { ApplyReviewOpts, ReviewResult } from "./learning";

/**
 * A scheduling algorithm. All review/preview/migration logic in the app routes
 * through this interface, so the active algorithm can be swapped at runtime.
 */
export interface Scheduler {
  name: SchedulerName;
  applyReview(
    card: CardState,
    rating: Rating,
    config: StudyConfig,
    opts?: ApplyReviewOpts,
  ): ReviewResult;
  /** Human-readable next-interval label for a rating button. */
  previewInterval(card: CardState, rating: Rating, config: StudyConfig): string;
  /** Convert a card to this scheduler's state representation (lossless). */
  migrate(card: CardState, config: StudyConfig): CardState;
}

function learningLabel(next: CardState): string | null {
  if (next.cardType === "learning" || next.cardType === "relearning") {
    const mins = next.learningDueAt ? Math.max(1, (next.learningDueAt - Date.now()) / 60000) : 1;
    return formatInterval(0, mins);
  }
  return null;
}

export const sm2Scheduler: Scheduler = {
  name: "sm2",
  applyReview: (card, rating, config, opts) => applyReviewSm2(card, rating, config, opts),
  previewInterval: (card, rating, config) => {
    const { card: next } = applyReviewSm2(card, rating, config);
    return learningLabel(next) ?? formatInterval(next.interval);
  },
  migrate: (card) => migrateToSm2(card),
};

/** Build FSRS parameters from user settings, falling back to defaults. */
export function fsrsParamsFromSettings(settings: AppSettings): FsrsParams {
  const w =
    settings.fsrsWeights && settings.fsrsWeights.length === DEFAULT_FSRS_PARAMS.w.length
      ? settings.fsrsWeights
      : DEFAULT_FSRS_PARAMS.w;
  return {
    w,
    requestedRetention: settings.fsrsTargetRetention ?? DEFAULT_FSRS_PARAMS.requestedRetention,
    maximumInterval: DEFAULT_FSRS_PARAMS.maximumInterval,
  };
}

export function makeFsrsScheduler(settings: AppSettings): Scheduler {
  const fsrsParams = fsrsParamsFromSettings(settings);
  return {
    name: "fsrs",
    applyReview: (card, rating, config, opts) =>
      applyReviewFsrs(card, rating, config, { ...opts, fsrsParams }),
    previewInterval: (card, rating, config) => {
      const { card: next } = applyReviewFsrs(card, rating, config, { fsrsParams });
      return learningLabel(next) ?? formatInterval(next.interval);
    },
    migrate: (card, config) => migrateToFsrs(card, config),
  };
}

/** Resolve the active scheduler from settings. */
export function getScheduler(settings: AppSettings): Scheduler {
  return settings.scheduler === "fsrs" ? makeFsrsScheduler(settings) : sm2Scheduler;
}

/**
 * Predicted current retrievability of a card under FSRS, given today's date.
 * Returns null for non-FSRS cards (no stability tracked).
 */
export function cardRetrievability(card: CardState, today: string): number | null {
  if (card.fsrsStability === undefined) return null;
  if (!card.fsrsLastReview) return 1;
  const [ay, am, ad] = card.fsrsLastReview.split("-").map(Number);
  const [by, bm, bd] = today.split("-").map(Number);
  const elapsed = Math.max(
    0,
    Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86400000),
  );
  return predictedRetention(card.fsrsStability, elapsed);
}

/** Next interval (days) a stability implies under a retention target. */
export function stabilityInterval(stability: number, retention: number): number {
  return intervalFromStability(stability, retention);
}
