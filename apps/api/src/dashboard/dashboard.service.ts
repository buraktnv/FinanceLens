import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getOverview(userId: string) {
    const [stocks, etfs, eurobonds, incomes, expenses, loans] = await Promise.all([
      this.prisma.stock.findMany({ where: { userId } }),
      this.prisma.eTF.findMany({ where: { userId } }),
      this.prisma.eurobond.findMany({ where: { userId } }),
      this.getMonthlyIncomes(userId),
      this.getMonthlyExpenses(userId),
      this.prisma.loan.findMany({ where: { userId, status: 'ACTIVE' } }),
    ]);

    // Calculate stock values
    const stocksValue = stocks.reduce((sum, s) => sum + Number(s.quantity) * Number(s.purchasePrice), 0);

    // Calculate ETF values
    const etfsValue = etfs.reduce((sum, e) => sum + Number(e.quantity) * Number(e.purchasePrice), 0);

    // Calculate Eurobond values (face value * quantity)
    const eurobondsValue = eurobonds.reduce((sum, e) => sum + Number(e.faceValue) * Number(e.quantity), 0);

    // Calculate loan balances
    const totalDebt = loans.reduce((sum, l) => sum + Number(l.remainingBalance || l.principalAmount), 0);

    // Net worth
    const totalAssets = stocksValue + etfsValue + eurobondsValue;
    const netWorth = totalAssets - totalDebt;

    return {
      netWorth,
      totalAssets,
      totalDebt,
      breakdown: {
        stocks: { count: stocks.length, value: stocksValue },
        etfs: { count: etfs.length, value: etfsValue },
        eurobonds: { count: eurobonds.length, value: eurobondsValue },
        loans: { count: loans.length, balance: totalDebt },
      },
      monthly: {
        income: incomes.total,
        expenses: expenses.total,
        savings: incomes.total - expenses.total,
        savingsRate: incomes.total > 0 ? ((incomes.total - expenses.total) / incomes.total * 100).toFixed(1) : 0,
      },
    };
  }

  private async getMonthlyIncomes(userId: string) {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

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
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

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
      ...incomes.map(i => ({
        id: i.id,
        type: 'income' as const,
        amount: Number(i.amount),
        description: i.description || i.type,
        category: i.type,
        date: i.date,
        currency: i.currency,
      })),
      ...expenses.map(e => ({
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
