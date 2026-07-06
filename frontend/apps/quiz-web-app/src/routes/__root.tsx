import { createRootRoute, Outlet } from "@tanstack/react-router";
import { Toaster } from "@prj--personal-portfolio--v3/shared--ui";
import { ErrorPage } from "@prj--personal-portfolio--v3/shared--ui/blocks";
import { PageLayout } from "@/components/layout/PageLayout";

function NotFoundComponent() {
  return (
    <PageLayout>
      <ErrorPage
        code="404"
        title="Page not found"
        message="The page you're looking for doesn't exist or has been moved."
        homeHref="/"
        homeLabel="Go home"
      />
    </PageLayout>
  );
}

function ErrorComponent({ error }: { error: Error }) {
  console.error(error);
  return (
    <PageLayout>
      <ErrorPage
        title="This page didn't load"
        message="Something went wrong. Try refreshing or head back home."
        homeHref="/"
        homeLabel="Go home"
      />
    </PageLayout>
  );
}

function RootComponent() {
  return (
    <>
      <Outlet />
      <Toaster position="bottom-center" closeButton richColors />
    </>
  );
}

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});
