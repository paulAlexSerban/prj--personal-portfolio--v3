import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
      <p className="text-xs uppercase tracking-widest text-muted-foreground">Quiz Web App</p>
      <h1 className="text-4xl font-bold text-foreground">Flashcards</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        CSR skeleton is running. Study sets, browsing, and the SM-2 study loop arrive in the next
        phases.
      </p>
    </main>
  );
}
