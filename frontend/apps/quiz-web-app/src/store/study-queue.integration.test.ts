import { describe, it, expect, beforeEach } from "vitest";
import { useStore, initialState } from "./index";
import { selectStudyQueue } from "./selectors";

// Simulate a realistic set of question slugs for a single post.
const POST = "big-o-notation";
const SLUGS = Array.from({ length: 30 }, (_, i) => `${POST}--q${i}`);

describe("/study queue (real store)", () => {
  beforeEach(() => {
    useStore.setState({ ...initialState, daily: { date: "", new: 0, reviews: 0 } });
  });

  it("a fresh add yields a non-empty global queue capped at the new-card limit", () => {
    useStore.getState().addPost(POST, SLUGS);
    const s = useStore.getState();
    const queue = selectStudyQueue(s, { now: Date.now() });
    // Default newCardsPerDay is 20.
    expect(queue.length).toBe(Math.min(20, SLUGS.length));
  });

  it("queue becomes empty once the daily new-card limit is consumed", () => {
    useStore.getState().addPost(POST, SLUGS);
    // Drain the daily new budget by reviewing 20 brand-new cards.
    for (let i = 0; i < 20; i++) {
      useStore.getState().reviewCard(SLUGS[i], 4, 1000); // Easy → graduates out of "new"
    }
    const s = useStore.getState();
    const queue = selectStudyQueue(s, { now: Date.now() });
    // Remaining 10 are still "new" but the daily cap is hit → empty until tomorrow.
    expect(queue.length).toBe(0);
  });

  it("study-ahead (ignoreLimits) surfaces remaining cards past the daily cap", () => {
    useStore.getState().addPost(POST, SLUGS);
    for (let i = 0; i < 20; i++) {
      useStore.getState().reviewCard(SLUGS[i], 4, 1000);
    }
    const s = useStore.getState();
    expect(selectStudyQueue(s, { now: Date.now() }).length).toBe(0);
    // Ignoring caps brings back the 10 untouched "new" cards.
    expect(selectStudyQueue(s, { now: Date.now(), ignoreLimits: true }).length).toBe(10);
  });

  it("cram mode returns scoped cards even when not due", () => {
    useStore.getState().addPost(POST, SLUGS);
    for (let i = 0; i < 20; i++) {
      useStore.getState().reviewCard(SLUGS[i], 4, 1000);
    }
    const s = useStore.getState();
    expect(selectStudyQueue(s, { questionSlugs: [SLUGS[20]], cram: true }).length).toBe(1);
    expect(selectStudyQueue(s, { now: Date.now() }).length).toBe(0);
  });

  it("cram mode returns relearning cards even when the learning step is not yet due", () => {
    const slug = SLUGS[0];
    useStore.getState().addPost(POST, [slug]);
    const card = useStore.getState().cardStates[slug];
    useStore.setState({
      cardStates: {
        [slug]: {
          ...card,
          cardType: "relearning",
          learningStep: 0,
          learningDueAt: Date.now() + 600_000,
        },
      },
    });
    const s = useStore.getState();
    expect(selectStudyQueue(s, { questionSlugs: [slug], cram: true, now: Date.now() }).length).toBe(
      1,
    );
    expect(selectStudyQueue(s, { now: Date.now() }).length).toBe(0);
  });
});
