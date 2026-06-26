import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageLayout } from "../components/layout/PageLayout";
import { useStore } from "../store";
import { todayISO } from "../utils/dates";

export const Route = createFileRoute("/stats")({
  head: () => ({ meta: [{ title: "Statistics — The Review" }] }),
  component: StatsPage,
});

function StatsPage() {
  const decks = useStore((s) => s.decks);
  const cards = useStore((s) => s.cards);
  const logs = useStore((s) => s.reviewLogs);
  const [retentionWindow, setRetentionWindow] = useState<30 | 90 | 365>(30);

  const today = todayISO(0);
  const cardArr = Object.values(cards);
  const todays = logs.filter((l) => l.timestamp.slice(0, 10) === today);

  const forecast30 = useMemo(() => {
    const out: { date: string; count: number }[] = [];
    for (let i = 0; i < 30; i++) {
      const d = todayISO(i);
      out.push({
        date: d,
        count: cardArr.filter((c) => c.cardType === "review" && !c.suspended && c.dueDate === d)
          .length,
      });
    }
    return out;
  }, [cardArr]);
  const maxF = Math.max(1, ...forecast30.map((f) => f.count));

  const heatmap = useMemo(() => {
    const days = 365;
    const map = new Map<string, number>();
    for (let i = days - 1; i >= 0; i--) map.set(todayISO(-i), 0);
    logs.forEach((l) => {
      const d = l.timestamp.slice(0, 10);
      if (map.has(d)) map.set(d, (map.get(d) ?? 0) + 1);
    });
    return Array.from(map.entries());
  }, [logs]);
  const maxH = Math.max(1, ...heatmap.map(([, n]) => n));

  const easeBuckets = useMemo(() => {
    const buckets: Record<string, number> = {};
    for (let x = 1.3; x <= 3.5; x += 0.1) buckets[x.toFixed(1)] = 0;
    cardArr.forEach((c) => {
      const k = Math.max(1.3, Math.min(3.5, c.easeFactor)).toFixed(1);
      buckets[k] = (buckets[k] ?? 0) + 1;
    });
    return Object.entries(buckets);
  }, [cardArr]);
  const maxE = Math.max(1, ...easeBuckets.map(([, n]) => n));

  const reviews30 = useMemo(() => {
    const out: { date: string; count: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = todayISO(-i);
      out.push({ date: d, count: logs.filter((l) => l.timestamp.slice(0, 10) === d).length });
    }
    return out;
  }, [logs]);
  const maxR = Math.max(1, ...reviews30.map((r) => r.count));

  const windowLogs = useMemo(() => {
    const cutoff = Date.now() - retentionWindow * 86400000;
    return logs.filter((l) => new Date(l.timestamp).getTime() >= cutoff);
  }, [logs, retentionWindow]);
  const retention = windowLogs.length
    ? (windowLogs.filter((l) => l.rating >= 3).length / windowLogs.length) * 100
    : 0;

  const reviewCards = cardArr.filter((c) => c.cardType === "review");
  const avgIvl = reviewCards.length
    ? reviewCards.reduce((n, c) => n + c.interval, 0) / reviewCards.length
    : 0;

  const timeStudiedToday = todays.reduce((n, l) => n + l.timeTaken, 0) / 60000;

  const heatColumns = 53;
  return (
    <PageLayout>
      <p className="smallcaps text-xs text-[var(--slate)]">Editorial Almanac</p>
      <h2 className="text-5xl font-bold mb-6" style={{ fontFamily: "var(--font-display)" }}>
        The Numbers
      </h2>

      <section
        className="grid grid-cols-2 md:grid-cols-4 border-y-2 border-[var(--ink-black)] divide-x-2 divide-[var(--ink-black)] mb-10"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        <Stat label="Reviewed Today" v={todays.length} />
        <Stat label="New Today" v={todays.filter((l) => l.previousInterval === 0).length} />
        <Stat label="Minutes Today" v={timeStudiedToday.toFixed(1)} />
        <Stat label="Decks" v={Object.keys(decks).length} />
      </section>

      <Section title="30-Day Forecast">
        <div
          className="grid grid-cols-6 md:grid-cols-10 gap-1"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {forecast30.map((f) => (
            <div
              key={f.date}
              className="border border-[var(--ink-black)] p-1 text-center text-[10px]"
            >
              <div className="smallcaps text-[9px] text-[var(--slate)]">{f.date.slice(5)}</div>
              <div
                className="text-base font-bold"
                style={{ opacity: 0.3 + 0.7 * (f.count / maxF) }}
              >
                {f.count}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="One-Year Heatmap">
        <div
          className="grid gap-[2px] overflow-x-auto"
          style={{ gridTemplateColumns: `repeat(${heatColumns}, 10px)` }}
        >
          {heatmap.map(([d, n]) => (
            <div
              key={d}
              title={`${d}: ${n} reviews`}
              style={{
                width: 10,
                height: 10,
                background:
                  n === 0 ? "var(--highlight)" : `rgba(13,13,13,${0.25 + 0.75 * (n / maxH)})`,
                border: "1px solid rgba(13,13,13,0.2)",
              }}
            />
          ))}
        </div>
      </Section>

      <Section title="Card Type Distribution">
        <div className="space-y-3">
          {Object.values(decks).map((d) => {
            const dCards = cardArr.filter((c) => c.deckId === d.id);
            const total = Math.max(1, dCards.length);
            const n = dCards.filter((c) => c.cardType === "new").length;
            const l = dCards.filter(
              (c) => c.cardType === "learning" || c.cardType === "relearning",
            ).length;
            const r = dCards.filter((c) => c.cardType === "review").length;
            return (
              <div key={d.id}>
                <p className="smallcaps text-xs mb-1">{d.name}</p>
                <div
                  className="flex h-4 border-2 border-[var(--ink-black)]"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  <div
                    title="new"
                    style={{ width: `${(n / total) * 100}%`, background: "var(--highlight)" }}
                  />
                  <div
                    title="learning"
                    style={{ width: `${(l / total) * 100}%`, background: "var(--column-rule)" }}
                  />
                  <div
                    title="review"
                    style={{ width: `${(r / total) * 100}%`, background: "var(--ink-black)" }}
                  />
                </div>
                <p
                  className="text-[10px] text-[var(--slate)] mt-0.5"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  new {n} · learn {l} · review {r}
                </p>
              </div>
            );
          })}
        </div>
      </Section>

      <Section title="Ease Distribution">
        <div className="flex items-end gap-0.5 h-32 border-b-2 border-[var(--ink-black)]">
          {easeBuckets.map(([k, n]) => (
            <div
              key={k}
              className="flex-1 bg-[var(--ink-black)]"
              style={{ height: `${(n / maxE) * 100}%` }}
              title={`${k}: ${n}`}
            />
          ))}
        </div>
        <div
          className="flex justify-between text-[10px] mt-1 smallcaps text-[var(--slate)]"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          <span>1.3</span>
          <span>2.5</span>
          <span>3.5</span>
        </div>
      </Section>

      <Section title="Reviews per Day (30 days)">
        <div className="flex items-end gap-1 h-32 border-b-2 border-[var(--ink-black)]">
          {reviews30.map((r) => (
            <div
              key={r.date}
              className="flex-1 bg-[var(--ink-black)]"
              style={{ height: `${(r.count / maxR) * 100}%`, minHeight: r.count > 0 ? 2 : 0 }}
              title={`${r.date}: ${r.count}`}
            />
          ))}
        </div>
      </Section>

      <Section title="True Retention">
        <div className="flex items-center gap-4 mb-3 text-xs smallcaps">
          <span>Window:</span>
          {[30, 90, 365].map((d) => (
            <button
              key={d}
              onClick={() => setRetentionWindow(d as 30 | 90 | 365)}
              className={retentionWindow === d ? "underline font-bold" : "hover:underline"}
            >
              {d}d
            </button>
          ))}
        </div>
        <p className="text-5xl font-bold" style={{ fontFamily: "var(--font-mono)" }}>
          {retention.toFixed(1)}%
        </p>
        <p className="smallcaps text-xs text-[var(--slate)]">
          (Good + Easy) ÷ (Again + Hard + Good + Easy) · {windowLogs.length} reviews
        </p>
      </Section>

      <Section title="Average Interval">
        <p className="text-3xl font-bold" style={{ fontFamily: "var(--font-mono)" }}>
          {avgIvl.toFixed(1)} days
        </p>
      </Section>
    </PageLayout>
  );
}

function Stat({ label, v }: { label: string; v: number | string }) {
  return (
    <div className="p-4 text-center">
      <p className="text-[10px] smallcaps text-[var(--slate)]">{label}</p>
      <p className="text-3xl font-bold">{v}</p>
    </div>
  );
}
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-12">
      <h3 className="text-2xl font-bold mb-2" style={{ fontFamily: "var(--font-display)" }}>
        {title}
      </h3>
      <div className="rule-thin mb-4" />
      {children}
    </section>
  );
}
