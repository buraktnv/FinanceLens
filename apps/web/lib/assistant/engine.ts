export interface AssistantSnapshot {
  netWorthTRY: number;
  monthlySavings: number;
  monthlyExpenses: number;
}

export interface Assumptions {
  annualReturnPct: number;
  annualInflationPct: number;
  monthlySavingOverride?: number | null;
  expenseReductionPct?: number;
}

export interface ProjectionPoint {
  dateISO: string;
  portfolioTRY: number;
}

export interface ProjectionResult {
  fireNumberTRY: number;
  fireDateISO: string | null;
  yearsToFI: number | null;
  savingsRate: number;
  alreadyFI: boolean;
  series: ProjectionPoint[];
  milestones: { label: string; dateISO: string }[];
}

const MAX_MONTHS = 600;

function addMonths(iso: string, months: number): string {
  const d = new Date(iso);
  d.setUTCMonth(d.getUTCMonth() + months);
  return d.toISOString().slice(0, 10);
}

export function projectFire(
  snapshot: AssistantSnapshot,
  assumptions: Assumptions,
): ProjectionResult {
  const expenses =
    snapshot.monthlyExpenses * (1 - (assumptions.expenseReductionPct ?? 0) / 100);
  const fireNumber = (expenses * 12) / 0.04;

  const saving = Math.max(
    0,
    assumptions.monthlySavingOverride ?? snapshot.monthlySavings,
  );

  const denom = saving + snapshot.monthlyExpenses;
  const savingsRate = denom > 0 ? saving / denom : 0;

  const startDate = new Date();
  startDate.setUTCDate(1);
  const startISO = startDate.toISOString().slice(0, 10);

  const series: ProjectionPoint[] = [
    { dateISO: startISO, portfolioTRY: snapshot.netWorthTRY },
  ];

  if (
    fireNumber <= 0 ||
    snapshot.netWorthTRY >= fireNumber ||
    saving <= 0
  ) {
    const alreadyFI = fireNumber <= 0 || snapshot.netWorthTRY >= fireNumber;
    return {
      fireNumberTRY: fireNumber,
      fireDateISO: null,
      yearsToFI: null,
      savingsRate,
      alreadyFI,
      series,
      milestones: [],
    };
  }

  // Monthly real return from nominal return and inflation.
  const realMonthly =
    Math.pow((1 + assumptions.annualReturnPct / 100) / (1 + assumptions.annualInflationPct / 100), 1 / 12) - 1;

  const milestoneTargets = [0.25, 0.5, 0.75, 1].map((p) => ({
    label: `%${Math.round(p * 100)}`,
    target: fireNumber * p,
    dateISO: null as string | null,
  }));

  let portfolio = snapshot.netWorthTRY;
  let fireMonth: number | null = null;

  for (let month = 1; month < MAX_MONTHS && fireMonth === null; month++) {
    portfolio = portfolio * (1 + realMonthly) + saving;
    const dateISO = addMonths(startISO, month);
    series.push({ dateISO, portfolioTRY: portfolio });

    for (const m of milestoneTargets) {
      if (m.dateISO === null && portfolio >= m.target) {
        m.dateISO = dateISO;
      }
    }

    if (portfolio >= fireNumber) {
      fireMonth = month;
    }
  }

  return {
    fireNumberTRY: fireNumber,
    fireDateISO: fireMonth !== null ? addMonths(startISO, fireMonth) : null,
    yearsToFI: fireMonth !== null ? Number((fireMonth / 12).toFixed(1)) : null,
    savingsRate,
    alreadyFI: false,
    series,
    milestones: milestoneTargets
      .filter((m) => m.dateISO !== null)
      .map(({ label, dateISO }) => ({ label, dateISO: dateISO as string })),
  };
}
