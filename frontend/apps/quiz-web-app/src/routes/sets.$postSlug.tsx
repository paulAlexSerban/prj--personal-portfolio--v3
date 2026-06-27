import { createFileRoute, Outlet } from "@tanstack/react-router";

/** Pathless layout so set detail (index) and study can share the $postSlug param. */
export const Route = createFileRoute("/sets/$postSlug")({
  component: () => <Outlet />,
});
