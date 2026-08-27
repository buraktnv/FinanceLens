import { describe, expect, it } from "vitest";
import {
  parseExtractionResponse,
  parseFlexibleNumber,
} from "../parse-extraction";

describe("parseFlexibleNumber", () => {
  it("parses TR and EN thousand/decimal formats", () => {
    expect(parseFlexibleNumber("1.234,56")).toBe(1234.56);
    expect(parseFlexibleNumber("1,234.56")).toBe(1234.56);
    expect(parseFlexibleNumber("1234,56")).toBe(1234.56);
    expect(parseFlexibleNumber("15K")).toBe(15000);
    expect(parseFlexibleNumber("2,5k")).toBe(2500);
    expect(parseFlexibleNumber("1 234")).toBe(1234);
    expect(parseFlexibleNumber("1.234.567")).toBe(1234567);
    expect(parseFlexibleNumber(42)).toBe(42);
  });

  it("returns null for garbage", () => {
    expect(parseFlexibleNumber("abc")).toBeNull();
    expect(parseFlexibleNumber("")).toBeNull();
    expect(parseFlexibleNumber(null)).toBeNull();
  });
});

describe("parseExtractionResponse", () => {
  it("parses items with numeric normalization and flags", () => {
    const raw = `İşte kayıtlar: {"items":[
      {"symbol":"THYAO","name":"THY","quantity":"100","purchasePrice":"290,50","currency":"TRY"},
      {"symbol":null,"name":"","quantity":0,"purchasePrice":"12,5","currency":"BTC"}
    ]}`;
    const { rows } = parseExtractionResponse(raw);

    expect(rows).toHaveLength(2);
    expect(rows[0]!.values.quantity).toBe(100);
    expect(rows[0]!.values.purchasePrice).toBeCloseTo(290.5);
    expect(rows[0]!.flags).toHaveLength(0);

    // İkinci satır: sembol eksik, adet sıfır, bilinmeyen para birimi
    expect(rows[1]!.flags.length).toBeGreaterThanOrEqual(3);
    expect(
      rows[1]!.flags.some((f) => f.includes("Sembol")),
    ).toBe(true);
  });

  it("tolerates code fences", () => {
    const raw = '```json\n{"items":[{"symbol":"VOO","quantity":10,"purchasePrice":480}]}\n```';
    const { rows } = parseExtractionResponse(raw);
    expect(rows).toHaveLength(1);
    expect(rows[0]!.values.symbol).toBe("VOO");
  });

  it("never throws; returns error for non-JSON", () => {
    const result = parseExtractionResponse("Model üzgünüm dedi.");
    expect(result.rows).toEqual([]);
    expect(result.error).toBeTruthy();
  });

  it("caps items at 50", () => {
    const items = Array.from({ length: 80 }, (_, i) => ({ symbol: `S${i}`, quantity: 1 }));
    const { rows } = parseExtractionResponse(JSON.stringify({ items }));
    expect(rows.length).toBeLessThanOrEqual(50);
  });
});
