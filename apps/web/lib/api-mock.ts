// Mock API toggle — set NEXT_PUBLIC_USE_MOCK_DATA=false in .env.local to use the real API
export const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA !== 'false';

import {
  mockDashboardOverview,
  mockTransactions,
  mockStocks,
  mockStockSummary,
  mockYahooQuotes,
  mockETFs,
  mockETFSummary,
  mockEurobonds,
  mockEurobondSummary,
  mockCash,
  mockCashSummary,
  mockGold,
  mockGoldSummary,
  mockSilver,
  mockSilverSummary,
  mockGoldPrice,
  mockSilverPrice,
  mockIncomes,
  mockIncomeSummary,
  mockExpenses,
  mockExpenseSummary,
} from './mock-data';

import type {
  DashboardOverview,
  Transaction,
  Stock,
  StockSummary,
  CreateStockInput,
  Eurobond,
  EurobondSummary,
  CreateEurobondInput,
  ETF,
  ETFSummary,
  CreateETFInput,
  Income,
  IncomeSummary,
  IncomeFilters,
  CreateIncomeInput,
  Expense,
  ExpenseSummary,
  ExpenseFilters,
  CreateExpenseInput,
  Cash,
  CashSummary,
  CreateCashInput,
  Gold,
  GoldSummary,
  CreateGoldInput,
  Silver,
  SilverSummary,
  CreateSilverInput,
  PreciousMetalPrice,
  YahooQuote,
  YahooSearchResult,
  YahooHistoricalData,
} from './api';

// Helper to simulate API delay
const delay = (ms: number = 300) => new Promise(resolve => setTimeout(resolve, ms));

// Mock Dashboard API
export const mockDashboardApi = {
  getOverview: async (): Promise<DashboardOverview> => {
    await delay();
    return mockDashboardOverview;
  },
  getRecentTransactions: async (limit = 10): Promise<Transaction[]> => {
    await delay();
    return mockTransactions.slice(0, limit);
  },
};

// Mock Stocks API
export const mockStocksApi = {
  getAll: async (): Promise<Stock[]> => {
    await delay();
    return mockStocks;
  },
  getOne: async (id: string): Promise<Stock> => {
    await delay();
    const stock = mockStocks.find(s => s.id === id);
    if (!stock) throw new Error('Stock not found');
    return stock;
  },
  getSummary: async (): Promise<StockSummary> => {
    await delay();
    return mockStockSummary;
  },
  create: async (data: CreateStockInput): Promise<Stock> => {
    await delay();
    const newStock: Stock = {
      id: String(mockStocks.length + 1),
      ...data,
      currency: data.currency || 'USD',
      dividends: [],
    };
    return newStock;
  },
  update: async (id: string, data: Partial<CreateStockInput>): Promise<Stock> => {
    await delay();
    const stock = mockStocks.find(s => s.id === id);
    if (!stock) throw new Error('Stock not found');
    return { ...stock, ...data };
  },
  delete: async (_id: string): Promise<void> => {
    await delay();
  },
};

// Mock Eurobonds API
export const mockEurobondsApi = {
  getAll: async (): Promise<Eurobond[]> => {
    await delay();
    return mockEurobonds;
  },
  getOne: async (id: string): Promise<Eurobond> => {
    await delay();
    const eurobond = mockEurobonds.find(e => e.id === id);
    if (!eurobond) throw new Error('Eurobond not found');
    return eurobond;
  },
  getSummary: async (): Promise<EurobondSummary> => {
    await delay();
    return mockEurobondSummary;
  },
  create: async (data: CreateEurobondInput): Promise<Eurobond> => {
    await delay();
    const newEurobond: Eurobond = {
      id: String(mockEurobonds.length + 1),
      ...data,
      currency: data.currency || 'USD',
      couponFrequency: data.couponFrequency || 2,
      couponPayments: [],
    };
    return newEurobond;
  },
  update: async (id: string, data: Partial<CreateEurobondInput>): Promise<Eurobond> => {
    await delay();
    const eurobond = mockEurobonds.find(e => e.id === id);
    if (!eurobond) throw new Error('Eurobond not found');
    return { ...eurobond, ...data };
  },
  delete: async (_id: string): Promise<void> => {
    await delay();
  },
};

// Mock ETFs API
export const mockEtfsApi = {
  getAll: async (): Promise<ETF[]> => {
    await delay();
    return mockETFs;
  },
  getOne: async (id: string): Promise<ETF> => {
    await delay();
    const etf = mockETFs.find(e => e.id === id);
    if (!etf) throw new Error('ETF not found');
    return etf;
  },
  getSummary: async (): Promise<ETFSummary> => {
    await delay();
    return mockETFSummary;
  },
  create: async (data: CreateETFInput): Promise<ETF> => {
    await delay();
    const newETF: ETF = {
      id: String(mockETFs.length + 1),
      ...data,
      currency: data.currency || 'USD',
      distributions: [],
    };
    return newETF;
  },
  update: async (id: string, data: Partial<CreateETFInput>): Promise<ETF> => {
    await delay();
    const etf = mockETFs.find(e => e.id === id);
    if (!etf) throw new Error('ETF not found');
    return { ...etf, ...data };
  },
  delete: async (_id: string): Promise<void> => {
    await delay();
  },
};

