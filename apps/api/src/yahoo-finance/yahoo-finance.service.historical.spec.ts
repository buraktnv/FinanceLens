import { BadRequestException } from '@nestjs/common';
import { YahooFinanceService } from './yahoo-finance.service';

describe('YahooFinanceService historical/quote hardening', () => {
  let service: YahooFinanceService;
  const fetchMock = jest.fn();

  beforeEach(async () => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
    service = new YahooFinanceService();
  });

  describe('getHistoricalData interval whitelist', () => {
    it('rejects a path-traversal interval before any request is made', async () => {
      await expect(
        service.getHistoricalData('AAPL', 1700000000, 1700086400, '../x'),
      ).rejects.toThrow(BadRequestException);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('rejects intervals outside {1d,1wk,1mo}', async () => {
      await expect(
        service.getHistoricalData('AAPL', 1700000000, 1700086400, '5m'),
      ).rejects.toThrow(BadRequestException);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('encodes the whitelisted interval into the upstream URL', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ chart: { result: [{ meta: {} }] } }),
      });

      await service.getHistoricalData('AAPL', 1700000000, 1700086400, '1wk');

      const url = fetchMock.mock.calls[0][0] as string;
      expect(url).toContain(
        '/v8/finance/chart/' +
          encodeURIComponent('AAPL') +
          '?period1=1700000000&period2=1700086400&interval=1wk',
      );
    });
  });

  describe('getQuote previousClose guard', () => {
    it('returns 0 change percent instead of Infinity when previousClose is 0', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({
          chart: {
            result: [
              {
                meta: {
                  symbol: 'AAPL',
                  longName: 'Apple Inc.',
                  regularMarketPrice: 150,
                  previousClose: 0,
                  currency: 'USD',
                  marketState: 'REGULAR',
                },
              },
            ],
          },
        }),
      });

      const quote = await service.getQuote('AAPL');

      expect(quote.regularMarketChange).toBe(150);
      expect(quote.regularMarketChangePercent).toBe(0);
    });
  });
});
