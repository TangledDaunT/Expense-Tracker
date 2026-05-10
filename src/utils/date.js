export function toLocalDateInputValue(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function parseExpenseDate(value) {
  if (typeof value !== 'string') return null

  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return null

  const parsed = new Date(year, month - 1, day)
  if (Number.isNaN(parsed.getTime())) return null

  return parsed
}

export function getExpenseTimestamp(value) {
  return parseExpenseDate(value)?.getTime() ?? 0
}
