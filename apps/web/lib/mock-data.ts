import type {
  DashboardOverview,
  Transaction,
  Stock,
  StockSummary,
  Eurobond,
  EurobondSummary,
  ETF,
  ETFSummary,
  Income,
  IncomeSummary,
  Expense,
  ExpenseSummary,
  Cash,
  CashSummary,
  Gold,
  GoldSummary,
  Silver,
  SilverSummary,
  PreciousMetalPrice,
  YahooQuote,
} from './api';

// Mock Dashboard Overview
export const mockDashboardOverview: DashboardOverview = {
  netWorth: 125000,
  totalAssets: 145000,
  totalDebt: 20000,
  breakdown: {
    stocks: { count: 5, value: 45000 },
    etfs: { count: 3, value: 25000 },
    eurobonds: { count: 2, value: 15000 },
    cash: { count: 4, value: 35000 },
    gold: { count: 2, value: 18000 },
    silver: { count: 1, value: 7000 },
    loans: { count: 1, balance: 20000 },
  },
  monthly: {
    income: 12000,
    expenses: 7500,
    savings: 4500,
    savingsRate: 37.5,
  },
};

// Mock Recent Transactions
export const mockTransactions: Transaction[] = [
  {
    id: '1',
    type: 'income',
    amount: 8500,
    description: 'Monthly Salary',
    category: 'Salary',
    date: '2024-01-15',
    currency: 'USD',
  },
  {
    id: '2',
    type: 'expense',
    amount: 1500,
    description: 'Apartment Rent',
    category: 'Housing',
    date: '2024-01-10',
    currency: 'USD',
  },
  {
    id: '3',
    type: 'income',
    amount: 250,
    description: 'Stock Dividend - AAPL',
    category: 'Dividends',
    date: '2024-01-08',
    currency: 'USD',
  },
  {
    id: '4',
    type: 'expense',
    amount: 850,
    description: 'Groceries & Food',
    category: 'Food',
    date: '2024-01-05',
    currency: 'USD',
  },
  {
    id: '5',
    type: 'expense',
    amount: 120,
    description: 'Internet & Utilities',
    category: 'Bills',
    date: '2024-01-03',
    currency: 'USD',
  },
];

// Mock Stocks
export const mockStocks: Stock[] = [
  {
    id: '1',
    symbol: 'AAPL',
    name: 'Apple Inc.',
    quantity: 50,
    purchasePrice: 150.00,
    currency: 'USD',
    purchaseDate: '2023-06-15',
    broker: 'Interactive Brokers',
    notes: 'Long-term technology investment',
    dividends: [
      {
        id: 'd1',
        amount: 24.00,
        currency: 'USD',
        paymentDate: '2024-01-08',
        taxWithheld: 3.60,
      },
    ],
  },
  {
    id: '2',
    symbol: 'MSFT',
    name: 'Microsoft Corporation',
    quantity: 30,
    purchasePrice: 280.00,
    currency: 'USD',
    purchaseDate: '2023-08-20',
    broker: 'Interactive Brokers',
    notes: 'Cloud computing leader',
    dividends: [],
  },
  {
    id: '3',
    symbol: 'GOOGL',
    name: 'Alphabet Inc.',
    quantity: 25,
    purchasePrice: 120.00,
    currency: 'USD',
    purchaseDate: '2023-09-10',
    broker: 'TD Ameritrade',
    notes: 'Search and advertising giant',
    dividends: [],
  },
  {
    id: '4',
    symbol: 'TSLA',
    name: 'Tesla Inc.',
    quantity: 20,
    purchasePrice: 200.00,
    currency: 'USD',
    purchaseDate: '2023-11-05',
    broker: 'Robinhood',
    notes: 'Electric vehicle leader',
    dividends: [],
  },
  {
    id: '5',
    symbol: 'NVDA',
    name: 'NVIDIA Corporation',
    quantity: 15,
    purchasePrice: 450.00,
    currency: 'USD',
    purchaseDate: '2023-12-01',
    broker: 'Interactive Brokers',
    notes: 'AI and GPU technology',
    dividends: [],
  },
];

