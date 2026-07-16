import { useState } from 'react'
import { motion } from 'motion/react'
import { formatSAR, t } from '../lib/i18n'
import alinmaLogo from '../assets/banks/alinma.png'
import alrajhiLogo from '../assets/banks/alrajhi.png'
import snbLogo from '../assets/banks/snb.png'

// Real brand logos, keyed by the bank name in the data
const BANK_LOGOS = {
  'Alinma Bank': alinmaLogo,
  'Al Rajhi Bank': alrajhiLogo,
  'Saudi National Bank': snbLogo,
}

// ─── Stacked deck ────────────────────────────────────────────────────────────
// Collapsed: cards fan behind the top one, offset diagonally (down + right)
// with a slight scale-down and rotation, like a held deck. Tapping fans them
// out into a fully readable vertical spread; tapping again restacks.

const CARD_H = 150
const GAP = 12
const PEEK_Y = 22 // vertical peek of each buried card
const PEEK_X = 6 // slight diagonal drift

export default function BankCardStack({ accounts, locale }) {
  const [expanded, setExpanded] = useState(false)
  const n = accounts.length

  const collapsedH = CARD_H + (n - 1) * PEEK_Y
  const expandedH = n * CARD_H + (n - 1) * GAP

  return (
    <div className="px-4">
      <motion.div
        className="relative"
        animate={{ height: expanded ? expandedH : collapsedH }}
        transition={{ duration: expanded ? 0.42 : 0.32, ease: 'easeOut' }}
        style={{ cursor: 'pointer' }}
        onClick={() => setExpanded((e) => !e)}
        role="button"
        aria-expanded={expanded}
        aria-label={t(locale, expanded ? 'bankStackCollapse' : 'bankStackExpand')}
      >
        {accounts.map((acc, i) => {
          const logo = BANK_LOGOS[acc.bank]
          return (
            <motion.div
              key={acc.account_id}
              // ── Bank account card — calm white/card surface; the bank's
              // brand color appears ONLY as a thin leading stripe + the logo
              // chip (see DESIGN.md 5.6), never as a full saturated fill. ──
              className="absolute left-0 right-0 rounded-[16px] p-5 overflow-hidden"
              style={{
                top: 0,
                height: CARD_H,
                zIndex: n - i, // first account stays on top of the deck
                background: 'var(--color-card)',
                border: '1px solid var(--color-card-border)',
                boxShadow: 'var(--shadow-md)',
              }}
              animate={{
                y: expanded ? i * (CARD_H + GAP) : i * PEEK_Y,
                x: expanded ? 0 : i * PEEK_X,
                scale: expanded ? 1 : 1 - i * 0.04,
                rotate: expanded ? 0 : i === 0 ? 0 : i % 2 ? -1.4 : 1.6,
              }}
              transition={{
                duration: expanded ? 0.42 : 0.32,
                ease: 'easeOut',
                delay: expanded ? i * 0.045 : (n - 1 - i) * 0.03,
              }}
              whileTap={{ scale: expanded ? 0.99 : 0.97 }}
            >
              {/* Brand identity stripe — the only place the bank color fills */}
              <span
                className="absolute top-0 bottom-0 start-0"
                style={{ width: 5, backgroundColor: acc.color }}
              />
              <div className="flex items-start justify-between mb-6">
                <div>
                  <p className="text-text text-sm font-bold tracking-tight">{acc.bank}</p>
                  <p className="text-muted text-[11px] mt-0.5 font-medium">
                    {acc.type} · ···· {acc.iban_tail}
                  </p>
                </div>
                {/* Logo chip — white, fine outline */}
                <span
                  className="w-11 h-11 rounded-[12px] flex items-center justify-center shrink-0 bg-white"
                  style={{ border: '1px solid var(--color-card-border)' }}
                >
                  {logo ? (
                    <img src={logo} alt={`${acc.bank} logo`} className="w-8 h-8 object-contain" />
                  ) : (
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: acc.color }} />
                  )}
                </span>
              </div>
              <p className="text-muted text-[10px] font-semibold uppercase tracking-widest mb-1">
                {t(locale, 'balance')}
              </p>
              <p className="text-text text-[24px] font-bold tracking-tight tabular-nums">
                {formatSAR(acc.balance_sar)}
              </p>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Subtle chevron — the only cue that the stack is tappable, no text.
          Points down when collapsed ("more below"), flips up when expanded. */}
      <div className="flex justify-center mt-2.5">
        <motion.svg
          width="14" height="14" viewBox="0 0 14 14" fill="none"
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
          style={{ opacity: 0.55 }}
        >
          <path d="M3 5.5l4 4 4-4" stroke="var(--color-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </motion.svg>
      </div>
    </div>
  )
}
