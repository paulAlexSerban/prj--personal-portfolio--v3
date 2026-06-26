import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageLayout } from "../components/layout/PageLayout";
import { stampClasses } from "../components/ui/Stamp";
import { useStore, getDeckStats } from "../store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "The Review — Spaced Repetition Journal" },
      {
        name: "description",
        content: "A newspaper-styled spaced-repetition study app implementing the SM-2 algorithm.",
      },
      { property: "og:title", content: "The Review" },
      { property: "og:description", content: "Spaced repetition, printed daily." },
    ],
  }),
  component: HomePage,
});

type SortBy = "due" | "alpha" | "recent";

function HomePage() {
  const decks = useStore((s) => s.decks);
  const cards = useStore((s) => s.cards);
  const [sortBy, setSortBy] = useState<SortBy>("due");

  const rows = useMemo(() => {
    const arr = Object.values(decks).map((d) => ({ deck: d, stats: getDeckStats(d.id, cards) }));
    if (sortBy === "alpha") arr.sort((a, b) => a.deck.name.localeCompare(b.deck.name));
    else if (sortBy === "recent")
      arr.sort((a, b) => b.deck.createdAt.localeCompare(a.deck.createdAt));
    else
      arr.sort(
        (a, b) =>
          b.stats.reviewDueCount +
          b.stats.learningCount -
          (a.stats.reviewDueCount + a.stats.learningCount),
      );
    return arr;
  }, [decks, cards, sortBy]);

  const totalDue = rows.reduce(
    (n, r) => n + r.stats.reviewDueCount + r.stats.learningCount + r.stats.newCount,
    0,
  );

  return (
    <PageLayout>
      <section className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <p className="smallcaps text-xs text-[var(--slate)]">Front Page · The Collection</p>
          <h2 className="text-4xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
            Your Decks
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="border-2 border-[var(--ink-black)] px-3 py-1 text-center">
            <p className="text-[10px] smallcaps text-[var(--slate)]">Cards Awaiting</p>
            <p className="text-2xl font-bold" style={{ fontFamily: "var(--font-mono)" }}>
              {totalDue}
            </p>
          </div>
          <Link to="/decks/new" className={stampClasses("solid", "md")}>
            New Deck
          </Link>
        </div>
      </section>

      <div className="flex items-center gap-4 mb-6 text-xs smallcaps">
        <span className="text-[var(--slate)]">Sort by:</span>
        {(["due", "alpha", "recent"] as SortBy[]).map((s) => (
          <button
            key={s}
            onClick={() => setSortBy(s)}
            className={`underline-offset-4 ${sortBy === s ? "underline font-bold" : "hover:underline"}`}
          >
            {s === "due" ? "Most Due" : s === "alpha" ? "Alphabetical" : "Recently Created"}
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="text-center py-24 border-y-[3px] border-[var(--ink-black)]">
          <p
            className="italic text-2xl max-w-2xl mx-auto"
            style={{ fontFamily: "var(--font-display)" }}
          >
            "Memory is the diary that we all carry about with us." — Oscar Wilde
          </p>
          <div className="mt-6">
            <Link to="/decks/new" className={stampClasses("solid", "lg")}>
              Start a Deck
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-x-10 gap-y-8">
          {rows.map(({ deck, stats }) => (
            <article key={deck.id} className="border-t-[3px] border-[var(--ink-black)] pt-4">
              <p className="smallcaps text-[10px] text-[var(--slate)] mb-1">
                Edition · {new Date(deck.createdAt).toLocaleDateString()}
              </p>
              <Link to="/decks/$deckId" params={{ deckId: deck.id }} className="hover:underline">
                <h3
                  className="text-3xl font-bold leading-tight"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {deck.name}
                </h3>
              </Link>
              <p className="mt-2 text-sm text-[var(--charcoal)] italic">
                {deck.description || "—"}
              </p>
              <div className="rule-thin my-4" />
              <div
                className="grid grid-cols-3 gap-2 text-center"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                <div>
                  <p className="text-[10px] smallcaps text-[var(--slate)]">New</p>
                  <p className="text-xl font-bold">{stats.newCount}</p>
                </div>
                <div>
                  <p className="text-[10px] smallcaps text-[var(--slate)]">Due</p>
                  <p className="text-xl font-bold">{stats.reviewDueCount + stats.learningCount}</p>
                </div>
                <div>
                  <p className="text-[10px] smallcaps text-[var(--slate)]">Total</p>
                  <p className="text-xl font-bold">{stats.total}</p>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Link
                  to="/decks/$deckId/study"
                  params={{ deckId: deck.id }}
                  className={stampClasses("solid", "sm")}
                >
                  Study
                </Link>
                <Link
                  to="/decks/$deckId"
                  params={{ deckId: deck.id }}
                  className={stampClasses("ghost", "sm")}
                >
                  Browse
                </Link>
                <Link
                  to="/decks/$deckId/add"
                  params={{ deckId: deck.id }}
                  className={stampClasses("ghost", "sm")}
                >
                  Add Card
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </PageLayout>
  );
}