export const mockStockSummary: StockSummary = {
  totalStocks: 5,
  totalCost: 45000,
  totalDividends: 24.00,
  stocks: mockStocks.map(stock => ({
    id: stock.id,
    symbol: stock.symbol,
    name: stock.name,
    quantity: stock.quantity,
    purchasePrice: stock.purchasePrice,
    currency: stock.currency,
    totalCost: stock.quantity * stock.purchasePrice,
  })),
};

// Mock Yahoo Finance Quotes
export const mockYahooQuotes: Record<string, YahooQuote> = {
  'AAPL': {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    regularMarketPrice: 185.50,
    regularMarketChange: 2.35,
    regularMarketChangePercent: 1.28,
    currency: 'USD',
    marketState: 'REGULAR',
  },
  'MSFT': {
    symbol: 'MSFT',
    name: 'Microsoft Corporation',
    regularMarketPrice: 378.90,
    regularMarketChange: 5.20,
    regularMarketChangePercent: 1.39,
    currency: 'USD',
    marketState: 'REGULAR',
  },
  'GOOGL': {
    symbol: 'GOOGL',
    name: 'Alphabet Inc.',
    regularMarketPrice: 142.75,
    regularMarketChange: 1.85,
    regularMarketChangePercent: 1.31,
    currency: 'USD',
    marketState: 'REGULAR',
  },
  'TSLA': {
    symbol: 'TSLA',
    name: 'Tesla Inc.',
    regularMarketPrice: 245.30,
    regularMarketChange: -3.20,
    regularMarketChangePercent: -1.29,
    currency: 'USD',
    marketState: 'REGULAR',
  },
  'NVDA': {
    symbol: 'NVDA',
    name: 'NVIDIA Corporation',
    regularMarketPrice: 725.80,
    regularMarketChange: 12.45,
    regularMarketChangePercent: 1.75,
    currency: 'USD',
    marketState: 'REGULAR',
  },
};

// Mock ETFs
export const mockETFs: ETF[] = [
  {
    id: '1',
    symbol: 'VOO',
    name: 'Vanguard S&P 500 ETF',
    quantity: 100,
    purchasePrice: 350.00,
    currency: 'USD',
    purchaseDate: '2023-07-10',
    expenseRatio: 0.03,
    broker: 'Vanguard',
    notes: 'Low-cost S&P 500 index fund',
    distributions: [],
  },
  {
    id: '2',
    symbol: 'VTI',
    name: 'Vanguard Total Stock Market ETF',
    quantity: 75,
    purchasePrice: 200.00,
    currency: 'USD',
    purchaseDate: '2023-08-15',
    expenseRatio: 0.03,
    broker: 'Vanguard',
    notes: 'Total US stock market exposure',
    distributions: [],
  },
  {
    id: '3',
    symbol: 'VXUS',
    name: 'Vanguard Total International Stock ETF',
    quantity: 50,
    purchasePrice: 55.00,
    currency: 'USD',
    purchaseDate: '2023-10-01',
    expenseRatio: 0.08,
    broker: 'Vanguard',
    notes: 'International diversification',
    distributions: [],
  },
];

export const mockETFSummary: ETFSummary = {
  totalEtfs: 3,
  totalValue: 25000,
  totalDistributions: 0,
  etfs: mockETFs.map(etf => ({
    id: etf.id,
    symbol: etf.symbol,
    name: etf.name,
    quantity: etf.quantity,
    purchasePrice: etf.purchasePrice,
    expenseRatio: etf.expenseRatio,
    currency: etf.currency,
    totalValue: etf.quantity * etf.purchasePrice,
  })),
};

// Mock Eurobonds
export const mockEurobonds: Eurobond[] = [
  {
    id: '1',
    name: 'Turkey 2028 Eurobond',
    isin: 'XS1234567890',
    faceValue: 1000,
    purchasePrice: 950,
    quantity: 10,
    couponRate: 5.75,
    currency: 'USD',
    purchaseDate: '2023-05-20',
    maturityDate: '2028-05-20',
    couponFrequency: 2,
    broker: 'JPMorgan',
    notes: 'Turkish sovereign bond',
    couponPayments: [],
  },
  {
    id: '2',
    name: 'Poland 2030 Eurobond',
    isin: 'XS0987654321',
    faceValue: 1000,
    purchasePrice: 980,
    quantity: 5,
    couponRate: 4.25,
    currency: 'USD',
    purchaseDate: '2023-09-15',
    maturityDate: '2030-09-15',
    couponFrequency: 2,
    broker: 'Goldman Sachs',
    notes: 'Polish sovereign bond',
    couponPayments: [],
  },
];

