import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { PageLayout } from "../components/layout/PageLayout";
import { Stamp, stampClasses } from "../components/ui/Stamp";
import { CardRenderer } from "../components/card/CardRenderer";
import { useStore } from "../store";
import { buildQueue } from "../algorithms/queue";
import { previewInterval } from "../algorithms/intervals";
import { todayISO } from "../utils/dates";
import type { Card, Rating } from "../store/types";

export const Route = createFileRoute("/decks/$deckId/study")({
  head: () => ({ meta: [{ title: "Study — The Review" }] }),
  component: StudyPage,
});

function StudyPage() {
  const { deckId } = useParams({ from: "/decks/$deckId/study" });
  const nav = useNavigate();
  const deck = useStore((s) => s.decks[deckId]);
  const cards = useStore((s) => s.cards);
  const settings = useStore((s) => s.settings);
  const dailyByDeck = useStore((s) => s.dailyByDeck);
  const reviewCard = useStore((s) => s.reviewCard);
  const startSession = useStore((s) => s.startSession);
  const endSession = useStore((s) => s.endSession);

  const [sessionId] = useState(() => (deck ? startSession(deck.id) : ""));
  const [revealed, setRevealed] = useState(false);
  const startTimeRef = useRef<number>(Date.now());
  const [tick, setTick] = useState(0);
  const [stats, setStats] = useState({ again: 0, hard: 0, good: 0, easy: 0, totalTime: 0 });

  useEffect(() => {
    const i = setInterval(() => setTick((t) => t + 1), 5000);
    return () => clearInterval(i);
  }, []);

  const queue = useMemo(() => {
    if (!deck) return [];
    const today = todayISO(0);
    const daily =
      dailyByDeck[deck.id]?.date === today
        ? dailyByDeck[deck.id]
        : { date: today, new: 0, reviews: 0 };
    return buildQueue(deck, Object.values(cards), {
      newStudiedToday: daily.new,
      reviewsStudiedToday: daily.reviews,
      today,
      now: Date.now(),
      settings,
    });
  }, [deck, cards, settings, dailyByDeck, tick]);

  const current: Card | undefined = queue[0];
  const initialTotal = useRef(queue.length);
  if (initialTotal.current < queue.length) initialTotal.current = queue.length;

  useEffect(() => {
    setRevealed(false);
    startTimeRef.current = Date.now();
  }, [current?.id]);

  function answer(rating: Rating) {
    if (!current) return;
    const elapsed = Date.now() - startTimeRef.current;
    reviewCard(current.id, rating, elapsed);
    setStats((s) => ({
      again: s.again + (rating === 1 ? 1 : 0),
      hard: s.hard + (rating === 2 ? 1 : 0),
      good: s.good + (rating === 3 ? 1 : 0),
      easy: s.easy + (rating === 4 ? 1 : 0),
      totalTime: s.totalTime + elapsed,
    }));
  }

  useEffect(() => {
    if (!settings.keyboardShortcuts) return;
    const onKey = (e: KeyboardEvent) => {
      if (!current) return;
      if (!revealed) {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          setRevealed(true);
        }
        return;
      }
      if (e.key === "1") answer(1);
      else if (e.key === "2") answer(2);
      else if (e.key === "3" || e.key === " " || e.key === "Enter") {
        e.preventDefault();
        answer(3);
      } else if (e.key === "4") answer(4);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [revealed, current, settings.keyboardShortcuts]);

  if (!deck)
    return (
      <PageLayout>
        <p className="italic">Deck not found.</p>
      </PageLayout>
    );

  if (!current) {
    return (
      <SessionEnd
        deck={deck.name}
        deckId={deck.id}
        stats={stats}
        onEnd={() => endSession(sessionId)}
        navHome={() => nav({ to: "/decks/$deckId", params: { deckId } })}
      />
    );
  }

  const done = initialTotal.current - queue.length;
  return (
    <PageLayout>
      <div
        className="flex items-center justify-between mb-4 text-sm"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        <span className="smallcaps">{deck.name}</span>
        <span>
          {done + 1} / {initialTotal.current}
        </span>
        <Link
          to="/decks/$deckId"
          params={{ deckId }}
          onClick={() => endSession(sessionId)}
          className="smallcaps underline"
        >
          End Session
        </Link>
      </div>
      <div className="border-y-2 border-[var(--ink-black)] h-1 mb-6 relative">
        <div
          className="absolute inset-y-0 left-0 bg-[var(--ink-black)]"
          style={{ width: `${(done / Math.max(initialTotal.current, 1)) * 100}%`, height: "2px" }}
        />
      </div>

      <article className="bg-[var(--aged-white)] border-[3px] border-[var(--ink-black)] grain p-8 md:p-12 min-h-[460px] flex flex-col">
        <p className="smallcaps text-[10px] text-[var(--slate)] mb-4">
          {current.cardType} card · ease {current.easeFactor.toFixed(2)} · ivl {current.interval}d
        </p>
        <CardRenderer
          html={current.front}
          reveal={revealed}
          dropcap
          className="text-3xl md:text-4xl leading-snug"
        />

        {revealed && (
          <>
            <div className="rule my-8" />
            <div
              className="inkbleed text-xl md:text-2xl"
              style={{ fontFamily: "var(--font-body)" }}
            >
              <CardRenderer html={current.back} reveal={true} />
            </div>
          </>
        )}

        <div className="mt-auto pt-8">
          {!revealed ? (
            <div className="text-center">
              <Stamp size="lg" onClick={() => setRevealed(true)}>
                Show Answer
              </Stamp>
              <p className="smallcaps text-[10px] text-[var(--slate)] mt-3">Press Space</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {(
                [
                  [1, "Again"],
                  [2, "Hard"],
                  [3, "Good"],
                  [4, "Easy"],
                ] as [Rating, string][]
              ).map(([r, label]) => (
                <div key={r} className="text-center">
                  <Stamp
                    onClick={() => answer(r)}
                    className="w-full"
                    variant={r === 3 ? "solid" : "ghost"}
                  >
                    {label}
                  </Stamp>
                  <p
                    className="smallcaps text-[10px] text-[var(--slate)] mt-1"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {previewInterval(current, r, deck.config)} · {r}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </article>
    </PageLayout>
  );
}

function SessionEnd({
  deck,
  deckId,
  stats,
  onEnd,
  navHome,
}: {
  deck: string;
  deckId: string;
  stats: { again: number; hard: number; good: number; easy: number; totalTime: number };
  onEnd: () => void;
  navHome: () => void;
}) {
  useEffect(() => {
    onEnd(); /* eslint-disable-next-line */
  }, []);
  const total = stats.again + stats.hard + stats.good + stats.easy;
  const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0);
  const mins = stats.totalTime / 60000;
  return (
    <PageLayout>
      <div className="text-center mb-8">
        <p className="smallcaps text-xs text-[var(--slate)]">Edition Complete</p>
        <h2 className="text-6xl font-black mt-2" style={{ fontFamily: "var(--font-display)" }}>
          Final Word
        </h2>
        <p className="italic mt-2 text-[var(--charcoal)]">
          You have reached the end of today's queue for <b>{deck}</b>.
        </p>
      </div>
      <div
        className="grid grid-cols-2 md:grid-cols-4 border-y-2 border-[var(--ink-black)] divide-x-2 divide-[var(--ink-black)] mb-8"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        {(
          [
            ["Again", stats.again],
            ["Hard", stats.hard],
            ["Good", stats.good],
            ["Easy", stats.easy],
          ] as const
        ).map(([l, n]) => (
          <div key={l} className="p-4 text-center">
            <p className="smallcaps text-[10px] text-[var(--slate)]">{l}</p>
            <p className="text-3xl font-bold">{n}</p>
            <p className="text-xs">{pct(n)}%</p>
          </div>
        ))}
      </div>
      <p
        className="text-center smallcaps text-sm text-[var(--slate)]"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        {total} cards · {mins.toFixed(1)} min · {(total / Math.max(mins, 0.1)).toFixed(1)} cards/min
      </p>
      <div className="text-center mt-8">
        <Link to="/decks/$deckId" params={{ deckId }} className={stampClasses("solid", "lg")}>
          Back to Deck
        </Link>
      </div>
    </PageLayout>
  );
}
