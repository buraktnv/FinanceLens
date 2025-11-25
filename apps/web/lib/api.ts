const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface RequestOptions extends RequestInit {
  params?: Record<string, string>;
}

async function getAccessToken(): Promise<string | null> {
  if (typeof window === 'undefined') {
    return null;
  }
  const { createClient } = await import('./supabase/client');
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, ...fetchOptions } = options;

  const url = new URL(`${API_URL}${endpoint}`);

  // Add additional params
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }

  // Get access token
  const token = await getAccessToken();

  const response = await fetch(url.toString(), {
    ...fetchOptions,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...fetchOptions.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// Dashboard API
export const dashboardApi = {
  getOverview: () => request<DashboardOverview>('/dashboard/overview'),
  getRecentTransactions: (limit = 10) =>
    request<Transaction[]>('/dashboard/transactions', { params: { limit: String(limit) } }),
};

// Stocks API
export const stocksApi = {
  getAll: () => request<Stock[]>('/stocks'),
  getOne: (id: string) => request<Stock>(`/stocks/${id}`),
  getSummary: () => request<StockSummary>('/stocks/summary'),
  create: (data: CreateStockInput) =>
    request<Stock>('/stocks', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<CreateStockInput>) =>
    request<Stock>(`/stocks/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) =>
    request<void>(`/stocks/${id}`, { method: 'DELETE' }),
};

// Eurobonds API
export const eurobondsApi = {
  getAll: () => request<Eurobond[]>('/eurobonds'),
  getOne: (id: string) => request<Eurobond>(`/eurobonds/${id}`),
  getSummary: () => request<EurobondSummary>('/eurobonds/summary'),
  create: (data: CreateEurobondInput) =>
    request<Eurobond>('/eurobonds', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<CreateEurobondInput>) =>
    request<Eurobond>(`/eurobonds/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) =>
    request<void>(`/eurobonds/${id}`, { method: 'DELETE' }),
};

// ETFs API
export const etfsApi = {
  getAll: () => request<ETF[]>('/etfs'),
  getOne: (id: string) => request<ETF>(`/etfs/${id}`),
  getSummary: () => request<ETFSummary>('/etfs/summary'),
  create: (data: CreateETFInput) =>
    request<ETF>('/etfs', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<CreateETFInput>) =>
    request<ETF>(`/etfs/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) =>
    request<void>(`/etfs/${id}`, { method: 'DELETE' }),
};

// Incomes API
export const incomesApi = {
  getAll: (filters?: IncomeFilters) => {
    const params: Record<string, string> = {};
    if (filters?.type) params.type = filters.type;
    if (filters?.startDate) params.startDate = filters.startDate;
    if (filters?.endDate) params.endDate = filters.endDate;
    return request<Income[]>('/incomes', { params });
  },
  getOne: (id: string) => request<Income>(`/incomes/${id}`),
  getSummary: (month?: number, year?: number) => {
    const params: Record<string, string> = {};
    if (month) params.month = String(month);
    if (year) params.year = String(year);
    return request<IncomeSummary>('/incomes/summary', { params });
  },
  create: (data: CreateIncomeInput) =>
    request<Income>('/incomes', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<CreateIncomeInput>) =>
    request<Income>(`/incomes/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) =>
    request<void>(`/incomes/${id}`, { method: 'DELETE' }),
};

// Expenses API
export const expensesApi = {
  getAll: (filters?: ExpenseFilters) => {
    const params: Record<string, string> = {};
    if (filters?.category) params.category = filters.category;
    if (filters?.paymentMethod) params.paymentMethod = filters.paymentMethod;
    if (filters?.startDate) params.startDate = filters.startDate;
    if (filters?.endDate) params.endDate = filters.endDate;
    return request<Expense[]>('/expenses', { params });
  },
  getOne: (id: string) => request<Expense>(`/expenses/${id}`),
  getSummary: (month?: number, year?: number) => {
    const params: Record<string, string> = {};
    if (month) params.month = String(month);
    if (year) params.year = String(year);
    return request<ExpenseSummary>('/expenses/summary', { params });
  },
  create: (data: CreateExpenseInput) =>
    request<Expense>('/expenses', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<CreateExpenseInput>) =>
    request<Expense>(`/expenses/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) =>
    request<void>(`/expenses/${id}`, { method: 'DELETE' }),
};

// Types
export interface DashboardOverview {
  netWorth: number;
  totalAssets: number;
  totalDebt: number;
  breakdown: {
    stocks: { count: number; value: number };
    etfs: { count: number; value: number };
    eurobonds: { count: number; value: number };
    loans: { count: number; balance: number };
  };
  monthly: {
    income: number;
    expenses: number;
    savings: number;
    savingsRate: number | string;
  };
}

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string;
  date: string;
  currency: string;
}

export interface Stock {
  id: string;
  symbol: string;
  name: string;
  quantity: number;
  purchasePrice: number;
  currency: string;
  purchaseDate: string;
  broker?: string;
  notes?: string;
  dividends: Dividend[];
}

export interface Dividend {
  id: string;
  amount: number;
  currency: string;
  paymentDate: string;
  taxWithheld?: number;
}

export interface StockSummary {
  totalStocks: number;
  totalCost: number;
  totalDividends: number;
  stocks: Array<{
    id: string;
    symbol: string;
    name: string;
    quantity: number;
    purchasePrice: number;
    currency: string;
    totalCost: number;
  }>;
}

export interface CreateStockInput {
  symbol: string;
  name: string;
  quantity: number;
  purchasePrice: number;
  currency?: string;
  purchaseDate: string;
  broker?: string;
  notes?: string;
}

export interface Eurobond {
  id: string;
  name: string;
  isin?: string;
  faceValue: number;
  purchasePrice: number;
  quantity: number;
  couponRate: number;
  currency: string;
  purchaseDate: string;
  maturityDate: string;
  couponFrequency: number;
  broker?: string;
  notes?: string;
  couponPayments: CouponPayment[];
}

export interface CouponPayment {
  id: string;
  amount: number;
  currency: string;
  paymentDate: string;
  taxWithheld?: number;
}

export interface EurobondSummary {
  totalBonds: number;
  totalFaceValue: number;
  totalCurrentValue: number;
  annualCouponIncome: number;
  eurobonds: Array<{
    id: string;
    name: string;
    isin?: string;
    faceValue: number;
    quantity: number;
    couponRate: number;
    currency: string;
    maturityDate: string;
  }>;
}

export interface CreateEurobondInput {
  name: string;
  isin?: string;
  faceValue: number;
  purchasePrice: number;
  quantity: number;
  couponRate: number;
  currency?: string;
  purchaseDate: string;
  maturityDate: string;
  couponFrequency?: number;
  broker?: string;
  notes?: string;
}

export interface ETF {
  id: string;
  symbol: string;
  name: string;
  quantity: number;
  purchasePrice: number;
  currency: string;
  purchaseDate: string;
  expenseRatio?: number;
  broker?: string;
  notes?: string;
  distributions: ETFDistribution[];
}

export interface ETFDistribution {
  id: string;
  amount: number;
  currency: string;
  paymentDate: string;
  taxWithheld?: number;
  type: string;
}

export interface ETFSummary {
  totalEtfs: number;
  totalValue: number;
  totalDistributions: number;
  etfs: Array<{
    id: string;
    symbol: string;
    name: string;
    quantity: number;
    purchasePrice: number;
    expenseRatio?: number;
    currency: string;
    totalValue: number;
  }>;
}

export interface CreateETFInput {
  symbol: string;
  name: string;
  quantity: number;
  purchasePrice: number;
  currency?: string;
  purchaseDate: string;
  expenseRatio?: number;
  broker?: string;
  notes?: string;
}

export interface Income {
  id: string;
  amount: number;
  currency: string;
  type: string;
  description?: string;
  date: string;
  isRecurring: boolean;
  frequency?: string;
  propertyId?: string;
  notes?: string;
}

export interface IncomeSummary {
  month: number;
  year: number;
  total: number;
  recurring: number;
  nonRecurring: number;
  byType: Record<string, number>;
  count: number;
}

export interface IncomeFilters {
  type?: string;
  startDate?: string;
  endDate?: string;
}

export interface CreateIncomeInput {
  amount: number;
  currency?: string;
  type: string;
  description?: string;
  date: string;
  isRecurring?: boolean;
  frequency?: string;
  propertyId?: string;
  notes?: string;
}

export interface Expense {
  id: string;
  amount: number;
  currency: string;
  category: string;
  description?: string;
  date: string;
  isRecurring: boolean;
  frequency?: string;
  paymentMethod?: string;
  propertyId?: string;
  notes?: string;
}

export interface ExpenseSummary {
  month: number;
  year: number;
  total: number;
  recurring: number;
  nonRecurring: number;
  byCategory: Record<string, number>;
  byPaymentMethod: Record<string, number>;
  count: number;
}

export interface ExpenseFilters {
  category?: string;
  paymentMethod?: string;
  startDate?: string;
  endDate?: string;
}

export interface CreateExpenseInput {
  amount: number;
  currency?: string;
  category: string;
  description?: string;
  date: string;
  isRecurring?: boolean;
  frequency?: string;
  paymentMethod?: string;
  propertyId?: string;
  notes?: string;
}

// Yahoo Finance API
export const yahooFinanceApi = {
  search: (query: string) =>
    request<YahooSearchResult[]>('/yahoo-finance/search', { params: { q: query } }),
  getQuote: (symbol: string) =>
    request<YahooQuote>(`/yahoo-finance/quote/${symbol}`),
  getHistorical: (symbol: string, period1: number, period2: number, interval = '1d') =>
    request<any>(`/yahoo-finance/historical/${symbol}`, {
      params: {
        period1: String(period1),
        period2: String(period2),
        interval,
      },
    }),
};

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
