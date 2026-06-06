import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageLayout } from "../components/layout/PageLayout";
import { Stamp } from "../components/ui/Stamp";
import { Modal } from "../components/ui/Modal";
import { useStore } from "../store";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — The Review" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const settings = useStore((s) => s.settings);
  const setSettings = useStore((s) => s.setSettings);
  const clearAll = useStore((s) => s.clearAll);
  const decks = useStore((s) => s.decks);
  const cards = useStore((s) => s.cards);
  const [confirm, setConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  function setTheme(t: typeof settings.theme) {
    setSettings({ theme: t });
    const root = document.documentElement;
    const isDark =
      t === "dark" || (t === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
    root.classList.toggle("dark", isDark);
  }

  function backup() {
    const blob = new Blob([JSON.stringify({ decks, cards, settings }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `the-review-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <PageLayout>
      <h2 className="text-5xl font-bold mb-6" style={{ fontFamily: "var(--font-display)" }}>
        Settings
      </h2>

      <Section title="Appearance">
        <Row label="Theme">
          {(["light", "dark", "system"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={`smallcaps text-xs mr-3 ${settings.theme === t ? "underline font-bold" : "hover:underline"}`}
            >
              {t}
            </button>
          ))}
        </Row>
      </Section>

      <Section title="Study">
        <Row label="Study order">
          <select
            value={settings.studyOrder}
            onChange={(e) =>
              setSettings({ studyOrder: e.target.value as typeof settings.studyOrder })
            }
            className="bg-transparent border-b-2 border-[var(--ink-black)] py-1"
          >
            <option value="mixed">Mixed</option>
            <option value="new-first">New cards first</option>
            <option value="reviews-first">Reviews first</option>
          </select>
        </Row>
        <Row label="Show time taken per card">
          <Toggle v={settings.showTiming} on={(v) => setSettings({ showTiming: v })} />
        </Row>
        <Row label="Keyboard shortcuts">
          <Toggle
            v={settings.keyboardShortcuts}
            on={(v) => setSettings({ keyboardShortcuts: v })}
          />
        </Row>
        <Row label="Global new/day override">
          <input
            type="number"
            value={settings.globalNewLimit ?? ""}
            onChange={(e) =>
              setSettings({ globalNewLimit: e.target.value === "" ? null : Number(e.target.value) })
            }
            className="bg-transparent border-b-2 border-[var(--ink-black)] w-24 py-1"
            placeholder="—"
          />
        </Row>
        <Row label="Global reviews/day override">
          <input
            type="number"
            value={settings.globalReviewLimit ?? ""}
            onChange={(e) =>
              setSettings({
                globalReviewLimit: e.target.value === "" ? null : Number(e.target.value),
              })
            }
            className="bg-transparent border-b-2 border-[var(--ink-black)] w-24 py-1"
            placeholder="—"
          />
        </Row>
      </Section>

      <Section title="Data">
        <div className="flex gap-3 mb-3">
          <Stamp variant="ghost" onClick={backup}>
            Export Backup
          </Stamp>
          <Stamp onClick={() => setConfirm(true)}>Clear All Data</Stamp>
        </div>
      </Section>

      <Section title="About">
        <p className="text-sm">The Review · v1.0</p>
        <p className="text-sm">Algorithm: SuperMemo SM-2 (1987)</p>
        <p className="text-sm">
          <a
            className="underline"
            href="https://super-memory.com/english/ol/sm2.htm"
            target="_blank"
            rel="noreferrer"
          >
            SM-2 reference paper
          </a>
        </p>
      </Section>

      <Modal
        open={confirm}
        onClose={() => {
          setConfirm(false);
          setConfirmText("");
        }}
        title="Erase all data?"
      >
        <p className="text-sm mb-3">
          Type <b>DELETE</b> to confirm. This removes all decks, cards, and history.
        </p>
        <input
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          className="w-full bg-transparent border-2 border-[var(--ink-black)] p-2 mb-3"
        />
        <Stamp
          disabled={confirmText !== "DELETE"}
          onClick={() => {
            clearAll();
            setConfirm(false);
            setConfirmText("");
          }}
        >
          Erase Everything
        </Stamp>
      </Modal>
    </PageLayout>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h3 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
        {title}
      </h3>
      <div className="rule-thin my-3" />
      {children}
    </section>
  );
}
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-dotted border-[var(--column-rule)]">
      <span className="smallcaps text-xs text-[var(--slate)]">{label}</span>
      <div>{children}</div>
    </div>
  );
}
function Toggle({ v, on }: { v: boolean; on: (v: boolean) => void }) {
  return (
    <button
      onClick={() => on(!v)}
      className={`border-2 border-[var(--ink-black)] px-3 py-1 text-xs smallcaps ${v ? "bg-[var(--ink-black)] text-[var(--aged-white)]" : ""}`}
    >
      {v ? "On" : "Off"}
    </button>
  );
}
