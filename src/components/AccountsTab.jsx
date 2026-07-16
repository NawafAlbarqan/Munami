import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useCountUp } from '../lib/useCountUp'
import { formatSAR, t } from '../lib/i18n'
import { useLocale } from '../lib/LocaleContext'
import accountsData from '../../data/munami_accounts.json'
import BankCardStack from './BankCardStack'

const ICONS = { shield: '🛡️', plane: '✈️', car: '🚗', default: '💰' }
const BUCKET_COLORS = ['#7FB8B0', '#C4B5E0', '#A8D5BA', '#E8B4B8', '#E8CF8E']

// ─── Tappable fund bucket ────────────────────────────────────────────────────

function FundBucket({ fund, index, onTap }) {
  const pct = fund.target_sar > 0
    ? Math.min(100, Math.round((fund.balance_sar / fund.target_sar) * 100))
    : 0

  return (
    <motion.button
      onClick={onTap}
      className="w-full bg-card border-[0.5px] border-card-border rounded-[20px] px-4 py-4 text-left"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.07, ease: 'easeOut' }}
      whileTap={{ scale: 0.98 }}
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
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold tabular-nums" style={{ color: fund.color }}>
            {pct}%
          </span>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="opacity-30">
            <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
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
    </motion.button>
  )
}

// ─── Main tab ────────────────────────────────────────────────────────────────

