import {
  Injectable,
  BadRequestException,
  HttpException,
  HttpStatus,
  ServiceUnavailableException,
} from '@nestjs/common';

export type FxPair =
  | 'USDTRY'
  | 'EURTRY'
  | 'GBPTRY'
  | 'CHFTRY'
  | 'JPYTRY'
  | 'AUDTRY';

export interface FxRate {
  rate: number;
  fetchedAt: string;
}

export interface YahooQuote {
  symbol: string;
  name: string;
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  currency: string;
  marketState: string;
}

export interface YahooSearchResult {
  symbol: string;
  name: string;
  type: string;
  exchange: string;
}

@Injectable()
export class YahooFinanceService {
  private static readonly fxCache = new Map<
    string,
    { rate: number; fetchedAt: string; expiry: number }
  >();
  private static readonly FX_CACHE_TTL = 15 * 60 * 1000; // 15 minutes

  private readonly baseUrl = 'https://query1.finance.yahoo.com';

  private static readonly ALLOWED_INTERVALS = ['1d', '1wk', '1mo'] as const;

  /**
   * Whitelist the chart interval before it is interpolated into the upstream
   * URL, so arbitrary/path-like values can never reach Yahoo Finance.
   */
  private assertValidInterval(interval: string): string {
    if (
      !YahooFinanceService.ALLOWED_INTERVALS.includes(
        interval as (typeof YahooFinanceService.ALLOWED_INTERVALS)[number],
      )
    ) {
      throw new BadRequestException(
        `Invalid interval '${interval}'. Allowed values: ${YahooFinanceService.ALLOWED_INTERVALS.join(', ')}`,
      );
    }
    return interval;
  }

  /**
   * Search for stocks/ETFs by symbol or name
   */
  async searchSymbol(query: string): Promise<YahooSearchResult[]> {
    try {
      const url = `${this.baseUrl}/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=10&newsCount=0`;

      const response = await fetch(url, {
        signal: AbortSignal.timeout(10_000),
      });

      if (!response.ok) {
        throw new HttpException(
          'Yahoo Finance API error',
          HttpStatus.BAD_GATEWAY,
        );
      }

      const data = await response.json();

      if (!data.quotes || data.quotes.length === 0) {
        return [];
      }

      return data.quotes.map((quote: any) => ({
        symbol: quote.symbol,
        name: quote.shortname || quote.longname || quote.symbol,
        type: quote.quoteType || 'EQUITY',
        exchange: quote.exchange || 'UNKNOWN',
      }));
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to search symbol',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get current quote for a symbol
   */
  async getQuote(symbol: string): Promise<YahooQuote> {
    try {
      const url = `${this.baseUrl}/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;

      const response = await fetch(url, {
        signal: AbortSignal.timeout(10_000),
      });

      if (!response.ok) {
        throw new HttpException(
          'Yahoo Finance API error',
          HttpStatus.BAD_GATEWAY,
        );
      }

      const data = await response.json();

      if (!data.chart || !data.chart.result || data.chart.result.length === 0) {
        throw new HttpException('Symbol not found', HttpStatus.NOT_FOUND);
      }

      const result = data.chart.result[0];
      const meta = result.meta;
      const price = Number(meta.regularMarketPrice ?? 0);
      const previousClose = Number(meta.previousClose ?? 0);

      return {
        symbol: meta.symbol,
        name: meta.longName || meta.symbol,
        regularMarketPrice: price,
        regularMarketChange: price - previousClose,
        regularMarketChangePercent:
          previousClose > 0
            ? ((price - previousClose) / previousClose) * 100
            : 0,
        currency: meta.currency,
        marketState: meta.marketState,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to get quote',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get FX rate (TRY per unit of pair base currency) with 15 min cache
   */
  async getFxRate(pair: FxPair): Promise<FxRate> {
    const cached = YahooFinanceService.fxCache.get(pair);
    if (cached && cached.expiry > Date.now()) {
      return { rate: cached.rate, fetchedAt: cached.fetchedAt };
    }

    try {
      const url = `${this.baseUrl}/v8/finance/chart/${pair}=X`;

      const response = await fetch(url, {
        signal: AbortSignal.timeout(10_000),
      });

      if (!response.ok) {
        throw new ServiceUnavailableException('FX rate service unavailable');
      }

      const data = (await response.json()) as {
        chart?: { result?: Array<{ meta?: { regularMarketPrice?: unknown } }> };
      };
      const rate = data?.chart?.result?.[0]?.meta?.regularMarketPrice;

      if (typeof rate !== 'number' || !Number.isFinite(rate)) {
        throw new ServiceUnavailableException('FX rate unavailable');
      }

      const entry = {
        rate,
        fetchedAt: new Date().toISOString(),
        expiry: Date.now() + YahooFinanceService.FX_CACHE_TTL,
      };
      YahooFinanceService.fxCache.set(pair, entry);

      return { rate: entry.rate, fetchedAt: entry.fetchedAt };
    } catch (error) {
      if (error instanceof ServiceUnavailableException) {
        throw error;
      }
      throw new ServiceUnavailableException(
        `Failed to fetch ${pair} exchange rate`,
      );
    }
  }

  /**
   * Get historical data for a symbol
   */
  async getHistoricalData(
    symbol: string,
    period1: number,
    period2: number,
    interval: string = '1d',
  ): Promise<any> {
    const safeInterval = this.assertValidInterval(interval);

    try {
      const url = `${this.baseUrl}/v8/finance/chart/${encodeURIComponent(symbol)}?period1=${period1}&period2=${period2}&interval=${encodeURIComponent(safeInterval)}&includePrePost=true&events=div%7Csplit%7Cearn`;

      const response = await fetch(url, {
        signal: AbortSignal.timeout(10_000),
      });

      if (!response.ok) {
        throw new HttpException(
          'Yahoo Finance API error',
          HttpStatus.BAD_GATEWAY,
        );
      }

      const data = await response.json();

      if (!data.chart || !data.chart.result || data.chart.result.length === 0) {
        throw new HttpException('Symbol not found', HttpStatus.NOT_FOUND);
      }

      return data.chart.result[0];
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to get historical data',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
