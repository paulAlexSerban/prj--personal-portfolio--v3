import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { PageLayout } from "../components/layout/PageLayout";
import { Stamp } from "../components/ui/Stamp";
import { Modal } from "../components/ui/Modal";
import { useStore } from "../store";
import { DEFAULT_CONFIG } from "../store/types";

export const Route = createFileRoute("/decks/$deckId/settings")({
  head: () => ({ meta: [{ title: "Deck Config — The Review" }] }),
  component: DeckConfigPage,
});

function DeckConfigPage() {
  const { deckId } = useParams({ from: "/decks/$deckId/settings" });
  const nav = useNavigate();
  const deck = useStore((s) => s.decks[deckId]);
  const updateDeck = useStore((s) => s.updateDeck);
  const deleteDeck = useStore((s) => s.deleteDeck);
  const [name, setName] = useState(deck?.name ?? "");
  const [description, setDescription] = useState(deck?.description ?? "");
  const [cfg, setCfg] = useState(deck?.config ?? DEFAULT_CONFIG);
  const [confirm, setConfirm] = useState(false);

  if (!deck)
    return (
      <PageLayout>
        <p>Deck not found.</p>
      </PageLayout>
    );

  function save() {
    updateDeck(deckId, { name, description, config: cfg });
    nav({ to: "/decks/$deckId", params: { deckId } });
  }

  return (
    <PageLayout>
      <h2 className="text-4xl font-bold mb-2" style={{ fontFamily: "var(--font-display)" }}>
        Deck Configuration
      </h2>
      <p className="italic text-[var(--slate)] mb-6">{deck.name}</p>

      <div className="space-y-5 max-w-2xl">
        <F label="Name">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-transparent border-b-2 border-[var(--ink-black)] py-2"
          />
        </F>
        <F label="Description">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full bg-transparent border-2 border-[var(--ink-black)] p-2"
          />
        </F>

        <div className="rule my-6" />
        <h3 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
          Scheduling
        </h3>

        <Num
          label="Daily New Card Limit"
          hint="How many new cards introduced per day."
          v={cfg.newCardsPerDay}
          on={(n) => setCfg({ ...cfg, newCardsPerDay: n })}
        />
        <Num
          label="Daily Review Limit"
          hint="Maximum review cards per day."
          v={cfg.maxReviewsPerDay}
          on={(n) => setCfg({ ...cfg, maxReviewsPerDay: n })}
        />
        <F label="Learning Steps (minutes, space-separated)" hint='E.g. "1 10"'>
          <input
            value={cfg.learningSteps.join(" ")}
            onChange={(e) => setCfg({ ...cfg, learningSteps: parseSteps(e.target.value) })}
            className="w-full bg-transparent border-b-2 border-[var(--ink-black)] py-2"
          />
        </F>
        <Num
          label="Graduating Interval (days)"
          hint="Days after passing learning."
          v={cfg.graduatingInterval}
          on={(n) => setCfg({ ...cfg, graduatingInterval: n })}
        />
        <Num
          label="Easy Interval (days)"
          hint='Days when answered "Easy" from learning.'
          v={cfg.easyInterval}
          on={(n) => setCfg({ ...cfg, easyInterval: n })}
        />
        <F label="Lapse Steps (minutes)" hint="Steps when card lapses.">
          <input
            value={cfg.lapseSteps.join(" ")}
            onChange={(e) => setCfg({ ...cfg, lapseSteps: parseSteps(e.target.value) })}
            className="w-full bg-transparent border-b-2 border-[var(--ink-black)] py-2"
          />
        </F>
        <Num
          label="Lapse New Interval (×)"
          step={0.05}
          hint="Fraction of old interval after lapse."
          v={cfg.lapseNewInterval}
          on={(n) => setCfg({ ...cfg, lapseNewInterval: n })}
        />
        <Num
          label="Minimum Interval (days)"
          v={cfg.minimumInterval}
          on={(n) => setCfg({ ...cfg, minimumInterval: n })}
        />
        <Num
          label="Maximum Interval (days)"
          v={cfg.maximumInterval}
          on={(n) => setCfg({ ...cfg, maximumInterval: n })}
        />
        <Num
          label="Easy Bonus (×)"
          step={0.05}
          v={cfg.easyBonus}
          on={(n) => setCfg({ ...cfg, easyBonus: n })}
        />
        <Num
          label="Interval Modifier (×)"
          step={0.05}
          v={cfg.intervalModifier}
          on={(n) => setCfg({ ...cfg, intervalModifier: n })}
        />
        <Num
          label="Starting Ease"
          step={0.05}
          v={cfg.startingEaseFactor}
          on={(n) => setCfg({ ...cfg, startingEaseFactor: n })}
        />

        <div className="flex gap-3 pt-4">
          <Stamp onClick={save}>Save Config</Stamp>
          <button
            onClick={() => setCfg({ ...DEFAULT_CONFIG })}
            className="smallcaps text-xs underline"
          >
            Reset to defaults
          </button>
        </div>

        <div className="rule my-10" />
        <h3 className="text-2xl font-black" style={{ fontFamily: "var(--font-display)" }}>
          Danger
        </h3>
        <p className="text-sm italic text-[var(--slate)] mb-3">
          Permanent action. Cannot be undone.
        </p>
        <Stamp onClick={() => setConfirm(true)}>Delete Deck</Stamp>
      </div>

      <Modal open={confirm} onClose={() => setConfirm(false)} title="Delete this deck?">
        <p className="text-sm mb-4">
          Type the deck name <b>{deck.name}</b> to confirm.
        </p>
        <ConfirmDelete
          name={deck.name}
          onConfirm={() => {
            deleteDeck(deckId);
            nav({ to: "/" });
          }}
        />
      </Modal>
    </PageLayout>
  );
}

function ConfirmDelete({ name, onConfirm }: { name: string; onConfirm: () => void }) {
  const [v, setV] = useState("");
  return (
    <div className="space-y-3">
      <input
        value={v}
        onChange={(e) => setV(e.target.value)}
        className="w-full bg-transparent border-2 border-[var(--ink-black)] p-2"
      />
      <Stamp disabled={v !== name} onClick={onConfirm}>
        Delete Forever
      </Stamp>
    </div>
  );
}

function F({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="smallcaps text-xs text-[var(--slate)]">{label}</span>
      <div className="mt-1">{children}</div>
      {hint && <span className="text-[11px] italic text-[var(--slate)] block mt-1">{hint}</span>}
    </label>
  );
}
function Num({
  label,
  hint,
  v,
  on,
  step,
}: {
  label: string;
  hint?: string;
  v: number;
  on: (n: number) => void;
  step?: number;
}) {
  return (
    <F label={label} hint={hint}>
      <input
        type="number"
        step={step ?? 1}
        value={v}
        onChange={(e) => on(Number(e.target.value))}
        className="w-full bg-transparent border-b-2 border-[var(--ink-black)] py-2"
        style={{ fontFamily: "var(--font-mono)" }}
      />
    </F>
  );
}
function parseSteps(s: string): number[] {
  return s
    .split(/[\s,]+/)
    .map((x) => Number(x))
    .filter((x) => !Number.isNaN(x) && x > 0);
}
