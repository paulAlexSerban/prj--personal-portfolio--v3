import type { ReactNode } from 'react';
import type { ExportedQuestion } from '@prj--personal-portfolio--v3/tools--quiz-export/contract';
import { CardRenderer } from './CardRenderer';
import { Modal } from '../ui/Modal';
import { Stamp } from '../ui/Stamp';

/** Minimal card state for preview display — app passes precomputed values. */
export interface CardPreviewData {
    interval: number;
    easeFactor: number;
    dueDate: string;
    lapses: number;
}

export interface QuestionPreviewProps {
    question: ExportedQuestion;
    open: boolean;
    card?: CardPreviewData;
    stateLabel: string;
    isIgnored: boolean;
    isSuspended: boolean;
    studyAction: ReactNode;
    onIgnoreToggle: () => void;
    onSuspendToggle: () => void;
    onReset: () => void;
    onClose: () => void;
    renderTag?: (tag: string) => ReactNode;
}

export function QuestionPreview({
    question,
    open,
    card,
    stateLabel,
    isIgnored,
    isSuspended,
    studyAction,
    onIgnoreToggle,
    onSuspendToggle,
    onReset,
    onClose,
    renderTag,
}: QuestionPreviewProps) {
    return (
        <Modal open={open} onClose={onClose} title="Question Preview" wide>
            <PreviewBody question={question} card={card} stateLabel={stateLabel} isIgnored={isIgnored} isSuspended={isSuspended} renderTag={renderTag} />

            <div className="rule my-6" />

            <div className="flex flex-wrap gap-2">
                {studyAction}
                <Stamp
                    variant="ghost"
                    title={isIgnored ? 'Include this question in study sessions again' : 'Exclude this question from all future sessions'}
                    onClick={onIgnoreToggle}
                >
                    {isIgnored ? 'Unignore' : 'Ignore'}
                </Stamp>
                <Stamp variant="ghost" title={isSuspended ? 'Return this card to study queues' : 'Exclude this card from queues until you unsuspend it'} onClick={onSuspendToggle}>
                    {isSuspended ? 'Unsuspend' : 'Suspend'}
                </Stamp>
                <Stamp variant="ghost" title="Reset this card's scheduling progress" onClick={onReset}>
                    Reset Progress
                </Stamp>
                <button type="button" onClick={onClose} title="Close this preview" className="smallcaps underline text-base ml-auto">
                    Close
                </button>
            </div>
        </Modal>
    );
}

function PreviewBody({
    question,
    card,
    stateLabel,
    isIgnored,
    isSuspended,
    renderTag,
}: {
    question: ExportedQuestion;
    card?: CardPreviewData;
    stateLabel: string;
    isIgnored: boolean;
    isSuspended: boolean;
    renderTag?: (tag: string) => ReactNode;
}) {
    return (
        <div className="space-y-6">
            <MetaRow question={question} card={card} stateLabel={stateLabel} isIgnored={isIgnored} isSuspended={isSuspended} renderTag={renderTag} />

            <section>
                <p className="smallcaps text-[10px] text-[var(--slate)] mb-2">Stem</p>
                <CardRenderer html={question.stem} compiledHtml={question.stemHtml} reveal className="text-lg leading-snug" />
            </section>

            <AnswerSection question={question} />

            {question.explanation && (
                <section>
                    <p className="smallcaps text-[10px] text-[var(--slate)] mb-2">Explanation</p>
                    <CardRenderer html={question.explanation} compiledHtml={question.explanationHtml} reveal />
                </section>
            )}
        </div>
    );
}

function MetaRow({
    question,
    card,
    stateLabel,
    isIgnored,
    isSuspended,
    renderTag,
}: {
    question: ExportedQuestion;
    card?: CardPreviewData;
    stateLabel: string;
    isIgnored: boolean;
    isSuspended: boolean;
    renderTag?: (tag: string) => ReactNode;
}) {
    return (
        <dl className="grid grid-cols-2 md:grid-cols-4 gap-3 text-base border-2 border-[var(--ink-black)] p-3" style={{ fontFamily: 'var(--font-mono)' }}>
            <MetaItem label="Format" value={question.answerFormat.replace(/_/g, ' ')} />
            <MetaItem label="Difficulty" value={question.difficulty} />
            <MetaItem label="State" value={stateLabel} />
            <MetaItem label="Grading" value={question.gradingMode} />
            {card && (
                <>
                    <MetaItem label="Interval" value={`${card.interval}d`} />
                    <MetaItem label="Ease" value={card.easeFactor.toFixed(2)} />
                    <MetaItem label="Due" value={card.dueDate} />
                    <MetaItem label="Lapses" value={String(card.lapses)} />
                </>
            )}
            {(isIgnored || isSuspended) && (
                <div className="col-span-full">
                    <span className="smallcaps text-[10px] text-[var(--slate)]">Status · </span>
                    <span className="font-bold">{[isIgnored && 'Ignored', isSuspended && 'Suspended'].filter(Boolean).join(' · ')}</span>
                </div>
            )}
            {question.tags.length > 0 && (
                <div className="col-span-full flex flex-wrap gap-2 pt-1">
                    {question.tags.map((tag) =>
                        renderTag ? (
                            renderTag(tag)
                        ) : (
                            <span key={tag} className="text-[14px] border border-[var(--ink-black)] px-2 py-0.5">
                                {tag.toLowerCase()}
                            </span>
                        )
                    )}
                </div>
            )}
        </dl>
    );
}

function MetaItem({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <dt className="smallcaps text-[12px] text-[var(--slate)]">{label}</dt>
            <dd className="font-bold capitalize">{value}</dd>
        </div>
    );
}

function AnswerSection({ question }: { question: ExportedQuestion }) {
    if (question.answerFormat === 'free_text') {
        return (
            <section>
                <p className="smallcaps text-[10px] text-[var(--slate)] mb-2">Answer</p>
                <p className="italic text-[var(--charcoal)] text-base">Self-graded — see explanation below.</p>
            </section>
        );
    }

    if (question.answerFormat === 'true_false') {
        return (
            <section>
                <p className="smallcaps text-[10px] text-[var(--slate)] mb-2">Correct Answer</p>
                <p className="font-bold border-2 border-[var(--ink-black)] bg-[var(--highlight)] px-4 py-3 inline-block">{question.answer ? 'True' : 'False'}</p>
            </section>
        );
    }

    if (question.answerFormat === 'multiple_choice' || question.answerFormat === 'multiple_select') {
        return (
            <section>
                <p className="smallcaps text-[10px] text-[var(--slate)] mb-2">{question.answerFormat === 'multiple_select' ? 'Correct Options' : 'Options (correct marked)'}</p>
                <ul className="flex flex-col gap-2">
                    {question.options.map((opt) => (
                        <li
                            key={opt.key}
                            className={`border-2 px-4 py-3 text-left ${
                                opt.isCorrect ? 'border-[var(--ink-black)] bg-[var(--highlight)] font-bold' : 'border-[var(--column-rule)] opacity-80'
                            }`}
                        >
                            <span className="smallcaps text-[10px] mr-2 text-[var(--slate)]">{opt.key}</span>
                            <CardRenderer html={opt.label} compiledHtml={opt.labelHtml} inline />
                            {opt.isCorrect && <span className="smallcaps text-[10px] ml-2 text-[var(--slate)]">· correct</span>}
                        </li>
                    ))}
                </ul>
            </section>
        );
    }

    return null;
}
