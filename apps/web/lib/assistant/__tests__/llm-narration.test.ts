import { describe, expect, it } from "vitest";
import {
  parseLlmNarration,
  sanitizeLlmText,
} from "../reply";

describe("sanitizeLlmText", () => {
  it("strips emojis and variation selectors", () => {
    expect(sanitizeLlmText("Merhaba! 👋 Nasıl gidiyor? 💪")).toBe(
      "Merhaba! Nasıl gidiyor?",
    );
  });

  it("replaces em and en dashes with commas", () => {
    expect(sanitizeLlmText("Birikim — 5 yıl, gider — düşük")).toBe(
      "Birikim, 5 yıl, gider, düşük",
    );
  });

  it("collapses leftover double spaces", () => {
    expect(sanitizeLlmText("a  b")).toBe("a b");
  });
});

describe("parseLlmNarration", () => {
  it("parses the JSON contract with points", () => {
    const raw =
      'İşte cevapın: {"summary": "5 yıl sonra özgür olursun.", "points": ["Ayda 15k biriktir", "Giderleri izle", "Kur riskini dağıt"]} tamam.';
    const parsed = parseLlmNarration(raw);
    expect(parsed.summary).toBe("5 yıl sonra özgür olursun.");
    expect(parsed.points).toHaveLength(3);
    expect(parsed.points[0]).toBe("Ayda 15k biriktir");
  });

  it("tolerates code fences around the JSON", () => {
    const raw = '```json\n{"summary": "Cevap.", "points": []}\n```';
    const parsed = parseLlmNarration(raw);
    expect(parsed.summary).toBe("Cevap.");
    expect(parsed.points).toEqual([]);
  });

  it("falls back to sanitized plain text on invalid JSON", () => {
    const parsed = parseLlmNarration("Bu bir cümle — emoji 📈 içeriyor.");
    expect(parsed.summary).toBe("Bu bir cümle, emoji içeriyor.");
    expect(parsed.points).toEqual([]);
  });

  it("caps points at four and drops empties", () => {
    const raw = JSON.stringify({
      summary: "s",
      points: ["a", "", "b", "c", "d", "e"],
    });
    expect(parseLlmNarration(raw).points).toEqual(["a", "b", "c", "d"]);
  });
});
