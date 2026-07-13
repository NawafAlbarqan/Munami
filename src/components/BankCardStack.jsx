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
          const accent = acc.accent || acc.color
          // Balance pops in the bank's accent when it differs (SNB's light green);
          // otherwise white for legibility on the solid brand fill.
          const balanceColor = accent !== acc.color ? accent : '#FFFFFF'
          return (
            <motion.div
              key={acc.account_id}
              // ── Retro 90s / neubrutalist treatment — bank cards ONLY ──
              className="absolute left-0 right-0 rounded-[22px] p-5"
              style={{
                top: 0,
                height: CARD_H,
                zIndex: n - i, // first account stays on top of the deck
                // Bold, saturated SOLID brand fill — no tint, no gradient
                backgroundColor: acc.color,
                // Thick black outline + chunky solid offset "sticker" shadow
                // (matches the app-wide retro system: 3px outline, 5px offset)
                border: '3px solid #000000',
                boxShadow: '5px 5px 0 #000000',
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
              <div className="flex items-start justify-between mb-7">
                <div>
                  <p className="text-white text-sm font-extrabold tracking-tight">{acc.bank}</p>
                  <p className="text-[11px] mt-0.5 font-semibold" style={{ color: 'rgba(255,255,255,0.72)' }}>
                    {acc.type} · ···· {acc.iban_tail}
                  </p>
                </div>
                {/* White chip with its own thick outline + mini sticker shadow —
                    carries the real logo so every brand mark stays crisp */}
                <span
                  className="w-11 h-11 rounded-[13px] flex items-center justify-center shrink-0 bg-white"
                  style={{ border: '2.5px solid #000000', boxShadow: '2px 2px 0 #000000' }}
                >
                  {logo ? (
                    <img src={logo} alt={`${acc.bank} logo`} className="w-8 h-8 object-contain" />
                  ) : (
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: acc.color }} />
                  )}
                </span>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.65)' }}>
                {t(locale, 'balance')}
              </p>
              <p className="text-[26px] font-extrabold tracking-tight tabular-nums" style={{ color: balanceColor }}>
                {formatSAR(acc.balance_sar)}
              </p>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Hint caption — tells the user the stack is tappable */}
      <p className="text-muted text-[11px] text-center mt-3 select-none">
        {t(locale, expanded ? 'bankStackCollapse' : 'bankStackExpand')}
      </p>
    </div>
  )
}
