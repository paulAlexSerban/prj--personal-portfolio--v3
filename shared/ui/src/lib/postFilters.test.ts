import { describe, it, expect } from "vitest";
import {
  filterByQuery,
  sortBlogPosts,
  sortQuizPosts,
  type BlogPostFilterItem,
  type QuizPostSortItem,
} from "./postFilters";

const items: BlogPostFilterItem[] = [
  {
    title: "Big O Notation",
    slug: "big-o-notation",
    excerpt: "Complexity analysis.",
    date: "2026-01-10",
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
    type: "snippet",
    tags: [{ name: "Terminal", slug: "terminal" }],
  },
  {
    title: "Refactoring",
    slug: "refactoring-fowler",
    excerpt: null,
    date: null,
    type: "book-note",
    tags: [{ name: "Clean Code", slug: "clean-code" }],
  },
];

const tagNames = (p: BlogPostFilterItem) => p.tags.map((t) => t.name);

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
