import { describe, it, expect, beforeEach } from "vitest";
import { useStore, initialState } from "./index";
import { getCategoryPostSlugs, getUncategorizedPostSlugs } from "./selectors";
import { todayISO } from "../utils/dates";

beforeEach(() => {
  useStore.setState({ ...initialState, daily: { date: todayISO(0), new: 0, reviews: 0 } });
});

describe("getCategoryPostSlugs / getUncategorizedPostSlugs", () => {
  it("returns only added posts that belong to the category", () => {
    const store = useStore.getState();
    store.addPost("a", ["a--1"]);
    store.addPost("b", ["b--1"]);
    store.addPost("c", ["c--1"]);
    const mcp = store.createCategory("MCP");
    store.addPostToCategory("a", "favorites");
    store.addPostToCategory("b", mcp);
    store.addPostToCategory("b", "favorites");

    const s = useStore.getState();
    expect(getCategoryPostSlugs(s, "favorites").sort()).toEqual(["a", "b"]);
    expect(getCategoryPostSlugs(s, mcp)).toEqual(["b"]);
    expect(getUncategorizedPostSlugs(s)).toEqual(["c"]);
  });

  it("ignores membership for posts that are no longer added", () => {
    const store = useStore.getState();
    store.addPost("a", ["a--1"]);
    store.addPostToCategory("a", "favorites");
    store.removePost("a");
    expect(getCategoryPostSlugs(useStore.getState(), "favorites")).toEqual([]);
  });
});
