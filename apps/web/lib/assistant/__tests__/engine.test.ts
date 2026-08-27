import { describe, expect, it } from "vitest";
import {
  projectFire,
  type AssistantSnapshot,
} from "../engine";

const base: AssistantSnapshot = {
  netWorthTRY: 10_000,
  monthlySavings: 5_000,
  monthlyExpenses: 20_000,
};

const assumptions = { annualReturnPct: 30, annualInflationPct: 25 };

describe("projectFire", () => {
  it("computes FIRE number from expenses via the 4% rule", () => {
    const r = projectFire(base, assumptions);
    expect(r.fireNumberTRY).toBeCloseTo(20_000 * 12 / 0.04, 6);
    expect(r.alreadyFI).toBe(false);
    expect(r.fireDateISO).not.toBeNull();
    expect(r.yearsToFI).toBeGreaterThan(0);
  });

  it("computes savings rate and guards divide-by-zero", () => {
    expect(projectFire(base, assumptions).savingsRate).toBeCloseTo(5_000 / 25_000, 6);
    const r = projectFire({ ...base, monthlySavings: 0, monthlyExpenses: 0 }, assumptions);
    expect(r.savingsRate).toBe(0);
  });

  it("compounds month by month with real return", () => {
    const r = projectFire(base, assumptions);
    const realMonthly = Math.pow(1.30 / 1.25, 1 / 12) - 1;
    const second = base.netWorthTRY * (1 + realMonthly) + 5_000;
    expect(r.series[1]!.portfolioTRY).toBeCloseTo(second, 4);
    expect(r.series[0]!.portfolioTRY).toBe(base.netWorthTRY);
  });

  it("emits ISO dates in month increments", () => {
    const r = projectFire(base, assumptions);
    expect(new Date(r.series[0]!.dateISO).getUTCFullYear()).toBeGreaterThan(2000);
    const a = new Date(r.series[3]!.dateISO);
    const b = new Date(r.series[4]!.dateISO);
    expect((b.getTime() - a.getTime()) / 86_400_000).toBeCloseTo(30.44, 0);
  });

  it("marks already-FI when portfolio exceeds the fire number", () => {
    const r = projectFire(
      { netWorthTRY: 7_000_000, monthlySavings: 5_000, monthlyExpenses: 20_000 },
      assumptions,
    );
    expect(r.alreadyFI).toBe(true);
    expect(r.fireDateISO).toBeNull();
    expect(r.yearsToFI).toBeNull();
  });

  it("handles negative net worth before converging", () => {
    const r = projectFire(
      { netWorthTRY: -100_000, monthlySavings: 5_000, monthlyExpenses: 20_000 },
      assumptions,
    );
    expect(r.series[0]!.portfolioTRY).toBe(-100_000);
    expect(r.fireDateISO).not.toBeNull();
  });

  it("treats zero expenses as immediately free", () => {
    const r = projectFire(
      { netWorthTRY: 1_000, monthlySavings: 5_000, monthlyExpenses: 0 },
      assumptions,
    );
    expect(r.fireNumberTRY).toBe(0);
    expect(r.alreadyFI).toBe(true);
  });

  it("respects the monthly saving override", () => {
    const plain = projectFire(base, { ...assumptions, monthlySavingOverride: null });
    const overridden = projectFire(base, { ...assumptions, monthlySavingOverride: 15_000 });
    expect(overridden.yearsToFI!).toBeLessThan(plain.yearsToFI!);
  });

  it("lowers the fire number when expenses are reduced", () => {
    const plain = projectFire(base, assumptions);
    const reduced = projectFire(base, { ...assumptions, expenseReductionPct: 20 });
    expect(reduced.fireNumberTRY).toBeCloseTo(plain.fireNumberTRY * 0.8, 6);
  });

  it("caps the series at 600 months", () => {
    const r = projectFire(
      { netWorthTRY: 100, monthlySavings: 1, monthlyExpenses: 50_000 },
      { annualReturnPct: 0, annualInflationPct: 0 },
    );
    expect(r.series.length).toBeLessThanOrEqual(600);
    expect(r.fireDateISO).toBeNull();
  });
});