export const mockEurobondSummary: EurobondSummary = {
  totalBonds: 2,
  totalFaceValue: 15000,
  totalCurrentValue: 14400,
  annualCouponIncome: 787.50,
  eurobonds: mockEurobonds.map(bond => ({
    id: bond.id,
    name: bond.name,
    isin: bond.isin,
    faceValue: bond.faceValue,
    quantity: bond.quantity,
    couponRate: bond.couponRate,
    currency: bond.currency,
    maturityDate: bond.maturityDate,
  })),
};

// Mock Cash Accounts
export const mockCash: Cash[] = [
  {
    id: '1',
    accountName: 'Primary Checking Account',
    balance: 15000,
    currency: 'USD',
    accountType: 'Checking',
    bankName: 'Chase Bank',
    notes: 'Main transaction account',
    createdAt: '2023-01-10',
    updatedAt: '2024-01-15',
  },
  {
    id: '2',
    accountName: 'Savings Account',
    balance: 12000,
    currency: 'USD',
    accountType: 'Savings',
    bankName: 'Bank of America',
    notes: 'Emergency fund',
    createdAt: '2023-02-05',
    updatedAt: '2024-01-12',
  },
  {
    id: '3',
    accountName: 'Money Market Account',
    balance: 5000,
    currency: 'USD',
    accountType: 'Money Market',
    bankName: 'Wells Fargo',
    notes: 'Short-term savings',
    createdAt: '2023-06-01',
    updatedAt: '2024-01-10',
  },
  {
    id: '4',
    accountName: 'Euro Account',
    balance: 3000,
    currency: 'EUR',
    accountType: 'Foreign Currency',
    bankName: 'Citibank',
    notes: 'European expenses',
    createdAt: '2023-08-15',
    updatedAt: '2024-01-08',
  },
];

export const mockCashSummary: CashSummary = {
  totalAccounts: 4,
  totalBalance: 35000,
  byCurrency: {
    'USD': 32000,
    'EUR': 3000,
  },
  accounts: mockCash.map(account => ({
    id: account.id,
    accountName: account.accountName,
    balance: account.balance,
    currency: account.currency,
    accountType: account.accountType,
    bankName: account.bankName,
  })),
};

// Mock Gold Holdings
export const mockGold: Gold[] = [
  {
    id: '1',
    name: '1oz American Gold Eagle',
    quantity: 10,
    purchasePrice: 1850.00,
    purchaseDate: '2023-04-10',
    purity: '22K (91.67%)',
    location: 'Home Safe',
    notes: 'US Mint coins',
    createdAt: '2023-04-10',
    updatedAt: '2024-01-15',
  },
  {
    id: '2',
    name: 'Gold Bar 100g',
    quantity: 2,
    purchasePrice: 6200.00,
    purchaseDate: '2023-11-20',
    purity: '24K (99.99%)',
    location: 'Bank Vault',
    notes: 'PAMP Suisse bars',
    createdAt: '2023-11-20',
    updatedAt: '2024-01-12',
  },
];

export const mockGoldSummary: GoldSummary = {
  totalHoldings: 2,
  totalQuantity: 12,
  totalCost: 18000,
  holdings: mockGold.map(gold => ({
    id: gold.id,
    name: gold.name,
    quantity: gold.quantity,
    purchasePrice: gold.purchasePrice,
    purchaseDate: gold.purchaseDate,
    purity: gold.purity,
    totalCost: gold.quantity * gold.purchasePrice,
  })),
};

// Mock Silver Holdings
export const mockSilver: Silver[] = [
  {
    id: '1',
    name: '1oz American Silver Eagle',
    quantity: 100,
    purchasePrice: 28.50,
    purchaseDate: '2023-07-15',
    purity: '99.9%',
    location: 'Home Safe',
    notes: 'Silver bullion coins',
    createdAt: '2023-07-15',
    updatedAt: '2024-01-15',
  },
];

