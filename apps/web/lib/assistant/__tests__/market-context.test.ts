import { afterEach, describe, expect, it, vi } from "vitest";
import {
  clearMarketContextCache,
  fetchMarketContext,
} from "../market-context";

function yahooChart(price: number, prev: number) {
  return {
    chart: {
      result: [
        {
          meta: { regularMarketPrice: price, previousClose: prev },
        },
      ],
    },
  };
}

afterEach(() => {
  clearMarketContextCache();
  vi.unstubAllGlobals();
});

describe("fetchMarketContext", () => {
  it("formats quotes into [PİYASA] lines with change percentages", async () => {
    clearMarketContextCache();
    const f = vi.fn().mockImplementation(async (url: string) => ({
      ok: true,
      json: async () =>
        String(url).includes("USDTRY")
          ? yahooChart(41.32, 41.0)
          : String(url).includes("GC")
            ? yahooChart(3850.5, 3800)
            : { chart: {} }, // diğerleri başarısız
    }));
    vi.stubGlobal("fetch", f);

    const result = await fetchMarketContext();

    expect(result.lines.some((l) => l.includes("[PİYASA] USD/TRY: 41.32") && l.includes("%0.78"))).toBe(true);
    expect(result.lines.some((l) => l.includes("[PİYASA] Altın"))).toBe(true);
    expect(result.lines.length).toBe(2); // XU100/S&P/EURTRY/gümüş sessizce atlandı
  });

  it("returns empty lines when every symbol fails", async () => {
    clearMarketContextCache();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 503, json: async () => ({}) }),
    );
    const result = await fetchMarketContext();
    expect(result.lines).toEqual([]);
  });

  it("serves repeated calls from cache", async () => {
    clearMarketContextCache();
    const f = vi.fn().mockImplementation(async (url: string) => ({
      ok: true,
      json: async () =>
        String(url).includes("USDTRY") ? yahooChart(41, 40.5) : { chart: {} },
    }));
    vi.stubGlobal("fetch", f);

    await fetchMarketContext();
    await fetchMarketContext();
    expect(f).toHaveBeenCalledTimes(6); // 6 sembol x 1 tur; ikinci tur önbellek
  });
});
