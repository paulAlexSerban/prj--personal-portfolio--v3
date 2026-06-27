import { describe, it, expect, beforeEach } from "vitest";
import { useStore, initialState } from "./index";
import { selectStudyQueue, getPostStats } from "./selectors";
import { todayISO } from "../utils/dates";

function resetStore() {
  useStore.setState(
    {
      cardStates: {},
      addedPosts: [],
      ignored: {},
      suspended: {},
      reviewLogs: [],
      studySessions: [],
      settings: initialState.settings,
      config: initialState.config,
      daily: { date: todayISO(0), new: 0, reviews: 0 },
      lastReview: null,
    },
    false,
  );
}

beforeEach(() => {
  resetStore();
});

describe("addPost", () => {
  it("adds the post and creates fresh card states for its questions", () => {
    useStore.getState().addPost("react-hooks", ["react-hooks--a", "react-hooks--b"]);
    const s = useStore.getState();
    expect(s.addedPosts).toEqual(["react-hooks"]);
    expect(Object.keys(s.cardStates)).toHaveLength(2);
    expect(s.cardStates["react-hooks--a"]!.cardType).toBe("new");
    expect(s.cardStates["react-hooks--a"]!.postSlug).toBe("react-hooks");
  });

  it("is additive — re-adding does not reset progress on existing questions (WEB-04)", () => {
    const store = useStore.getState();
    store.addPost("react-hooks", ["react-hooks--a"]);
    // advance the card out of "new"
    store.reviewCard("react-hooks--a", 4, 1000);
    const advanced = useStore.getState().cardStates["react-hooks--a"]!;
    expect(advanced.cardType).not.toBe("new");

    // re-add the same post with an extra question
    useStore.getState().addPost("react-hooks", ["react-hooks--a", "react-hooks--b"]);
    const s = useStore.getState();
    // existing card untouched
    expect(s.cardStates["react-hooks--a"]!.cardType).toBe(advanced.cardType);
    expect(s.cardStates["react-hooks--a"]!.repetitions).toBe(advanced.repetitions);
    // new card created fresh
    expect(s.cardStates["react-hooks--b"]!.cardType).toBe("new");
    // post not duplicated
    expect(s.addedPosts).toEqual(["react-hooks"]);
  });
});

describe("removePost", () => {
  it("removes the post from the study set but preserves card progress (WEB-05)", () => {
    const store = useStore.getState();
    store.addPost("react-hooks", ["react-hooks--a"]);
    store.reviewCard("react-hooks--a", 3, 1000);
    const before = useStore.getState().cardStates["react-hooks--a"]!;

    useStore.getState().removePost("react-hooks");
    const s = useStore.getState();
    expect(s.addedPosts).toEqual([]);
    // progress kept
    expect(s.cardStates["react-hooks--a"]).toEqual(before);

    // re-adding keeps the previous progress
    useStore.getState().addPost("react-hooks", ["react-hooks--a"]);
    expect(useStore.getState().cardStates["react-hooks--a"]).toEqual(before);
  });
});

describe("reviewCard", () => {
  it("advances SM-2 state by question slug and logs the review (WEB-06)", () => {
    const store = useStore.getState();
    store.addPost("p", ["p--q1"]);
    store.reviewCard("p--q1", 3, 2500);

    const s = useStore.getState();
    const card = s.cardStates["p--q1"]!;
    expect(card.cardType).not.toBe("new"); // graduated/learning
    expect(s.reviewLogs).toHaveLength(1);
    expect(s.reviewLogs[0]!.questionSlug).toBe("p--q1");
    expect(s.reviewLogs[0]!.rating).toBe(3);
    expect(s.reviewLogs[0]!.timeTaken).toBe(2500);
  });

  it("is a no-op for an unknown question slug", () => {
    useStore.getState().reviewCard("missing", 3, 1000);
    expect(useStore.getState().reviewLogs).toHaveLength(0);
  });

  it("counts a new-card review in today's daily counts", () => {
    const store = useStore.getState();
    store.addPost("p", ["p--q1"]);
    store.reviewCard("p--q1", 3, 1000);
    expect(useStore.getState().daily.new).toBe(1);
  });
});

describe("ignoreQuestion", () => {
  it("excludes the question from the study queue (WEB-08)", () => {
    const store = useStore.getState();
    store.addPost("p", ["p--q1", "p--q2"]);

    let queue = selectStudyQueue(useStore.getState(), { now: Date.now() });
    expect(queue.map((c) => c.questionSlug).sort()).toEqual(["p--q1", "p--q2"]);

    useStore.getState().ignoreQuestion("p--q1");
    queue = selectStudyQueue(useStore.getState(), { now: Date.now() });
    expect(queue.map((c) => c.questionSlug)).toEqual(["p--q2"]);
  });

  it("unignore restores the question to the queue", () => {
    const store = useStore.getState();
    store.addPost("p", ["p--q1"]);
    store.ignoreQuestion("p--q1");
    expect(selectStudyQueue(useStore.getState())).toHaveLength(0);
    useStore.getState().unignoreQuestion("p--q1");
    expect(selectStudyQueue(useStore.getState())).toHaveLength(1);
  });
});

