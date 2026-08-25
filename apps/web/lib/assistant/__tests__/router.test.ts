import { describe, expect, it } from "vitest";
import { detectIntent } from "../router";

describe("detectIntent", () => {
  const cases: { text: string; want: unknown }[] = [
    { text: "merhaba", want: { kind: "greeting" } },
    { text: "Selam, nasilsin?", want: { kind: "greeting" } },
    { text: "Ne zaman özgür olurum?", want: { kind: "fire-date" } },
    { text: "finansal bağımsızlığa ne kadar kaldı", want: { kind: "fire-date" } },
    { text: "ayda 15k biriktirirsem ne olur", want: { kind: "save-what-if", monthlyAmount: 15000 } },
    { text: "ayda 5 bin TL biriktirsem", want: { kind: "save-what-if", monthlyAmount: 5000 } },
    { text: "25000 lira ayda biriktiriyorum", want: { kind: "save-what-if", monthlyAmount: 25000 } },
    { text: "giderlerim %20 düşse", want: { kind: "expense-what-if", reductionPct: 20 } },
    { text: "harcamalarımı yarıya indirsem", want: { kind: "expense-what-if", reductionPct: 50 } },
    { text: "2008 gibi bir kriz olsaydı", want: { kind: "crash-scenario", eventId: "2008" } },
    { text: "kriz yaşasak ne olur", want: { kind: "crash-scenario" } },
    { text: "yardım", want: { kind: "help" } },
    { text: "bugün hava nasıl", want: { kind: "help" } },
  ];

  for (const { text, want } of cases) {
    it(`maps "${text}"`, () => {
      expect(detectIntent(text)).toEqual(want);
    });
  }

  it("is case-insensitive and ASCII-tolerant", () => {
    expect(detectIntent("NE ZAMAN OZGUR OLURUM")).toEqual({ kind: "fire-date" });
  });
});