// Mock Incomes API
export const mockIncomesApi = {
  getAll: async (filters?: IncomeFilters): Promise<Income[]> => {
    await delay();
    let filtered = [...mockIncomes];
    if (filters?.type) {
      filtered = filtered.filter(i => i.type === filters.type);
    }
    return filtered;
  },
  getOne: async (id: string): Promise<Income> => {
    await delay();
    const income = mockIncomes.find(i => i.id === id);
    if (!income) throw new Error('Income not found');
    return income;
  },
  getSummary: async (_month?: number, _year?: number): Promise<IncomeSummary> => {
    await delay();
    return mockIncomeSummary;
  },
  create: async (data: CreateIncomeInput): Promise<Income> => {
    await delay();
    const newIncome: Income = {
      id: String(mockIncomes.length + 1),
      ...data,
      currency: data.currency || 'USD',
      isRecurring: data.isRecurring || false,
    };
    return newIncome;
  },
  update: async (id: string, data: Partial<CreateIncomeInput>): Promise<Income> => {
    await delay();
    const income = mockIncomes.find(i => i.id === id);
    if (!income) throw new Error('Income not found');
    return { ...income, ...data };
  },
  delete: async (_id: string): Promise<void> => {
    await delay();
  },
};

// Mock Expenses API
export const mockExpensesApi = {
  getAll: async (filters?: ExpenseFilters): Promise<Expense[]> => {
    await delay();
    let filtered = [...mockExpenses];
    if (filters?.category) {
      filtered = filtered.filter(e => e.category === filters.category);
    }
    return filtered;
  },
  getOne: async (id: string): Promise<Expense> => {
    await delay();
    const expense = mockExpenses.find(e => e.id === id);
    if (!expense) throw new Error('Expense not found');
    return expense;
  },
  getSummary: async (_month?: number, _year?: number): Promise<ExpenseSummary> => {
    await delay();
    return mockExpenseSummary;
  },
  create: async (data: CreateExpenseInput): Promise<Expense> => {
    await delay();
    const newExpense: Expense = {
      id: String(mockExpenses.length + 1),
      ...data,
      currency: data.currency || 'USD',
      isRecurring: data.isRecurring || false,
    };
    return newExpense;
  },
  update: async (id: string, data: Partial<CreateExpenseInput>): Promise<Expense> => {
    await delay();
    const expense = mockExpenses.find(e => e.id === id);
    if (!expense) throw new Error('Expense not found');
    return { ...expense, ...data };
  },
  delete: async (_id: string): Promise<void> => {
    await delay();
  },
};

