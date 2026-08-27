import { Test, TestingModule } from '@nestjs/testing';
import { ServiceUnavailableException } from '@nestjs/common';
import { YahooFinanceService } from './yahoo-finance.service';

interface FetchStubResponse {
  ok: boolean;
  json: () => Promise<unknown>;
}

describe('YahooFinanceService - getFxRate', () => {
  let service: YahooFinanceService;
  const fetchMock = jest.fn<Promise<FetchStubResponse>, [string]>();

  function stubChart(meta: Record<string, unknown>): void {
    fetchMock.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ chart: { result: [{ meta }] } }),
      }),
    );
  }

  function clearStaticFxCache(): void {
    const cache = (
      YahooFinanceService as unknown as { fxCache?: Map<string, unknown> }
    ).fxCache;
    cache?.clear();
  }

  beforeEach(async () => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
    clearStaticFxCache();

    const module: TestingModule = await Test.createTestingModule({
      providers: [YahooFinanceService],
    }).compile();

    service = module.get<YahooFinanceService>(YahooFinanceService);
  });

  describe('getFxRate', () => {
    it('should parse regularMarketPrice from chart meta', async () => {
      stubChart({ symbol: 'USDTRY=X', regularMarketPrice: 41.25 });

      const result = await service.getFxRate('USDTRY');

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock.mock.calls[0][0]).toBe(
        'https://query1.finance.yahoo.com/v8/finance/chart/USDTRY=X',
      );
      expect(result.rate).toBe(41.25);
      expect(typeof result.fetchedAt).toBe('string');
      expect(new Date(result.fetchedAt).getTime()).not.toBeNaN();
    });

    it('should serve cached rate without refetching on second call', async () => {
      stubChart({ symbol: 'EURTRY=X', regularMarketPrice: 44.5 });

      const first = await service.getFxRate('EURTRY');
      const second = await service.getFxRate('EURTRY');

      expect(second).toEqual(first);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('should refetch after cache TTL expiry (15 minutes)', async () => {
      jest.useFakeTimers();
      try {
        stubChart({ symbol: 'USDTRY=X', regularMarketPrice: 42 });

        await service.getFxRate('USDTRY');

        jest.advanceTimersByTime(15 * 60 * 1000 - 1);
        await service.getFxRate('USDTRY');
        expect(fetchMock).toHaveBeenCalledTimes(1);

        jest.advanceTimersByTime(1);
        await service.getFxRate('USDTRY');
        expect(fetchMock).toHaveBeenCalledTimes(2);
      } finally {
        jest.useRealTimers();
      }
    });

    it('should throw ServiceUnavailableException on invalid payload (empty result)', async () => {
      fetchMock.mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ chart: { result: [] } }),
        }),
      );

      await expect(service.getFxRate('USDTRY')).rejects.toThrow(
        ServiceUnavailableException,
      );
    });

    it('should throw ServiceUnavailableException when meta price is missing', async () => {
      stubChart({ symbol: 'USDTRY=X' });

      await expect(service.getFxRate('USDTRY')).rejects.toThrow(
        ServiceUnavailableException,
      );
    });

    it('should not leak upstream error details in the exception message', async () => {
      fetchMock.mockImplementation(() =>
        Promise.reject(new Error('secret upstream detail')),
      );

      let caught: unknown;
      try {
        await service.getFxRate('EURTRY');
      } catch (error) {
        caught = error;
      }

      expect(caught).toBeInstanceOf(ServiceUnavailableException);
      expect((caught as Error).message).not.toContain('secret upstream detail');
    });
  });
});