export const mockSilverSummary: SilverSummary = {
  totalHoldings: 1,
  totalQuantity: 100,
  totalCost: 7000,
  holdings: mockSilver.map(silver => ({
    id: silver.id,
    name: silver.name,
    quantity: silver.quantity,
    purchasePrice: silver.purchasePrice,
    purchaseDate: silver.purchaseDate,
    purity: silver.purity,
    totalCost: silver.quantity * silver.purchasePrice,
  })),
};

// Mock Precious Metal Prices
export const mockGoldPrice: PreciousMetalPrice = {
  metal: 'GOLD',
  pricePerGram: 65.50,
  pricePerOunce: 2038.00,
  currency: 'TRY',
  lastUpdated: '2024-01-15T10:30:00Z',
  usdToTry: 31.20,
};

export const mockSilverPrice: PreciousMetalPrice = {
  metal: 'SILVER',
  pricePerGram: 0.85,
  pricePerOunce: 26.45,
  currency: 'TRY',
  lastUpdated: '2024-01-15T10:30:00Z',
  usdToTry: 31.20,
};

// Mock Incomes
export const mockIncomes: Income[] = [
  {
    id: '1',
    amount: 8500,
    currency: 'USD',
    type: 'Salary',
    description: 'Monthly salary - Tech Company',
    date: '2024-01-15',
    isRecurring: true,
    frequency: 'monthly',
    notes: 'Regular employment income',
  },
  {
    id: '2',
    amount: 2500,
    currency: 'USD',
    type: 'Freelance',
    description: 'Web development project',
    date: '2024-01-10',
    isRecurring: false,
    notes: 'One-time project payment',
  },
  {
    id: '3',
    amount: 1000,
    currency: 'USD',
    type: 'Rental Income',
    description: 'Apartment rent - Downtown property',
    date: '2024-01-05',
    isRecurring: true,
    frequency: 'monthly',
    propertyId: 'prop-1',
    notes: 'Investment property',
  },
];

export const mockIncomeSummary: IncomeSummary = {
  month: 1,
  year: 2024,
  total: 12000,
  recurring: 9500,
  nonRecurring: 2500,
  byType: {
    'Salary': 8500,
    'Freelance': 2500,
    'Rental Income': 1000,
  },
  count: 3,
};

// Mock Expenses
export const mockExpenses: Expense[] = [
  {
    id: '1',
    amount: 1500,
    currency: 'USD',
    category: 'Housing',
    description: 'Apartment rent',
    date: '2024-01-10',
    isRecurring: true,
    frequency: 'monthly',
    paymentMethod: 'Bank Transfer',
    notes: 'Monthly rent payment',
  },
  {
    id: '2',
    amount: 850,
    currency: 'USD',
    category: 'Food',
    description: 'Groceries and dining',
    date: '2024-01-08',
    isRecurring: false,
    paymentMethod: 'Credit Card',
    notes: 'Monthly food expenses',
  },
  {
    id: '3',
    amount: 200,
    currency: 'USD',
    category: 'Transportation',
    description: 'Gas and public transit',
    date: '2024-01-07',
    isRecurring: false,
    paymentMethod: 'Debit Card',
    notes: 'Commute expenses',
  },
  {
    id: '4',
    amount: 120,
    currency: 'USD',
    category: 'Bills',
    description: 'Internet and utilities',
    date: '2024-01-05',
    isRecurring: true,
    frequency: 'monthly',
    paymentMethod: 'Auto Pay',
    notes: 'Monthly utilities',
  },
  {
    id: '5',
    amount: 80,
    currency: 'USD',
    category: 'Entertainment',
    description: 'Streaming services',
    date: '2024-01-03',
    isRecurring: true,
    frequency: 'monthly',
    paymentMethod: 'Credit Card',
    notes: 'Netflix, Spotify, etc.',
  },
];

export const mockExpenseSummary: ExpenseSummary = {
  month: 1,
  year: 2024,
  total: 7500,
  recurring: 1700,
  nonRecurring: 5800,
  byCategory: {
    'Housing': 1500,
    'Food': 850,
    'Transportation': 200,
    'Bills': 120,
    'Entertainment': 80,
  },
  byPaymentMethod: {
    'Bank Transfer': 1500,
    'Credit Card': 930,
    'Debit Card': 200,
    'Auto Pay': 120,
  },
  count: 5,
};
