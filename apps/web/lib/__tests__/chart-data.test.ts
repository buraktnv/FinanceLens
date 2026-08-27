import { describe, expect, it } from "vitest";
import {
  buildAllocationSlices,
  buildCategoryRows,
  sumSlices,
} from "../chart-data";

const fullBreakdown = {
  stocks: { count: 2, value: 50000 },
  etfs: { count: 0, value: 0 },
  eurobonds: { count: 1, value: 100000 },
  cash: { count: 3, value: 25000 },
  gold: { count: 0, value: 0 },
  silver: { count: 0, value: 0 },
  loans: { count: 0, balance: 0 },
};

describe("buildAllocationSlices", () => {
  it("returns only non-zero slices sorted descending", () => {
    const slices = buildAllocationSlices(fullBreakdown);
    expect(slices.map((slice) => slice.key)).toEqual([
      "eurobonds",
      "stocks",
      "cash",
    ]);
    expect(slices.map((slice) => slice.label)).toEqual([
      "Eurobond",
      "Hisse",
      "Nakit",
    ]);
  });

  it("sums slices to the total portfolio value", () => {
    expect(sumSlices(buildAllocationSlices(fullBreakdown))).toBe(175000);
  });

  it("returns empty array when all values are zero", () => {
    const zeroBreakdown = {
      stocks: { count: 0, value: 0 },
      etfs: { count: 0, value: 0 },
      eurobonds: { count: 0, value: 0 },
      cash: { count: 0, value: 0 },
      gold: { count: 0, value: 0 },
      silver: { count: 0, value: 0 },
      loans: { count: 0, balance: 0 },
    };
    expect(buildAllocationSlices(zeroBreakdown)).toEqual([]);
  });

  it("handles missing breakdown", () => {
    expect(buildAllocationSlices(undefined)).toEqual([]);
    expect(buildAllocationSlices(null)).toEqual([]);
  });
});

describe("buildCategoryRows", () => {
  it("sorts descending and limits to top 8", () => {
    const byCategory: Record<string, number> = {};
    for (let index = 1; index <= 10; index += 1) {
      byCategory[`CAT_${index}`] = index * 100;
    }
    const rows = buildCategoryRows(byCategory);
    expect(rows).toHaveLength(8);
    expect(rows[0]?.value).toBe(1000);
    expect(rows[7]?.value).toBe(300);
  });

  it("falls back to Diger label for unknown categories and filters non-positive values", () => {
    const rows = buildCategoryRows({ UNKNOWN_KEY: 50, EMPTY: 0, NEGATIVE: -5 });
    expect(rows).toHaveLength(1);
    expect(rows[0]?.label).toBe("Diger");
  });

  it("maps known categories to Turkish labels", () => {
    const rows = buildCategoryRows({ RENT: 12000, GROCERIES: 4500 });
    expect(rows.map((row) => row.label)).toEqual(["Kira", "Market"]);
  });

  it("handles missing input", () => {
    expect(buildCategoryRows(undefined)).toEqual([]);
    expect(buildCategoryRows(null)).toEqual([]);
  });
});
