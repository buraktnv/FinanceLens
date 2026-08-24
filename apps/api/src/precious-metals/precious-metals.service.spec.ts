import { Test, TestingModule } from '@nestjs/testing';
import { PreciousMetalsService } from './precious-metals.service';

describe('PreciousMetalsService', () => {
  let service: PreciousMetalsService;
  const fetchMock = jest.fn();

  // Troy ounce constant: Yahoo quotes metals per troy ounce.
  const GRAMS_PER_TROY_OUNCE = 31.1035;
  const usdToTry = 40;

  function stubYahooQuotes(metalPriceUsdPerOunce: number): void {
    fetchMock.mockImplementation((input: unknown) => {
      const url = String(input);
      const symbol = decodeURIComponent(
        url.split('/v8/finance/chart/')[1].split('?')[0],
      );
      const regularMarketPrice =
        symbol === 'USDTRY=X' ? usdToTry : metalPriceUsdPerOunce;
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            chart: {
              result: [
                {
                  meta: { symbol, regularMarketPrice, currency: 'USD' },
                },
              ],
            },
          }),
      });
    });
  }

  beforeEach(async () => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;

    const module: TestingModule = await Test.createTestingModule({
      providers: [PreciousMetalsService],
    }).compile();

    service = module.get<PreciousMetalsService>(PreciousMetalsService);
  });

  describe('getGoldPrice', () => {
    it('should convert the USD/oz quote to TRY/gram using grams per troy ounce', async () => {
      stubYahooQuotes(3000);

      const result = await service.getGoldPrice();

      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(result.metal).toBe('GOLD');
      expect(result.currency).toBe('TRY');
      expect(result.usdToTry).toBe(usdToTry);
      expect(result.pricePerOunce).toBeCloseTo(3000 * usdToTry, 6);
      expect(result.pricePerGram).toBeCloseTo(
        (3000 * usdToTry) / GRAMS_PER_TROY_OUNCE,
        6,
      );
    });
  });

  describe('getSilverPrice', () => {
    it('should convert the USD/oz quote to TRY/gram using grams per troy ounce', async () => {
      stubYahooQuotes(35);

      const result = await service.getSilverPrice();

      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(result.metal).toBe('SILVER');
      expect(result.currency).toBe('TRY');
      expect(result.usdToTry).toBe(usdToTry);
      expect(result.pricePerOunce).toBeCloseTo(35 * usdToTry, 6);
      expect(result.pricePerGram).toBeCloseTo(
        (35 * usdToTry) / GRAMS_PER_TROY_OUNCE,
        6,
      );
    });
  });

  describe('cache', () => {
    it('should serve cached prices within the TTL and refetch after expiry', async () => {
      jest.useFakeTimers();
      try {
        stubYahooQuotes(3000);

        const first = await service.getGoldPrice();

        jest.advanceTimersByTime(15 * 60 * 1000 - 1);
        const cached = await service.getGoldPrice();

        expect(cached).toEqual(first);
        expect(fetchMock).toHaveBeenCalledTimes(2);

        jest.advanceTimersByTime(1);
        await service.getGoldPrice();

        expect(fetchMock).toHaveBeenCalledTimes(4);
      } finally {
        jest.useRealTimers();
      }
    });

    it('should cache gold and silver prices separately', async () => {
      stubYahooQuotes(3000);

      const gold = await service.getGoldPrice();
      const silver = await service.getSilverPrice();

      expect(gold.metal).toBe('GOLD');
      expect(silver.metal).toBe('SILVER');
    });
  });
});
