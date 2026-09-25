export function formatCurrency(value, currency = 'usd', { compact = false } = {}) {
  if (!isFiniteNumber(value)) return '—'

  const amount = Number(value)
  const abs = Math.abs(amount)
  const digits = abs >= 1 ? 2 : abs >= 0.01 ? 4 : 6

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    notation: compact ? 'compact' : 'standard',
    maximumFractionDigits: compact ? 2 : digits,
    minimumFractionDigits: compact ? 2 : Math.min(2, digits),
  }).format(amount)
}

export function formatPercent(value) {
  if (!isFiniteNumber(value)) return '—'

  const amount = Number(value)
  const sign = amount > 0 ? '+' : ''
  return `${sign}${amount.toFixed(2)}%`
}

export function formatSupply(value) {
  if (!isFiniteNumber(value)) return '—'
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 2,
  }).format(Number(value))
}

export function formatDateTime(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function formatCount(value) {
  if (!isFiniteNumber(value)) return '—'
  return new Intl.NumberFormat('en-US').format(Number(value))
}

export function changeDirection(value) {
  if (!isFiniteNumber(value) || Number(value) === 0) return 'flat'
  return Number(value) > 0 ? 'up' : 'down'
}

function isFiniteNumber(value) {
  return value != null && Number.isFinite(Number(value))
}
