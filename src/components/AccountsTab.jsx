import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useCountUp } from '../lib/useCountUp'
import { formatSAR, t } from '../lib/i18n'
import { useLocale } from '../lib/LocaleContext'
import accountsData from '../../data/munami_accounts.json'

const ICONS = { shield: '🛡️', plane: '✈️', car: '🚗', default: '💰' }
// Cycle through these when user creates a new bucket
const BUCKET_COLORS = ['#7FB8B0', '#C4B5E0', '#A8D5BA', '#E8B4B8', '#E8CF8E']

// ─── Bank card carousel ──────────────────────────────────────────────────────

function BankCarousel({ accounts, locale }) {
  const [activeIdx, setActiveIdx] = useState(0)

  function onScroll(e) {
    const el = e.currentTarget
    // Cards are w-[280px] with gap-3 (12px) → scroll step ≈ 292px
    const step = el.children[0]?.offsetWidth + 12 || 292
    const idx = Math.round(el.scrollLeft / step)
    setActiveIdx(Math.max(0, Math.min(accounts.length - 1, idx)))
  }

  return (
    <div>
      <div
        onScroll={onScroll}
        className="flex gap-3 overflow-x-auto snap-x snap-mandatory scroll-thin"
        style={{ paddingLeft: '1rem', paddingRight: '1rem' }}
      >
        {accounts.map((acc, i) => (
          <motion.div
            key={acc.account_id}
            className="shrink-0 w-[280px] snap-center rounded-[20px] p-5 border-[0.5px]"
            style={{
              backgroundColor: acc.color + '18',
              borderColor: acc.color + '50',
            }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: i * 0.07, ease: 'easeOut' }}
          >
            <div className="flex items-start justify-between mb-8">
              <div>
                <p className="text-text text-sm font-semibold">{acc.bank}</p>
                <p className="text-muted text-[11px] mt-0.5">
                  {acc.type} · ···· {acc.iban_tail}
                </p>
              </div>
              <span
                className="w-3 h-3 rounded-full mt-0.5"
                style={{ backgroundColor: acc.color }}
              />
            </div>
            <p className="text-muted text-[10px] font-medium uppercase tracking-widest mb-1">
              {t(locale, 'balance')}
            </p>
            <p className="text-2xl font-bold tracking-tight" style={{ color: acc.color }}>
              {formatSAR(acc.balance_sar)}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Dot indicators — pill expands on active, coloured to match card */}
      <div className="flex justify-center gap-1.5 mt-4">
        {accounts.map((acc, i) => (
          <span
            key={i}
            className="h-1.5 rounded-full transition-all duration-200"
            style={{
              width: i === activeIdx ? '20px' : '6px',
              backgroundColor: i === activeIdx ? acc.color : 'var(--color-card-border)',
            }}
          />
        ))}
      </div>
    </div>
  )
}

// ─── Fund bucket row ──────────────────────────────────────────────────────────

function FundBucket({ fund, index }) {
  const pct = fund.target_sar > 0
    ? Math.min(100, Math.round((fund.balance_sar / fund.target_sar) * 100))
    : 0

  return (
    <motion.div
      className="bg-card border-[0.5px] border-card-border rounded-[20px] px-4 py-4"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.07, ease: 'easeOut' }}
    >
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-3">
          <span className="text-xl">{ICONS[fund.icon] || ICONS.default}</span>
          <div>
            <p className="text-text text-sm font-medium">{fund.name}</p>
            <p className="text-muted text-[11px] tabular-nums">
              {formatSAR(fund.balance_sar)} / {formatSAR(fund.target_sar)}
            </p>
          </div>
        </div>
        <span
          className="text-xs font-bold tabular-nums"
          style={{ color: fund.color }}
        >
          {pct}%
        </span>
      </div>

      <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-card-border)' }}>
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: fund.color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, delay: index * 0.08, ease: 'easeOut' }}
        />
      </div>
    </motion.div>
  )
}

// ─── Main tab ────────────────────────────────────────────────────────────────

