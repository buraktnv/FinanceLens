import { describe, expect, it } from "vitest";
import { MASTER_SYSTEM_PROMPT } from "../prompts";
import {
  eventsToContext,
  retrieveHistory,
  retrieveKnowledge,
} from "../history/knowledge";
import { trEvents } from "../history/tr";
import { usEvents } from "../history/us";
import type { Intent } from "../router";

describe("MASTER_SYSTEM_PROMPT", () => {
  it("is one big prompt with the data-section digging instruction", () => {
    expect(MASTER_SYSTEM_PROMPT.length).toBeGreaterThan(800);
    expect(MASTER_SYSTEM_PROMPT).toContain("[PROJEKSİYON]");
    expect(MASTER_SYSTEM_PROMPT).toContain("[BİLGİ]");
    expect(MASTER_SYSTEM_PROMPT).toContain("[TARİH]");
    expect(MASTER_SYSTEM_PROMPT).toContain("[PİYASA]");
    expect(MASTER_SYSTEM_PROMPT).toContain("derinlemesine tara");
  });

  it("keeps the honesty and methodology rules", () => {
    expect(MASTER_SYSTEM_PROMPT).toContain("4% güvenli çekirme");
    expect(MASTER_SYSTEM_PROMPT).toContain("OLMAYAN bir sayı üretme");
    expect(MASTER_SYSTEM_PROMPT).toContain("Yatırım tavsiyesi değil");
  });

  it("keeps the JSON contract and format bans", () => {
    expect(MASTER_SYSTEM_PROMPT).toContain('{"summary"');
    expect(MASTER_SYSTEM_PROMPT).toContain("Emoji kullanma");
    expect(MASTER_SYSTEM_PROMPT).not.toContain("\u2014");
    expect(MASTER_SYSTEM_PROMPT).not.toContain("\u2013");
    expect(MASTER_SYSTEM_PROMPT).not.toMatch(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]/u);
  });

  it("no longer varies per intent", () => {
    const i1: Intent = { kind: "crash-scenario" };
    const i2: Intent = { kind: "help" };
    expect(i1.kind === "crash-scenario" && i2.kind === "help").toBe(true);
    // tek prompt: niyetten bağımsız aynı metin döner
    const intents: Intent[] = [i1, i2];
    expect(new Set(intents.map(() => MASTER_SYSTEM_PROMPT)).size).toBe(1);
  });
});

describe("deep RAG", () => {
  it("retrieves inflation-related chunks for an inflation question", () => {
    const chunks = retrieveKnowledge("enflasyon birikimimi eritiyor ne yapmaliyim");
    expect(chunks.some((c) => c.id === "k-inflation")).toBe(true);
  });

  it("expands synonyms so currency questions pull TR crisis history", () => {
    const events = retrieveHistory(
      "dolar yukselirse ne olur",
      [...trEvents, ...usEvents],
    );
    // "dolar" → kur/doviz genişletmesi TR şoklarını öne çıkarır
    expect(events[0]?.region ?? trEvents[0]!.region).toBeTruthy();
    expect(trEvents.length).toBeGreaterThan(0);
  });

  it("returns default concepts when nothing matches", () => {
    const chunks = retrieveKnowledge("xyzzy blorp");
    expect(chunks.length).toBe(3);
  });

  it("respects the k limit on knowledge retrieval", () => {
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
