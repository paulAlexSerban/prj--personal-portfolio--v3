import { useState } from 'react';
import { Modal } from '@prj--personal-portfolio--v3/shared--ui';

import {
    formatAxisLabel,
    getAxisTerm,
    getAxisTerms,
    projectAxisHint,
    type AxisTerm,
} from '@/lib/project-axis.ts';

interface Props {
    scope: string;
    maturity: string;
    className?: string;
}

const labelButtonClass =
    'kicker appearance-none border-0 bg-transparent p-0 text-[12px] text-slate-ink underline decoration-dotted decoration-current underline-offset-4 hover:text-ink hover:decoration-solid cursor-pointer';

export function AxisBadge({ scope, maturity, className }: Props) {
    const [activeId, setActiveId] = useState<string | null>(null);
    const scopeTerm = getAxisTerm(scope);
    const maturityTerm = getAxisTerm(maturity);
    const active = activeId ? getAxisTerm(activeId) : undefined;
    const hint = projectAxisHint(scope, maturity);

    return (
        <div className={className}>
            <p className="m-0 flex flex-wrap items-baseline gap-x-1">
                <AxisLabel term={scopeTerm} fallback={scope} onOpen={setActiveId} expanded={activeId === scope} />
                <span className="kicker text-[12px]" aria-hidden="true">
                    -
                </span>
                <AxisLabel term={maturityTerm} fallback={maturity} onOpen={setActiveId} expanded={activeId === maturity} />
            </p>
            <p className="deck m-0 mt-1 text-[12px] leading-snug">{hint}</p>
            <AxisGlossaryModal term={active} onClose={() => setActiveId(null)} onSelect={setActiveId} />
        </div>
    );
}

function AxisLabel({
    term,
    fallback,
    onOpen,
    expanded,
}: {
    term: AxisTerm | undefined;
    fallback: string;
    onOpen: (id: string) => void;
    expanded: boolean;
}) {
    if (!term) {
        return <span className="kicker text-[12px]">{formatAxisLabel(fallback)}</span>;
    }
    return (
        <button
            type="button"
            className={labelButtonClass}
            aria-haspopup="dialog"
            aria-expanded={expanded}
            onClick={() => onOpen(term.id)}
        >
            {term.label}
        </button>
    );
}

function AxisGlossaryModal({
    term,
    onClose,
    onSelect,
}: {
    term: AxisTerm | undefined;
    onClose: () => void;
    onSelect: (id: string) => void;
}) {
    if (!term) return null;

    const siblings = getAxisTerms(term.axis);
    const axisName = term.axis === 'scope' ? 'Scope axis' : 'Maturity axis';

    return (
        <Modal open onClose={onClose} title={term.label}>
            <p className="kicker m-0 mb-3 text-[11px]">{axisName}</p>
            <p className="m-0 text-sm font-bold leading-snug">{term.lead}</p>
            <p className="mt-3 text-sm leading-relaxed text-charcoal">{term.body}</p>
            <p className="mt-4 text-sm leading-relaxed text-charcoal">{term.contrast}</p>
            <div className="rule-thin my-4" />
            <p className="kicker mb-2 text-[11px]">Also on this axis</p>
            <div className="flex flex-wrap gap-x-3 gap-y-1">
                {siblings.map((sibling) =>
                    sibling.id === term.id ? (
                        <span key={sibling.id} className="kicker text-[12px] font-bold text-ink" aria-current="true">
                            {sibling.label}
                        </span>
                    ) : (
                        <button
                            key={sibling.id}
                            type="button"
                            className={labelButtonClass}
                            onClick={() => onSelect(sibling.id)}
                        >
                            {sibling.label}
                        </button>
                    ),
                )}
            </div>
        </Modal>
    );
}
