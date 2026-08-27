import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  FxPair,
  YahooFinanceService,
} from '../yahoo-finance/yahoo-finance.service';

interface PairRate {
  rate: number;
  fetchedAt: string | null;
}

type FxRates = Record<FxPair, PairRate>;

const FX_PAIRS = [
  'USDTRY',
  'EURTRY',
  'GBPTRY',
  'CHFTRY',
  'JPYTRY',
  'AUDTRY',
] as const satisfies readonly FxPair[];

const CURRENCY_TO_PAIR: Partial<Record<string, FxPair>> = {
  USD: 'USDTRY',
  EUR: 'EURTRY',
  GBP: 'GBPTRY',
  CHF: 'CHFTRY',
  JPY: 'JPYTRY',
  AUD: 'AUDTRY',
};

@Injectable()
export class DashboardService {
  constructor(
    private prisma: PrismaService,
    private yahooFinance: YahooFinanceService,
  ) {}

  /**
   * Fetch all supported FX pairs concurrently; on upstream failure fall back
   * to rate=1 and flag the overview as stale instead of failing the request.
   */
  private async fetchFxRates(): Promise<{ rates: FxRates; stale: boolean }> {
    const results = await Promise.all(
      FX_PAIRS.map(async (pair): Promise<PairRate> => {
        try {
          const { rate, fetchedAt } = await this.yahooFinance.getFxRate(pair);
          return { rate, fetchedAt };
        } catch {
          return { rate: 1, fetchedAt: null };
        }
      }),
    );

    const rates = Object.fromEntries(
      FX_PAIRS.map((pair, i) => [pair, results[i]]),
    ) as FxRates;

    return {
      rates,
      stale: results.some((r) => r.fetchedAt === null),
    };
  }

  private latestFetchedAt(rates: FxRates): string | null {
    const timestamps = Object.values(rates)
      .map((r) => r.fetchedAt)
      .filter((t): t is string => t !== null)
      .sort();
    return timestamps.length > 0 ? timestamps[timestamps.length - 1] : null;
  }

  /**
   * Per-item currency drives the TRY multiplier:
   * USD/EUR/GBP/CHF/JPY/AUD -> x<pair>TRY, TRY -> x1.
   * Any other currency counts at nominal and records a warning so the
   * understatement is visible instead of silent.
   */
  private toTry(
    value: number,
    currency: string,
    rates: FxRates,
    warnings: string[],
    assetLabel: string,
  ): number {
    if (currency === 'TRY') return value;

    const pair = CURRENCY_TO_PAIR[currency];
    if (!pair) {
      warnings.push(
        `Unsupported currency ${currency} held on asset ${assetLabel} counted at nominal`,
      );
      return value;
    }
    return value * rates[pair].rate;
  }

