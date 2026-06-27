import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Stamp } from "@prj--personal-portfolio--v3/shared--ui";
import { Modal } from "@prj--personal-portfolio--v3/shared--ui";
import { toast } from "sonner";
import { useStore } from "@/store";
import { DEFAULT_CONFIG } from "@/store/types";
import type { QuizState } from "@/store";
import type { SchedulerName } from "@/store/types";
import { applyTheme } from "@/lib/theme";
import { DEFAULT_FSRS_PARAMS } from "@/algorithms/fsrs";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const settings = useStore((s) => s.settings);
  const setSettings = useStore((s) => s.setSettings);
  const config = useStore((s) => s.config);
  const setConfig = useStore((s) => s.setConfig);
  const clearAll = useStore((s) => s.clearAll);
  const importState = useStore((s) => s.importState);

  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const [confirmScheduler, setConfirmScheduler] = useState<SchedulerName | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function selectTheme(t: typeof settings.theme) {
    setSettings({ theme: t });
    applyTheme(t);
  }

  function switchScheduler(target: SchedulerName) {
    const count = Object.keys(useStore.getState().cardStates).length;
    setSettings({ scheduler: target });
    setConfirmScheduler(null);
    toast.success(
      target === "fsrs"
        ? `Switched to FSRS — ${count} card(s) migrated (stability/difficulty seeded)`
        : `Switched to SM-2 — ${count} card(s) migrated`,
    );
  }

  function exportBackup() {
    const state = useStore.getState();
    const snapshot: Partial<QuizState> = {
      cardStates: state.cardStates,
      addedPosts: state.addedPosts,
      ignored: state.ignored,
      suspended: state.suspended,
      postConfigs: state.postConfigs,
      dailyByPost: state.dailyByPost,
      reviewLogs: state.reviewLogs,
      studySessions: state.studySessions,
      settings: state.settings,
      config: state.config,
      daily: state.daily,
    };
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `quiz-progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Backup exported");
  }

  function handleImportFile(files: FileList | null) {
    if (!files?.[0]) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const snapshot = JSON.parse(String(reader.result)) as Partial<QuizState>;
        if (typeof snapshot !== "object" || snapshot === null) throw new Error("Invalid file.");
        importState(snapshot);
        applyTheme(useStore.getState().settings.theme);
        const postCount = snapshot.addedPosts?.length ?? 0;
        const cardCount = Object.keys(snapshot.cardStates ?? {}).length;
        const msg = `Imported: ${postCount} set(s), ${cardCount} card state(s).`;
        setImportMsg(msg);
        toast.success(msg);
      } catch (e) {
        const msg = `Import failed: ${(e as Error).message}`;
        setImportMsg(msg);
        toast.error(msg);
      }
    };
    reader.readAsText(files[0]);
  }

  return (
    <PageLayout>
      <p className="smallcaps text-sm text-[var(--slate)]">Configuration</p>
      <h2 className="text-5xl font-bold mb-8" style={{ fontFamily: "var(--font-display)" }}>
        Settings
      </h2>

      <Section title="Appearance">
        <Row
          label="Theme"
          hint="Colour scheme for the app. “System” follows your operating system’s light/dark preference and updates automatically when it changes."
        >
          {(["light", "dark", "system"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => selectTheme(t)}
              className={`smallcaps text-sm mr-3 ${settings.theme === t ? "underline font-bold" : "hover:underline"}`}
            >
              {t}
            </button>
          ))}
        </Row>
      </Section>

      <Section title="Study">
        <Row
          label="Study order"
          hint="How due cards are sequenced within a session. “Mixed” interleaves new and review cards; “New cards first” front-loads unseen material; “Reviews first” clears your backlog before introducing anything new. Learning-step cards always come first regardless."
        >
          <select
            value={settings.studyOrder}
            onChange={(e) =>
              setSettings({ studyOrder: e.target.value as typeof settings.studyOrder })
            }
            className="bg-transparent border-b-2 border-[var(--ink-black)] py-1 text-base"
          >
            <option value="mixed">Mixed</option>
            <option value="new-first">New cards first</option>
            <option value="reviews-first">Reviews first</option>
          </select>
        </Row>
        <Row
          label="Show time taken per card"
          hint="When on, the study screen displays how long you spend on each card and totals it per session. Purely informational — it doesn’t affect scheduling."
        >
          <Toggle v={settings.showTiming} on={(v) => setSettings({ showTiming: v })} />
        </Row>
        <Row
          label="Keyboard shortcuts"
          hint="Enables hotkeys during study: 1–4 to rate Again/Hard/Good/Easy, Space/Enter to reveal or rate Good. Turn off if shortcuts interfere with assistive tools."
        >
          <Toggle
            v={settings.keyboardShortcuts}
            on={(v) => setSettings({ keyboardShortcuts: v })}
          />
        </Row>
        <Row
          label="Global new cards / day override"
          hint="A hard cap on new cards introduced per day across all sets combined. Leave blank to use the per-set “Daily new card limit” below. Lower this to slow down intake and keep future review load manageable."
        >
          <input
            type="number"
            value={settings.globalNewLimit ?? ""}
            onChange={(e) =>
              setSettings({ globalNewLimit: e.target.value === "" ? null : Number(e.target.value) })
            }
            className="bg-transparent border-b-2 border-[var(--ink-black)] w-24 py-1"
            placeholder="—"
            style={{ fontFamily: "var(--font-mono)" }}
          />
        </Row>
        <Row
          label="Global reviews / day override"
          hint="A hard cap on review cards shown per day across all sets combined. Leave blank to use the per-set “Daily review limit” below. Any reviews beyond the cap roll over to the next day."
        >
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
            style={{ fontFamily: "var(--font-mono)" }}
          />
        </Row>
        <Row
          label="Next day starts at (hour, 0–23)"
          hint="The local hour your “study day” rolls over (Anki-style). With the default 4, cards due “tomorrow” become available at 4 AM, so late-night study before then still counts as today. Raise it if you study past midnight."
        >
          <input
            type="number"
            min={0}
            max={23}
            value={settings.dayStartHour}
            onChange={(e) => setSettings({ dayStartHour: Number(e.target.value) })}
            className="bg-transparent border-b-2 border-[var(--ink-black)] w-24 py-1"
            style={{ fontFamily: "var(--font-mono)" }}
          />
        </Row>
      </Section>

      <Section title="Leeches">
        <p className="text-sm italic text-[var(--slate)] mb-4">
          Cards that lapse repeatedly are &ldquo;leeches&rdquo;. When lapses reach the threshold,
          the configured action is applied automatically.
        </p>
        <Row
          label="Leech threshold (lapses, 0 = off)"
          hint="Number of times a card may lapse (be rated “Again” from review) before it’s flagged as a leech. Lower = stricter. Set to 0 to disable leech detection entirely."
        >
          <input
            type="number"
            min={0}
            value={settings.leechThreshold}
            onChange={(e) => setSettings({ leechThreshold: Number(e.target.value) })}
            className="bg-transparent border-b-2 border-[var(--ink-black)] w-24 py-1"
            style={{ fontFamily: "var(--font-mono)" }}
          />
        </Row>
        <Row
          label="Leech action"
          hint="What happens when a card hits the threshold. “Auto-suspend” removes it from study queues until you unsuspend it (from Stats or the card preview); “Tag only” keeps showing it but lists it under Leeches in Stats so you can rewrite it."
        >
          <select
            value={settings.leechAction}
            onChange={(e) =>
              setSettings({ leechAction: e.target.value as typeof settings.leechAction })
            }
            className="bg-transparent border-b-2 border-[var(--ink-black)] py-1 text-base"
          >
            <option value="suspend">Auto-suspend</option>
            <option value="tag">Tag only (stats view)</option>
          </select>
        </Row>
      </Section>

      <Section title="Scheduler">
        <p className="text-sm italic text-[var(--slate)] mb-4">
          Choose the spaced-repetition algorithm. Switching migrates every card losslessly — SM-2
          keeps interval &amp; ease, FSRS seeds stability &amp; difficulty from them. You can switch
          back at any time.
        </p>
        <Row
          label="Algorithm"
          hint="SM-2 is the classic SuperMemo algorithm (simple, ease-factor based). FSRS-5 is a modern memory model that predicts forgetting per card and typically hits the same retention with fewer reviews. Switching opens a confirmation and migrates your cards without losing progress."
        >
          <div className="flex gap-2">
            {(
              [
                ["sm2", "SM-2 (classic)"],
                ["fsrs", "FSRS-5 (memory model)"],
              ] as [SchedulerName, string][]
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() =>
                  settings.scheduler === value ? undefined : setConfirmScheduler(value)
                }
                className={`border-2 border-[var(--ink-black)] px-3 py-1 text-sm smallcaps ${
                  settings.scheduler === value
                    ? "bg-[var(--ink-black)] text-[var(--aged-white)]"
                    : "hover:bg-[var(--highlight)]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </Row>

        {settings.scheduler === "fsrs" && (
          <>
            <div className="py-2 border-b border-dotted border-[var(--column-rule)]">
              <div className="flex items-center justify-between">
                <span className="smallcaps text-sm text-[var(--slate)]">Target retention</span>
                <span className="text-base" style={{ fontFamily: "var(--font-mono)" }}>
                  {Math.round(settings.fsrsTargetRetention * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0.7}
                max={0.99}
                step={0.01}
                value={settings.fsrsTargetRetention}
                onChange={(e) => setSettings({ fsrsTargetRetention: Number(e.target.value) })}
                className="w-full mt-2 accent-[var(--ink-black)]"
              />
              <p className="text-[11px] italic text-[var(--slate)] mt-0.5">
                Higher retention → shorter intervals &amp; more reviews. 90% is a good default.
              </p>
            </div>
            <details className="py-2 border-b border-dotted border-[var(--column-rule)]">
              <summary className="smallcaps text-sm text-[var(--slate)] cursor-pointer">
                Advanced: FSRS weights (19 values)
              </summary>
              <textarea
                value={(settings.fsrsWeights ?? DEFAULT_FSRS_PARAMS.w).join(", ")}
                onChange={(e) => {
                  const parsed = e.target.value
                    .split(/[\s,]+/)
                    .map(Number)
                    .filter((n) => !Number.isNaN(n));
                  if (parsed.length === DEFAULT_FSRS_PARAMS.w.length) {
                    setSettings({ fsrsWeights: parsed });
                  }
                }}
                rows={3}
                className="w-full mt-2 bg-transparent border-2 border-[var(--ink-black)] p-2 text-[11px]"
                style={{ fontFamily: "var(--font-mono)" }}
              />
              <button
                type="button"
                onClick={() => {
                  setSettings({ fsrsWeights: undefined });
                  toast.success("FSRS weights reset to defaults");
                }}
                className="smallcaps text-sm underline hover:no-underline mt-1"
              >
                Reset weights to defaults
              </button>
              <p className="text-[11px] italic text-[var(--slate)] mt-1">
                Paste optimised weights from the FSRS optimiser. Invalid input (≠ 19 numbers) is
                ignored.
              </p>
            </details>
          </>
        )}
      </Section>

      <Section title="SM-2 Scheduling">
        <p className="text-sm italic text-[var(--slate)] mb-4">
          Global scheduling parameters. Daily limits and learning/lapse steps apply to both
          algorithms; ease-based fields below are used by SM-2.
        </p>
        <NumRow
          label="Daily new card limit"
          hint="Default number of brand-new cards introduced per day for each set. Individual sets can override this; the global override above caps the total across all sets."
          v={config.newCardsPerDay}
          on={(n) => setConfig({ newCardsPerDay: n })}
        />
        <NumRow
          label="Daily review limit"
          hint="Default maximum number of due review cards shown per day for each set. Reviews beyond this limit are deferred to following days."
          v={config.maxReviewsPerDay}
          on={(n) => setConfig({ maxReviewsPerDay: n })}
        />
        <Row
          label="Learning steps (min, space-separated)"
          hint="Short intervals (in minutes) a new card steps through before it “graduates” to long-term review. E.g. “1 10” shows the card again after 1 min, then 10 min, then graduates. More steps = more reinforcement before scheduling in days."
        >
          <input
            value={config.learningSteps.join(" ")}
            onChange={(e) => setConfig({ learningSteps: parseSteps(e.target.value) })}
            className="bg-transparent border-b-2 border-[var(--ink-black)] w-32 py-1 text-base"
            style={{ fontFamily: "var(--font-mono)" }}
          />
        </Row>
        <NumRow
          label="Graduating interval (days)"
          hint="The first review interval (in days) given when a card passes the last learning step with “Good”."
          v={config.graduatingInterval}
          on={(n) => setConfig({ graduatingInterval: n })}
        />
        <NumRow
          label="Easy interval (days)"
          hint="The first review interval (in days) when you rate a learning card “Easy”, skipping the remaining learning steps."
          v={config.easyInterval}
          on={(n) => setConfig({ easyInterval: n })}
        />
        <Row
          label="Lapse steps (min)"
          hint="Relearning intervals (in minutes) a card steps through after you forget it (rate “Again” from review) before it returns to long-term scheduling."
        >
          <input
            value={config.lapseSteps.join(" ")}
            onChange={(e) => setConfig({ lapseSteps: parseSteps(e.target.value) })}
            className="bg-transparent border-b-2 border-[var(--ink-black)] w-32 py-1 text-base"
            style={{ fontFamily: "var(--font-mono)" }}
          />
        </Row>
        <NumRow
          label="Lapse new interval (×)"
          step={0.05}
          hint="Multiplier applied to a card’s interval after a lapse. 0 resets it (relearn from scratch); 0.5 keeps half of the previous interval once it graduates again."
          v={config.lapseNewInterval}
          on={(n) => setConfig({ lapseNewInterval: n })}
        />
        <NumRow
          label="Minimum interval (days)"
          hint="Floor for any review interval. Cards will never be scheduled sooner than this many days apart."
          v={config.minimumInterval}
          on={(n) => setConfig({ minimumInterval: n })}
        />
        <NumRow
          label="Maximum interval (days)"
          hint="Ceiling for any review interval. Caps how far into the future a well-known card can be pushed (default ~100 years)."
          v={config.maximumInterval}
          on={(n) => setConfig({ maximumInterval: n })}
        />
        <NumRow
          label="Easy bonus (×)"
          step={0.05}
          hint="Extra multiplier applied to the interval when you rate a review card “Easy”, on top of normal growth. 1.3 means Easy intervals are 30% longer than Good."
          v={config.easyBonus}
          on={(n) => setConfig({ easyBonus: n })}
        />
        <NumRow
          label="Interval modifier (×)"
          step={0.05}
          hint="Global multiplier on every review interval. Below 1 shortens all intervals (more reviews, higher retention); above 1 lengthens them. A quick way to tune overall difficulty."
          v={config.intervalModifier}
          on={(n) => setConfig({ intervalModifier: n })}
        />
        <NumRow
          label="Starting ease"
          step={0.05}
          hint="The initial ease factor for a freshly graduated card (default 2.5 = ×2.5 interval growth on “Good”). Ease rises with Easy ratings and falls with Hard/Again."
          v={config.startingEaseFactor}
          on={(n) => setConfig({ startingEaseFactor: n })}
        />
        <div className="pt-4">
          <button
            type="button"
            onClick={() => {
              setConfig({ ...DEFAULT_CONFIG });
              toast.success("Scheduling reset to defaults");
            }}
            className="smallcaps text-sm underline hover:no-underline"
          >
            Reset to defaults
          </button>
        </div>
      </Section>

      <Section title="Data">
        <p className="text-base italic text-[var(--slate)] mb-4">
          Export saves your full progress (card states, review history, settings). Import restores
          from a previous export.
        </p>
        <div className="flex gap-3 flex-wrap mb-6">
          <Stamp variant="ghost" onClick={exportBackup}>
            Export Backup
          </Stamp>
          <Stamp variant="ghost" onClick={() => fileRef.current?.click()}>
            Import Backup
          </Stamp>
          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={(e) => handleImportFile(e.target.files)}
          />
        </div>
        {importMsg && (
          <p className="text-base mb-4" style={{ fontFamily: "var(--font-mono)" }}>
            {importMsg}
          </p>
        )}

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleImportFile(e.dataTransfer.files);
          }}
          onClick={() => fileRef.current?.click()}
          className="border-[3px] border-dashed border-[var(--ink-black)] p-10 text-center cursor-pointer hover:bg-[var(--highlight)] text-base smallcaps"
        >
          Drop backup JSON here or click to choose
        </div>
      </Section>

      <Section title="Danger Zone">
        <p className="text-base italic text-[var(--slate)] mb-4">
          Permanently erases all progress, added sets, review history, and sessions. Cannot be
          undone.
        </p>
        <Stamp onClick={() => setConfirmClear(true)}>Clear All Data</Stamp>
      </Section>

      <Section title="About">
        <p className="text-base">
          Active algorithm:{" "}
          {settings.scheduler === "fsrs" ? "FSRS-5 (memory model)" : "SuperMemo SM-2 (1987)"}
        </p>
        <p className="text-base mt-1">
          <a
            className="underline"
            href="https://super-memory.com/english/ol/sm2.htm"
            target="_blank"
            rel="noreferrer"
          >
            SM-2 reference
          </a>
          {" · "}
          <a
            className="underline"
            href="https://github.com/open-spaced-repetition/fsrs4anki/wiki/The-Algorithm"
            target="_blank"
            rel="noreferrer"
          >
            FSRS algorithm
          </a>
        </p>
      </Section>

      <Modal
        open={confirmClear}
        onClose={() => {
          setConfirmClear(false);
          setConfirmText("");
        }}
        title="Erase all data?"
      >
        <p className="text-base mb-3">
          Type <b>DELETE</b> to confirm. Removes all progress, sets, history and sessions.
        </p>
        <input
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          className="w-full bg-transparent border-2 border-[var(--ink-black)] p-2 mb-3"
          style={{ fontFamily: "var(--font-mono)" }}
        />
        <Stamp
          disabled={confirmText !== "DELETE"}
          onClick={() => {
            clearAll();
            setConfirmClear(false);
            setConfirmText("");
            toast.success("All data erased");
          }}
        >
          Erase Everything
        </Stamp>
      </Modal>

      <Modal
        open={confirmScheduler !== null}
        onClose={() => setConfirmScheduler(null)}
        title={confirmScheduler === "fsrs" ? "Switch to FSRS-5?" : "Switch to SM-2?"}
      >
        <p className="text-base mb-3">
          {confirmScheduler === "fsrs" ? (
            <>
              FSRS models memory with <b>stability</b> and <b>difficulty</b>, scheduling each card
              to hit your target retention. Existing cards keep their progress — stability is seeded
              from their current interval and difficulty from ease.
            </>
          ) : (
            <>
              SM-2 schedules with an <b>ease factor</b> and growing intervals. FSRS-only fields are
              dropped; your intervals and ease are preserved, so this is lossless and reversible.
            </>
          )}
        </p>
        <Stamp onClick={() => confirmScheduler && switchScheduler(confirmScheduler)}>
          {confirmScheduler === "fsrs" ? "Switch to FSRS" : "Switch to SM-2"}
        </Stamp>
      </Modal>
    </PageLayout>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-12">
      <h3 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
        {title}
      </h3>
      <div className="rule-thin my-3" />
      {children}
    </section>
  );
}

