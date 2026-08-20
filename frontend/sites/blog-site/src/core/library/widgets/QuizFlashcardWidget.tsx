import { useState } from 'react';
import { QuestionRenderer } from '@prj--personal-portfolio--v3/shared--ui/blocks';
import { Stamp } from '@prj--personal-portfolio--v3/shared--ui';

import type { WidgetQuestion } from '@/lib/quizWidgetTypes.ts';

import { QuizFlashcardSummary } from './QuizFlashcardSummary';

export interface QuizFlashcardWidgetProps {
    slug: string;
    questions: WidgetQuestion[];
    totalQuestionCount: number;
    quizAppHref: string;
}

type Phase = 'active' | 'summary';
type SelfReport = 'correct' | 'incorrect' | null;

interface CardResult {
    slug: string;
    typeLabel: string;
    correct: boolean;
}

export function QuizFlashcardWidget({ slug, questions, totalQuestionCount, quizAppHref }: QuizFlashcardWidgetProps) {
    const [index, setIndex] = useState(0);
    const [phase, setPhase] = useState<Phase>('active');
    const [revealed, setRevealed] = useState(false);
    const [gradedCorrect, setGradedCorrect] = useState<boolean | null>(null);
    const [selfReport, setSelfReport] = useState<SelfReport>(null);
    const [results, setResults] = useState<CardResult[]>([]);

    if (questions.length === 0) return null;

    const current = questions[index]!;
    const isLast = index >= questions.length - 1;
    const isSelfGraded = current.gradingMode === 'self';
    const canAdvance = revealed && (isSelfGraded ? selfReport !== null : gradedCorrect !== null);

    function resetCard() {
        setRevealed(false);
        setGradedCorrect(null);
        setSelfReport(null);
    }

    function restart() {
        setIndex(0);
        setPhase('active');
        setResults([]);
        resetCard();
    }

    function advance() {
        if (!canAdvance) return;
        const correct = isSelfGraded ? selfReport === 'correct' : gradedCorrect === true;
        const nextResults = [...results, { slug: current.slug, typeLabel: current.typeLabel, correct }];
        setResults(nextResults);
        if (isLast) {
            setPhase('summary');
            return;
        }
        setIndex((i) => i + 1);
        resetCard();
    }

    const correctCount = results.filter((r) => r.correct).length;

    return (
        <section id="quiz-widget-mount" className="quiz-widget-slot mt-12" data-quiz-widget data-post-slug={slug} aria-label="Flashcard quiz preview">
            {phase === 'summary' ? (
                <QuizFlashcardSummary
                    previewCount={questions.length}
                    totalQuestionCount={totalQuestionCount}
                    correctCount={correctCount}
                    quizAppHref={quizAppHref}
                    onRestart={restart}
                />
            ) : (
                <>
                    <p className="smallcaps mb-3 text-[10px] text-slate-ink">
                        A quick flashcard preview - one example of each question type in this post. This is a demo of what you&apos;ll find in the full quiz app.
                    </p>
                    <div className="mb-4 flex items-center justify-between text-xs" style={{ fontFamily: 'var(--font-mono)' }}>
                        <span className="smallcaps">
                            Flashcard preview · {index + 1} / {questions.length}
                        </span>
                        <span className="smallcaps border border-rule px-2 py-0.5 text-[10px]">{current.typeLabel}</span>
                    </div>
                    <div className="relative mb-6 h-1 border-y-2 border-ink">
                        <div
                            className="absolute inset-y-0 left-0 bg-ink"
                            style={{
                                width: `${(index / Math.max(questions.length, 1)) * 100}%`,
                                height: '2px',
                            }}
                        />
                    </div>
                    <article className="grain flex min-h-105 flex-col border-[3px] border-ink bg-aged p-3 md:p-8">
                        <QuestionRenderer
                            key={current.slug}
                            question={current}
                            revealed={revealed}
                            onReveal={() => setRevealed(true)}
                            onGraded={setGradedCorrect}
                            onRetry={() => {
                                setRevealed(false);
                                setGradedCorrect(null);
                                setSelfReport(null);
                            }}
                        />
                        {revealed && (
                            <div className="mt-auto pt-8">
                                {isSelfGraded && (
                                    <div className="mb-4 grid grid-cols-2 gap-2">
                                        <Stamp
                                            variant={selfReport === 'correct' ? 'solid' : 'ghost'}
                                            className="w-full"
                                            onClick={() => setSelfReport('correct')}
                                            title="You recalled this well"
                                        >
                                            Got it
                                        </Stamp>
                                        <Stamp
                                            variant={selfReport === 'incorrect' ? 'solid' : 'ghost'}
                                            className="w-full"
                                            onClick={() => setSelfReport('incorrect')}
                                            title="You missed this one"
                                        >
                                            Missed it
                                        </Stamp>
                                    </div>
                                )}
                                <div className="text-center">
                                    <Stamp
                                        size="lg"
                                        disabled={!canAdvance}
                                        onClick={advance}
                                        title={
                                            canAdvance
                                                ? isLast
                                                    ? 'See your preview results'
                                                    : 'Go to the next sample card'
                                                : isSelfGraded
                                                  ? 'Tell us whether you got it before continuing'
                                                  : 'Submit an answer first'
                                        }
                                    >
                                        {isLast ? 'See results' : 'Next card'}
                                    </Stamp>
                                </div>
                            </div>
                        )}
                    </article>
                </>
            )}
        </section>
    );
}
