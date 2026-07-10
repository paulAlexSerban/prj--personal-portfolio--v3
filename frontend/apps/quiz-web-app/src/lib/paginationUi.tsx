import type { PaginationControlState } from "@prj--personal-portfolio--v3/shared--ui/pagination-bar";

/** Card grids — matches blog listing page size. */
export const GRID_PAGE_SIZE = 12;

/** Tables and dense lists — matches question browser. */
export const TABLE_PAGE_SIZE = 25;

export function renderStampPrev({ disabled, onClick }: PaginationControlState) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      title="Go to the previous page"
      className="stamp stamp-ghost text-sm disabled:opacity-40"
    >
      ← Prev
    </button>
  );
}

export function renderStampNext({ disabled, onClick }: PaginationControlState) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      title="Go to the next page"
      className="stamp stamp-ghost text-sm disabled:opacity-40"
    >
      Next →
    </button>
  );
}

export const stampPaginationLabelClassName = "smallcaps text-[10px] text-[var(--slate)]";
