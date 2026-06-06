import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { PageLayout } from "../components/layout/PageLayout";
import { Stamp } from "../components/ui/Stamp";
import { CardRenderer } from "../components/card/CardRenderer";
import { useStore } from "../store";

export const Route = createFileRoute("/decks/$deckId/add")({
  head: () => ({ meta: [{ title: "Add Card — The Review" }] }),
  component: AddCardPage,
});

function AddCardPage() {
  const { deckId } = useParams({ from: "/decks/$deckId/add" });
  const deck = useStore((s) => s.decks[deckId]);
  const decks = useStore((s) => s.decks);
  const createCard = useStore((s) => s.createCard);
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [tags, setTags] = useState("");
  const [targetDeck, setTargetDeck] = useState(deckId);
  const [count, setCount] = useState(0);
  const frontRef = useRef<HTMLTextAreaElement | null>(null);

  function save() {
    if (!front.trim()) return;
    createCard({
      deckId: targetDeck,
      front,
      back,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    });
    setFront("");
    setBack("");
    setCount((n) => n + 1);
    frontRef.current?.focus();
  }

  function makeCloze() {
    const ta = frontRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    if (start === end) return;
    const sel = front.slice(start, end);
    setFront(front.slice(0, start) + `{{c1::${sel}}}` + front.slice(end));
  }

  if (!deck)
    return (
      <PageLayout>
        <p>Deck not found.</p>
      </PageLayout>
    );

  return (
    <PageLayout>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="smallcaps text-xs text-[var(--slate)]">Add to deck</p>
          <h2 className="text-3xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
            {deck.name}
          </h2>
        </div>
        <Link to="/decks/$deckId" params={{ deckId }} className="smallcaps text-xs underline">
          Back to deck
        </Link>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-4">
        <div className="border-2 border-[var(--ink-black)] p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="smallcaps text-xs">Front (Question)</h3>
            <div className="flex gap-1 text-xs">
              <FmtBtn onClick={() => setFront(front + "<b></b>")}>B</FmtBtn>
              <FmtBtn onClick={() => setFront(front + "<i></i>")}>I</FmtBtn>
              <FmtBtn onClick={() => setFront(front + "<u></u>")}>U</FmtBtn>
              <FmtBtn onClick={() => setFront(front + "<code></code>")}>{"<>"}</FmtBtn>
              <FmtBtn onClick={makeCloze}>Cloze</FmtBtn>
            </div>
          </div>
          <textarea
            ref={frontRef}
            value={front}
            onChange={(e) => setFront(e.target.value)}
            rows={6}
            className="w-full bg-transparent border-2 border-[var(--ink-black)] p-2"
            style={{ fontFamily: "var(--font-body)" }}
            autoFocus
          />
        </div>
        <div className="border-2 border-[var(--ink-black)] p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="smallcaps text-xs">Back (Answer)</h3>
            <div className="flex gap-1 text-xs">
              <FmtBtn onClick={() => setBack(back + "<b></b>")}>B</FmtBtn>
              <FmtBtn onClick={() => setBack(back + "<i></i>")}>I</FmtBtn>
              <FmtBtn onClick={() => setBack(back + "<u></u>")}>U</FmtBtn>
            </div>
          </div>
          <textarea
            value={back}
            onChange={(e) => setBack(e.target.value)}
            rows={6}
            className="w-full bg-transparent border-2 border-[var(--ink-black)] p-2"
            style={{ fontFamily: "var(--font-body)" }}
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-4">
        <label className="block">
          <span className="smallcaps text-xs">Tags (comma separated)</span>
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="w-full bg-transparent border-b-2 border-[var(--ink-black)] py-2 mt-1"
          />
        </label>
        <label className="block">
          <span className="smallcaps text-xs">Deck</span>
          <select
            value={targetDeck}
            onChange={(e) => setTargetDeck(e.target.value)}
            className="w-full bg-transparent border-b-2 border-[var(--ink-black)] py-2 mt-1"
          >
            {Object.values(decks).map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="border-2 border-[var(--ink-black)] p-4 mb-4 grain bg-[var(--aged-white)]">
        <p className="smallcaps text-[10px] text-[var(--slate)] mb-2">Preview</p>
        <CardRenderer html={front || "<i>(front blank)</i>"} dropcap className="text-xl" />
        <div className="rule my-3" />
        <CardRenderer html={back || "<i>(back blank)</i>"} className="text-base" />
      </div>

      <div className="flex items-center gap-4">
        <Stamp onClick={save}>Save & Add Another</Stamp>
        <span className="smallcaps text-xs text-[var(--slate)]">{count} added this session</span>
      </div>
    </PageLayout>
  );
}

function FmtBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="border border-[var(--ink-black)] px-2 py-0.5 font-bold hover:bg-[var(--ink-black)] hover:text-[var(--aged-white)]"
    >
      {children}
    </button>
  );
}