function Row({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="py-2 border-b border-dotted border-[var(--column-rule)]">
      <div className="flex items-center justify-between gap-4">
        <span className="smallcaps text-sm text-[var(--slate)]">{label}</span>
        <div className="shrink-0">{children}</div>
      </div>
      {hint && <p className="text-[11px] italic text-[var(--slate)] mt-0.5 max-w-prose">{hint}</p>}
    </div>
  );
}

function NumRow({
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
    <div className="py-2 border-b border-dotted border-[var(--column-rule)]">
      <div className="flex items-center justify-between">
        <span className="smallcaps text-sm text-[var(--slate)]">{label}</span>
        <input
          type="number"
          step={step ?? 1}
          value={v}
          onChange={(e) => on(Number(e.target.value))}
          className="bg-transparent border-b-2 border-[var(--ink-black)] w-24 py-0.5 text-right text-base"
          style={{ fontFamily: "var(--font-mono)" }}
        />
      </div>
      {hint && <p className="text-[11px] italic text-[var(--slate)] mt-0.5">{hint}</p>}
    </div>
  );
}

function Toggle({ v, on }: { v: boolean; on: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => on(!v)}
      className={`border-2 border-[var(--ink-black)] px-3 py-1 text-sm smallcaps ${v ? "bg-[var(--ink-black)] text-[var(--aged-white)]" : ""}`}
    >
      {v ? "On" : "Off"}
    </button>
  );
}

function parseSteps(s: string): number[] {
  return s
    .split(/[\s,]+/)
    .map((x) => Number(x))
    .filter((x) => !Number.isNaN(x) && x > 0);
}
