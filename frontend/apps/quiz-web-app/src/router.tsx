import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const router = createRouter({
  routeTree,
  // Vite sets BASE_URL to the `base` config value with a trailing slash; strip it.
  basepath: import.meta.env.BASE_URL.replace(/\/$/, "") || "/",
  scrollRestoration: true,
  defaultPreloadStaleTime: 0,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