describe("resetPost / resetAll", () => {
  it("resetPost returns a post's cards to new without touching other posts", () => {
    const store = useStore.getState();
    store.addPost("a", ["a--1"]);
    store.addPost("b", ["b--1"]);
    store.reviewCard("a--1", 4, 1000);
    store.reviewCard("b--1", 4, 1000);

    useStore.getState().resetPost("a");
    const s = useStore.getState();
    expect(s.cardStates["a--1"]!.cardType).toBe("new");
    expect(s.cardStates["b--1"]!.cardType).not.toBe("new");
  });

  it("resetAll clears progress, logs and sessions", () => {
    const store = useStore.getState();
    store.addPost("a", ["a--1"]);
    store.reviewCard("a--1", 4, 1000);

    useStore.getState().resetAll();
    const s = useStore.getState();
    expect(s.cardStates["a--1"]!.cardType).toBe("new");
    expect(s.reviewLogs).toHaveLength(0);
    expect(s.studySessions).toHaveLength(0);
    // added posts are preserved on a progress reset
    expect(s.addedPosts).toEqual(["a"]);
  });

  it("resetQuestion resets one card without touching siblings or review logs", () => {
    const store = useStore.getState();
    store.addPost("a", ["a--1", "a--2"]);
    store.reviewCard("a--1", 4, 1000);
    store.reviewCard("a--2", 4, 1000);

    useStore.getState().resetQuestion("a--1");
    const s = useStore.getState();
    expect(s.cardStates["a--1"]!.cardType).toBe("new");
    expect(s.cardStates["a--2"]!.cardType).not.toBe("new");
    expect(s.reviewLogs).toHaveLength(2);
  });
});

describe("undoLastReview", () => {
  it("restores the exact prior card state, daily counts, and drops the log", () => {
    const store = useStore.getState();
    store.addPost("p", ["p--1"]);
    const before = useStore.getState().cardStates["p--1"]!;
    const dailyBefore = useStore.getState().daily;

    store.reviewCard("p--1", 4, 1500);
    const afterReview = useStore.getState();
    expect(afterReview.cardStates["p--1"]).not.toEqual(before);
    expect(afterReview.reviewLogs).toHaveLength(1);
    expect(afterReview.daily.new).toBe(1);

    const undone = useStore.getState().undoLastReview();
    const s = useStore.getState();
    expect(undone?.questionSlug).toBe("p--1");
    expect(undone?.rating).toBe(4);
    expect(s.cardStates["p--1"]).toEqual(before);
    expect(s.daily).toEqual(dailyBefore);
    expect(s.reviewLogs).toHaveLength(0);
    expect(s.lastReview).toBeNull();
  });

  it("returns null and is a no-op when there is nothing to undo", () => {
    expect(useStore.getState().undoLastReview()).toBeNull();
  });

  it("only undoes the most recent review", () => {
    const store = useStore.getState();
    store.addPost("p", ["p--1", "p--2"]);
    store.reviewCard("p--1", 3, 1000);
    store.reviewCard("p--2", 3, 1000);

    useStore.getState().undoLastReview();
    const s = useStore.getState();
    expect(s.reviewLogs).toHaveLength(1);
    expect(s.reviewLogs[0]!.questionSlug).toBe("p--1");
    // second undo is now a no-op because lastReview was consumed
    expect(useStore.getState().undoLastReview()).toBeNull();
  });
});

describe("suspendQuestion", () => {
  it("excludes a suspended question from the queue and unsuspend restores it", () => {
    const store = useStore.getState();
    store.addPost("p", ["p--1", "p--2"]);

    store.suspendQuestion("p--1");
    let queue = selectStudyQueue(useStore.getState(), { now: Date.now() });
    expect(queue.map((c) => c.questionSlug)).toEqual(["p--2"]);

    useStore.getState().unsuspendQuestion("p--1");
    queue = selectStudyQueue(useStore.getState(), { now: Date.now() });
    expect(queue.map((c) => c.questionSlug).sort()).toEqual(["p--1", "p--2"]);
  });
});

describe("getPostStats", () => {
  it("reports counts and excludes ignored from active totals", () => {
    const store = useStore.getState();
    store.addPost("p", ["p--1", "p--2", "p--3"]);
    store.ignoreQuestion("p--3");

    const stats = getPostStats(useStore.getState(), "p");
    expect(stats.total).toBe(3);
    expect(stats.newCount).toBe(2);
    expect(stats.ignoredCount).toBe(1);
  });
});

describe("sessions", () => {
  it("startSession then endSession summarises reviews since it started", () => {
    const store = useStore.getState();
    store.addPost("p", ["p--1", "p--2"]);
    const id = store.startSession();
    store.reviewCard("p--1", 3, 1000);
    store.reviewCard("p--2", 1, 1000);
    useStore.getState().endSession(id);

    const session = useStore.getState().studySessions.find((s) => s.id === id)!;
    expect(session.endedAt).not.toBeNull();
    expect(session.cardsStudied).toBe(2);
    expect(session.cardsGood).toBe(1);
    expect(session.cardsAgain).toBe(1);
  });
});
