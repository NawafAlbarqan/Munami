import { useState, useMemo } from 'react'
import { applyCategoryMap, categoryColorVar } from '../lib/finance'
import { formatSAR } from '../lib/i18n'

function themeColor(varName) {
  if (typeof window === 'undefined') return '#000000'
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim()
}

// "Today" and "Yesterday" are relative to the data's own latest date —
// never the system clock, so the demo looks right whenever it's run.
// Subtract one calendar day from a YYYY-MM-DD string without any UTC conversion,
// so the result is always the correct local calendar date regardless of timezone.
function prevDay(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const dt = new Date(y, m - 1, d - 1) // local midnight, no UTC shift
  return [
    dt.getFullYear(),
    String(dt.getMonth() + 1).padStart(2, '0'),
    String(dt.getDate()).padStart(2, '0'),
  ].join('-')
}

function formatDateHeader(dateStr, latestDate) {
  if (dateStr === latestDate) return 'Today'
  if (dateStr === prevDay(latestDate)) return 'Yesterday'
  const parsed = new Date(dateStr + 'T00:00:00')
  return parsed.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export default function TransactionsTab({ rows }) {
  const [search, setSearch] = useState('')
  const [bankFilter, setBankFilter] = useState(null) // null = all banks

  const mapped = useMemo(() => applyCategoryMap(rows), [rows])

  const banks = useMemo(() => {
    const set = new Set(rows.map((r) => r.bank).filter(Boolean))
    return [...set].sort()
  }, [rows])

  // Data's latest date — drives the "Today" / "Yesterday" labels
  const latestDate = useMemo(
    () => rows.reduce((max, r) => (r.date > max ? r.date : max), ''),
    [rows],
  )

  // Filter then sort newest-first (timestamp string sort works for ISO dates)
  const sorted = useMemo(() => {
    const q = search.toLowerCase()
    return mapped
      .filter((r) => r.merchant && r.date)
      .filter((r) => !bankFilter || r.bank === bankFilter)
      .filter(
        (r) =>
          !q ||
          (r.merchant || '').toLowerCase().includes(q) ||
          (r.category || '').toLowerCase().includes(q),
      )
      .sort((a, b) => {
        if (b.date !== a.date) return b.date > a.date ? 1 : -1
        return (b.timestamp || '') > (a.timestamp || '') ? 1 : -1
      })
  }, [mapped, search, bankFilter])

  // Group into [{date, transactions[]}] in descending date order
  const grouped = useMemo(() => {
    const map = new Map()
    for (const tx of sorted) {
      if (!map.has(tx.date)) map.set(tx.date, [])
      map.get(tx.date).push(tx)
    }
    return [...map.entries()].map(([date, transactions]) => ({ date, transactions }))
  }, [sorted])

  return (
    <div className="absolute inset-0 overflow-y-auto scroll-thin bg-page px-4 pt-6 pb-24">
      <p className="text-muted text-xs font-medium uppercase tracking-widest mb-0.5">Your activity</p>
      <h1 className="text-text font-bold mb-4 leading-tight" style={{ fontFamily: "'Nunito', sans-serif", fontSize: 26 }}>
        Every spend, tracked 🌱
      </h1>

      {/* Search bar */}
      <input
        type="text"
        placeholder="Search merchants or categories…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full bg-card border-[0.5px] border-card-border rounded-[14px] px-4 py-3 text-sm text-text placeholder:text-muted outline-none mb-3"
      />

      {/* Bank filter chips */}
      <div className="flex gap-2 mb-5 flex-wrap">
        <button
          onClick={() => setBankFilter(null)}
          className={`px-3 py-1 rounded-full text-xs font-medium border-[0.5px] transition-colors ${
            !bankFilter
              ? 'bg-primary text-page border-primary'
              : 'bg-card border-card-border text-muted'
          }`}
        >
          All Banks
        </button>
        {banks.map((bank) => (
          <button
            key={bank}
            onClick={() => setBankFilter(bankFilter === bank ? null : bank)}
            className={`px-3 py-1 rounded-full text-xs font-medium border-[0.5px] transition-colors ${
              bankFilter === bank
                ? 'bg-primary text-page border-primary'
                : 'bg-card border-card-border text-muted'
            }`}
          >
            {bank}
          </button>
        ))}
      </div>

      {/* Transaction list grouped by date */}
      <div className="flex flex-col gap-4">
        {grouped.length === 0 && (
          <p className="text-muted text-sm text-center py-10">No transactions found.</p>
        )}
        {grouped.map(({ date, transactions }) => (
          <div key={date}>
            <p className="text-muted text-[11px] font-medium uppercase tracking-wide mb-2 px-1">
              {formatDateHeader(date, latestDate)}
            </p>
            <div className="bg-card border-[0.5px] border-card-border rounded-[20px] overflow-hidden">
              {transactions.map((tx, i) => {
                const isCredit = (tx.direction || '').toLowerCase() === 'credit'
                const color = themeColor(categoryColorVar(tx.category))
                return (
                  <div
                    key={tx.transaction_id || i}
                    className={`flex items-center gap-3 px-4 py-3.5 ${
                      i < transactions.length - 1 ? 'border-b border-card-border' : ''
                    }`}
                  >
                    {/* Category color dot */}
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: isCredit ? 'var(--color-positive)' : color }}
                    />
                    {/* Merchant + category · bank */}
                    <div className="flex-1 min-w-0">
                      <p className="text-text text-sm font-medium truncate">{tx.merchant}</p>
                      <p className="text-muted text-[11px] truncate">
                        {tx.category} · {tx.bank}
                      </p>
                    </div>
                    {/* Amount — credits green with + sign */}
                    <span
                      className="text-sm font-semibold tabular-nums shrink-0"
                      style={{ color: isCredit ? 'var(--color-positive)' : 'var(--color-text)' }}
                    >
                      {isCredit ? '+' : ''}
                      {formatSAR(tx.amount_sar)}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
