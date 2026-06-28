import { describe, it, expect } from "vitest";
import { filterByQuery } from "@prj--personal-portfolio--v3/shared--ui/post-filters";

/**
 * Characterization test for the post-catalogue search at routes/index.tsx:47–55.
 *
 * The original inline filter:
 *   posts.filter((p) =>
 *     p.title.toLowerCase().includes(q) ||
 *     p.slug.toLowerCase().includes(q) ||
 *     p.tags.some((t) => t.includes(q)))   // q already lowercased
 *
 * These tests pin that observable behavior and prove the shared filterByQuery
 * (used via (p) => p.tags) is behaviorally equivalent before the swap.
 * Quiz tags are stored lowercase, so t.includes(q) === t.toLowerCase().includes(q).
 */

interface PostLike {
  title: string;
  slug: string;
  tags: string[];
}

const posts: PostLike[] = [
  { title: "Big O Notation", slug: "big-o-notation", tags: ["algorithms", "big-o"] },
  { title: "Python Strings", slug: "python-strings", tags: ["python", "strings"] },
  { title: "Vim Basics", slug: "vim-basics", tags: ["terminal", "vim"] },
];

const run = (q: string) => filterByQuery(posts, q, (p) => p.tags).map((p) => p.slug);

describe("post catalogue filter — characterization", () => {
  it("empty query returns every post", () => {
    expect(run("")).toEqual(["big-o-notation", "python-strings", "vim-basics"]);
  });

  it("matches on title (case-insensitive)", () => {
    expect(run("PYTHON")).toEqual(["python-strings"]);
  });

  it("matches on slug", () => {
    expect(run("vim-basics")).toEqual(["vim-basics"]);
  });

  it("matches on tag", () => {
    expect(run("algorithms")).toEqual(["big-o-notation"]);
  });

  it("returns nothing when no field matches", () => {
    expect(run("nonexistent")).toEqual([]);
  });
});
