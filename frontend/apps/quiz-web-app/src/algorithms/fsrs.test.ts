import { describe, it, expect } from "vitest";
import {
  DEFAULT_FSRS_PARAMS,
  applyReviewFsrs,
  initDifficulty,
  initStability,
  intervalFromStability,
  migrateToFsrs,
  nextDifficulty,
  nextForgetStability,
  nextRecallStability,
  predictedRetention,
} from "./fsrs";
import { migrateToSm2 } from "./sm2";
import { getScheduler } from "./scheduler";
import { DEFAULT_CONFIG, DEFAULT_SETTINGS, createCardState } from "../store/types";
import type { CardState } from "../store/types";

const w = DEFAULT_FSRS_PARAMS.w;

describe("FSRS core formulas", () => {
  it("initial stability picks the weight for the rating", () => {
    expect(initStability(1, w)).toBeCloseTo(w[0]);
    expect(initStability(4, w)).toBeCloseTo(w[3]);
  });

  it("initial difficulty is ordered: harder ratings → higher difficulty", () => {
    const again = initDifficulty(1, w);
    const easy = initDifficulty(4, w);
    expect(again).toBeGreaterThan(easy);
    expect(again).toBeLessThanOrEqual(10);
    expect(easy).toBeGreaterThanOrEqual(1);
  });

  it("difficulty rises on Again and falls on Easy", () => {
    const d = 5;
    expect(nextDifficulty(d, 1, w)).toBeGreaterThan(d);
    expect(nextDifficulty(d, 4, w)).toBeLessThan(d);
  });

  it("difficulty stays within [1, 10]", () => {
    expect(nextDifficulty(9.9, 1, w)).toBeLessThanOrEqual(10);
    expect(nextDifficulty(1.1, 4, w)).toBeGreaterThanOrEqual(1);
  });

  it("predicted retention is 1 at t=0 and decays over time", () => {
    expect(predictedRetention(10, 0)).toBeCloseTo(1);
    const early = predictedRetention(10, 5);
    const late = predictedRetention(10, 30);
    expect(early).toBeGreaterThan(late);
    expect(late).toBeGreaterThan(0);
  });

  it("interval at the requested retention recovers stability for R=0.9", () => {
    // By construction R(I)=requestedRetention, and at the default 0.9 the
    // interval equals the stability (FACTOR/DECAY are tuned for this).
    const ivl = intervalFromStability(10, 0.9);
    expect(ivl).toBe(10);
  });

  it("higher retention target → shorter interval", () => {
    const lenient = intervalFromStability(50, 0.8);
    const strict = intervalFromStability(50, 0.95);
    expect(strict).toBeLessThan(lenient);
  });

  it("recall stability increases, lapse stability does not exceed prior stability", () => {
    const S = 10;
    const D = 5;
    const R = 0.9;
    expect(nextRecallStability(D, S, R, 3, w)).toBeGreaterThan(S);
    expect(nextForgetStability(D, S, R, w)).toBeLessThanOrEqual(S);
  });
});

describe("FSRS review flow", () => {
  it("graduates a new card to review with stability/difficulty seeded", () => {
    const card = createCardState("p--q1", "p");
    // Easy graduates straight to review regardless of learning steps.
    const { card: next } = applyReviewFsrs(card, 4, DEFAULT_CONFIG, {
      today: "2026-06-01",
    });
    expect(next.cardType).toBe("review");
    expect(next.fsrsStability).toBeGreaterThan(0);
    expect(next.fsrsDifficulty).toBeGreaterThanOrEqual(1);
  });

  it("a lapse on a review card increments lapses and enters relearning", () => {
    const card: CardState = {
      ...createCardState("p--q2", "p"),
      cardType: "review",
      interval: 20,
      fsrsStability: 20,
      fsrsDifficulty: 5,
      fsrsLastReview: "2026-05-12",
    };
    const { card: next } = applyReviewFsrs(card, 1, DEFAULT_CONFIG, {
      today: "2026-06-01",
    });
    expect(next.lapses).toBe(1);
    expect(next.cardType).toBe("relearning");
    expect(next.fsrsStability!).toBeLessThanOrEqual(20);
  });

  it("Good on a due review card lengthens the interval", () => {
    const card: CardState = {
      ...createCardState("p--q3", "p"),
      cardType: "review",
      interval: 10,
      fsrsStability: 10,
      fsrsDifficulty: 5,
      fsrsLastReview: "2026-05-22",
    };
    const { card: next } = applyReviewFsrs(card, 3, DEFAULT_CONFIG, {
      today: "2026-06-01",
    });
    expect(next.fsrsStability!).toBeGreaterThan(10);
    expect(next.interval).toBeGreaterThan(10);
  });
});

