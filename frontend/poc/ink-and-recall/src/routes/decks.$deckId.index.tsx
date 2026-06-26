import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageLayout } from "../components/layout/PageLayout";
import { Stamp, stampClasses } from "../components/ui/Stamp";
import { Modal } from "../components/ui/Modal";
import { useStore, getDeckStats } from "../store";
import { todayISO } from "../utils/dates";
import type { Card } from "../store/types";

export const Route = createFileRoute("/decks/$deckId/")({
  head: () => ({ meta: [{ title: "Deck — The Review" }] }),
  component: DeckDetailPage,
});

function DeckDetailPage() {
  const { deckId } = useParams({ from: "/decks/$deckId/" });
  const nav = useNavigate();
  const deck = useStore((s) => s.decks[deckId]);
  const cards = useStore((s) => s.cards);
  const deleteDeck = useStore((s) => s.deleteDeck);
  const deleteCards = useStore((s) => s.deleteCards);
  const suspendCard = useStore((s) => s.suspendCard);
  const resetCardProgress = useStore((s) => s.resetCardProgress);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | Card["cardType"]>("all");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState(false);

  const deckCards = useMemo(
    () => Object.values(cards).filter((c) => c.deckId === deckId),
    [cards, deckId],
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return deckCards.filter((c) => {
      if (filter !== "all" && c.cardType !== filter) return false;
      if (!q) return true;
      return c.front.toLowerCase().includes(q) || c.back.toLowerCase().includes(q);
    });
  }, [deckCards, search, filter]);

  const PER = 50;
  const pageRows = filtered.slice(page * PER, page * PER + PER);
  const stats = useMemo(() => (deck ? getDeckStats(deck.id, cards) : null), [deck, cards]);

  const forecast = useMemo(() => {
    if (!deck) return [];
    const out: { date: string; label: string; count: number }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = todayISO(i);
      const count =
        deckCards.filter((c) => c.cardType === "review" && !c.suspended && c.dueDate === d).length +
        (i === 0
          ? deckCards.filter((c) => c.cardType === "review" && !c.suspended && c.dueDate < d).length
          : 0);
      out.push({
        date: d,
        label:
          i === 0
            ? "Today"
            : new Date(d).toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              }),
        count,
      });
    }
    return out;
  }, [deck, deckCards]);

  if (!deck)
    return (
      <PageLayout>
        <p className="italic">Deck not found.</p>
      </PageLayout>
    );
  const maxForecast = Math.max(1, ...forecast.map((f) => f.count));

  function toggleSel(id: string) {
    setSelected((p) => {
      const n = new Set(p);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  return (
    <PageLayout>
      <article>
        <p className="smallcaps text-xs text-[var(--slate)]">Deck</p>
        <h2
          className="text-5xl font-bold leading-none"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {deck.name}
        </h2>
        <p className="italic mt-2 text-[var(--charcoal)]">{deck.description || "—"}</p>
        <p className="smallcaps text-[10px] text-[var(--slate)] mt-2">
          Established {new Date(deck.createdAt).toLocaleDateString()}
        </p>

        <div className="rule mt-4 mb-6" />

        <div className="flex flex-wrap gap-3 mb-6">
          <Link
            to="/decks/$deckId/study"
            params={{ deckId }}
            className={stampClasses("solid", "lg")}
          >
            Begin Study
          </Link>
          <Link to="/decks/$deckId/add" params={{ deckId }} className={stampClasses("ghost", "md")}>
            Add Card
          </Link>
          <Link
            to="/decks/$deckId/settings"
            params={{ deckId }}
            className={stampClasses("ghost", "md")}
          >
            Configure
          </Link>
          <button
            onClick={() => setConfirmDelete(true)}
            className="stamp stamp-ghost text-sm ml-auto"
          >
            Delete Deck
          </button>
        </div>

        {stats && (
          <div
            className="grid grid-cols-2 md:grid-cols-5 border-y-2 border-[var(--ink-black)] divide-x-2 divide-[var(--ink-black)] mb-8"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {[
              ["New", stats.newCount],
              ["Learning", stats.learningCount],
              ["Due", stats.reviewDueCount],
              ["Suspended", stats.suspendedCount],
              ["Total", stats.total],
            ].map(([l, n]) => (
              <div key={l} className="p-4 text-center">
                <p className="text-[10px] smallcaps text-[var(--slate)]">{l}</p>
                <p className="text-3xl font-bold">{n}</p>
              </div>
            ))}
          </div>
        )}

        <section className="grid md:grid-cols-2 gap-8 mb-10">
          <div>
            <h3 className="text-xl font-bold mb-2" style={{ fontFamily: "var(--font-display)" }}>
              Seven-Day Forecast
            </h3>
            <div className="rule-thin mb-3" />
            <div style={{ fontFamily: "var(--font-mono)" }} className="text-sm">
              {forecast.map((f) => (
                <div key={f.date} className="flex items-center gap-3 py-1">
                  <span className="w-28 smallcaps text-[var(--slate)]">{f.label}</span>
                  <span className="flex-1 truncate" style={{ letterSpacing: "0px" }}>
                    {"█".repeat(Math.round((f.count / maxForecast) * 24))}
                  </span>
                  <span className="w-8 text-right font-bold">{f.count}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-xl font-bold mb-2" style={{ fontFamily: "var(--font-display)" }}>
              At a Glance
            </h3>
            <div className="rule-thin mb-3" />
            <dl className="text-sm space-y-1" style={{ fontFamily: "var(--font-mono)" }}>
              <Row k="Daily new limit" v={deck.config.newCardsPerDay} />
              <Row k="Daily review limit" v={deck.config.maxReviewsPerDay} />
              <Row k="Learning steps" v={deck.config.learningSteps.join(" / ") + " min"} />
              <Row k="Starting ease" v={deck.config.startingEaseFactor.toFixed(2)} />
              <Row k="Max interval" v={`${deck.config.maximumInterval} d`} />
            </dl>
          </div>
        </section>

        <div className="flex flex-wrap items-center gap-3 mb-3">
          <h3 className="text-xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
            Card Index
          </h3>
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder="Search front or back…"
            className="border-2 border-[var(--ink-black)] bg-transparent px-2 py-1 text-sm flex-1 min-w-[180px]"
          />
          <select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value as typeof filter);
              setPage(0);
            }}
            className="border-2 border-[var(--ink-black)] bg-[var(--newsprint)] px-2 py-1 text-sm"
          >
            <option value="all">All types</option>
            <option value="new">New</option>
            <option value="learning">Learning</option>
            <option value="review">Review</option>
            <option value="relearning">Relearning</option>
          </select>
        </div>

        {selected.size > 0 && (
          <div className="flex flex-wrap gap-2 mb-3 p-3 border-2 border-[var(--ink-black)] bg-[var(--highlight)]">
            <span className="smallcaps text-xs self-center">{selected.size} selected</span>
            <Stamp
              size="sm"
              variant="ghost"
              onClick={() => {
                selected.forEach((id) => suspendCard(id, true));
                setSelected(new Set());
              }}
            >
              Suspend
            </Stamp>
            <Stamp
              size="sm"
              variant="ghost"
              onClick={() => {
                selected.forEach((id) => resetCardProgress(id));
                setSelected(new Set());
              }}
            >
              Reset Progress
            </Stamp>
            <Stamp
              size="sm"
              onClick={() => {
                deleteCards(Array.from(selected));
                setSelected(new Set());
              }}
            >
              Delete
            </Stamp>
          </div>
        )}

        <div className="border-2 border-[var(--ink-black)] overflow-x-auto">
          <table className="w-full text-sm" style={{ fontFamily: "var(--font-mono)" }}>
            <thead className="border-b-2 border-[var(--ink-black)] bg-[var(--highlight)]">
              <tr>
                <th className="p-2 w-8"></th>
                <th className="p-2 text-left">Front</th>
                <th className="p-2 text-left">Back</th>
                <th className="p-2 text-left w-24">Due</th>
                <th className="p-2 text-left w-20">Ivl</th>
                <th className="p-2 text-left w-20">Ease</th>
                <th className="p-2 text-left w-24">Type</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-[var(--column-rule)] hover:bg-[var(--highlight)] cursor-pointer"
                  onClick={() => nav({ to: "/cards/$cardId/edit", params: { cardId: c.id } })}
                >
                  <td className="p-2" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selected.has(c.id)}
                      onChange={() => toggleSel(c.id)}
                    />
                  </td>
                  <td className="p-2 max-w-[260px] truncate">{c.front.replace(/<[^>]+>/g, "")}</td>
                  <td className="p-2 max-w-[260px] truncate">{c.back.replace(/<[^>]+>/g, "")}</td>
                  <td className="p-2">{c.dueDate}</td>
                  <td className="p-2">{c.interval}d</td>
                  <td className="p-2">{c.easeFactor.toFixed(2)}</td>
                  <td className="p-2">{c.cardType}</td>
                </tr>
              ))}
              {pageRows.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-6 text-center italic text-[var(--slate)]">
                    No cards match.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {filtered.length > PER && (
          <div
            className="flex justify-between items-center mt-3 text-sm"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
              className="smallcaps underline disabled:opacity-30"
            >
              ← Prev
            </button>
            <span>
              Page {page + 1} / {Math.ceil(filtered.length / PER)}
            </span>
            <button
              disabled={(page + 1) * PER >= filtered.length}
              onClick={() => setPage((p) => p + 1)}
              className="smallcaps underline disabled:opacity-30"
            >
              Next →
            </button>
          </div>
        )}
      </article>

      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Delete this deck?">
        <p className="text-sm mb-4">
          This will permanently delete <b>{deck.name}</b> and all {stats?.total ?? 0} cards within
          it.
        </p>
        <div className="flex gap-3">
          <Stamp
            onClick={() => {
              deleteDeck(deck.id);
              nav({ to: "/" });
            }}
          >
            Delete Forever
          </Stamp>
          <button onClick={() => setConfirmDelete(false)} className="smallcaps underline text-sm">
            Cancel
          </button>
        </div>
      </Modal>
    </PageLayout>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex justify-between border-b border-dotted border-[var(--column-rule)] py-1">
      <dt className="smallcaps text-[var(--slate)]">{k}</dt>
      <dd>{v}</dd>
    </div>
  );
}
