import { describe, it, expect } from "vitest";
import { clampPage, paginate, totalPages } from "./pagination";

describe("paginate", () => {
  const items = [1, 2, 3, 4, 5];

  it("returns the first page slice", () => {
    expect(paginate(items, 1, 2)).toEqual([1, 2]);
  });

  it("returns a middle page slice", () => {
    expect(paginate(items, 2, 2)).toEqual([3, 4]);
  });

  it("returns an empty slice when the page is out of range", () => {
    expect(paginate(items, 10, 2)).toEqual([]);
  });
});

describe("totalPages", () => {
  it("ceil-divides item count by page size", () => {
    expect(totalPages(5, 2)).toBe(3);
  });

  it("returns 1 when there are zero items", () => {
    expect(totalPages(0, 12)).toBe(1);
  });

  it("returns 1 when count is an exact multiple of page size", () => {
    expect(totalPages(12, 12)).toBe(1);
  });
});

describe("clampPage", () => {
  it("returns the page when it is in range", () => {
    expect(clampPage(2, 5)).toBe(2);
  });

  it("clamps values below 1 to 1", () => {
    expect(clampPage(0, 5)).toBe(1);
    expect(clampPage(-3, 5)).toBe(1);
  });

  it("clamps values above the max page", () => {
    expect(clampPage(999, 5)).toBe(5);
  });

  it("returns 1 for non-finite input", () => {
    expect(clampPage(NaN, 5)).toBe(1);
    expect(clampPage(Infinity, 5)).toBe(1);
  });

  it("returns 1 when pages is 0", () => {
    expect(clampPage(3, 0)).toBe(1);
  });
});
