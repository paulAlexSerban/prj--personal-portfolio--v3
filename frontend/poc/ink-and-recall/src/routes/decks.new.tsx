import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PageLayout } from "../components/layout/PageLayout";
import { Stamp } from "../components/ui/Stamp";
import { useStore } from "../store";

export const Route = createFileRoute("/decks/new")({
  head: () => ({ meta: [{ title: "New Deck — The Review" }] }),
  component: NewDeckPage,
});

function NewDeckPage() {
  const nav = useNavigate();
  const create = useStore((s) => s.createDeck);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const d = create({ name: name.trim(), description: description.trim() });
    nav({ to: "/decks/$deckId", params: { deckId: d.id } });
  }

  return (
    <PageLayout>
      <h2 className="text-4xl font-bold mb-2" style={{ fontFamily: "var(--font-display)" }}>
        Establish a New Deck
      </h2>
      <p className="italic text-[var(--slate)] mb-6">A fresh column for new knowledge.</p>
      <form onSubmit={submit} className="max-w-xl space-y-5">
        <Field label="Deck Name">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-transparent border-b-2 border-[var(--ink-black)] py-2 text-xl"
            autoFocus
          />
        </Field>
        <Field label="Description" hint="A short editorial note">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-transparent border-2 border-[var(--ink-black)] p-3"
            rows={3}
          />
        </Field>
        <div className="flex gap-3 pt-2">
          <Stamp type="submit">Create Deck</Stamp>
          <button
            type="button"
            onClick={() => nav({ to: "/" })}
            className="text-sm smallcaps underline"
          >
            Cancel
          </button>
        </div>
      </form>
    </PageLayout>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="smallcaps text-xs text-[var(--slate)]">{label}</span>
      <div className="mt-1">{children}</div>
      {hint && <span className="text-[11px] italic text-[var(--slate)] block mt-1">{hint}</span>}
    </label>
  );
}
