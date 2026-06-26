import { describe, it, expect } from "vitest";
import { buildQueue, type QueueOpts } from "./queue";
import { DEFAULT_CONFIG, DEFAULT_SETTINGS, createCardState, type CardState } from "../store/types";
import { todayISO } from "../utils/dates";

function baseOpts(overrides: Partial<QueueOpts> = {}): QueueOpts {
    return {
        config: DEFAULT_CONFIG,
        newStudiedToday: 0,
        reviewsStudiedToday: 0,
        today: todayISO(0),
        now: Date.now(),
        settings: DEFAULT_SETTINGS,
        ...overrides,
    };
}

function reviewCard(slug: string, dueDate: string): CardState {
    return { ...createCardState(slug, "p"), cardType: "review", interval: 5, dueDate };
}

describe("buildQueue", () => {
    it("includes new cards and due review cards", () => {
        const cards = [createCardState("p--new", "p"), reviewCard("p--due", todayISO(0))];
        const queue = buildQueue(cards, baseOpts());
        expect(queue.map((c) => c.questionSlug).sort()).toEqual(["p--due", "p--new"]);
    });

    it("excludes review cards not yet due", () => {
        const cards = [reviewCard("p--future", todayISO(3))];
        const queue = buildQueue(cards, baseOpts());
        expect(queue).toHaveLength(0);
    });

    it("respects the new-cards-per-day limit", () => {
        const cards = Array.from({ length: 5 }, (_, i) => createCardState(`p--n${i}`, "p"));
        const queue = buildQueue(cards, baseOpts({ config: { ...DEFAULT_CONFIG, newCardsPerDay: 2 } }));
        expect(queue).toHaveLength(2);
    });

    it("subtracts already-studied new cards from the limit", () => {
        const cards = Array.from({ length: 5 }, (_, i) => createCardState(`p--n${i}`, "p"));
        const queue = buildQueue(
            cards,
            baseOpts({ config: { ...DEFAULT_CONFIG, newCardsPerDay: 3 }, newStudiedToday: 2 }),
        );
        expect(queue).toHaveLength(1);
    });

    it("orders reviews-first when configured", () => {
        const cards = [createCardState("p--new", "p"), reviewCard("p--due", todayISO(0))];
        const queue = buildQueue(
            cards,
            baseOpts({ settings: { ...DEFAULT_SETTINGS, studyOrder: "reviews-first" } }),
        );
        expect(queue[0]!.questionSlug).toBe("p--due");
    });
});
