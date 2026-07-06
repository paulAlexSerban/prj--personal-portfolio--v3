import type { ReactNode } from 'react';
import type { ExportedQuestion } from '@prj--personal-portfolio--v3/tools--quiz-export/contract';
import { QuestionRenderer } from './QuestionRenderer';
import { Stamp } from '../ui/Stamp';

export type Rating = 1 | 2 | 3 | 4;

const RATING_HINTS: Record<Rating, string> = {
    1: 'You forgot - reschedule this card soon (Again)',
    2: 'Recalled with difficulty - shorter interval (Hard)',
    3: 'Recalled correctly - normal interval (Good)',
    4: 'Recalled easily - longer interval (Easy)',
};

export interface StudyCardViewData {
    cardType: string;
    easeFactor: number;
    interval: number;
}

export interface StudyCardProps {
    card: StudyCardViewData;
    question: ExportedQuestion;
    revealed: boolean;
    gradedCorrect: boolean | null;
    progress: { done: number; total: number };
    ratingPreview: (rating: Rating) => string;
    ratingDisabled: (rating: Rating) => boolean;
    exitSlot: ReactNode;
    onReveal: () => void;
    onGraded: (correct: boolean | null) => void;
    onRetry: () => void;
    onRate: (rating: Rating) => void;
    onBury: () => void;
    onSuspend: () => void;
    onIgnore: () => void;
    /** External link to the source blog post (quiz app supplies URL). */
    blogPostHref?: string;
}

export function StudyCard({
    card,
    question,
    revealed,
    gradedCorrect,
    progress,
    ratingPreview,
    ratingDisabled,
    exitSlot,
    onReveal,
    onGraded,
    onRetry,
    onRate,
    onBury,
    onSuspend,
    onIgnore,
    blogPostHref,
}: StudyCardProps) {
    const { done, total } = progress;

    return (
        <>
            <div className="flex items-center justify-between mb-4 text-xs" style={{ fontFamily: 'var(--font-mono)' }}>
                {exitSlot}
                <span>
                    {done + 1} / {total}
                </span>
                <div className="flex items-center gap-3">
                    <button type="button" onClick={onBury} className="smallcaps" title="Skip this card for the rest of this session">
                        Bury
                    </button>
                    <button type="button" onClick={onSuspend} className="smallcaps" title="Exclude from all queues until you unsuspend it">
                        Suspend
                    </button>
                    <button type="button" onClick={onIgnore} className="smallcaps" title="Exclude this question from all future sessions">
                        Ignore
                    </button>
                </div>
            </div>

            {/* Screen-reader announcement for reveal + auto-grade result. */}
            <div aria-live="polite" className="sr-only">
                {revealed ? (gradedCorrect === null ? 'Answer revealed.' : gradedCorrect ? 'Correct.' : 'Incorrect.') : ''}
            </div>

            <div className="border-y-2 border-[var(--ink-black)] h-1 mb-6 relative">
                <div
                    className="absolute inset-y-0 left-0 bg-[var(--ink-black)]"
                    style={{
                        width: `${(done / Math.max(total, 1)) * 100}%`,
                        height: '2px',
                    }}
                />
            </div>

            <article className="bg-[var(--aged-white)] border-[3px] border-[var(--ink-black)] grain p-3 md:p-8 min-h-[460px] flex flex-col">
                <p className="smallcaps text-[10px] text-[var(--slate)] mb-1 md:mb-4">
                    {card.cardType} card · ease {card.easeFactor.toFixed(2)} · ivl {card.interval}d
                </p>

                <QuestionRenderer key={question.slug} question={question} revealed={revealed} onReveal={onReveal} onGraded={onGraded} onRetry={onRetry} />

                {revealed && (
                    <div className="mt-auto pt-8">
                        {gradedCorrect === false && <p className="smallcaps text-[10px] text-[var(--slate)] mb-2 text-center">Wrong answer - rate Again or Hard</p>}
                        <div className="grid grid-cols-4 gap-2">
                            {(
                                [
                                    [1, 'Again'],
                                    [2, 'Hard'],
                                    [3, 'Good'],
                                    [4, 'Easy'],
                                ] as [Rating, string][]
                            ).map(([r, label]) => {
                                const disabled = ratingDisabled(r);
                                return (
                                    <div key={r} className="text-center">
                                        <Stamp
                                            onClick={() => onRate(r)}
                                            disabled={disabled}
                                            className="w-full"
                                            variant={r === 3 ? 'solid' : 'ghost'}
                                            title={disabled ? 'Locked - you answered incorrectly, rate Again or Hard' : RATING_HINTS[r]}
                                        >
                                            {label}
                                        </Stamp>
                                        <p className="smallcaps text-[10px] text-[var(--slate)] mt-1" style={{ fontFamily: 'var(--font-mono)' }}>
                                            {disabled ? '-' : `${ratingPreview(r)} · ${r}`}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                        <p className="smallcaps text-sm text-[var(--slate)] mt-3 text-center italic" title="Content is read-only - edit in the source content repo">
                            Read-only · content edited in source
                            {blogPostHref && (
                                <>
                                    {' · '}
                                    <a
                                        href={blogPostHref}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="underline not-italic"
                                        title="Open the source blog post in a new tab"
                                    >
                                        Read source post ↗
                                    </a>
                                </>
                            )}
                        </p>
                    </div>
                )}
            </article>
        </>
    );
}