describe("scheduler migration round-trip", () => {
  it("SM-2 → FSRS seeds stability/difficulty for review cards", () => {
    const card: CardState = {
      ...createCardState("p--q4", "p"),
      cardType: "review",
      interval: 30,
      easeFactor: 2.5,
      dueDate: "2026-07-01",
    };
    const migrated = migrateToFsrs(card, DEFAULT_CONFIG);
    expect(migrated.fsrsStability).toBe(30);
    expect(migrated.fsrsDifficulty).toBeGreaterThan(1);
    expect(migrated.fsrsDifficulty).toBeLessThanOrEqual(10);
  });

  it("leaves new/learning cards untouched (seeded on first review)", () => {
    const card = createCardState("p--q5", "p");
    expect(migrateToFsrs(card, DEFAULT_CONFIG).fsrsStability).toBeUndefined();
  });

  it("SM-2 → FSRS → SM-2 preserves interval and easeFactor exactly", () => {
    const card: CardState = {
      ...createCardState("p--q6", "p"),
      cardType: "review",
      interval: 42,
      easeFactor: 2.3,
      dueDate: "2026-08-01",
    };
    const fsrs = migrateToFsrs(card, DEFAULT_CONFIG);
    const back = migrateToSm2(fsrs);
    expect(back.interval).toBe(42);
    expect(back.easeFactor).toBe(2.3);
    expect(back.fsrsStability).toBeUndefined();
    expect(back.fsrsDifficulty).toBeUndefined();
  });

  it("migration is idempotent", () => {
    const card: CardState = {
      ...createCardState("p--q7", "p"),
      cardType: "review",
      interval: 12,
      easeFactor: 2.5,
      dueDate: "2026-07-01",
    };
    const once = migrateToFsrs(card, DEFAULT_CONFIG);
    const twice = migrateToFsrs(once, DEFAULT_CONFIG);
    expect(twice).toEqual(once);
  });
});

describe("getScheduler", () => {
  it("returns SM-2 by default and FSRS when selected", () => {
    expect(getScheduler(DEFAULT_SETTINGS).name).toBe("sm2");
    expect(getScheduler({ ...DEFAULT_SETTINGS, scheduler: "fsrs" }).name).toBe("fsrs");
  });

  it("FSRS scheduler honours the target-retention setting in previews", () => {
    const card: CardState = {
      ...createCardState("p--q8", "p"),
      cardType: "review",
      interval: 20,
      fsrsStability: 20,
      fsrsDifficulty: 5,
      fsrsLastReview: "2026-05-12",
    };
    const lenient = getScheduler({
      ...DEFAULT_SETTINGS,
      scheduler: "fsrs",
      fsrsTargetRetention: 0.8,
    }).previewInterval(card, 3, DEFAULT_CONFIG);
    const strict = getScheduler({
      ...DEFAULT_SETTINGS,
      scheduler: "fsrs",
      fsrsTargetRetention: 0.95,
    }).previewInterval(card, 3, DEFAULT_CONFIG);
    expect(lenient).not.toBe(strict);
  });
});
