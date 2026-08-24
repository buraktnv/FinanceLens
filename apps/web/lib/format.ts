const DASH = '—'

function toFiniteNumber(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  const trimmed = value.trim()
  if (trimmed === '') return null
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : null
}

export function formatCurrency(
  amount: number | string | null | undefined,
  currency = 'TRY',
): string {
  const amountNumber = toFiniteNumber(amount)
  if (amountNumber === null) return DASH
  try {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amountNumber)
  } catch {
    return DASH
  }
}

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

function toDateString(date: Date): string {
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}`
}

export function formatDate(input: string | Date | null | undefined): string {
  if (input === null || input === undefined || input === '') return DASH
  if (typeof input === 'string') {
    const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input.trim())
    if (isoMatch) {
      const [, year, month, day] = isoMatch
      const parsed = new Date(Number(year), Number(month) - 1, Number(day))
      if (
        Number.isNaN(parsed.getTime()) ||
        parsed.getFullYear() !== Number(year) ||
        parsed.getMonth() !== Number(month) - 1 ||
        parsed.getDate() !== Number(day)
      ) {
        return DASH
      }
      return `${day}.${month}.${year}`
    }
    const parsed = new Date(input)
    if (Number.isNaN(parsed.getTime())) return DASH
    return toDateString(parsed)
  }
  if (!(input instanceof Date)) return DASH
  if (Number.isNaN(input.getTime())) return DASH
  return toDateString(input)
}

export function formatPercent(value: number | string | null | undefined): string {
  const valueNumber = toFiniteNumber(value)
  if (valueNumber === null) return DASH
  return `%${valueNumber.toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}
