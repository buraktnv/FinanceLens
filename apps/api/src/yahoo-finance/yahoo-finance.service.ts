import { Injectable, HttpException, HttpStatus } from '@nestjs/common';

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
  private readonly baseUrl = 'https://query1.finance.yahoo.com';

  /**
   * Search for stocks/ETFs by symbol or name
   */
  async searchSymbol(query: string): Promise<YahooSearchResult[]> {
    try {
      const url = `${this.baseUrl}/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=10&newsCount=0`;

      const response = await fetch(url);

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

      const response = await fetch(url);

      if (!response.ok) {
        throw new HttpException(
          'Yahoo Finance API error',
          HttpStatus.BAD_GATEWAY,
        );
      }

      const data = await response.json();

      if (!data.chart || !data.chart.result || data.chart.result.length === 0) {
        throw new HttpException(
          'Symbol not found',
          HttpStatus.NOT_FOUND,
        );
      }

      const result = data.chart.result[0];
      const meta = result.meta;
      const quote = result.indicators?.quote?.[0];

      return {
        symbol: meta.symbol,
        name: meta.longName || meta.symbol,
        regularMarketPrice: meta.regularMarketPrice,
        regularMarketChange: meta.regularMarketPrice - meta.previousClose,
        regularMarketChangePercent: ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100,
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
   * Get historical data for a symbol
   */
  async getHistoricalData(
    symbol: string,
    period1: number,
    period2: number,
    interval: string = '1d',
  ): Promise<any> {
    try {
      const url = `${this.baseUrl}/v8/finance/chart/${encodeURIComponent(symbol)}?period1=${period1}&period2=${period2}&interval=${interval}&includePrePost=true&events=div%7Csplit%7Cearn`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new HttpException(
          'Yahoo Finance API error',
          HttpStatus.BAD_GATEWAY,
        );
      }

      const data = await response.json();

      if (!data.chart || !data.chart.result || data.chart.result.length === 0) {
        throw new HttpException(
          'Symbol not found',
          HttpStatus.NOT_FOUND,
        );
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
