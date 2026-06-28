import type { ReactNode } from 'react';
import { Stamp } from '../ui/Stamp';

export interface ScopeCounts {
    newTotal: number;
    learningDue: number;
    reviewDue: number;
}

export interface NothingDueViewProps {
    counts: ScopeCounts;
    actions: ReactNode;
    /** When provided, offers a "study ahead" button that ignores daily caps. */
    onStudyAhead?: () => void;
}

export function NothingDueView({ counts, actions, onStudyAhead }: NothingDueViewProps) {
    const totalAvailable = counts.newTotal + counts.learningDue + counts.reviewDue;
    const cappedByLimit = totalAvailable > 0;

    return (
        <>
            <div className="text-center mb-8">
                <p className="smallcaps text-sm text-[var(--slate)]">Nothing Queued</p>
                <h2 className="text-6xl font-black mt-2" style={{ fontFamily: 'var(--font-display)' }}>
                    All Clear
                </h2>
                <p className="italic mt-2 text-[var(--charcoal)]">
                    {cappedByLimit
                        ? "You've reached today's study limit for this scope. More cards unlock tomorrow, or raise the daily limits in Settings."
                        : 'No cards are due right now. Add more posts or come back when reviews are scheduled.'}
                </p>
            </div>

            <div className="grid grid-cols-3 border-y-2 border-[var(--ink-black)] divide-x-2 divide-[var(--ink-black)] mb-8" style={{ fontFamily: 'var(--font-mono)' }}>
                {(
                    [
                        ['New (untapped)', counts.newTotal],
                        ['Learning due', counts.learningDue],
                        ['Reviews due', counts.reviewDue],
                    ] as const
                ).map(([l, n]) => (
                    <div key={l} className="p-4 text-center">
                        <p className="smallcaps text-[10px] text-[var(--slate)]">{l}</p>
                        <p className="text-3xl font-bold">{n}</p>
                    </div>
                ))}
            </div>

            {cappedByLimit && onStudyAhead && (
                <div className="text-center mb-6">
                    <Stamp onClick={onStudyAhead} variant="solid" title="Ignore today's daily limits and study upcoming cards now">
                        Study ahead ({totalAvailable})
                    </Stamp>
                    <p className="smallcaps text-[10px] text-[var(--slate)] mt-2" style={{ fontFamily: 'var(--font-mono)' }}>
                        Ignores today's limits for this session. Or raise the caps in Settings.
                    </p>
                </div>
            )}

            <div className="text-center mt-4 flex justify-center gap-3">{actions}</div>
        </>
    );
}
