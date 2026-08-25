import { describe, expect, it } from "vitest";
import { buildSystemPrompt } from "../prompts";
import {
  eventsToContext,
  retrieveKnowledge,
} from "../history/knowledge";
import type { Intent } from "../router";

describe("buildSystemPrompt", () => {
  const intents: Intent[] = [
    { kind: "fire-date" },
    { kind: "greeting" },
    { kind: "crash-scenario" },
    { kind: "save-what-if", monthlyAmount: 5000 },
    { kind: "expense-what-if", reductionPct: 20 },
    { kind: "help" },
  ];

  it("includes the persona, format rules and JSON contract for every intent", () => {
    for (const intent of intents) {
      const p = buildSystemPrompt(intent);
      expect(p).toContain("FinanceLens");
      expect(p).toContain("Emoji kullanma");
      expect(p).toContain('{"summary"');
      expect(p).toContain("asla kendi başına sayı üretme");
    }
  });

  it("adds the domain-specific block per intent", () => {
    expect(buildSystemPrompt({ kind: "fire-date" })).toContain("4% kuralı");
    expect(buildSystemPrompt({ kind: "crash-scenario" })).toContain(
      "Tarihsel stres testi",
    );
    expect(buildSystemPrompt({ kind: "save-what-if", monthlyAmount: 1 })).toContain(
      "Birikim senaryosu",
    );
  });

  it("never contains emoji or em dashes itself", () => {
    for (const intent of intents) {
      const p = buildSystemPrompt(intent);
      expect(p).not.toMatch(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]/u);
      expect(p).not.toContain("\u2014"); // em dash
      expect(p).not.toContain("\u2013"); // en dash
    }
  });
});

describe("retrieveKnowledge (RAG)", () => {
  it("retrieves inflation-related chunks for an inflation question", () => {
    const chunks = retrieveKnowledge("enflasyon birikimimi eritiyor ne yapmaliyim");
    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks.some((c) => c.id === "k-inflation")).toBe(true);
  });

  it("retrieves FIRE methodology for freedom questions", () => {
    const chunks = retrieveKnowledge("finansal ozgurluk hedefim icin hesap");
    expect(chunks.some((c) => c.id === "k-4pct")).toBe(true);
  });

  it("returns default concepts when nothing matches", () => {
    const chunks = retrieveKnowledge("xyzzy blorp");
    expect(chunks.length).toBe(3);
  });

  it("respects the k limit", () => {
    const chunks = retrieveKnowledge("enflasyon altin doviz borsa portfoy", 2);
    expect(chunks.length).toBeLessThanOrEqual(2);
  });

  it("serializes history events into context lines", () => {
    const ctx = eventsToContext([
      {
        id: "us-2008-gfc",
        region: "US",
        year: 2008,
        title: "2008 Küresel Finans Krizi",
        type: "crisis",
        drawdownPct: -57,
        recoveryMonths: 60,
        lesson: "Panik satışı yapanlar dibi gördü.",
      },
    ]);
    expect(ctx).toContain("US 2008: 2008 Küresel Finans Krizi");
    expect(ctx).toContain("%57");
    expect(ctx).toContain("60 ay");
  });
});
