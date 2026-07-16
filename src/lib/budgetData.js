export const DEFAULT_BUDGET_LIMITS = [
  { category: 'Shopping', limit: 2000, color: '#f46f5b' },
  { category: 'Food & Groceries', limit: 1500, color: '#31b878' },
  { category: 'Entertainment', limit: 800, color: '#526f8d' },
  { category: 'Bills & Transport', limit: 2000, color: '#e4b44f' },
]

export function futureDate(days) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-')
}

export const DEFAULT_BILLS = [
  { id: 'stc', name: 'STC', amount: 240, dueDate: futureDate(3) },
  { id: 'netflix', name: 'Netflix', amount: 55, dueDate: futureDate(7) },
]
