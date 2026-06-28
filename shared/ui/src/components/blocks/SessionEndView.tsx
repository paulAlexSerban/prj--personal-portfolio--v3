import type { ReactNode } from 'react';

export interface SessionStats {
    again: number;
    hard: number;
    good: number;
    easy: number;
    totalTime: number;
}

export interface SessionEndViewProps {
    stats: SessionStats;
    subtitle: string;
    actions: ReactNode;
}

export function SessionEndView({ stats, subtitle, actions }: SessionEndViewProps) {
    const total = stats.again + stats.hard + stats.good + stats.easy;
    const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0);
    const mins = stats.totalTime / 60000;

    return (
        <>
            <div className="text-center mb-8">
                <p className="smallcaps text-sm text-[var(--slate)]">Edition Complete</p>
                <h2 className="text-6xl font-black mt-2" style={{ fontFamily: 'var(--font-display)' }}>
                    Final Word
                </h2>
                <p className="italic mt-2 text-[var(--charcoal)]">{subtitle}</p>
            </div>

            <div
                className="grid grid-cols-2 md:grid-cols-4 border-y-2 border-[var(--ink-black)] divide-x-2 divide-[var(--ink-black)] mb-8"
                style={{ fontFamily: 'var(--font-mono)' }}
            >
                {(
                    [
                        ['Again', stats.again],
                        ['Hard', stats.hard],
                        ['Good', stats.good],
                        ['Easy', stats.easy],
                    ] as const
                ).map(([l, n]) => (
                    <div key={l} className="p-4 text-center">
                        <p className="smallcaps text-[10px] text-[var(--slate)]">{l}</p>
                        <p className="text-3xl font-bold">{n}</p>
                        <p className="text-sm">{pct(n)}%</p>
                    </div>
                ))}
            </div>

            <p className="text-center smallcaps text-base text-[var(--slate)]" style={{ fontFamily: 'var(--font-mono)' }}>
                {total} cards · {mins.toFixed(1)} min · {(total / Math.max(mins, 0.1)).toFixed(1)} cards/min
            </p>

            <div className="text-center mt-8 flex justify-center gap-3">{actions}</div>
        </>
    );
}
