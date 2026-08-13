import { PaginationBar } from '@prj--personal-portfolio--v3/shared--ui/pagination-bar';

interface Props {
    page: number;
    pages: number;
    total: number;
    onPageChange: (page: number) => void;
    itemLabel?: string;
}

export function NewsPagination({ page, pages, total, onPageChange, itemLabel = 'articles' }: Props) {
    return (
        <PaginationBar
            page={page}
            pages={pages}
            total={total}
            onPageChange={onPageChange}
            itemLabel={itemLabel}
            labelClassName="kicker text-[11px]"
            renderPrev={({ disabled, onClick }) =>
                disabled ? (
                    <span className="stamp stamp-ghost px-3 py-1.5 text-sm opacity-40" aria-disabled="true">
                        ← Prev
                    </span>
                ) : (
                    <button type="button" className="stamp stamp-ghost appearance-none px-3 py-1.5 text-sm" onClick={onClick}>
                        ← Prev
                    </button>
                )
            }
            renderNext={({ disabled, onClick }) =>
                disabled ? (
                    <span className="stamp stamp-ghost px-3 py-1.5 text-sm opacity-40" aria-disabled="true">
                        Next &gt;
                    </span>
                ) : (
                    <button type="button" className="stamp stamp-ghost appearance-none px-3 py-1.5 text-sm" onClick={onClick}>
                        Next &gt;
                    </button>
                )
            }
        />
    );
}
