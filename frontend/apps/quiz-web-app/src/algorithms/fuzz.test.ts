import { describe, it, expect } from "vitest";
import { applyFuzz, balanceDueDate, buildDueCounts, fuzzMagnitude } from "./fuzz";
import { applyReview } from "./sm2";
import { DEFAULT_CONFIG, createCardState } from "../store/types";

describe("fuzzMagnitude", () => {
  it("grows with interval", () => {
    expect(fuzzMagnitude(1)).toBe(0);
    expect(fuzzMagnitude(5)).toBe(1);
    expect(fuzzMagnitude(35)).toBeGreaterThan(1);
  });
});

describe("applyFuzz", () => {
  it("is deterministic for the same seed", () => {
    const a = applyFuzz(10, "card-a", 1);
    const b = applyFuzz(10, "card-a", 1);
    expect(a).toEqual(b);
  });

  it("keeps interval within fuzz tolerance", () => {
    const { interval } = applyFuzz(30, "card-b", 1);
    const mag = fuzzMagnitude(30);
    expect(interval).toBeGreaterThanOrEqual(30 - mag);
    expect(interval).toBeLessThanOrEqual(30 + mag);
  });
});

describe("balanceDueDate", () => {
  it("spreads a same-day cohort across multiple due dates", () => {
    const today = "2026-06-01";
    const dueCounts = new Map<string, number>();
    const dueDates = new Set<string>();

    for (let i = 0; i < 20; i++) {
      const { dueDate } = balanceDueDate({
        baseInterval: 10,
        seed: `cohort--q${i}`,
        today,
        minimumInterval: 1,
        dueCounts,
      });
      dueDates.add(dueDate);
      dueCounts.set(dueDate, (dueCounts.get(dueDate) ?? 0) + 1);
    }

    expect(dueDates.size).toBeGreaterThan(1);
  });

  it("nudges toward the lightest day in the lookahead window", () => {
    const today = "2026-06-01";
    const dueCounts = new Map<string, number>([
      ["2026-06-10", 50],
      ["2026-06-11", 50],
      ["2026-06-12", 1],
    ]);
    const { dueDate } = balanceDueDate({
      baseInterval: 10,
      seed: "light-day",
      today,
      minimumInterval: 1,
      dueCounts,
      lookaheadDays: 21,
    });
    expect(dueDate).toBe("2026-06-12");
  });
});

describe("buildDueCounts", () => {
  it("counts only review cards by due date", () => {
    const counts = buildDueCounts([
      { cardType: "review", dueDate: "2026-06-01" },
      { cardType: "review", dueDate: "2026-06-01" },
      { cardType: "new", dueDate: "2026-06-01" },
    ]);
    expect(counts.get("2026-06-01")).toBe(2);
  });
});

describe("applyReview fuzz integration", () => {
  it("assigns different due dates to cards graduating with the same interval", () => {
    const today = "2026-06-01";
    const dueCounts = new Map<string, number>();
    const dueDates = new Set<string>();
    const config = { ...DEFAULT_CONFIG, graduatingInterval: 10 };

    for (let i = 0; i < 15; i++) {
      const slug = `p--q${i}`;
      let card = createCardState(slug, "p");
      card.cardType = "learning";
      card.learningStep = config.learningSteps.length - 1;
      const { card: next } = applyReview(card, 3, config, {
        seed: slug,
        dueCounts,
        today,
      });
      dueDates.add(next.dueDate);
      dueCounts.set(next.dueDate, (dueCounts.get(next.dueDate) ?? 0) + 1);
    }

    expect(dueDates.size).toBeGreaterThan(1);
  });
});
