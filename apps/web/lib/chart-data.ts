import type { DashboardOverview } from "./api";
import { getExpenseCategoryLabel } from "./labels";

export type AllocationBreakdown = DashboardOverview["breakdown"];

export interface ChartSlice {
  [key: string]: string | number;
  key: string;
  label: string;
  value: number;
}

type AllocatableKey = Exclude<keyof AllocationBreakdown, "loans">;

const ALLOCATION_ORDER: Array<{ key: AllocatableKey; label: string }> = [
  { key: "cash", label: "Nakit" },
  { key: "gold", label: "Altin" },
  { key: "silver", label: "Gumus" },
  { key: "stocks", label: "Hisse" },
  { key: "etfs", label: "ETF" },
  { key: "eurobonds", label: "Eurobond" },
];

export function buildAllocationSlices(
  breakdown: AllocationBreakdown | null | undefined,
): ChartSlice[] {
  if (!breakdown) return [];
  return ALLOCATION_ORDER.map(({ key, label }) => ({
    key,
    label,
    value: Number(breakdown[key]?.value ?? 0),
  }))
    .filter((slice) => Number.isFinite(slice.value) && slice.value > 0)
    .sort((a, b) => b.value - a.value);
}

export function buildCategoryRows(
  byCategory: Record<string, number> | null | undefined,
  limit = 8,
): ChartSlice[] {
  if (!byCategory) return [];
  return Object.entries(byCategory)
    .map(([key, raw]) => ({
      key,
      label: getExpenseCategoryLabel(key),
      value: Number(raw),
    }))
    .filter((row) => Number.isFinite(row.value) && row.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

export function sumSlices(slices: ChartSlice[]): number {
  return slices.reduce((sum, slice) => sum + slice.value, 0);
}
