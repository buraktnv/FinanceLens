import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  mockIncomes,
  mockIncomeSummary,
  mockExpenses,
  mockExpenseSummary,
} from '../mock-data'

// Each CRUD test loads a fresh api-mock module instance (vi.resetModules) so
// mutations to the module-level mock arrays never leak between tests.
async function loadApiMock() {
  vi.resetModules()
  return import('../api-mock')
}

function firstOf<T>(items: T[]): T {
  const [first] = items
  if (!first) throw new Error('expected non-empty list')
  return first
}

const INCOME_TYPES = [
  'SALARY',
  'RENTAL',
  'DIVIDEND',
  'INTEREST',
  'BONUS',
  'FREELANCE',
  'GIFT',
  'REFUND',
  'SALE',
  'OTHER',
]

const FREQUENCIES = ['DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'SEMIANNUAL', 'ANNUAL']

const EXPENSE_CATEGORIES = [
  'RENT',
  'MORTGAGE_PAYMENT',
  'UTILITIES',
  'INTERNET',
  'PHONE',
  'MAINTENANCE',
  'INSURANCE',
  'HOA_FEE',
  'PROPERTY_TAX',
  'TRANSPORTATION',
  'FUEL',
  'CAR_PAYMENT',
  'CAR_INSURANCE',
  'CAR_MAINTENANCE',
  'PARKING',
  'GROCERIES',
  'DINING',
  'COFFEE',
  'HEALTHCARE',
  'EDUCATION',
  'ENTERTAINMENT',
  'SHOPPING',
  'CLOTHING',
  'PERSONAL_CARE',
  'GYM',
  'SUBSCRIPTIONS',
  'TRAVEL',
  'GIFTS',
  'DONATIONS',
  'TAXES',
  'FEES',
  'OTHER',
]

const PAYMENT_METHODS = ['CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'MOBILE_PAYMENT', 'CRYPTO', 'OTHER']

beforeEach(() => {
  delete process.env.NEXT_PUBLIC_USE_MOCK_DATA
})

afterEach(() => {
  delete process.env.NEXT_PUBLIC_USE_MOCK_DATA
})

describe('USE_MOCK_DATA flag', () => {
  it('defaults to false when NEXT_PUBLIC_USE_MOCK_DATA is unset', async () => {
    const { USE_MOCK_DATA } = await loadApiMock()
    expect(USE_MOCK_DATA).toBe(false)
  })

  it('is true when NEXT_PUBLIC_USE_MOCK_DATA=true', async () => {
    process.env.NEXT_PUBLIC_USE_MOCK_DATA = 'true'
    const { USE_MOCK_DATA } = await loadApiMock()
    expect(USE_MOCK_DATA).toBe(true)
  })

  it('is false when NEXT_PUBLIC_USE_MOCK_DATA=false', async () => {
    process.env.NEXT_PUBLIC_USE_MOCK_DATA = 'false'
    const { USE_MOCK_DATA } = await loadApiMock()
    expect(USE_MOCK_DATA).toBe(false)
  })
})

describe('mockStocksApi', () => {
  it('getAll hands out a fresh array copy while keeping live item references', async () => {
    const { mockStocksApi } = await loadApiMock()
    const first = await mockStocksApi.getAll()
    const second = await mockStocksApi.getAll()
    // Contract: every list call returns a defensive array copy, but the items
    // inside are the live stored objects (create/update/delete stay visible).
    expect(first).not.toBe(second)
    expect(first[0]).toBe(second[0])
  })

  it('create adds the stock so getAll returns the same reference', async () => {
    const { mockStocksApi } = await loadApiMock()
    const created = await mockStocksApi.create({
      symbol: 'THYAO',
      name: 'Turk Hava Yollari',
      quantity: 10,
      purchasePrice: 250,
      currency: 'TRY',
      purchaseDate: '2026-01-15',
    })
    const list = await mockStocksApi.getAll()
    expect(list.find((s) => s.id === created.id)).toBe(created)
  })

  it('update persists the change in the list', async () => {
    const { mockStocksApi } = await loadApiMock()
    const before = await mockStocksApi.getAll()
    const target = firstOf(before)
    const updated = await mockStocksApi.update(target.id, { quantity: 999 })
    expect(updated.quantity).toBe(999)
    const after = await mockStocksApi.getAll()
    expect(after.find((s) => s.id === target.id)).toBe(updated)
  })

  it('delete removes the stock from the list', async () => {
    const { mockStocksApi } = await loadApiMock()
    const before = await mockStocksApi.getAll()
    const targetId = firstOf(before).id
    await mockStocksApi.delete(targetId)
    const after = await mockStocksApi.getAll()
    expect(after.find((s) => s.id === targetId)).toBeUndefined()
    expect(after).toHaveLength(before.length - 1)
  })

  it('assigns a unique id even when a deletion freed a lower number', async () => {
    const { mockStocksApi } = await loadApiMock()
    const before = await mockStocksApi.getAll()
    await mockStocksApi.delete(firstOf(before.slice(1)).id)
    const created = await mockStocksApi.create({
      symbol: 'ASELS',
      name: 'Aselsan',
      quantity: 5,
      purchasePrice: 40,
      purchaseDate: '2026-02-01',
    })
    const after = await mockStocksApi.getAll()
    expect(after.filter((s) => s.id === created.id)).toHaveLength(1)
  })
})

describe('mockExpensesApi', () => {
  it('create with GROCERIES persists and matches a category filter', async () => {
    const { mockExpensesApi } = await loadApiMock()
    const created = await mockExpensesApi.create({
      amount: 320.5,
      currency: 'TRY',
      category: 'GROCERIES',
      description: 'Haftalik market',
      date: '2026-08-20',
      paymentMethod: 'CREDIT_CARD',
    })
    const all = await mockExpensesApi.getAll()
    expect(all.find((e) => e.id === created.id)).toBe(created)
    const groceriesOnly = await mockExpensesApi.getAll({ category: 'GROCERIES' })
    expect(groceriesOnly.some((e) => e.id === created.id)).toBe(true)
  })

  it('update persists the change in the list', async () => {
    const { mockExpensesApi } = await loadApiMock()
    const before = await mockExpensesApi.getAll()
    const target = firstOf(before)
    const updated = await mockExpensesApi.update(target.id, { amount: 4242 })
    expect(updated.amount).toBe(4242)
    const after = await mockExpensesApi.getAll()
    expect(after.find((e) => e.id === target.id)?.amount).toBe(4242)
  })

  it('delete removes the expense from the list', async () => {
    const { mockExpensesApi } = await loadApiMock()
    const before = await mockExpensesApi.getAll()
    const targetId = firstOf(before).id
    await mockExpensesApi.delete(targetId)
    const after = await mockExpensesApi.getAll()
    expect(after.find((e) => e.id === targetId)).toBeUndefined()
    expect(after).toHaveLength(before.length - 1)
  })
})

describe('mockIncomesApi', () => {
  it('create with SALARY type and MONTHLY frequency persists', async () => {
    const { mockIncomesApi } = await loadApiMock()
    const created = await mockIncomesApi.create({
      amount: 40000,
      currency: 'TRY',
      type: 'SALARY',
      description: 'Aylik maas',
      date: '2026-08-15',
      isRecurring: true,
      frequency: 'MONTHLY',
    })
    const all = await mockIncomesApi.getAll()
    const stored = all.find((i) => i.id === created.id)
    expect(stored).toBe(created)
    expect(stored?.frequency).toBe('MONTHLY')
  })
})

describe('mock fixtures use Prisma enum values', () => {
  it('income types and frequencies are valid enum members', () => {
    for (const income of mockIncomes) {
      expect(INCOME_TYPES).toContain(income.type)
      if (income.frequency) expect(FREQUENCIES).toContain(income.frequency)
    }
  })

  it('income summary byType keys are valid IncomeType members', () => {
    for (const key of Object.keys(mockIncomeSummary.byType)) {
      expect(INCOME_TYPES).toContain(key)
    }
  })

  it('expense categories, frequencies and payment methods are valid enum members', () => {
    for (const expense of mockExpenses) {
      expect(EXPENSE_CATEGORIES).toContain(expense.category)
      if (expense.paymentMethod) expect(PAYMENT_METHODS).toContain(expense.paymentMethod)
      if (expense.frequency) expect(FREQUENCIES).toContain(expense.frequency)
    }
  })

  it('expense summary keys are valid enum members', () => {
    for (const key of Object.keys(mockExpenseSummary.byCategory)) {
      expect(EXPENSE_CATEGORIES).toContain(key)
    }
    for (const key of Object.keys(mockExpenseSummary.byPaymentMethod)) {
      expect(PAYMENT_METHODS).toContain(key)
    }
  })
})
