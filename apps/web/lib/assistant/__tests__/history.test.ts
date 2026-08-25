import { describe, expect, it } from "vitest";
import { trEvents } from "../history/tr";
import { usEvents } from "../history/us";
import { globalEvents } from "../history/global";
import { matchHistory, type HistoryEvent } from "../history/matcher";

describe("history datasets", () => {
  const all: HistoryEvent[] = [...trEvents, ...usEvents, ...globalEvents];

  it("has ~20 curated events across regions", () => {
    expect(all.length).toBeGreaterThanOrEqual(18);
    expect(all.length).toBeLessThanOrEqual(24);
    expect(all.filter((e) => e.region === "TR").length).toBeGreaterThanOrEqual(4);
    expect(all.filter((e) => e.region === "US").length).toBeGreaterThanOrEqual(4);
    expect(all.filter((e) => e.region === "GLOBAL").length).toBeGreaterThanOrEqual(4);
  });

  it("has unique ids and sane fields", () => {
    const ids = new Set(all.map((e) => e.id));
    expect(ids.size).toBe(all.length);
    for (const e of all) {
      expect(e.year).toBeGreaterThan(1900);
      expect(["crisis", "boom", "stagflation"]).toContain(e.type);
      expect(e.drawdownPct).toBeGreaterThanOrEqual(-95);
      expect(e.drawdownPct).toBeLessThanOrEqual(200);
      expect(e.lesson.length).toBeGreaterThan(10);
      expect(e.title.length).toBeGreaterThan(5);
    }
  });
});

describe("matchHistory", () => {
  it("puts stagflation/crisis events first in a high-volatility, low-real-return regime", () => {
    const matches = matchHistory(trEvents.concat(usEvents), {
      horizonYears: 3,
      realReturnPct: -5,
      currencyVolatility: "high",
    });
    expect(matches[0]!.event.type === "crisis" || matches[0]!.event.type === "stagflation").toBe(true);
    expect(matches.length).toBeLessThanOrEqual(3);
  });

  it("boosts TR events under high currency volatility", () => {
    const matches = matchHistory(trEvents, {
      horizonYears: 5,
      realReturnPct: 0,
      currencyVolatility: "high",
    });
    expect(matches[0]!.event.region).toBe("TR");
  });

  it("prefers booms when real returns are strongly positive and volatility low", () => {
    const matches = matchHistory(usEvents, {
      horizonYears: 10,
      realReturnPct: 12,
      currencyVolatility: "low",
    });
    expect(matches[0]!.event.type).toBe("boom");
  });

  it("scores are sorted descending and limited", () => {
    const matches = matchHistory([...trEvents, ...globalEvents], {
      horizonYears: 8,
      realReturnPct: 2,
      currencyVolatility: "high",
    }, 5);
    for (let i = 1; i < matches.length; i++) {
      expect(matches[i - 1]!.score).toBeGreaterThanOrEqual(matches[i]!.score);
    }
    expect(matches.length).toBeLessThanOrEqual(5);
  });
});