export default function AccountsTab() {
  const { locale } = useLocale()
  const [funds, setFunds] = useState(accountsData.funds)
  const [unallocated, setUnallocated] = useState(accountsData.unallocated_sar)

  const [sheetOpen, setSheetOpen] = useState(false)
  const [sheetMode, setSheetMode] = useState('add') // 'add' | 'create'

  // "Add funds" form
  const [addFundId, setAddFundId] = useState(accountsData.funds[0]?.id ?? '')
  const [addAmount, setAddAmount] = useState('')

  // "New bucket" form
  const [newName, setNewName] = useState('')
  const [newTarget, setNewTarget] = useState('')

  const animatedTotal = useCountUp(accountsData.total_balance_sar, 0.8)

  function openSheet(mode) {
    setSheetMode(mode)
    setAddAmount('')
    setNewName('')
    setNewTarget('')
    setSheetOpen(true)
  }

  function handleAddFunds() {
    const amount = parseFloat(addAmount)
    if (!amount || amount <= 0 || amount > unallocated) return
    setFunds((prev) =>
      prev.map((f) =>
        f.id === addFundId ? { ...f, balance_sar: f.balance_sar + amount } : f,
      ),
    )
    setUnallocated((prev) => prev - amount)
    setSheetOpen(false)
  }

  function handleCreateBucket() {
    const name = newName.trim()
    if (!name) return
    const target = parseFloat(newTarget) || 0
    const newFund = {
      id: `fund-${Date.now()}`,
      name,
      icon: 'default',
      balance_sar: 0,
      target_sar: target,
      color: BUCKET_COLORS[funds.length % BUCKET_COLORS.length],
    }
    setFunds((prev) => [...prev, newFund])
    setSheetOpen(false)
  }

  return (
    <div className="absolute inset-0 overflow-y-auto scroll-thin bg-page pb-24">

      {/* ── Total balance hero ── */}
      <motion.div
        className="pt-6 pb-6 text-center"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <p className="text-muted text-[10px] font-medium uppercase tracking-widest mb-1">
          {t(locale, 'yourTotalBalance')}
        </p>
        <p className="text-text munami-hero">
          {formatSAR(animatedTotal)}
        </p>
        <p className="text-muted text-xs mt-2">
          {t(locale, 'acrossAccounts', accountsData.accounts.length)}
        </p>
      </motion.div>

      {/* ── Bank carousel ── */}
      <BankCarousel accounts={accountsData.accounts} locale={locale} />

      {/* ── Fund buckets ── */}
      <div className="px-4 mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-text text-base font-semibold">{t(locale, 'yourFunds')}</h2>
          <button
            onClick={() => openSheet('add')}
            className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-page text-xl font-bold leading-none"
          >
            +
          </button>
        </div>

        {/* Unallocated / free cash */}
        <div className="bg-card border-[0.5px] border-card-border rounded-[20px] px-4 py-3.5 mb-3 flex items-center gap-3">
          <span className="text-xl">💵</span>
          <div className="flex-1 min-w-0">
            <p className="text-text text-sm font-medium">{t(locale, 'unallocated')}</p>
            <p className="text-muted text-[11px]">{t(locale, 'freeToAssign')}</p>
          </div>
          <p className="text-positive font-semibold tabular-nums text-sm shrink-0">
            {formatSAR(unallocated)}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {funds.map((fund, i) => (
            <FundBucket key={fund.id} fund={fund} index={i} />
          ))}
        </div>
      </div>

      {/* ── Bottom sheet ── */}
      <AnimatePresence>
        {sheetOpen && (
          <>
            <motion.div
              className="absolute inset-0 z-20"
              style={{ background: 'rgba(0,0,0,0.55)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setSheetOpen(false)}
            />
            <motion.div
              className="absolute bottom-0 left-0 right-0 z-30 bg-card rounded-t-[24px] px-5 pt-4 pb-10"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
            >
              {/* Drag handle */}
              <div className="w-10 h-1 bg-card-border rounded-full mx-auto mb-5" />

              {/* Mode toggle */}
              <div className="flex bg-tint rounded-[12px] p-1 mb-5">
                {['add', 'create'].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setSheetMode(mode)}
                    className={`flex-1 py-2 rounded-[10px] text-sm font-medium transition-colors ${
                      sheetMode === mode ? 'bg-card text-text' : 'text-muted'
                    }`}
                  >
                    {mode === 'add' ? t(locale, 'addFunds') : t(locale, 'newBucket')}
                  </button>
                ))}
              </div>

              {sheetMode === 'add' ? (
                <div className="flex flex-col gap-4">
                  <div>
                    <p className="text-muted text-[10px] font-medium uppercase tracking-wide mb-2">
                      {t(locale, 'selectBucket')}
                    </p>
                    <div className="flex flex-col gap-2">
                      {funds.map((f) => (
                        <button
                          key={f.id}
                          onClick={() => setAddFundId(f.id)}
                          className={`flex items-center gap-3 px-4 py-3 rounded-[14px] border-[0.5px] text-left transition-colors ${
                            addFundId === f.id
                              ? 'border-primary bg-primary/10'
                              : 'border-card-border bg-tint'
                          }`}
                        >
                          <span>{ICONS[f.icon] || ICONS.default}</span>
                          <span className="text-text text-sm font-medium flex-1">{f.name}</span>
                          <span className="text-muted text-xs tabular-nums">
                            {formatSAR(f.balance_sar)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-muted text-[10px] font-medium uppercase tracking-wide mb-2">
                      {t(locale, 'amountSAR')}
                    </p>
                    <input
                      type="number"
                      placeholder="0"
                      value={addAmount}
                      onChange={(e) => setAddAmount(e.target.value)}
                      className="w-full bg-tint border-[0.5px] border-card-border rounded-[14px] px-4 py-3 text-text text-sm outline-none"
                    />
                    <p className="text-muted text-xs mt-1.5">
                      {t(locale, 'availableFunds', formatSAR(unallocated))}
                    </p>
                  </div>

                  <button
                    onClick={handleAddFunds}
                    className="w-full py-3.5 rounded-full bg-primary text-page text-sm font-semibold"
                  >
                    {t(locale, 'addFunds')}
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <div>
                    <p className="text-muted text-[10px] font-medium uppercase tracking-wide mb-2">
                      {t(locale, 'bucketName')}
                    </p>
                    <input
                      type="text"
                      placeholder={t(locale, 'bucketNamePlaceholder')}
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full bg-tint border-[0.5px] border-card-border rounded-[14px] px-4 py-3 text-text text-sm outline-none"
                    />
                  </div>

                  <div>
                    <p className="text-muted text-[10px] font-medium uppercase tracking-wide mb-2">
                      {t(locale, 'targetAmountSAR')}
                    </p>
                    <input
                      type="number"
                      placeholder="0"
                      value={newTarget}
                      onChange={(e) => setNewTarget(e.target.value)}
                      className="w-full bg-tint border-[0.5px] border-card-border rounded-[14px] px-4 py-3 text-text text-sm outline-none"
                    />
                  </div>

                  <button
                    onClick={handleCreateBucket}
                    className="w-full py-3.5 rounded-full bg-primary text-page text-sm font-semibold"
                  >
                    {t(locale, 'createBucket')}
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
