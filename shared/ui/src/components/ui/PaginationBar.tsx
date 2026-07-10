import type { ReactNode } from 'react';

import { cn } from '../../lib/utils';

export interface PaginationControlState {
    disabled: boolean;
    onClick: () => void;
}

export interface PaginationBarProps {
    page: number;
    pages: number;
    total: number;
    onPageChange: (page: number) => void;
    itemLabel?: string;
    className?: string;
    labelClassName?: string;
    renderPrev: (state: PaginationControlState) => ReactNode;
    renderNext: (state: PaginationControlState) => ReactNode;
}

/** Prev/Next pager with shared copy and a11y; visuals supplied via render props. */
export function PaginationBar({ page, pages, total, onPageChange, itemLabel = 'total', className, labelClassName, renderPrev, renderNext }: PaginationBarProps) {
    if (pages <= 1) return null;

    const prevDisabled = page <= 1;
    const nextDisabled = page >= pages;

    return (
        <div className={cn('flex items-center justify-between', className)} role="navigation" aria-label="Pagination">
            <span className={labelClassName}>
                Page {page} of {pages} · {total} {itemLabel}
            </span>
            <div className="flex gap-2">
                {renderPrev({
                    disabled: prevDisabled,
                    onClick: () => {
                        if (!prevDisabled) onPageChange(page - 1);
                    },
                })}
                {renderNext({
                    disabled: nextDisabled,
                    onClick: () => {
                        if (!nextDisabled) onPageChange(page + 1);
                    },
                })}
            </div>
        </div>
    );
}
