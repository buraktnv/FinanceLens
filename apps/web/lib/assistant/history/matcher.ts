export interface HistoryEvent {
  id: string;
  region: "TR" | "US" | "GLOBAL";
  year: number;
  title: string;
  type: "crisis" | "boom" | "stagflation";
  /** Peak-to-trough portfolio drawdown, percent (negative = loss). */
  drawdownPct: number;
  /** Months to recover the prior peak; null if it never fully recovered within a decade. */
  recoveryMonths: number | null;
  lesson: string;
}

export interface MatchInput {
  horizonYears: number;
  realReturnPct: number;
  currencyVolatility: "low" | "high";
}

export interface HistoryMatch {
  event: HistoryEvent;
  score: number;
}

export function matchHistory(
  events: HistoryEvent[],
  input: MatchInput,
  limit = 3,
): HistoryMatch[] {
  const scored = events.map((event) => ({ event, score: scoreEvent(event, input) }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}

function scoreEvent(event: HistoryEvent, input: MatchInput): number {
  let score = 0;

  // Regime fit: crises/stagflation match weak or negative real returns.
  if (input.realReturnPct <= 0) {
    if (event.type === "crisis") score += 3;
    if (event.type === "stagflation") score += 2.5;
    if (event.type === "boom") score -= 1.5;
  } else if (input.realReturnPct >= 8) {
    if (event.type === "boom") score += 3;
    if (event.type === "crisis") score += 0.5; // crashes still relevant as stress tests
    if (event.type === "stagflation") score -= 1;
  } else {
    // Mildly positive regime: mixed history is most informative.
    score += event.type === "boom" ? 1 : 1.5;
  }

  // Currency volatility boosts emerging-market style episodes (TR).
  if (input.currencyVolatility === "high") {
    if (event.region === "TR") score += 2;
    if (event.type === "crisis") score += 0.5;
  } else if (event.region === "TR") {
    score -= 0.5;
  }

  // Horizon similarity: events whose recovery fits inside the user's horizon
  // are more actionable; decade-scale disasters matter for long horizons.
  const recoveryYears = event.recoveryMonths ? event.recoveryMonths / 12 : 10;
  if (Math.abs(recoveryYears - input.horizonYears) <= 5) score += 1.5;
  else if (recoveryYears > input.horizonYears) score += 0.5;

  return score;
}
