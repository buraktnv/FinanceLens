import { describe, expect, it } from 'vitest'
import { formatCurrency, formatDate, formatPercent } from '../format'

const norm = (s: string) => s.replace(/[\u00A0\u202F]/g, ' ')

describe('formatCurrency', () => {
  it('formats TRY with tr-TR grouping and 2 decimals', () => {
    expect(norm(formatCurrency(1234.5, 'TRY'))).toBe('₺1.234,50')
  })

  it('accepts numeric strings and formats USD', () => {
    expect(norm(formatCurrency('1000', 'USD'))).toBe('$1.000,00')
  })

  it('formats GBP', () => {
    expect(norm(formatCurrency(2500, 'GBP'))).toMatch(/^£/)
    expect(norm(formatCurrency(2500, 'GBP'))).toBe('£2.500,00')
  })

  it('formats EUR', () => {
    expect(norm(formatCurrency(999.999, 'EUR'))).toBe('€1.000,00')
  })

  it('defaults to TRY when currency omitted', () => {
    expect(norm(formatCurrency(1234.5))).toBe('₺1.234,50')
  })

  it.each([null, undefined])('returns dash for %s', (input) => {
    expect(formatCurrency(input)).toBe('—')
  })

  it('returns dash for non-numeric string', () => {
    expect(formatCurrency('abc')).toBe('—')
  })

  it('returns dash for NaN', () => {
    expect(formatCurrency(NaN)).toBe('—')
  })

  it('rounds to 2 decimals', () => {
    expect(norm(formatCurrency(10.005, 'TRY'))).toBe('₺10,01')
  })
})

describe('formatDate', () => {
  it('formats ISO date string as DD.MM.YYYY', () => {
    expect(formatDate('2026-03-05')).toBe('05.03.2026')
  })

  it('formats Date instance as DD.MM.YYYY', () => {
    expect(formatDate(new Date(2026, 2, 5))).toBe('05.03.2026')
  })

  it('pads single digit day and month', () => {
    expect(formatDate(new Date(2026, 0, 9))).toBe('09.01.2026')
  })

  it('returns dash for invalid date string', () => {
    expect(formatDate('not-a-date')).toBe('—')
  })

  it('returns dash for null', () => {
    expect(formatDate(null)).toBe('—')
  })

  it('returns dash for undefined', () => {
    expect(formatDate(undefined)).toBe('—')
  })
})

describe('formatPercent', () => {
  it('places percent sign before number with tr decimal comma', () => {
    expect(formatPercent(12.5)).toBe('%12,50')
  })

  it('accepts numeric strings', () => {
    expect(formatPercent('7')).toBe('%7,00')
  })

  it('formats zero', () => {
    expect(formatPercent(0)).toBe('%0,00')
  })

  it('rounds to 2 decimals', () => {
    expect(formatPercent(3.456)).toBe('%3,46')
  })

  it.each([null, undefined, NaN, 'abc'])('returns dash for %s', (input) => {
    expect(formatPercent(input)).toBe('—')
  })
})