// Mock Cash API
export const mockCashApi = {
  getAll: async (): Promise<Cash[]> => {
    await delay();
    return mockCash;
  },
  getOne: async (id: string): Promise<Cash> => {
    await delay();
    const cash = mockCash.find(c => c.id === id);
    if (!cash) throw new Error('Cash account not found');
    return cash;
  },
  getSummary: async (): Promise<CashSummary> => {
    await delay();
    return mockCashSummary;
  },
  create: async (data: CreateCashInput): Promise<Cash> => {
    await delay();
    const newCash: Cash = {
      id: String(mockCash.length + 1),
      ...data,
      currency: data.currency || 'USD',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return newCash;
  },
  update: async (id: string, data: Partial<CreateCashInput>): Promise<Cash> => {
    await delay();
    const cash = mockCash.find(c => c.id === id);
    if (!cash) throw new Error('Cash account not found');
    return { ...cash, ...data, updatedAt: new Date().toISOString() };
  },
  delete: async (_id: string): Promise<void> => {
    await delay();
  },
};

// Mock Gold API
export const mockGoldApi = {
  getAll: async (): Promise<Gold[]> => {
    await delay();
    return mockGold;
  },
  getOne: async (id: string): Promise<Gold> => {
    await delay();
    const gold = mockGold.find(g => g.id === id);
    if (!gold) throw new Error('Gold holding not found');
    return gold;
  },
  getSummary: async (): Promise<GoldSummary> => {
    await delay();
    return mockGoldSummary;
  },
  create: async (data: CreateGoldInput): Promise<Gold> => {
    await delay();
    const newGold: Gold = {
      id: String(mockGold.length + 1),
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return newGold;
  },
  update: async (id: string, data: Partial<CreateGoldInput>): Promise<Gold> => {
    await delay();
    const gold = mockGold.find(g => g.id === id);
    if (!gold) throw new Error('Gold holding not found');
    return { ...gold, ...data, updatedAt: new Date().toISOString() };
  },
  delete: async (_id: string): Promise<void> => {
    await delay();
  },
};

// Mock Silver API
export const mockSilverApi = {
  getAll: async (): Promise<Silver[]> => {
    await delay();
    return mockSilver;
  },
  getOne: async (id: string): Promise<Silver> => {
    await delay();
    const silver = mockSilver.find(s => s.id === id);
    if (!silver) throw new Error('Silver holding not found');
    return silver;
  },
  getSummary: async (): Promise<SilverSummary> => {
    await delay();
    return mockSilverSummary;
  },
  create: async (data: CreateSilverInput): Promise<Silver> => {
    await delay();
    const newSilver: Silver = {
      id: String(mockSilver.length + 1),
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return newSilver;
  },
  update: async (id: string, data: Partial<CreateSilverInput>): Promise<Silver> => {
    await delay();
    const silver = mockSilver.find(s => s.id === id);
    if (!silver) throw new Error('Silver holding not found');
    return { ...silver, ...data, updatedAt: new Date().toISOString() };
  },
  delete: async (_id: string): Promise<void> => {
    await delay();
  },
};

// Mock Precious Metals Price API
export const mockPreciousMetalsApi = {
  getGoldPrice: async (): Promise<PreciousMetalPrice> => {
    await delay();
    return mockGoldPrice;
  },
  getSilverPrice: async (): Promise<PreciousMetalPrice> => {
    await delay();
    return mockSilverPrice;
  },
};

// Generates deterministic-ish historical price data via a seeded random walk
// so the chart looks realistic instead of flat or empty.
function generateHistoricalPrices(
  symbol: string,
  period1: number,
  period2: number,
  interval: string,
): YahooHistoricalData {
  const quote = mockYahooQuotes[symbol];
  const endPrice = quote?.regularMarketPrice ?? 100;

  // Determine how many data points based on interval
  let stepSeconds: number;
  switch (interval) {
    case '5m': stepSeconds = 5 * 60; break;
    case '15m': stepSeconds = 15 * 60; break;
    case '1h': stepSeconds = 60 * 60; break;
    case '1wk': stepSeconds = 7 * 24 * 60 * 60; break;
    default: stepSeconds = 24 * 60 * 60; break; // 1d
  }

  const timestamps: number[] = [];
  for (let t = period1; t <= period2; t += stepSeconds) {
    timestamps.push(t);
  }

  // Cap to a reasonable number of points to keep the chart snappy
  const maxPoints = 200;
  const stride = Math.ceil(timestamps.length / maxPoints);
  const sampled = timestamps.filter((_, i) => i % stride === 0);

  // Seeded PRNG (mulberry32) for deterministic output per symbol
  let seed = 0;
  for (const ch of symbol) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0xffffffff;
  };

  // Work backwards from endPrice with a random walk
  const closes: (number | null)[] = new Array(sampled.length);
  closes[sampled.length - 1] = Number(endPrice.toFixed(2));
  const volatility = endPrice * 0.02; // ~2% daily swing
  for (let i = sampled.length - 2; i >= 0; i--) {
    const delta = (random() - 0.48) * volatility * 2;
    const prev = closes[i + 1] ?? endPrice;
    const next = Math.max(0.01, prev - delta);
    closes[i] = Number(next.toFixed(2));
  }

  return {
    symbol,
    timestamp: sampled,
    indicators: {
      quote: [{ close: closes }],
    },
  };
}

// Mock Yahoo Finance API
export const mockYahooFinanceApi = {
  search: async (query: string): Promise<YahooSearchResult[]> => {
    await delay();
    // Simple mock search
    const results: YahooSearchResult[] = [
      { symbol: 'AAPL', name: 'Apple Inc.', type: 'EQUITY', exchange: 'NMS' },
      { symbol: 'MSFT', name: 'Microsoft Corporation', type: 'EQUITY', exchange: 'NMS' },
      { symbol: 'GOOGL', name: 'Alphabet Inc.', type: 'EQUITY', exchange: 'NMS' },
      { symbol: 'TSLA', name: 'Tesla, Inc.', type: 'EQUITY', exchange: 'NMS' },
      { symbol: 'NVDA', name: 'NVIDIA Corporation', type: 'EQUITY', exchange: 'NMS' },
    ];
    return results.filter(r =>
      r.symbol.toLowerCase().includes(query.toLowerCase()) ||
      r.name.toLowerCase().includes(query.toLowerCase())
    );
  },
  getQuote: async (symbol: string): Promise<YahooQuote> => {
    await delay();
    const quote = mockYahooQuotes[symbol];
    if (!quote) {
      throw new Error(`Quote not found for symbol: ${symbol}`);
    }
    return quote;
  },
  getHistorical: async (symbol: string, period1: number, period2: number, interval = '1d'): Promise<YahooHistoricalData> => {
    await delay();
    return generateHistoricalPrices(symbol, period1, period2, interval);
  },
};