export default function AccountsTab({ cashBalance = 0, onCashBalanceChange }) {
  const { locale } = useLocale()
  const [funds, setFunds] = useState(accountsData.funds)
  const [unallocated, setUnallocated] = useState(accountsData.unallocated_sar)

  // Sheet state — 'create' | 'fund'
  const [sheetOpen, setSheetOpen] = useState(false)
  const [sheetMode, setSheetMode] = useState('create')

  // Fund detail sheet
  const [activeFund, setActiveFund] = useState(null)
  const [activeAccount, setActiveAccount] = useState(null)
  const [fundAction, setFundAction] = useState('add') // 'add' | 'withdraw'
  const [amount, setAmount] = useState('')

  // New fund form
  const [newName, setNewName] = useState('')
  const [newTarget, setNewTarget] = useState('')
  const [cashDraft, setCashDraft] = useState(String(cashBalance || ''))

  const totalBalance = accountsData.total_balance_sar + cashBalance
  const animatedTotal = useCountUp(totalBalance, 0.8)
  const cashAccount = {
    account_id: 'CASH-PRIMARY',
    bank: t(locale, 'primaryCash'),
    type: t(locale, 'manualBalance'),
    balance_sar: cashBalance,
    color: '#F46F5B',
    accent: '#FFFFFF',
    manual: true,
  }
  const allAccounts = [cashAccount, ...accountsData.accounts]

  function openFundSheet(fund) {
    setActiveFund(fund)
    setFundAction('add')
    setAmount('')
    setSheetMode('fund')
    setSheetOpen(true)
  }

  function openCreateSheet() {
    setNewName('')
    setNewTarget('')
    setSheetMode('create')
    setSheetOpen(true)
  }

  function openAccountSheet(account) {
    setActiveAccount(account)
    if (account.manual) {
      setCashDraft(String(cashBalance || ''))
      setSheetMode('cash')
    } else {
      setSheetMode('account')
    }
    setSheetOpen(true)
  }

  function handleSaveCash() {
    const value = Number(cashDraft)
    if (!Number.isFinite(value) || value < 0) return
    onCashBalanceChange?.(value)
    closeSheet()
  }

  function closeSheet() {
    setSheetOpen(false)
    setActiveFund(null)
    setActiveAccount(null)
    setAmount('')
  }

  function handleFundAction() {
    const val = parseFloat(amount)
    if (!val || val <= 0 || !activeFund) return

    if (fundAction === 'add') {
      if (val > unallocated) return
      setFunds((prev) =>
        prev.map((f) => f.id === activeFund.id ? { ...f, balance_sar: f.balance_sar + val } : f)
      )
      setUnallocated((prev) => prev - val)
    } else {
      const fund = funds.find((f) => f.id === activeFund.id)
      if (!fund || val > fund.balance_sar) return
      setFunds((prev) =>
        prev.map((f) => f.id === activeFund.id ? { ...f, balance_sar: f.balance_sar - val } : f)
      )
      setUnallocated((prev) => prev + val)
    }
    closeSheet()
  }

  function handleCreateFund() {
    const name = newName.trim()
    if (!name) return
    const target = parseFloat(newTarget) || 0
    setFunds((prev) => [
      ...prev,
      {
        id: `fund-${Date.now()}`,
        name,
        icon: 'default',
        balance_sar: 0,
        target_sar: target,
        color: BUCKET_COLORS[prev.length % BUCKET_COLORS.length],
      },
    ])
    closeSheet()
  }

  // Keep activeFund in sync with live fund state (balance updates)
  const liveFund = activeFund ? funds.find((f) => f.id === activeFund.id) ?? activeFund : null

  return (
    <div className="absolute inset-0 overflow-y-auto scroll-thin bg-page pb-10 accounts-page">

      {/* ── Total balance hero — asymmetric, badge/seal treatment ── */}
      <motion.div
        className="px-4 pb-6"
        style={{ paddingTop: 60 }}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <div
          className="retro-hero rounded-[28px] pl-6 pr-6 pt-8 pb-6"
          style={{ background: 'var(--grad-hero-card)' }}
        >
          <p className="text-[10px] font-bold uppercase tracking-widest mb-2">
            {t(locale, 'yourTotalBalance')}
          </p>
          <p className="munami-hero tabular-nums">
            {formatSAR(animatedTotal)}
          </p>
          {/* Short thick rule — deliberate typographic break between the
              number and the supporting caption, not just stacked centered text */}
          <div className="rounded-full mt-4 mb-3" style={{ width: 52, height: 3, backgroundColor: 'rgba(255,255,255,.72)' }} />
          <span className="retro-verdict inline-block rounded-full px-3 py-1 text-[11px] font-bold">
            {t(locale, 'acrossAccounts', allAccounts.length)}
          </span>
        </div>
      </motion.div>

      {/* ── Bank card stack — tap to fan out, tap again to restack ── */}
      <BankCardStack accounts={allAccounts} locale={locale} onAccountSelect={openAccountSheet} initialExpanded />

      {/* ── Fund buckets ── */}
      <div className="px-4 mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-text text-base font-semibold">{t(locale, 'yourFunds')}</h2>
          {/* + only creates a new fund — each fund card handles deposits/withdrawals */}
          <button
            onClick={openCreateSheet}
            className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-accent text-xl font-bold leading-none"
          >
            +
          </button>
        </div>

        {/* Unallocated — display only, not tappable */}
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

        {/* Fund cards — each tappable */}
        <div className="flex flex-col gap-3">
          {funds.map((fund, i) => (
            <FundBucket
              key={fund.id}
              fund={fund}
              index={i}
              onTap={() => openFundSheet(fund)}
            />
          ))}
        </div>
      </div>

      {/* ── Bottom sheet ── */}
      <AnimatePresence>
        {sheetOpen && (
          <>
            <motion.div
              className="absolute inset-0 z-20"
              style={{ background: 'rgba(0,0,0,0.45)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={closeSheet}
            />
            <motion.div
              className="absolute bottom-0 left-0 right-0 z-30 bg-card rounded-t-[24px] px-5 pt-4 pb-10"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
            >
              <div className="w-10 h-1 bg-card-border rounded-full mx-auto mb-5" />

              {sheetMode === 'cash' && activeAccount ? (
                <div className="cash-sheet">
                  <div className="flex items-center gap-3 mb-5">
                    <span className="cash-sheet-icon"><span>﷼</span></span>
                    <div>
                      <p className="text-muted text-xs">{t(locale, 'manualBalance')}</p>
                      <p className="text-text text-base font-bold">{t(locale, 'primaryCash')}</p>
                    </div>
                  </div>
                  <label className="cash-input-label" htmlFor="primary-cash">{t(locale, 'amountSAR')}</label>
                  <div className="cash-input-wrap">
                    <input
                      id="primary-cash"
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="0.01"
                      value={cashDraft}
                      onChange={(event) => setCashDraft(event.target.value)}
                      placeholder="0"
                    />
                    <span>SAR</span>
                  </div>
                  <p className="cash-help">{t(locale, 'cashBalanceHelp')}</p>
                  <button type="button" className="cash-save" onClick={handleSaveCash}>{t(locale, 'saveCash')}</button>
                </div>
              ) : sheetMode === 'account' && activeAccount ? (
                <div>
                  <div className="flex items-center gap-3 mb-5">
                    <span className="w-12 h-12 rounded-[15px] text-white font-bold flex items-center justify-center" style={{ background: activeAccount.color }}>
                      {activeAccount.bank.slice(0, 1)}
                    </span>
                    <div>
                      <p className="text-muted text-xs">{t(locale, 'accountDetails')}</p>
                      <p className="text-text text-base font-bold">{activeAccount.bank}</p>
                    </div>
                  </div>
                  <div className="bg-tint rounded-[18px] overflow-hidden">
                    {[
                      [t(locale, 'balance'), formatSAR(activeAccount.balance_sar)],
                      [t(locale, 'accountType'), activeAccount.type],
                      [t(locale, 'ibanEnding'), `•••• ${activeAccount.iban_tail}`],
                    ].map(([label, value], index) => (
                      <div key={label} className={`flex justify-between gap-4 px-4 py-3.5 ${index < 2 ? 'border-b border-card-border' : ''}`}>
                        <span className="text-muted text-xs">{label}</span>
                        <span className="text-text text-sm font-semibold text-end">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : sheetMode === 'fund' && liveFund ? (
                /* ── Fund detail: add or withdraw ── */
                <div className="flex flex-col gap-4">
                  {/* Fund header */}
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-2xl">{ICONS[liveFund.icon] || ICONS.default}</span>
                    <div>
                      <p className="text-text text-base font-semibold">{liveFund.name}</p>
                      <p className="text-muted text-xs tabular-nums">
                        {formatSAR(liveFund.balance_sar)} / {formatSAR(liveFund.target_sar)}
                      </p>
                    </div>
                  </div>

                  {/* Add / Withdraw toggle */}
                  <div className="flex bg-tint rounded-[12px] p-1">
                    {(['add', 'withdraw'] ).map((action) => (
                      <button
                        key={action}
                        onClick={() => { setFundAction(action); setAmount('') }}
                        className={`flex-1 py-2 rounded-[10px] text-sm font-medium transition-colors ${
                          fundAction === action ? 'bg-card text-text' : 'text-muted'
                        }`}
                      >
                        {action === 'add' ? t(locale, 'addFunds') : t(locale, 'withdraw')}
                      </button>
                    ))}
                  </div>

                  {/* Amount input */}
                  <div>
                    <p className="text-muted text-[10px] font-medium uppercase tracking-wide mb-2">
                      {t(locale, 'amountSAR')}
                    </p>
                    <input
                      type="number"
                      placeholder="0"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full bg-tint border-[0.5px] border-card-border rounded-[14px] px-4 py-3 text-text text-sm outline-none"
                    />
                    <p className="text-muted text-xs mt-1.5">
                      {fundAction === 'add'
                        ? t(locale, 'availableFunds', formatSAR(unallocated))
                        : t(locale, 'availableToWithdraw', formatSAR(liveFund.balance_sar))}
                    </p>
                  </div>

                  <button
                    onClick={handleFundAction}
                    className="w-full py-3.5 rounded-full bg-primary text-on-accent text-sm font-semibold"
                  >
                    {fundAction === 'add'
                      ? t(locale, 'depositToFund', liveFund.name)
                      : t(locale, 'withdrawFromFund', liveFund.name)}
                  </button>
                </div>
              ) : (
                /* ── Create new fund ── */
                <div className="flex flex-col gap-4">
                  <p className="text-text text-base font-semibold mb-1">{t(locale, 'newBucket')}</p>

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
                    onClick={handleCreateFund}
                    className="w-full py-3.5 rounded-full bg-primary text-on-accent text-sm font-semibold"
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
