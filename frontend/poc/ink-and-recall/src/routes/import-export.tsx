import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { PageLayout } from "../components/layout/PageLayout";
import { Stamp } from "../components/ui/Stamp";
import { useStore } from "../store";
import type { Card, Deck } from "../store/types";

export const Route = createFileRoute("/import-export")({
  head: () => ({ meta: [{ title: "Import / Export — The Review" }] }),
  component: ImportExportPage,
});

function ImportExportPage() {
  const decks = useStore((s) => s.decks);
  const cards = useStore((s) => s.cards);
  const importData = useStore((s) => s.importData);
  const [mode, setMode] = useState<"merge" | "replace">("merge");
  const [msg, setMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function exportDeck(id: string) {
    const d = decks[id];
    if (!d) return;
    const data = { decks: [d], cards: Object.values(cards).filter((c) => c.deckId === id) };
    download(`${d.name.replace(/\W+/g, "-").toLowerCase()}.json`, JSON.stringify(data, null, 2));
  }
  function exportAll() {
    const data = { decks: Object.values(decks), cards: Object.values(cards) };
    download(
      `the-review-all-${new Date().toISOString().slice(0, 10)}.json`,
      JSON.stringify(data, null, 2),
    );
  }

  function handleFiles(files: FileList | null) {
    if (!files || !files[0]) return;
    const f = files[0];
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as { decks: Deck[]; cards: Card[] };
        if (!parsed.decks || !parsed.cards) throw new Error("Invalid format");
        importData(parsed, mode);
        setMsg(`Imported ${parsed.decks.length} deck(s), ${parsed.cards.length} card(s).`);
      } catch (e) {
        setMsg(`Import failed: ${(e as Error).message}`);
      }
    };
    reader.readAsText(f);
  }

  return (
    <PageLayout>
      <h2 className="text-5xl font-bold mb-6" style={{ fontFamily: "var(--font-display)" }}>
        Import & Export
      </h2>

      <section className="mb-10">
        <h3 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
          Export
        </h3>
        <div className="rule-thin my-3" />
        <div className="flex gap-3 mb-4 flex-wrap">
          <Stamp onClick={exportAll}>Export All Decks (JSON)</Stamp>
        </div>
        <ul className="space-y-2">
          {Object.values(decks).map((d) => (
            <li
              key={d.id}
              className="flex items-center justify-between border-b border-dotted border-[var(--column-rule)] py-2"
            >
              <span style={{ fontFamily: "var(--font-display)" }} className="text-lg">
                {d.name}
              </span>
              <Stamp size="sm" variant="ghost" onClick={() => exportDeck(d.id)}>
                Export
              </Stamp>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-10">
        <h3 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
          Import
        </h3>
        <div className="rule-thin my-3" />
        <p className="text-sm italic mb-3 text-[var(--slate)]">
          Drop a JSON exported from The Review. Anki <code>.apkg</code> support is text-only and
          best-effort.
        </p>
        <div className="flex items-center gap-4 mb-4 text-xs smallcaps">
          <span>Mode:</span>
          {(["merge", "replace"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={mode === m ? "underline font-bold" : "hover:underline"}
            >
              {m}
            </button>
          ))}
        </div>
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleFiles(e.dataTransfer.files);
          }}
          onClick={() => fileRef.current?.click()}
          className="border-[3px] border-dashed border-[var(--ink-black)] p-12 text-center cursor-pointer hover:bg-[var(--highlight)]"
        >
          <p className="smallcaps">Drop file here or click to choose</p>
          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>
        {msg && (
          <p className="mt-3 text-sm" style={{ fontFamily: "var(--font-mono)" }}>
            {msg}
          </p>
        )}
      </section>
    </PageLayout>
  );
}

function download(name: string, content: string) {
  const blob = new Blob([content], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
