import { useState } from 'react'
import { motion } from 'motion/react'
import { formatSAR, t } from '../lib/i18n'
import alinmaLogo from '../assets/banks/alinma.png'
import alrajhiLogo from '../assets/banks/alrajhi.png'
import snbLogo from '../assets/banks/snb.png'
import { Banknote } from 'lucide-react'

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

const COLLAPSED_CARD_H = 150
const EXPANDED_CARD_H = 112
const EXPANDED_GAP = 10
const PEEK_Y = 22 // vertical peek of each buried card
const PEEK_X = 6 // slight diagonal drift
const SPRING = { type: 'spring', stiffness: 310, damping: 30, mass: 0.78 }

export default function BankCardStack({ accounts, locale, onAccountSelect, initialExpanded = false }) {
  const [expanded, setExpanded] = useState(initialExpanded)
  const n = accounts.length

  const collapsedH = COLLAPSED_CARD_H + (n - 1) * PEEK_Y
  const expandedH = n * EXPANDED_CARD_H + (n - 1) * EXPANDED_GAP

  return (
    <div className="px-4">
      <motion.div
        className="relative"
        animate={{ height: expanded ? expandedH : collapsedH }}
        transition={SPRING}
        style={{ cursor: 'pointer' }}
        onClick={() => setExpanded((e) => !e)}
        role="button"
        aria-expanded={expanded}
        aria-label={t(locale, expanded ? 'bankStackCollapse' : 'bankStackExpand')}
      >
        {accounts.map((acc, i) => {
          const logo = BANK_LOGOS[acc.bank]
          const accent = acc.accent || acc.color
          // Balance pops in the bank's accent when it differs (SNB's light green);
          // otherwise white for legibility on the solid brand fill.
          const balanceColor = accent !== acc.color ? accent : '#FFFFFF'
          return (
            <motion.button
              type="button"
              key={acc.account_id}
              // ── Retro 90s / neubrutalist treatment — bank cards ONLY ──
              className={`absolute left-0 right-0 text-start ${expanded ? 'px-4 py-3.5' : 'p-5'}`}
              style={{
                top: 0,
                zIndex: n - i, // first account stays on top of the deck
                // Bold, saturated SOLID brand fill — no tint, no gradient
                backgroundColor: acc.color,
                border: '1px solid rgba(255,255,255,0.22)',
                willChange: 'transform, height',
              }}
              onClick={(event) => {
                if (!expanded || !onAccountSelect) return
                event.stopPropagation()
                onAccountSelect(acc)
              }}
              animate={{
                height: expanded ? EXPANDED_CARD_H : COLLAPSED_CARD_H,
                borderRadius: expanded ? 18 : 22,
                boxShadow: expanded
                  ? '0 9px 22px rgba(16,38,63,0.14)'
                  : '0 16px 30px rgba(16,38,63,0.20)',
                y: expanded ? i * (EXPANDED_CARD_H + EXPANDED_GAP) : i * PEEK_Y,
                x: expanded ? 0 : i * PEEK_X,
                scale: expanded ? 1 : 1 - i * 0.04,
                rotate: expanded ? 0 : i === 0 ? 0 : i % 2 ? -1.4 : 1.6,
              }}
              transition={{
                ...SPRING,
                delay: expanded ? i * 0.025 : (n - 1 - i) * 0.018,
              }}
              whileTap={{ scale: expanded ? 0.985 : 0.97 }}
            >
              <div className={`flex items-start justify-between ${expanded ? 'mb-2' : 'mb-7'}`}>
                <div>
                  <p className={`text-white font-extrabold tracking-tight ${expanded ? 'text-[13px]' : 'text-sm'}`}>{acc.bank}</p>
                  <p className={`${expanded ? 'text-[10px]' : 'text-[11px]'} mt-0.5 font-semibold`} style={{ color: 'rgba(255,255,255,0.72)' }}>
                    {acc.manual ? acc.type : `${acc.type} · ···· ${acc.iban_tail}`}
                  </p>
                </div>
                {/* White chip with its own thick outline + mini sticker shadow —
                    carries the real logo so every brand mark stays crisp */}
                <span
                  className={`${expanded ? 'w-9 h-9 rounded-[11px]' : 'w-11 h-11 rounded-[13px]'} flex items-center justify-center shrink-0 bg-white`}
                  style={{ border: '1px solid rgba(16,38,63,0.08)', boxShadow: '0 5px 14px rgba(0,0,0,0.14)' }}
                >
                  {acc.manual ? (
                    <Banknote size={25} color={acc.color} strokeWidth={2.2} />
                  ) : logo ? (
                    <img src={logo} alt={`${acc.bank} logo`} className={`${expanded ? 'w-7 h-7' : 'w-8 h-8'} object-contain`} />
                  ) : (
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: acc.color }} />
                  )}
                </span>
              </div>
              <div className={expanded ? 'flex items-end justify-between gap-3' : ''}>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.65)' }}>
                  {t(locale, 'balance')}
                </p>
                <p className={`${expanded ? 'text-[21px]' : 'text-[26px]'} font-extrabold tracking-tight tabular-nums`} style={{ color: balanceColor }}>
                  {formatSAR(acc.balance_sar)}
                </p>
              </div>
            </motion.button>
          )
        })}
      </motion.div>

      {/* Subtle chevron — the only cue that the stack is tappable, no text.
          Points down when collapsed ("more below"), flips up when expanded. */}
      <div className="flex justify-center mt-2.5">
        <motion.svg
          width="14" height="14" viewBox="0 0 14 14" fill="none"
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={SPRING}
          style={{ opacity: 0.55 }}
        >
          <path d="M3 5.5l4 4 4-4" stroke="var(--color-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </motion.svg>
      </div>
    </div>
  )
}
