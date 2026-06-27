import { todayISO } from "../utils/dates";

export type CardType = "new" | "learning" | "review" | "relearning";

/** Available scheduling algorithms. */
export type SchedulerName = "sm2" | "fsrs";

/**
 * Per-question spaced-repetition state. Keyed by question slug in the store.
 * Content (stem, options, explanation) lives in the JSON data, NOT here —
 * this object only carries the scheduling state for a single question.
 *
 * SM-2 uses `interval` / `easeFactor` / `repetitions`. FSRS additionally
 * tracks `fsrsStability` / `fsrsDifficulty`; their absence means the card has
 * never been scheduled under FSRS (migration seeds them from interval/ease).
 */
export interface CardState {
  questionSlug: string;
  postSlug: string;
  interval: number;
  repetitions: number;
  easeFactor: number;
  dueDate: string; // ISO date (yyyy-mm-dd)
  lapses: number;
  cardType: CardType;
  learningStep: number;
  learningDueAt?: number; // ms epoch for in-session learning queue
  /** FSRS stability (S): expected days until retrievability drops to target. */
  fsrsStability?: number;
  /** FSRS difficulty (D) ∈ [1, 10]. */
  fsrsDifficulty?: number;
  /** ISO date of the last FSRS review, for retrievability R(t) computation. */
  fsrsLastReview?: string;
  createdAt: string;
  updatedAt: string;
}

/** FSRS-5 tunable parameters. */
export interface FsrsParams {
  /** 19-element weight vector (FSRS-5). */
  w: number[];
  /** Target retrieval probability used to compute the next interval. */
  requestedRetention: number;
  /** Hard cap on the scheduled interval (days). */
  maximumInterval: number;
}

export interface StudyConfig {
  newCardsPerDay: number;
  maxReviewsPerDay: number;
  learningSteps: number[];
  graduatingInterval: number;
  easyInterval: number;
  lapseSteps: number[];
  lapseNewInterval: number;
  minimumInterval: number;
  easyBonus: number;
  intervalModifier: number;
  maximumInterval: number;
  startingEaseFactor: number;
}

export type Rating = 1 | 2 | 3 | 4;

export interface ReviewLog {
  id: string;
  questionSlug: string;
  postSlug: string;
  rating: Rating;
  timestamp: string;
  previousInterval: number;
  newInterval: number;
  previousEaseFactor: number;
  newEaseFactor: number;
  timeTaken: number;
  /** Scheduler that produced this review (for analytics / back-testing). */
  scheduler?: SchedulerName;
}

export interface StudySession {
  id: string;
  startedAt: string;
  endedAt: string | null;
  cardsStudied: number;
  cardsAgain: number;
  cardsHard: number;
  cardsGood: number;
  cardsEasy: number;
}

export interface AppSettings {
  theme: "light" | "dark" | "system";
  studyOrder: "new-first" | "reviews-first" | "mixed";
  showTiming: boolean;
  keyboardShortcuts: boolean;
  globalNewLimit: number | null;
  globalReviewLimit: number | null;
  /** Hour (0–23) when the study day rolls over (Anki default: 4). */
  dayStartHour: number;
  /** Auto-leech when lapses reach this count (0 = disabled). */
  leechThreshold: number;
  /** Action when a card becomes a leech. */
  leechAction: "suspend" | "tag";
  /** Active scheduling algorithm. */
  scheduler: SchedulerName;
  /** FSRS target retrieval probability [0.7 – 0.99]. */
  fsrsTargetRetention: number;
  /** Optional custom FSRS weights (19 values). Falls back to defaults when unset. */
  fsrsWeights?: number[];
}

/** Per-post overrides for pacing — unset fields inherit global config. */
export type PostConfigOverride = Partial<
  Pick<StudyConfig, "newCardsPerDay" | "maxReviewsPerDay" | "learningSteps" | "lapseSteps">
>;

export interface DailyCounts {
  date: string;
  new: number;
  reviews: number;
}

export interface PostStats {
  total: number;
  newCount: number;
  learningCount: number;
  reviewDueCount: number;
  ignoredCount: number;
}

export const DEFAULT_CONFIG: StudyConfig = {
  newCardsPerDay: 20,
  maxReviewsPerDay: 200,
  learningSteps: [1, 10],
  graduatingInterval: 1,
  easyInterval: 4,
  lapseSteps: [10],
  lapseNewInterval: 0,
  minimumInterval: 1,
  easyBonus: 1.3,
  intervalModifier: 1.0,
  maximumInterval: 36500,
  startingEaseFactor: 2.5,
};

export const DEFAULT_SETTINGS: AppSettings = {
  theme: "light",
  studyOrder: "mixed",
  showTiming: true,
  keyboardShortcuts: true,
  globalNewLimit: null,
  globalReviewLimit: null,
  dayStartHour: 4,
  leechThreshold: 8,
  leechAction: "suspend",
  scheduler: "sm2",
  fsrsTargetRetention: 0.9,
};

/** Fresh SM-2 state for a question newly added to the study set. */
export function createCardState(
  questionSlug: string,
  postSlug: string,
  now = Date.now(),
): CardState {
  const ts = new Date(now).toISOString();
  return {
    questionSlug,
    postSlug,
    interval: 0,
    repetitions: 0,
    easeFactor: 2.5,
    dueDate: todayISO(0),
    lapses: 0,
    cardType: "new",
    learningStep: 0,
    createdAt: ts,
    updatedAt: ts,
  };
}

/** Reset a card's progress back to "new" while preserving identity/timestamps. */
export function resetCardState(card: CardState, now = Date.now()): CardState {
  return {
    ...card,
    interval: 0,
    repetitions: 0,
    easeFactor: 2.5,
    lapses: 0,
    cardType: "new",
    learningStep: 0,
    learningDueAt: undefined,
    fsrsStability: undefined,
    fsrsDifficulty: undefined,
    fsrsLastReview: undefined,
    dueDate: todayISO(0),
    updatedAt: new Date(now).toISOString(),
  };
}
