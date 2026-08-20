import { Stamp, stampClasses } from '@prj--personal-portfolio--v3/shared--ui';

interface QuizFlashcardSummaryProps {
    previewCount: number;
    totalQuestionCount: number;
    correctCount: number;
    quizAppHref: string;
    onRestart: () => void;
}

function plural(count: number, singular: string, pluralForm = `${singular}s`): string {
    return count === 1 ? singular : pluralForm;
}

export function QuizFlashcardSummary({ previewCount, totalQuestionCount, correctCount, quizAppHref, onRestart }: QuizFlashcardSummaryProps) {
    const pct = previewCount ? Math.round((correctCount / previewCount) * 100) : 0;
    const remaining = Math.max(0, totalQuestionCount - previewCount);

    return (
        <div className="text-center">
            <p className="smallcaps text-sm text-slate-ink">Preview complete</p>
            <h2 className="mt-2 font-display text-4xl font-black md:text-5xl">Sample wrap</h2>
            <p className="mt-2 italic text-charcoal">You finished this post&apos;s flashcard preview.</p>

            <div className="my-8 grid grid-cols-2 divide-x-2 divide-ink border-y-2 border-ink" style={{ fontFamily: 'var(--font-mono)' }}>
                <div className="p-4">
                    <p className="smallcaps text-[10px] text-slate-ink">Correct</p>
                    <p className="text-3xl font-bold">{correctCount}</p>
                    <p className="text-sm">{pct}%</p>
                </div>
                <div className="p-4">
                    <p className="smallcaps text-[10px] text-slate-ink">Cards</p>
                    <p className="text-3xl font-bold">{previewCount}</p>
                    <p className="text-sm">of {totalQuestionCount} in the full quiz</p>
                </div>
            </div>

            <p className="mx-auto max-w-xl text-base leading-relaxed text-charcoal">
                This was a sample of {previewCount} question {plural(previewCount, 'type')} from this post&apos;s full quiz - {totalQuestionCount}{' '}
                {plural(totalQuestionCount, 'question')} total
                {remaining > 0 ? `, with ${remaining} more in the app` : ''}. This flashcard preview is a demo of what you&apos;ll find in the full spaced-repetition quiz app.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <a href={quizAppHref} target="_blank" rel="noopener noreferrer" className={stampClasses('solid', 'lg')} title="Open this post's full quiz in a new tab">
                    Continue in the full quiz →
                </a>
                <Stamp variant="ghost" size="lg" onClick={onRestart} title="Replay this flashcard preview from the start">
                    Restart preview
                </Stamp>
            </div>
        </div>
    );
}
