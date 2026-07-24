import { describe, it, expect } from "vitest";
import {
  filterByQuery,
  filterByDateRange,
  formatDateLabel,
  getAvailableDateKeys,
  parseDateKey,
  sortBlogPosts,
  sortQuizPosts,
  toDateKey,
  type BlogPostFilterItem,
  type QuizPostSortItem,
} from "./postFilters";

const items: BlogPostFilterItem[] = [
  {
    title: "Big O Notation",
    slug: "big-o-notation",
    excerpt: "Complexity analysis.",
    date: "2026-01-10",
    cover: null,
    type: "post",
    tags: [
      { name: "Algorithms", slug: "algorithms" },
      { name: "Big-O", slug: "big-o" },
    ],
  },
  {
    title: "Vim Basics",
    slug: "vim-basics",
    excerpt: "Editor shortcuts.",
    date: "2026-03-05",
    cover: null,
    type: "snippet",
    tags: [{ name: "Terminal", slug: "terminal" }],
  },
  {
    title: "Refactoring",
    slug: "refactoring-fowler",
    excerpt: null,
    date: null,
    cover: null,
    type: "book-note",
    tags: [{ name: "Clean Code", slug: "clean-code" }],
  },
];

const tagNames = (p: BlogPostFilterItem) => p.tags.map((t) => t.name);

describe("toDateKey / parseDateKey / formatDateLabel", () => {
  it("round-trips a local Date to yyyy-MM-dd and back", () => {
    const date = new Date(2026, 6, 12); // Jul 12, 2026 local
    expect(toDateKey(date)).toBe("2026-07-12");
    const parsed = parseDateKey("2026-07-12");
    expect(parsed).not.toBeNull();
    expect(parsed!.getFullYear()).toBe(2026);
    expect(parsed!.getMonth()).toBe(6);
    expect(parsed!.getDate()).toBe(12);
  });

  it("rejects invalid keys", () => {
    expect(parseDateKey("not-a-date")).toBeNull();
    expect(parseDateKey("2026-13-01")).toBeNull();
    expect(parseDateKey("2026-02-30")).toBeNull();
    expect(parseDateKey("")).toBeNull();
  });

  it("formats a human label", () => {
    expect(formatDateLabel("2026-07-12")).toBe("Jul 12, 2026");
    expect(formatDateLabel("bad")).toBe("bad");
  });
});

describe("getAvailableDateKeys", () => {
  it("collects unique day-keys and skips null/invalid dates", () => {
    const mixed: BlogPostFilterItem[] = [
      ...items,
      {
        title: "Same Day",
        slug: "same-day",
        excerpt: null,
        date: "2026-01-10T15:00:00",
        cover: null,
        type: "post",
        tags: [],
      },
      {
        title: "Bad Date",
        slug: "bad-date",
        excerpt: null,
        date: "not-a-date",
        cover: null,
        type: "post",
        tags: [],
      },
    ];
    const keys = getAvailableDateKeys(mixed);
    expect(keys).toEqual(new Set(["2026-01-10", "2026-03-05"]));
  });
});

describe("filterByDateRange", () => {
  it("is a no-op when from is null", () => {
    expect(filterByDateRange(items, null, null)).toEqual(items);
    expect(filterByDateRange(items, null, "2026-03-05")).toEqual(items);
  });

  it("filters to a single day when to is null", () => {
    const result = filterByDateRange(items, "2026-01-10", null);
    expect(result.map((p) => p.slug)).toEqual(["big-o-notation"]);
  });

  it("filters an inclusive range and excludes undated items", () => {
    const result = filterByDateRange(items, "2026-01-10", "2026-03-05");
    expect(result.map((p) => p.slug)).toEqual([
      "big-o-notation",
      "vim-basics",
    ]);
  });

  it("includes boundary days", () => {
    const result = filterByDateRange(items, "2026-01-10", "2026-01-10");
    expect(result.map((p) => p.slug)).toEqual(["big-o-notation"]);
  });

  it("returns empty when no dates fall in range", () => {
    expect(filterByDateRange(items, "2025-01-01", "2025-12-31")).toEqual([]);
  });
});

describe("filterByQuery", () => {
  it("returns all items for an empty query", () => {
    expect(filterByQuery(items, "", tagNames)).toHaveLength(3);
    expect(filterByQuery(items, "   ", tagNames)).toHaveLength(3);
  });

  it("matches on title case-insensitively", () => {
    const result = filterByQuery(items, "vim", tagNames);
    expect(result.map((p) => p.slug)).toEqual(["vim-basics"]);
  });

  it("matches on slug", () => {
    const result = filterByQuery(items, "fowler", tagNames);
    expect(result.map((p) => p.slug)).toEqual(["refactoring-fowler"]);
  });

  it("matches on tag name via the extractor", () => {
    const result = filterByQuery(items, "algorithms", tagNames);
    expect(result.map((p) => p.slug)).toEqual(["big-o-notation"]);
  });

  it("returns empty when nothing matches", () => {
    expect(filterByQuery(items, "zzz-no-match", tagNames)).toEqual([]);
  });

  it("supports a string[] tag extractor (quiz usage shape)", () => {
    const quizPosts = [
      { title: "A", slug: "a", tags: ["python", "strings"] },
      { title: "B", slug: "b", tags: ["bash"] },
    ];
    const result = filterByQuery(quizPosts, "python", (p) => p.tags);
    expect(result.map((p) => p.slug)).toEqual(["a"]);
  });
});

describe("sortBlogPosts", () => {
  it("sorts by title ascending", () => {
    const result = sortBlogPosts(items, "title");
    expect(result.map((p) => p.title)).toEqual([
      "Big O Notation",
      "Refactoring",
      "Vim Basics",
    ]);
  });

  it("sorts by date newest first (null dates last)", () => {
    const result = sortBlogPosts(items, "date");
    expect(result.map((p) => p.slug)).toEqual([
      "vim-basics",
      "big-o-notation",
      "refactoring-fowler",
    ]);
  });

  it("does not mutate the input array", () => {
    const snapshot = items.map((p) => p.slug);
    sortBlogPosts(items, "title");
    expect(items.map((p) => p.slug)).toEqual(snapshot);
  });
});

const quizItems: QuizPostSortItem[] = [
  { title: "Big O Notation", date: "2026-01-10", questionCount: 12 },
  { title: "Vim Basics", date: "2026-03-05", questionCount: 5 },
  { title: "Refactoring", date: null, questionCount: 20 },
];

describe("sortQuizPosts", () => {
  it("sorts by date newest first (null dates last)", () => {
    const result = sortQuizPosts(quizItems, "date");
    expect(result.map((p) => p.title)).toEqual([
      "Vim Basics",
      "Big O Notation",
      "Refactoring",
    ]);
  });

  it("sorts by title ascending", () => {
    const result = sortQuizPosts(quizItems, "title");
    expect(result.map((p) => p.title)).toEqual([
      "Big O Notation",
      "Refactoring",
      "Vim Basics",
    ]);
  });

  it("sorts by question count descending", () => {
    const result = sortQuizPosts(quizItems, "questions");
    expect(result.map((p) => p.title)).toEqual([
      "Refactoring",
      "Big O Notation",
      "Vim Basics",
    ]);
  });

  it("does not mutate the input array", () => {
    const snapshot = quizItems.map((p) => p.title);
    sortQuizPosts(quizItems, "date");
    expect(quizItems.map((p) => p.title)).toEqual(snapshot);
  });
});
