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

    yahooFinanceService = {
      getFxRate: jest.fn((pair: string) =>
        pair === 'USDTRY'
          ? { rate: 40, fetchedAt: fetchedAtIso }
          : { rate: 44, fetchedAt: fetchedAtIso },
      ),
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
        { accountName: 'TL hesabi', balance: decimal('10000') },
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
      // cash/gold/silver are TRY-native: 10000 + 3500 + 500
      expect(result.breakdown.cash.value).toBeCloseTo(10000, 6);
      expect(result.breakdown.gold.value).toBeCloseTo(3500, 6);
      expect(result.breakdown.silver.value).toBeCloseTo(500, 6);
      expect(result.totalAssets).toBeCloseTo(154500, 6);
      expect(result.netWorth).toBeCloseTo(154500, 6);

      expect(yahooFinanceService.getFxRate).toHaveBeenCalledWith('USDTRY');
      expect(yahooFinanceService.getFxRate).toHaveBeenCalledWith('EURTRY');
    });

    it('should expose fxRates with fetchedAt and stay backward compatible', async () => {
      mixedPortfolio();

      const result = await service.getOverview(userId);

      expect(result.fxRates).toEqual({
        USDTRY: 40,
        EURTRY: 44,
        fetchedAt: fetchedAtIso,
      });
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

      // stocks: 200 + 500 = 700, eurobonds: 3000, cash+gold+silver: 14000
      expect(result.totalAssets).toBeCloseTo(17700, 6);
      expect(result.netWorth).toBeCloseTo(17700, 6);
      expect(result.fxRates).toEqual(
        expect.objectContaining({ USDTRY: 1, EURTRY: 1 }),
      );
      expect(result.stale).toBe(true);
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

      // stocks: 200x1 + 500 = 700, eurobonds: 3000x44 = 132000, rest: 14000
      expect(result.breakdown.stocks.value).toBeCloseTo(700, 6);
      expect(result.breakdown.eurobonds.value).toBeCloseTo(132000, 6);
      expect(result.fxRates).toEqual(
        expect.objectContaining({ USDTRY: 1, EURTRY: 44 }),
      );
      expect(result.stale).toBe(true);
    });
  });
});