  async getOverview(userId: string) {
    const [
      stocks,
      etfs,
      eurobonds,
      cash,
      gold,
      silver,
      incomes,
      expenses,
      loans,
      fx,
    ] = await Promise.all([
      this.prisma.stock.findMany({ where: { userId } }),
      this.prisma.eTF.findMany({ where: { userId } }),
      this.prisma.eurobond.findMany({ where: { userId } }),
      this.prisma.cash.findMany({ where: { userId } }),
      this.prisma.gold.findMany({ where: { userId } }),
      this.prisma.silver.findMany({ where: { userId } }),
      this.getMonthlyIncomes(userId),
      this.getMonthlyExpenses(userId),
      this.prisma.loan.findMany({ where: { userId, status: 'ACTIVE' } }),
      this.fetchFxRates(),
    ]);
    const { rates: fxRates, stale } = fx;
    const warnings: string[] = [];

    // Calculate stock values (converted to TRY by row currency)
    const stocksValue = stocks.reduce(
      (sum, s) =>
        sum +
        this.toTry(
          Number(s.quantity) * Number(s.purchasePrice),
          s.currency as string,
          fxRates,
          warnings,
          (s as { symbol?: string }).symbol ?? s.id,
        ),
      0,
    );

    // Calculate ETF values (converted to TRY by row currency)
    const etfsValue = etfs.reduce(
      (sum, e) =>
        sum +
        this.toTry(
          Number(e.quantity) * Number(e.purchasePrice),
          e.currency as string,
          fxRates,
          warnings,
          (e as { symbol?: string }).symbol ?? e.id,
        ),
      0,
    );

    // Calculate Eurobond values (face value * quantity, converted to TRY)
    const eurobondsValue = eurobonds.reduce(
      (sum, e) =>
        sum +
        this.toTry(
          Number(e.faceValue) * Number(e.quantity),
          e.currency as string,
          fxRates,
          warnings,
          (e as { name?: string }).name ?? e.id,
        ),
      0,
    );

    // Calculate cash total, converted per-account currency to TRY.
    const cashValue = cash.reduce(
      (sum, c) =>
        sum +
        this.toTry(
          Number(c.balance),
          c.currency as string,
          fxRates,
          warnings,
          (c as { name?: string }).name ?? c.id,
        ),
      0,
    );

    // Calculate gold value (just purchase cost for now - current market price will be fetched on frontend)
    const goldValue = gold.reduce(
      (sum, g) => sum + Number(g.quantity) * Number(g.purchasePrice),
      0,
    );

    // Calculate silver value (just purchase cost for now - current market price will be fetched on frontend)
    const silverValue = silver.reduce(
      (sum, s) => sum + Number(s.quantity) * Number(s.purchasePrice),
      0,
    );

    // Calculate loan balances ("??" not "||": a paid-off loan has 0 remaining)
    const totalDebt = loans.reduce(
      (sum, l) => sum + Number(l.remainingBalance ?? l.principalAmount ?? 0),
      0,
    );

    // Net worth
    const totalAssets =
      stocksValue +
      etfsValue +
      eurobondsValue +
      cashValue +
      goldValue +
      silverValue;
    const netWorth = totalAssets - totalDebt;

    return {
      netWorth,
      totalAssets,
      totalDebt,
      breakdown: {
        stocks: { count: stocks.length, value: stocksValue },
        etfs: { count: etfs.length, value: etfsValue },
        eurobonds: { count: eurobonds.length, value: eurobondsValue },
        cash: { count: cash.length, value: cashValue },
        gold: { count: gold.length, value: goldValue },
        silver: { count: silver.length, value: silverValue },
        loans: { count: loans.length, balance: totalDebt },
      },
      monthly: {
        income: incomes.total,
        expenses: expenses.total,
        savings: incomes.total - expenses.total,
        savingsRate:
          incomes.total > 0
            ? (
                ((incomes.total - expenses.total) / incomes.total) *
                100
              ).toFixed(1)
            : 0,
      },
      fxRates: {
        ...Object.fromEntries(FX_PAIRS.map((p) => [p, fxRates[p].rate])),
        fetchedAt: this.latestFetchedAt(fxRates),
      },
      warnings,
      ...(stale ? { stale: true } : {}),
    };
  }

  private async getMonthlyIncomes(userId: string) {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
    );

    const incomes = await this.prisma.income.findMany({
      where: {
        userId,
        date: { gte: startDate, lte: endDate },
      },
    });

    return {
      total: incomes.reduce((sum, i) => sum + Number(i.amount), 0),
      count: incomes.length,
    };
  }

  private async getMonthlyExpenses(userId: string) {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
    );

    const expenses = await this.prisma.expense.findMany({
      where: {
        userId,
        date: { gte: startDate, lte: endDate },
      },
    });

    return {
      total: expenses.reduce((sum, e) => sum + Number(e.amount), 0),
      count: expenses.length,
    };
  }

  async getRecentTransactions(userId: string, limit = 10) {
    const [incomes, expenses] = await Promise.all([
      this.prisma.income.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
        take: limit,
      }),
      this.prisma.expense.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
        take: limit,
      }),
    ]);

    const transactions = [
      ...incomes.map((i) => ({
        id: i.id,
        type: 'income' as const,
        amount: Number(i.amount),
        description: i.description || i.type,
        category: i.type,
        date: i.date,
        currency: i.currency,
      })),
      ...expenses.map((e) => ({
        id: e.id,
        type: 'expense' as const,
        amount: -Number(e.amount),
        description: e.description || e.category,
        category: e.category,
        date: e.date,
        currency: e.currency,
      })),
    ];

    return transactions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  }
}
