import { PaginationBar } from '@prj--personal-portfolio--v3/shared--ui/pagination-bar';

interface Props {
    page: number;
    pages: number;
    total: number;
    prevHref?: string;
    nextHref?: string;
    itemLabel?: string;
}

export function NewsPagination({ page, pages, total, prevHref, nextHref, itemLabel = 'articles' }: Props) {
    return (
        <PaginationBar
            page={page}
            pages={pages}
            total={total}
            onPageChange={() => {}}
            itemLabel={itemLabel}
            labelClassName="kicker text-[11px]"
            renderPrev={({ disabled }) =>
                disabled || !prevHref ? (
                    <span className="stamp stamp-ghost px-3 py-1.5 text-sm opacity-40" aria-disabled="true">
                        ← Prev
                    </span>
                ) : (
                    <a className="stamp stamp-ghost px-3 py-1.5 text-sm no-underline" href={prevHref}>
                        ← Prev
                    </a>
                )
            }
            renderNext={({ disabled }) =>
                disabled || !nextHref ? (
                    <span className="stamp stamp-ghost px-3 py-1.5 text-sm opacity-40" aria-disabled="true">
                        Next →
                    </span>
                ) : (
                    <a className="stamp stamp-ghost px-3 py-1.5 text-sm no-underline" href={nextHref}>
                        Next →
                    </a>
                )
            }
        />
    );
}
