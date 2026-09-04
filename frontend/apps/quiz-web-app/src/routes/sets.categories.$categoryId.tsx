import { createFileRoute, Link } from "@tanstack/react-router";
import { Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/sets/categories/$categoryId")({
  component: () => <Outlet />,
});
