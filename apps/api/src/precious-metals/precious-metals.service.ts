import { Injectable, HttpException, HttpStatus } from '@nestjs/common';

export interface PreciousMetalPrice {
  metal: 'GOLD' | 'SILVER';
  pricePerGram: number;
  pricePerOunce: number;
  currency: 'TRY';
  lastUpdated: Date;
  usdToTry: number;
}

@Injectable()
export class PreciousMetalsService {
  private readonly baseUrl = 'https://query1.finance.yahoo.com';

  // Constants
  private readonly GRAMS_PER_OUNCE = 28.3495;
  private readonly GOLD_SYMBOL = 'GC=F'; // Gold futures
  private readonly SILVER_SYMBOL = 'SI=F'; // Silver futures
  private readonly USDTRY_SYMBOL = 'USDTRY=X'; // USD/TRY exchange rate

  // Cache (in-memory)
  private cache: Map<string, { data: any; expiry: number }> = new Map();
  private readonly CACHE_TTL = 15 * 60 * 1000; // 15 minutes

  /**
   * Get current gold price in TRY per gram
   */
  async getGoldPrice(): Promise<PreciousMetalPrice> {
    return this.getMetalPrice('GOLD', this.GOLD_SYMBOL);
  }

  /**
   * Get current silver price in TRY per gram
   */
  async getSilverPrice(): Promise<PreciousMetalPrice> {
    return this.getMetalPrice('SILVER', this.SILVER_SYMBOL);
  }

  /**
   * Generic method to fetch precious metal prices
   */
  private async getMetalPrice(
    metal: 'GOLD' | 'SILVER',
    symbol: string,
  ): Promise<PreciousMetalPrice> {
    const cacheKey = `${metal}_PRICE`;

    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const [metalQuote, usdTryQuote] = await Promise.all([
        this.getQuote(symbol),
        this.getQuote(this.USDTRY_SYMBOL),
      ]);

      const usdPerOunce = metalQuote.regularMarketPrice;
      const usdToTry = usdTryQuote.regularMarketPrice;

      // Convert USD/oz to TRY/gram
      const tryPerOunce = usdPerOunce * usdToTry;
      const tryPerGram = tryPerOunce / this.GRAMS_PER_OUNCE;

      const result: PreciousMetalPrice = {
        metal,
        pricePerGram: tryPerGram,
        pricePerOunce: tryPerOunce,
        currency: 'TRY',
        lastUpdated: new Date(),
        usdToTry,
      };

      // Cache the result
      this.saveToCache(cacheKey, result);

      return result;
    } catch (error) {
      throw new HttpException(
        `Failed to fetch ${metal} price: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get quote from Yahoo Finance
   */
  private async getQuote(symbol: string): Promise<any> {
    const url = `${this.baseUrl}/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new HttpException(
        'Yahoo Finance API error',
        HttpStatus.BAD_GATEWAY,
      );
    }

    const data = await response.json();
    if (!data.chart?.result?.[0]) {
      throw new HttpException('Symbol not found', HttpStatus.NOT_FOUND);
    }

    const meta = data.chart.result[0].meta;
    return {
      symbol: meta.symbol,
      regularMarketPrice: meta.regularMarketPrice,
      currency: meta.currency,
    };
  }

  // Simple in-memory cache methods
  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && cached.expiry > Date.now()) {
      return cached.data;
    }
    return null;
  }

  private saveToCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      expiry: Date.now() + this.CACHE_TTL,
    });
  }
}
