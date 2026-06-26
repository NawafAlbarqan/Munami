// Bilingual seam: app defaults to English for now, but every label goes
// through here so flipping LOCALE (or wiring a language switcher) later
// only touches this file.

export const LOCALE = 'en'
export const DIR = LOCALE === 'ar' ? 'rtl' : 'ltr'

const STRINGS = {
  en: {
    greeting: (name) => `Hi ${name} 👋`,
    summaryTitle: (month) => `${month} Summary`,
    summaryTitlePartial: (month) => `${month} · So Far`,
    income: 'Income',
    incomeCarriedOver: (month) => `Income · ${month}`,
    spent: 'Spent',
    net: 'Net',
    loading: 'Loading data...',
  },
  ar: {
    greeting: (name) => `مرحباً ${name} 👋`,
    summaryTitle: (month) => `ملخص ${month}`,
    summaryTitlePartial: (month) => `${month} · حتى الآن`,
    income: 'الدخل',
    incomeCarriedOver: (month) => `الدخل · ${month}`,
    spent: 'الصرف',
    net: 'الصافي',
    loading: 'جارِ تحميل البيانات...',
  },
}

const MONTH_NAMES = {
  en: [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ],
  ar: [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
  ],
}

export function t(key, ...args) {
  const value = STRINGS[LOCALE][key]
  return typeof value === 'function' ? value(...args) : value
}

export function monthLabel(monthKey) {
  if (!monthKey) return ''
  return MONTH_NAMES[LOCALE][Number(monthKey.slice(5, 7)) - 1]
}

// "June 2026" — used by the month switcher, where the data spans more than
// one year so the month name alone would be ambiguous.
export function monthYearLabel(monthKey) {
  if (!monthKey) return ''
  return `${monthLabel(monthKey)} ${monthKey.slice(0, 4)}`
}

export function formatSAR(amount) {
  return `SAR ${Math.round(amount).toLocaleString('en-US')}`
}
