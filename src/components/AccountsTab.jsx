import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Pencil, Plus } from 'lucide-react'
import { useCountUp } from '../lib/useCountUp'
import { formatSAR, t } from '../lib/i18n'
import { useLocale } from '../lib/LocaleContext'
import accountsData from '../../data/munami_accounts.json'
import BankCardStack from './BankCardStack'

const ICONS = { shield: '🛡️', plane: '✈️', car: '🚗', default: '💰' }
const BUCKET_COLORS = ['#7FB8B0', '#C4B5E0', '#A8D5BA', '#E8B4B8', '#E8CF8E']

// ─── Tappable fund bucket ────────────────────────────────────────────────────

function FundBucket({ fund, index, onTap, editing = false }) {
  const pct = fund.target_sar > 0
    ? Math.min(100, Math.round((fund.balance_sar / fund.target_sar) * 100))
    : 0

  return (
    <motion.button
      onClick={onTap}
      className={`fund-budget-row ${editing ? 'is-editing' : ''}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.07, ease: 'easeOut' }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="fund-budget-row-head">
        <span className="fund-budget-icon">{ICONS[fund.icon] || ICONS.default}</span>
        <strong>{fund.name}</strong>
        <span className="fund-budget-amount">{formatSAR(fund.balance_sar)} / {formatSAR(fund.target_sar)}</span>
        {editing && <span className="fund-budget-edit"><Pencil size={14} /></span>}
      </div>
      <div className="progress-track">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: fund.color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, delay: index * 0.08, ease: 'easeOut' }}
        />
      </div>
      <small>{pct}%</small>
    </motion.button>
  )
}

// ─── Main tab ────────────────────────────────────────────────────────────────

export default function AccountsTab({
  cashBalance = 0,
  onCashTransaction,
  funds = accountsData.funds,
  onFundsChange = () => {},
  unallocated = accountsData.unallocated_sar,
  onUnallocatedChange = () => {},
  initialAction = null,
}) {
  const { locale } = useLocale()
  const setFunds = onFundsChange
  const setUnallocated = onUnallocatedChange

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
  const opensWithCash = initialAction === 'cash'

  // Sheet state — 'create' | 'fund'
  const [sheetOpen, setSheetOpen] = useState(opensWithCash)
  const [sheetMode, setSheetMode] = useState(opensWithCash ? 'cash' : 'create')

  // Fund detail sheet
  const [activeFund, setActiveFund] = useState(null)
  const [activeAccount, setActiveAccount] = useState(opensWithCash ? cashAccount : null)
  const [fundAction, setFundAction] = useState('add') // 'add' | 'withdraw'
  const [amount, setAmount] = useState('')

  // New fund form
  const [newName, setNewName] = useState('')
  const [newTarget, setNewTarget] = useState('')
  const [cashAction, setCashAction] = useState('add')
  const [cashDraft, setCashDraft] = useState('')
  const [cashDescription, setCashDescription] = useState('')
  const [cashSaving, setCashSaving] = useState(false)
  const [editingFunds, setEditingFunds] = useState(false)

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
      setCashAction('add')
      setCashDraft('')
      setCashDescription('')
      setSheetMode('cash')
    } else {
      setSheetMode('account')
    }
    setSheetOpen(true)
  }

  async function handleSaveCash() {
    const value = Number(cashDraft)
    if (!Number.isFinite(value) || value <= 0 || (cashAction === 'withdraw' && value > cashBalance)) return
    setCashSaving(true)
    await onCashTransaction?.({ action: cashAction, amount: value, description: cashDescription })
    setCashSaving(false)
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
  const cashAmount = Number(cashDraft)
  const cashCanSubmit = Number.isFinite(cashAmount) && cashAmount > 0 && (cashAction !== 'withdraw' || cashAmount <= cashBalance)

  return (
    <div
      className="absolute inset-0 scroll-thin bg-page pb-10 accounts-page"
      style={{ overflowY: sheetOpen ? 'hidden' : 'auto' }}
    >

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
        <div className="section-title funds-section-title">
          <h2>{t(locale, 'yourFunds')}</h2>
          <div className="section-title-actions">
            <span>{funds.length}</span>
            <button
              type="button"
              className={`section-edit-action ${editingFunds ? 'is-active' : ''}`}
              onClick={() => setEditingFunds((current) => !current)}
              aria-label={editingFunds ? t(locale, 'done') : t(locale, 'editFunds')}
            >
              {editingFunds ? t(locale, 'done') : <Pencil size={14} />}
            </button>
            {editingFunds && (
              <button type="button" className="section-add-action" onClick={openCreateSheet} aria-label={t(locale, 'newBucket')}>
                <Plus size={17} />
              </button>
            )}
          </div>
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
        <div className="fund-budget-list">
          {funds.map((fund, i) => (
            <FundBucket
              key={fund.id}
              fund={fund}
              index={i}
              editing={editingFunds}
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
              className="accounts-sheet-backdrop"
              style={{ background: 'rgba(0,0,0,0.45)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={closeSheet}
            />
            <motion.div
              className="accounts-sheet bg-card rounded-t-[24px] px-5 pt-4 pb-10 scroll-thin"
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
                  <div className="cash-action-switch" role="group" aria-label={t(locale, 'cashAction')}>
                    {(['add', 'withdraw']).map((action) => (
                      <button
                        key={action}
                        type="button"
                        className={cashAction === action ? 'is-active' : ''}
                        onClick={() => setCashAction(action)}
                      >
                        {t(locale, action === 'add' ? 'cashDeposit' : 'cashWithdrawal')}
                      </button>
                    ))}
                  </div>
                  <label className="cash-input-label" htmlFor="primary-cash">{t(locale, 'amountSAR')}</label>
                  <div className="cash-input-wrap">
                    <input
                      id="primary-cash"
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="50"
                      value={cashDraft}
                      onChange={(event) => setCashDraft(event.target.value)}
                      placeholder="0"
                    />
                    <span>SAR</span>
                  </div>
                  <label className="cash-input-label cash-description-label" htmlFor="cash-description">{t(locale, 'optionalDescription')}</label>
                  <input
                    id="cash-description"
                    className="cash-description-input"
                    type="text"
                    value={cashDescription}
                    onChange={(event) => setCashDescription(event.target.value)}
                    placeholder={t(locale, 'cashDescriptionPlaceholder')}
                    maxLength={120}
                  />
                  <p className="cash-help">
                    {t(locale, 'cashTransactionHelp')}
                    {cashAction === 'withdraw' && <><br />{t(locale, 'cashAvailable', formatSAR(cashBalance))}</>}
                  </p>
                  <button type="button" className="cash-save" onClick={handleSaveCash} disabled={cashSaving || !cashCanSubmit}>
                    {cashSaving ? t(locale, 'savingCash') : t(locale, cashAction === 'add' ? 'addCashAction' : 'withdraw')}
                  </button>
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
                    className="navy-action w-full py-3.5 rounded-full text-sm font-semibold"
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
                    className="navy-action w-full py-3.5 rounded-full text-sm font-semibold"
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
