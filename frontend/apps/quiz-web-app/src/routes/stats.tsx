import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Modal } from "@/components/ui/Modal";
import { Stamp, stampClasses } from "@/components/ui/Stamp";
import { useStore } from "@/store";
import { selectDueCount, selectLeeches } from "@/store/selectors";
import { cardRetrievability } from "@/algorithms/scheduler";
import { predictedRetention } from "@/algorithms/fsrs";
import { todayISO } from "@/utils/dates";

export const Route = createFileRoute("/stats")({
  component: StatsPage,
});

function StatsPage() {
  const cardStates = useStore((s) => s.cardStates);
  const ignored = useStore((s) => s.ignored);
  const suspended = useStore((s) => s.suspended);
  const addedPosts = useStore((s) => s.addedPosts);
  const settings = useStore((s) => s.settings);
  const config = useStore((s) => s.config);
  const daily = useStore((s) => s.daily);
  const dailyByPost = useStore((s) => s.dailyByPost);
  const postConfigs = useStore((s) => s.postConfigs);
  const reviewLogs = useStore((s) => s.reviewLogs);
  const unsuspendQuestion = useStore((s) => s.unsuspendQuestion);
  const resetAll = useStore((s) => s.resetAll);

  const [confirmReset, setConfirmReset] = useState(false);
  const [retentionWindow, setRetentionWindow] = useState<30 | 90 | 365>(30);

  const storeSlice = {
    addedPosts,
    cardStates,
    ignored,
    suspended,
    daily,
    dailyByPost,
    postConfigs,
    config,
    settings,
    reviewLogs,
    studySessions: [],
    lastReview: null,
  };

  const today = todayISO(0, settings.dayStartHour);

  const dueToday = useMemo(
    () => selectDueCount(storeSlice as never),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [addedPosts, cardStates, ignored, suspended, daily, dailyByPost, postConfigs, config, settings],
  );

  const leeches = useMemo(
    () => selectLeeches(storeSlice as never),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cardStates, addedPosts, settings.leechThreshold],
  );

  const cardArr = Object.values(cardStates);
  const postSet = new Set(addedPosts);
  const activeCards = cardArr.filter((c) => postSet.has(c.postSlug) && !ignored[c.questionSlug]);

  const todayLogs = reviewLogs.filter((l) => l.timestamp.slice(0, 10) === today);

  const totals = useMemo(
    () => ({
      total: activeCards.length,
      new: activeCards.filter((c) => c.cardType === "new").length,
      learning: activeCards.filter((c) => c.cardType === "learning" || c.cardType === "relearning")
        .length,
      review: activeCards.filter((c) => c.cardType === "review").length,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cardStates, ignored, addedPosts],
  );

  // 30-day forecast grid
  const forecast30 = useMemo(() => {
    const out: { date: string; count: number }[] = [];
    for (let i = 0; i < 30; i++) {
      const d = todayISO(i);
      out.push({
        date: d,
        count: activeCards.filter(
          (c) => c.cardType === "review" && c.dueDate === (i === 0 ? undefined : d),
        ).length,
      });
    }
    // Day 0: all review cards due on or before today
    out[0].count = activeCards.filter((c) => c.cardType === "review" && c.dueDate <= today).length;
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardStates, ignored, addedPosts]);
  const maxForecast = Math.max(1, ...forecast30.map((f) => f.count));

  // 1-year review heatmap
  const heatmap = useMemo(() => {
    const days = 365;
    const map = new Map<string, number>();
    for (let i = days - 1; i >= 0; i--) map.set(todayISO(-i), 0);
    reviewLogs.forEach((l) => {
      const d = l.timestamp.slice(0, 10);
      if (map.has(d)) map.set(d, (map.get(d) ?? 0) + 1);
    });
    return Array.from(map.entries());
  }, [reviewLogs]);
  const maxHeat = Math.max(1, ...heatmap.map(([, n]) => n));

  // Ease factor distribution
  const easeBuckets = useMemo(() => {
    const buckets: Record<string, number> = {};
    for (let x = 1.3; x <= 3.5; x += 0.1) buckets[x.toFixed(1)] = 0;
    cardArr.forEach((c) => {
      const k = Math.max(1.3, Math.min(3.5, c.easeFactor)).toFixed(1);
      buckets[k] = (buckets[k] ?? 0) + 1;
    });
    return Object.entries(buckets);
  }, [cardArr]);
  const maxEase = Math.max(1, ...easeBuckets.map(([, n]) => n));

  // Reviews per day (last 30 days)
  const reviews30 = useMemo(() => {
    const out: { date: string; count: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = todayISO(-i);
      out.push({ date: d, count: reviewLogs.filter((l) => l.timestamp.slice(0, 10) === d).length });
    }
    return out;
  }, [reviewLogs]);
  const maxReviews = Math.max(1, ...reviews30.map((r) => r.count));

  // True retention
  const windowLogs = useMemo(() => {
    const cutoff = Date.now() - retentionWindow * 86400000;
    return reviewLogs.filter((l) => new Date(l.timestamp).getTime() >= cutoff);
  }, [reviewLogs, retentionWindow]);
  const retention = windowLogs.length
    ? (windowLogs.filter((l) => l.rating >= 3).length / windowLogs.length) * 100
    : 0;

  // Average interval
  const reviewCards = cardArr.filter((c) => c.cardType === "review");
  const avgIvl = reviewCards.length
    ? reviewCards.reduce((n, c) => n + c.interval, 0) / reviewCards.length
    : 0;

  const timeStudiedToday = todayLogs.reduce((n, l) => n + l.timeTaken, 0) / 60000;

  // FSRS memory-model stats (only meaningful when cards carry stability).
  const fsrsActive = settings.scheduler === "fsrs";
  const fsrsCards = reviewCards.filter((c) => c.fsrsStability !== undefined);
  const avgStability = fsrsCards.length
    ? fsrsCards.reduce((n, c) => n + (c.fsrsStability ?? 0), 0) / fsrsCards.length
    : 0;
  const avgDifficulty = fsrsCards.length
    ? fsrsCards.reduce((n, c) => n + (c.fsrsDifficulty ?? 0), 0) / fsrsCards.length
    : 0;

  const retentionCurve = useMemo(() => {
    const out: { day: number; r: number }[] = [];
    for (let i = 0; i <= 30; i += 2) {
      out.push({ day: i, r: avgStability > 0 ? predictedRetention(avgStability, i) : 0 });
    }
    return out;
  }, [avgStability]);

  const retrievabilityBands = useMemo(() => {
    let green = 0;
    let amber = 0;
    let red = 0;
    for (const c of fsrsCards) {
      const r = cardRetrievability(c, today);
      if (r == null) continue;
      if (r >= 0.9) green++;
      else if (r >= 0.7) amber++;
      else red++;
    }
    return { green, amber, red };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardStates, today, settings.scheduler]);

  if (addedPosts.length === 0) {
    return (
      <PageLayout>
        <div className="text-center py-16">
          <p className="italic text-[var(--charcoal)] mb-4">
            No study sets yet. Add a post to start tracking progress.
          </p>
          <Link to="/" className={stampClasses("solid", "lg")}>
            Browse Posts
          </Link>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <p className="smallcaps text-sm text-[var(--slate)]">Editorial Almanac</p>
      <h2 className="text-5xl font-bold mb-6" style={{ fontFamily: "var(--font-display)" }}>
        The Numbers
      </h2>

      <section
        className="grid grid-cols-2 md:grid-cols-4 border-y-2 border-[var(--ink-black)] divide-x-2 divide-[var(--ink-black)] mb-10"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        <Stat label="Reviewed Today" v={todayLogs.length} />
        <Stat label="New Today" v={todayLogs.filter((l) => l.previousInterval === 0).length} />
        <Stat label="Minutes Today" v={timeStudiedToday.toFixed(1)} />
        <Stat label="Sets" v={addedPosts.length} />
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
                className="text-lg font-bold"
                style={{ opacity: 0.3 + 0.7 * (f.count / maxForecast) }}
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
          style={{ gridTemplateColumns: "repeat(53, 10px)" }}
        >
          {heatmap.map(([d, n]) => (
            <div
              key={d}
              title={`${d}: ${n} reviews`}
              style={{
                width: 10,
                height: 10,
                background:
                  n === 0 ? "var(--highlight)" : `rgba(13,13,13,${0.25 + 0.75 * (n / maxHeat)})`,
                border: "1px solid rgba(13,13,13,0.2)",
              }}
            />
          ))}
        </div>
      </Section>

      {fsrsActive && (
        <Section title="Memory Model (FSRS)">
          {fsrsCards.length === 0 ? (
            <p className="text-base italic text-[var(--slate)]">
              No FSRS-scheduled review cards yet. Review some cards under FSRS to populate the
              memory model.
            </p>
          ) : (
            <>
              <div
                className="grid grid-cols-2 md:grid-cols-4 border-y-2 border-[var(--ink-black)] divide-x-2 divide-[var(--ink-black)] mb-6"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                <Stat label="Avg Stability" v={`${avgStability.toFixed(1)}d`} />
                <Stat label="Avg Difficulty" v={avgDifficulty.toFixed(1)} />
                <Stat
                  label="Target Retention"
                  v={`${Math.round(settings.fsrsTargetRetention * 100)}%`}
                />
                <Stat label="Modelled Cards" v={fsrsCards.length} />
              </div>

              <p className="smallcaps text-sm text-[var(--slate)] mb-2">
                Predicted retention over 30 days (avg card)
              </p>
              <div className="flex items-end gap-1 h-24 border-b-2 border-[var(--ink-black)] mb-1">
                {retentionCurve.map((p) => (
                  <div
                    key={p.day}
                    className="flex-1 bg-[var(--ink-black)]"
                    style={{ height: `${p.r * 100}%`, minHeight: 2 }}
                    title={`Day ${p.day}: ${(p.r * 100).toFixed(0)}%`}
                  />
                ))}
              </div>
              <div
                className="flex justify-between text-[10px] smallcaps text-[var(--slate)] mb-6"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                <span>today</span>
                <span>+15d</span>
                <span>+30d</span>
              </div>

              <p className="smallcaps text-sm text-[var(--slate)] mb-2">
                Current retrievability of modelled cards
              </p>
              <div className="flex h-5 border-2 border-[var(--ink-black)] mb-1">
                <div
                  style={{
                    width: `${(retrievabilityBands.green / Math.max(1, fsrsCards.length)) * 100}%`,
                    background: "var(--ink-black)",
                  }}
                  title={`≥90%: ${retrievabilityBands.green}`}
                />
                <div
                  style={{
                    width: `${(retrievabilityBands.amber / Math.max(1, fsrsCards.length)) * 100}%`,
                    background: "var(--column-rule)",
                  }}
                  title={`70–90%: ${retrievabilityBands.amber}`}
                />
                <div
                  style={{
                    width: `${(retrievabilityBands.red / Math.max(1, fsrsCards.length)) * 100}%`,
                    background: "var(--highlight)",
                  }}
                  title={`<70%: ${retrievabilityBands.red}`}
                />
              </div>
              <p
                className="text-[10px] text-[var(--slate)]"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                strong {retrievabilityBands.green} · fading {retrievabilityBands.amber} · at-risk{" "}
                {retrievabilityBands.red}
              </p>
            </>
          )}
        </Section>
      )}

      {settings.leechThreshold > 0 && (
        <Section title={`Leeches (≥ ${settings.leechThreshold} lapses)`}>
          {leeches.length === 0 ? (
            <p className="text-base italic text-[var(--slate)]">No leeches — keep it up.</p>
          ) : (
            <div className="border-2 border-[var(--ink-black)] overflow-x-auto">
              <table
                className="data-table w-full text-base"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                <thead className="border-b-2 border-[var(--ink-black)] bg-[var(--highlight)]">
                  <tr>
                    <th className="p-2 text-left">Question</th>
                    <th className="p-2 text-left w-16">Lapses</th>
                    <th className="p-2 text-left w-20">Set</th>
                    <th className="p-2 text-left w-24">Status</th>
                    <th className="p-2 text-left w-24">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leeches.map((c) => (
                    <tr key={c.questionSlug} className="border-b border-[var(--column-rule)]">
                      <td className="p-2 max-w-[240px] truncate" title={c.questionSlug}>
                        {c.questionSlug}
                      </td>
                      <td className="p-2 font-bold">{c.lapses}</td>
                      <td className="p-2 smallcaps text-[10px]">{c.postSlug}</td>
                      <td className="p-2">{suspended[c.questionSlug] ? "Suspended" : "Active"}</td>
                      <td className="p-2">
                        {suspended[c.questionSlug] && (
                          <button
                            type="button"
                            onClick={() => unsuspendQuestion(c.questionSlug)}
                            className="smallcaps text-[10px] underline"
                          >
                            Unsuspend
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="text-[10px] italic text-[var(--slate)] mt-2">
            Threshold and action configurable in{" "}
            <Link to="/settings" className="underline">
              Settings
            </Link>
            .
          </p>
        </Section>
      )}

      <Section title="Card Type Distribution">
        <div className="space-y-3">
          {addedPosts.map((slug) => {
            const dCards = cardArr.filter((c) => c.postSlug === slug);
            const total = Math.max(1, dCards.length);
            const n = dCards.filter((c) => c.cardType === "new").length;
            const l = dCards.filter(
              (c) => c.cardType === "learning" || c.cardType === "relearning",
            ).length;
            const r = dCards.filter((c) => c.cardType === "review").length;
            return (
              <div key={slug}>
                <p
                  className="smallcaps text-sm mb-1 truncate max-w-xs"
                  title={slug}
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {slug}
                </p>
                <div className="flex h-4 border-2 border-[var(--ink-black)]">
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
                  new {n} · learn {l} · review {r} · total {dCards.length}
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
              style={{ height: `${(n / maxEase) * 100}%` }}
              title={`ease ${k}: ${n} cards`}
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
              style={{ height: `${(r.count / maxReviews) * 100}%`, minHeight: r.count > 0 ? 2 : 0 }}
              title={`${r.date}: ${r.count}`}
            />
          ))}
        </div>
      </Section>

      <Section title="True Retention">
        <div className="flex items-center gap-4 mb-3 text-sm smallcaps">
          <span>Window:</span>
          {([30, 90, 365] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setRetentionWindow(d)}
              className={retentionWindow === d ? "underline font-bold" : "hover:underline"}
            >
              {d}d
            </button>
          ))}
        </div>
        <p className="text-5xl font-bold" style={{ fontFamily: "var(--font-mono)" }}>
          {retention.toFixed(1)}%
        </p>
        <p className="smallcaps text-sm text-[var(--slate)]">
          (Good + Easy) ÷ total · {windowLogs.length} reviews
        </p>
      </Section>

      <Section title="Average Interval">
        <p className="text-3xl font-bold" style={{ fontFamily: "var(--font-mono)" }}>
          {avgIvl.toFixed(1)} days
        </p>
        <p className="smallcaps text-sm text-[var(--slate)]">
          across {reviewCards.length} review cards
        </p>
      </Section>

      <div className="text-center flex flex-wrap justify-center gap-3 mt-12">
        {dueToday > 0 && (
          <Link to="/study" className={stampClasses("solid", "md")}>
            Study All Due ({dueToday})
          </Link>
        )}
        <Link to="/sets" className={stampClasses("ghost", "md")}>
          My Sets
        </Link>
        <Link to="/" className={stampClasses("ghost", "md")}>
          Browse
        </Link>
        <button
          type="button"
          onClick={() => setConfirmReset(true)}
          className="stamp stamp-ghost text-base"
        >
          Reset All Progress
        </button>
      </div>

      <Modal open={confirmReset} onClose={() => setConfirmReset(false)} title="Reset all progress?">
        <p className="text-base mb-4">
          Resets SM-2 scheduling for <b>every</b> tracked question and clears all review logs and
          sessions. Your added sets and ignored questions are kept. This cannot be undone.
        </p>
        <div className="flex gap-3">
          <Stamp
            onClick={() => {
              resetAll();
              setConfirmReset(false);
            }}
          >
            Reset Everything
          </Stamp>
          <button
            type="button"
            onClick={() => setConfirmReset(false)}
            className="smallcaps underline text-base"
          >
            Cancel
          </button>
        </div>
      </Modal>
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
