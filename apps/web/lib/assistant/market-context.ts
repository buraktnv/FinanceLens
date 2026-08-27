export interface MarketContextResult {
  lines: string[];
  fetchedAt: string;
}

interface YahooChartResponse {
  chart?: {
    result?: Array<{
      meta?: {
        symbol?: string;
        regularMarketPrice?: unknown;
        previousClose?: unknown;
      };
    }>;
  };
  errors?: unknown;
}

const TIMEOUT_MS = 10_000;
const CACHE_TTL_MS = 10 * 60 * 1000;
let cache: { at: number; result: MarketContextResult } | null = null;

/** Sembol → okunabilir Türkçe ad. */
const SYMBOLS: Array<{ symbol: string; label: string }> = [
  { symbol: "USDTRY=X", label: "USD/TRY" },
  { symbol: "EURTRY=X", label: "EUR/TRY" },
  { symbol: "GC=F", label: "Altın (ons USD)" },
  { symbol: "SI=F", label: "Gümüş (ons USD)" },
  { symbol: "XU100.IS", label: "BIST 100" },
  { symbol: "^GSPC", label: "S&P 500" },
];

function parseQuote(json: YahooChartResponse): {
  price: number | null;
  prev: number | null;
} {
  const meta = json.chart?.result?.[0]?.meta;
  const price = Number(meta?.regularMarketPrice ?? NaN);
  const prev = Number(meta?.previousClose ?? NaN);
  return {
    price: Number.isFinite(price) ? price : null,
    prev: Number.isFinite(prev) ? prev : null,
  };
}

/**
 * Yahoo Finance'ten güncel piyasa verisi toplar (kurlar, metaller, endeksler).
 * Her sembol bağımsız denenir; başarısız olanlar sessizce atlanır.
 * Sonuç 10 dakika önbelleğe alınır. Yalnızca sunucu tarafında kullanılır
 * (Yahoo tarayıcıdan CORS nedeniyle çekilemez).
 */
export async function fetchMarketContext(
  _signal?: AbortSignal,
): Promise<MarketContextResult> {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) return cache.result;

  const timeout = AbortSignal.timeout(TIMEOUT_MS);
  const settled = await Promise.allSettled(
    SYMBOLS.map(async ({ symbol }) => {
      const res = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=5d`,
        { signal: timeout },
      );
      if (!res.ok) throw new Error(String(res.status));
      const { price, prev } = parseQuote(await res.json());
      if (price === null) throw new Error("no-price");
      return { symbol, price, prev };
    }),
  );

  const lines: string[] = [];
  for (let i = 0; i < SYMBOLS.length; i++) {
    const r = settled[i];
    const meta = SYMBOLS[i];
    if (!r || r.status !== "fulfilled" || !meta) continue;
    const { label } = meta;
    const changePct =
      r.value.prev && r.value.prev > 0
        ? `, onceki kapanisa gore %${(((r.value.price - r.value.prev) / r.value.prev) * 100).toFixed(2)}`
        : "";
    lines.push(`[PİYASA] ${label}: ${r.value.price.toFixed(2)}${changePct}`);
  }

  const result: MarketContextResult = {
    lines,
    fetchedAt: new Date().toISOString(),
  };

  if (lines.length > 0) {
    cache = { at: Date.now(), result };
  }
  return result;
}

/** Test yardımcısı. */
export function clearMarketContextCache(): void {
  cache = null;
}
