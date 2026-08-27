import { Test, TestingModule } from '@nestjs/testing';
import { ServiceUnavailableException } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../prisma/prisma.service';
import { YahooFinanceService } from '../yahoo-finance/yahoo-finance.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let prismaService: Record<string, { findMany: jest.Mock }>;
  let yahooFinanceService: { getFxRate: jest.Mock };

  const userId = 'user-1';
  const fetchedAtIso = '2026-08-24T10:00:00.000Z';

  const decimal = (value: string): { toString: () => string } => ({
    toString: () => value,
  });

  beforeEach(async () => {
    prismaService = {
      stock: { findMany: jest.fn().mockResolvedValue([]) },
      eTF: { findMany: jest.fn().mockResolvedValue([]) },
      eurobond: { findMany: jest.fn().mockResolvedValue([]) },
      cash: { findMany: jest.fn().mockResolvedValue([]) },
      gold: { findMany: jest.fn().mockResolvedValue([]) },
      silver: { findMany: jest.fn().mockResolvedValue([]) },
      loan: { findMany: jest.fn().mockResolvedValue([]) },
      income: { findMany: jest.fn().mockResolvedValue([]) },
      expense: { findMany: jest.fn().mockResolvedValue([]) },
    };

    const fxRatesMock: Record<string, number> = {
      USDTRY: 40,
      EURTRY: 44,
      GBPTRY: 50,
      CHFTRY: 46,
      JPYTRY: 0.27,
      AUDTRY: 26,
    };
    yahooFinanceService = {
      getFxRate: jest.fn((pair: string) => ({
        rate: fxRatesMock[pair] ?? 1,
        fetchedAt: fetchedAtIso,
      })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: PrismaService, useValue: prismaService },
        { provide: YahooFinanceService, useValue: yahooFinanceService },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
  });

  describe('getOverview', () => {
    function mixedPortfolio() {
      prismaService.stock.findMany.mockResolvedValue([
        {
          id: 'stock-usd',
          symbol: 'AAPL',
          quantity: decimal('2'),
          purchasePrice: decimal('100'),
          currency: 'USD',
        },
        {
          id: 'stock-try',
          symbol: 'ASELS',
          quantity: decimal('10'),
          purchasePrice: decimal('50'),
          currency: 'TRY',
        },
      ]);
      prismaService.eTF.findMany.mockResolvedValue([]);
      prismaService.eurobond.findMany.mockResolvedValue([
        {
          id: 'bond-eur',
          faceValue: decimal('1000'),
          quantity: decimal('3'),
          currency: 'EUR',
        },
      ]);
      prismaService.cash.findMany.mockResolvedValue([
        {
          accountName: 'TL hesabi',
          balance: decimal('10000'),
          currency: 'TRY',
        },
        {
          accountName: 'USD hesabi',
          balance: decimal('1000'),
          currency: 'USD',
        },
      ]);
      prismaService.gold.findMany.mockResolvedValue([
        { quantity: decimal('1'), purchasePrice: decimal('3500') },
      ]);
      prismaService.silver.findMany.mockResolvedValue([
        { quantity: decimal('5'), purchasePrice: decimal('100') },
      ]);
      prismaService.loan.findMany.mockResolvedValue([]);
    }

    it('should aggregate mixed USD stock + EUR eurobond + TRY cash into a single TRY net worth', async () => {
      mixedPortfolio();

      const result = await service.getOverview(userId);

      // stocks: 2x100x40 (USD) + 10x50 (TRY) = 8500
      expect(result.breakdown.stocks.value).toBeCloseTo(8500, 6);
      // eurobonds: 1000x3x44 = 132000
      expect(result.breakdown.eurobonds.value).toBeCloseTo(132000, 6);
      // cash: 10000 (TRY) + 1000x40 (USD->TRY) = 50000
      expect(result.breakdown.cash.value).toBeCloseTo(50000, 6);
      expect(result.breakdown.gold.value).toBeCloseTo(3500, 6);
      expect(result.breakdown.silver.value).toBeCloseTo(500, 6);
      expect(result.totalAssets).toBeCloseTo(194500, 6);
      expect(result.netWorth).toBeCloseTo(194500, 6);

      expect(yahooFinanceService.getFxRate).toHaveBeenCalledWith('USDTRY');
      expect(yahooFinanceService.getFxRate).toHaveBeenCalledWith('EURTRY');
    });

    it('should expose fxRates with fetchedAt and stay backward compatible', async () => {
      mixedPortfolio();

      const result = await service.getOverview(userId);

      expect(result.fxRates).toEqual({
        USDTRY: 40,
        EURTRY: 44,
        GBPTRY: 50,
        CHFTRY: 46,
        JPYTRY: 0.27,
        AUDTRY: 26,
        fetchedAt: fetchedAtIso,
      });
      expect(result.warnings).toEqual([]);
      expect(result.stale).toBeUndefined();

      for (const key of [
        'netWorth',
        'totalAssets',
        'totalDebt',
        'breakdown',
        'monthly',
      ]) {
        expect(result).toHaveProperty(key);
      }
    });

    it('should fall back to rate=1 with stale=true when FX fails instead of throwing', async () => {
      mixedPortfolio();
      yahooFinanceService.getFxRate.mockRejectedValue(
        new ServiceUnavailableException('FX rate service unavailable'),
      );

      const result = await service.getOverview(userId);

      // stocks: 200 + 500 = 700, eurobonds: 3000, cash: 11000, gold+silver: 4000
      expect(result.totalAssets).toBeCloseTo(18700, 6);
      expect(result.netWorth).toBeCloseTo(18700, 6);
      expect(result.fxRates).toEqual(
        expect.objectContaining({ USDTRY: 1, EURTRY: 1 }),
      );
      expect(result.stale).toBe(true);
    });

    it('counts a paid-off loan (remainingBalance=0) as zero debt, not principal', async () => {
      mixedPortfolio();
      prismaService.loan.findMany.mockResolvedValue([
        { remainingBalance: decimal('0'), principalAmount: decimal('250000') },
        {
          remainingBalance: decimal('5000'),
          principalAmount: decimal('200000'),
        },
      ]);

      const result = await service.getOverview(userId);

      expect(result.totalDebt).toBeCloseTo(5000, 6);
    });

    it('should convert GBP stock rows via the mocked GBPTRY rate', async () => {
      prismaService.stock.findMany.mockResolvedValue([
        {
          id: 'stock-gbp',
          symbol: 'HSBA',
          quantity: decimal('2'),
          purchasePrice: decimal('100'),
          currency: 'GBP',
        },
      ]);

      const result = await service.getOverview(userId);

      // 2 x 100 x 50 (GBPTRY) = 10000
      expect(result.breakdown.stocks.value).toBeCloseTo(10000, 6);
      expect(result.totalAssets).toBeCloseTo(10000, 6);
      expect(yahooFinanceService.getFxRate).toHaveBeenCalledWith('GBPTRY');
      expect(result.fxRates.GBPTRY).toBeCloseTo(50, 6);
      expect(result.warnings).toEqual([]);
      expect(result.stale).toBeUndefined();
    });

    it('should count unknown-currency rows at nominal and push a warning', async () => {
      prismaService.stock.findMany.mockResolvedValue([
        {
          id: 'stock-sek',
          symbol: 'ERIC',
          quantity: decimal('5'),
          purchasePrice: decimal('100'),
          currency: 'SEK',
        },
      ]);
      prismaService.eTF.findMany.mockResolvedValue([
        {
          id: 'etf-cad',
          symbol: 'XIC',
          quantity: decimal('1'),
          purchasePrice: decimal('200'),
          currency: 'CAD',
        },
      ]);

      const result = await service.getOverview(userId);

      // both counted at nominal, no conversion
      expect(result.breakdown.stocks.value).toBeCloseTo(500, 6);
      expect(result.breakdown.etfs.value).toBeCloseTo(200, 6);
      expect(yahooFinanceService.getFxRate).not.toHaveBeenCalledWith('SEKTRY');
      expect(result.warnings).toHaveLength(2);
      expect(result.warnings[0]).toContain('SEK');
      expect(result.warnings[0]).toContain('ERIC');
      expect(result.warnings[1]).toContain('CAD');
      expect(result.warnings[1]).toContain('XIC');
    });

    it('should be stale when only one pair fails while the other keeps its rate', async () => {
      mixedPortfolio();
      yahooFinanceService.getFxRate.mockImplementation((pair: string) =>
        pair === 'USDTRY'
          ? Promise.reject(
              new ServiceUnavailableException('FX rate service unavailable'),
            )
          : Promise.resolve({ rate: 44, fetchedAt: fetchedAtIso }),
      );

      const result = await service.getOverview(userId);

      // stocks: 200x1 + 500 = 700, eurobonds: 3000x44 = 132000,
      // cash: 11000 (rate 1), gold+silver: 4000
      expect(result.breakdown.stocks.value).toBeCloseTo(700, 6);
      expect(result.breakdown.eurobonds.value).toBeCloseTo(132000, 6);
      expect(result.fxRates).toEqual(
        expect.objectContaining({ USDTRY: 1, EURTRY: 44 }),
      );
      expect(result.stale).toBe(true);
    });
  });
});
