import { describe, it, expect } from "vitest";
import { createRouter, createMemoryHistory } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

const POST = "big-o-notation-in-data-structures-and-algorithms-a-practical-engineering-guide";

describe("route resolution", () => {
  it("resolves /study to the global study route (not the nested per-set one)", async () => {
    const router = createRouter({
      routeTree,
      history: createMemoryHistory({ initialEntries: ["/study"] }),
    });
    await router.load();
    const ids = router.state.matches.map((m) => m.routeId);
    expect(ids).toContain("/study");
    expect(ids).not.toContain("/sets/$postSlug/study");
  });

  it("resolves /sets/$postSlug/study to the per-set study route", async () => {
    const router = createRouter({
      routeTree,
      history: createMemoryHistory({ initialEntries: [`/sets/${POST}/study`] }),
    });
    await router.load();
    const ids = router.state.matches.map((m) => m.routeId);
    expect(ids).toContain("/sets/$postSlug/study");
    expect(ids).not.toContain("/study");
  });

  it("resolves /sets/$postSlug to the set detail route", async () => {
    const router = createRouter({
      routeTree,
      history: createMemoryHistory({ initialEntries: [`/sets/${POST}`] }),
    });
    await router.load();
    const ids = router.state.matches.map((m) => m.routeId);
    expect(ids).toContain("/sets/$postSlug/");
  });

  it("resolves /browse and /tags routes", async () => {
    const browseRouter = createRouter({
      routeTree,
      history: createMemoryHistory({ initialEntries: ["/browse"] }),
    });
    await browseRouter.load();
    expect(browseRouter.state.matches.map((m) => m.routeId)).toContain("/browse");

    const tagsRouter = createRouter({
      routeTree,
      history: createMemoryHistory({ initialEntries: ["/tags/"] }),
    });
    await tagsRouter.load();
    expect(tagsRouter.state.matches.map((m) => m.routeId)).toContain("/tags/");
  });
});
