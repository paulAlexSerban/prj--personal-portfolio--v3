import { describe, it, expect } from "vitest";
import { applyReview } from "./sm2";
import { DEFAULT_CONFIG, createCardState } from "../store/types";
import type { CardState } from "../store/types";

const reviewOpts = { today: "2026-06-01" };

function reviewCard(slug: string, interval = 10, easeFactor = 2.5): CardState {
  return {
    ...createCardState(slug, "post-a"),
    cardType: "review",
    interval,
    repetitions: 3,
    easeFactor,
    dueDate: "2026-06-01",
  };
}

function rateAgainFromReview(card: CardState): CardState {
  const lapsed = applyReview(card, 1, DEFAULT_CONFIG, reviewOpts).card;
  expect(lapsed.cardType).toBe("relearning");
  return applyReview(lapsed, 3, DEFAULT_CONFIG, reviewOpts).card;
}

describe("SM-2 ease factor", () => {
  it("is tracked independently per question", () => {
    let easyCard = reviewCard("post-a--q-easy");
    let againCard = reviewCard("post-a--q-again");

    for (let i = 0; i < 3; i++) {
      easyCard = applyReview(easyCard, 4, DEFAULT_CONFIG, reviewOpts).card;
      againCard = rateAgainFromReview(againCard);
    }

    expect(easyCard.easeFactor).toBeGreaterThan(againCard.easeFactor);
    expect(easyCard.easeFactor).toBeCloseTo(2.5 + 0.15 * 3);
    expect(againCard.easeFactor).toBeCloseTo(2.5 - 0.2 * 3);
    expect(easyCard.questionSlug).toBe("post-a--q-easy");
    expect(againCard.questionSlug).toBe("post-a--q-again");
  });

  it("applies standard ease deltas on review ratings", () => {
    const base = reviewCard("post-a--q-deltas", 10, 2.5);

    const again = applyReview(base, 1, DEFAULT_CONFIG, reviewOpts).card;
    expect(again.easeFactor).toBeCloseTo(2.3);

    const hard = applyReview(base, 2, DEFAULT_CONFIG, reviewOpts).card;
    expect(hard.easeFactor).toBeCloseTo(2.35);

    const good = applyReview(base, 3, DEFAULT_CONFIG, reviewOpts).card;
    expect(good.easeFactor).toBe(2.5);

    const easy = applyReview(base, 4, DEFAULT_CONFIG, reviewOpts).card;
    expect(easy.easeFactor).toBeCloseTo(2.65);
  });

  it("floors ease factor at 1.3 on Again and Hard", () => {
    const lowEase = reviewCard("post-a--q-floor", 10, 1.35);
    const again = applyReview(lowEase, 1, DEFAULT_CONFIG, reviewOpts).card;
    expect(again.easeFactor).toBe(1.3);
  });
});

describe("SM-2 interval growth", () => {
  it("orders intervals Easy > Good > Hard on the same card", () => {
    const base = reviewCard("post-a--q-order", 10, 2.5);

    const hard = applyReview(base, 2, DEFAULT_CONFIG, reviewOpts).card.interval;
    const good = applyReview(base, 3, DEFAULT_CONFIG, reviewOpts).card.interval;
    const easy = applyReview(base, 4, DEFAULT_CONFIG, reviewOpts).card.interval;

    expect(easy).toBeGreaterThan(good);
    expect(good).toBeGreaterThan(hard);
  });

  it("repeated Easy ratings converge to and never exceed config.maximumInterval", () => {
    let card = reviewCard("post-a--q-cap", 1, 2.5);

    for (let i = 0; i < 20; i++) {
      card = applyReview(card, 4, DEFAULT_CONFIG, reviewOpts).card;
      expect(card.interval).toBeLessThanOrEqual(DEFAULT_CONFIG.maximumInterval);
    }
    expect(card.interval).toBe(DEFAULT_CONFIG.maximumInterval);
  });
});
