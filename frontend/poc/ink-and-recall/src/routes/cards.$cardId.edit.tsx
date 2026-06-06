import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { PageLayout } from "../components/layout/PageLayout";
import { Stamp } from "../components/ui/Stamp";
import { CardRenderer } from "../components/card/CardRenderer";
import { useStore } from "../store";

export const Route = createFileRoute("/cards/$cardId/edit")({
  head: () => ({ meta: [{ title: "Edit Card — The Review" }] }),
  component: EditCardPage,
});

function EditCardPage() {
  const { cardId } = useParams({ from: "/cards/$cardId/edit" });
  const nav = useNavigate();
  const card = useStore((s) => s.cards[cardId]);
  const decks = useStore((s) => s.decks);
  const update = useStore((s) => s.updateCard);
  const del = useStore((s) => s.deleteCard);
  const suspend = useStore((s) => s.suspendCard);
  const reset = useStore((s) => s.resetCardProgress);

  const [front, setFront] = useState(card?.front ?? "");
  const [back, setBack] = useState(card?.back ?? "");
  const [tags, setTags] = useState((card?.tags ?? []).join(", "));
  const [deckId, setDeckId] = useState(card?.deckId ?? "");

  if (!card)
    return (
      <PageLayout>
        <p>Card not found.</p>
      </PageLayout>
    );

  function save() {
    update(cardId, {
      front,
      back,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      deckId,
    });
    nav({ to: "/decks/$deckId", params: { deckId } });
  }

  return (
    <PageLayout>
      <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: "var(--font-display)" }}>
        Edit Card
      </h2>
      <div className="grid md:grid-cols-2 gap-6 mb-4">
        <div>
          <p className="smallcaps text-xs mb-1">Front</p>
          <textarea
            value={front}
            onChange={(e) => setFront(e.target.value)}
            rows={5}
            className="w-full bg-transparent border-2 border-[var(--ink-black)] p-2"
          />
        </div>
        <div>
          <p className="smallcaps text-xs mb-1">Back</p>
          <textarea
            value={back}
            onChange={(e) => setBack(e.target.value)}
            rows={5}
            className="w-full bg-transparent border-2 border-[var(--ink-black)] p-2"
          />
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-6 mb-4">
        <label className="block">
          <span className="smallcaps text-xs">Tags</span>
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="w-full bg-transparent border-b-2 border-[var(--ink-black)] py-2 mt-1"
          />
        </label>
        <label className="block">
          <span className="smallcaps text-xs">Deck</span>
          <select
            value={deckId}
            onChange={(e) => setDeckId(e.target.value)}
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
        <CardRenderer html={front} dropcap className="text-xl" />
        <div className="rule my-3" />
        <CardRenderer html={back} />
      </div>
      <div className="flex gap-3">
        <Stamp onClick={save}>Save</Stamp>
        <Stamp
          variant="ghost"
          onClick={() => {
            suspend(cardId, !card.suspended);
          }}
        >
          {card.suspended ? "Unsuspend" : "Suspend"}
        </Stamp>
        <Stamp variant="ghost" onClick={() => reset(cardId)}>
          Reset Progress
        </Stamp>
        <Stamp
          onClick={() => {
            del(cardId);
            nav({ to: "/decks/$deckId", params: { deckId } });
          }}
        >
          Delete
        </Stamp>
      </div>
      <p
        className="mt-4 smallcaps text-xs text-[var(--slate)]"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        Type: {card.cardType} · Ivl: {card.interval}d · Ease: {card.easeFactor.toFixed(2)} · Reps:{" "}
        {card.repetitions} · Lapses: {card.lapses} · Due: {card.dueDate}
      </p>
    </PageLayout>
  );
}
