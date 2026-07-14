import { useRef, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import MunamiMascot from './MunamiMascot'
import { useLocale } from '../lib/LocaleContext'
import { t } from '../lib/i18n'

const USE_AI = import.meta.env.VITE_USE_AI === 'true'

const CATEGORY_EMOJI = {
  'Shopping': '🛍️',
  'Food & Groceries': '🍽️',
  'Bills & Transport': '🚗',
  'Entertainment': '🎬',
  'Other': '📦',
}

// Randomized casual greetings — one picked at random each time the chat opens
const GREETINGS_AR = [
  'يالله حياك، كيف أقدر أخدمك اليوم؟',
  'يا مرحبا',
  'سم',
  'اهلين، وش عندك؟',
  'حياك، تبي تشوف وضعك المالي؟',
  'هلا هلا، جاهز أساعدك',
]

const GREETINGS_EN = [
  "Hey, what's up?",
  "Yo, how's it going?",
  "Hey! What do you need?",
  "Sup",
  "Hey hey, what's on your mind?",
  "Hi! Ready when you are.",
]

function pickRandomGreeting(locale) {
  const pool = locale === 'ar' ? GREETINGS_AR : GREETINGS_EN
  return pool[Math.floor(Math.random() * pool.length)]
}

// Detect if the user is asking to categorize a merchant or transaction
const CATEGORIZE_EN = /\b(categorize|classify|what category|which category|what type of (?:expense|transaction|spend))\b/i
const CATEGORIZE_AR = /صنّف|صنف|ما تصنيف|ما هي فئة|أي فئة/

function isCategoryQuestion(text) {
  return CATEGORIZE_EN.test(text) || CATEGORIZE_AR.test(text)
}

// Extract the merchant / item from a categorization question
function extractMerchant(text) {
  const enMatch = text.match(
    /(?:categorize(?:\s+this)?:?\s*|what category (?:is\s+)?(?:for\s+)?|classify(?:\s+this)?:?\s*|what type of (?:expense|transaction|spend) is\s*)(.+?)(?:\?|$)/i
  )
  if (enMatch) return enMatch[1].trim()
  const arMatch = text.match(/(?:صنّف|صنف)\s+(.+?)(?:\?|$)/)
  if (arMatch) return arMatch[1].trim()
  return text // fallback: pass the whole message
}

// ── Thinking bubble ───────────────────────────────────────────────────────────

function ThinkingBubble() {
  return (
    <div className="flex items-end gap-2">
      <div className="w-8 h-8 flex items-end justify-center shrink-0 mb-0.5">
        <MunamiMascot size={30} expression="happy" />
      </div>
      <div className="bg-tint border-[0.5px] border-primary/25 rounded-[18px] rounded-bl-[4px] px-4 py-3">
        <div className="flex gap-1.5 items-center">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-primary/60"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Main tab ──────────────────────────────────────────────────────────────────

export default function CopilotTab({ financialContext }) {
  const { locale } = useLocale()
  const scrollRef = useRef(null)
  const inputRef = useRef(null)

  const [messages, setMessages] = useState([
    { role: 'ai', content: pickRandomGreeting(locale) },
  ])
  const [input, setInput] = useState('')
  const [isThinking, setIsThinking] = useState(false)

  // On locale switch, swap greeting to the new language (only if still at the opening message)
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].role === 'ai') {
        return [{ role: 'ai', content: pickRandomGreeting(locale) }]
      }
      return prev
    })
  }, [locale])

  // Auto-scroll to bottom when messages or thinking state changes
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    setTimeout(() => el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' }), 80)
  }, [messages, isThinking])

  async function sendMessage(text) {
    const content = text.trim()
    if (!content || isThinking) return

    const userMsg = { role: 'user', content }
    const nextMessages = [...messages, userMsg]
    setMessages(nextMessages)
    setInput('')

    // Safety switch: no API calls in demo mode
    if (!USE_AI) {
      setTimeout(() => {
        const fallback = locale === 'ar'
          ? 'منمّي في وضع العرض التجريبي. فعّل VITE_USE_AI لردود حية!'
          : 'منمّي is in demo mode right now — enable AI for live responses!'
        setMessages((prev) => [...prev, { role: 'ai', content: fallback }])
      }, 600)
      return
    }

    setIsThinking(true)

    // Categorization intent → call /api/categorize, reply in normal chat bubble
    if (isCategoryQuestion(content)) {
      const merchant = extractMerchant(content)
      try {
        const res = await fetch('/api/categorize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ merchant }),
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const { category } = await res.json()
        const emoji = CATEGORY_EMOJI[category] || '📦'
        const reply = locale === 'ar'
          ? `"${merchant}" تقع تحت فئة ${category} ${emoji}`
          : `"${merchant}" is ${category} ${emoji}`
        setMessages((prev) => [...prev, { role: 'ai', content: reply }])
      } catch (err) {
        console.warn('[CopilotTab] categorize error:', err.message)
        const fallback = locale === 'ar'
          ? 'لم أتمكن من التصنيف الآن. حاول مرة أخرى!'
          : "Couldn't categorize that right now — try again in a moment!"
        setMessages((prev) => [...prev, { role: 'ai', content: fallback }])
      } finally {
        setIsThinking(false)
      }
      return
    }

    // Normal chat → /api/chat with full message history and financial context
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages.map((m) => ({ role: m.role, content: m.content })),
          context: financialContext,
          locale,
        }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const { reply } = await res.json()
      setMessages((prev) => [...prev, { role: 'ai', content: reply }])
    } catch (err) {
      console.warn('[CopilotTab] chat error:', err.message)
      const fallback = locale === 'ar'
        ? 'أواجه بعض الصعوبة في الاتصال الآن. حاول مرة أخرى قريباً!'
        : "I'm having a bit of trouble connecting right now. Please try again in a moment!"
      setMessages((prev) => [...prev, { role: 'ai', content: fallback }])
    } finally {
      setIsThinking(false)
    }
  }

  return (
    <div className="absolute inset-0 bg-page">
      {/* ── Header ── */}
      {/* pr-16 keeps the title row clear of the floating hamburger (top-right) */}
      <div className="absolute top-0 left-0 right-0 z-10 pl-5 pr-16 pt-4 pb-3.5 bg-page border-b-[3px] border-card-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center shrink-0">
            <MunamiMascot expression="greeting" size={36} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 leading-none">
              <p className="text-text text-base font-bold">منمّي</p>
              <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
              <span className="text-muted text-[10px]">{USE_AI ? 'AI' : 'Demo'}</span>
            </div>
            <p className="text-muted text-[11px] mt-1">{t(locale, 'copilotSubtitle')}</p>
          </div>
        </div>
      </div>

      {/* ── Message thread — always LTR layout (AI left, user right is universal) ── */}
      <div
        ref={scrollRef}
        className="absolute inset-0 overflow-y-auto scroll-thin px-4 pt-[92px] pb-36"
        dir="ltr"
      >
        <div className="flex flex-col gap-3 py-2">
          {messages.map((msg, i) => (
            <motion.div
              key={`${locale}-${i}`}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'items-end gap-2'}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              {msg.role === 'ai' && (
                <div className="w-8 h-8 flex items-end justify-center shrink-0 mb-0.5">
                  {/* The very first bubble is always the chat-open greeting —
                      every later AI reply uses the steady-state happy mood. */}
                  <MunamiMascot size={30} expression={i === 0 ? 'greeting' : 'happy'} />
                </div>
              )}
              <div
                dir={locale === 'ar' ? 'rtl' : 'ltr'}
                className={`max-w-[82%] px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-card border-[0.5px] border-card-border rounded-[18px] rounded-br-[4px] text-text'
                    : 'bg-tint border-[0.5px] border-primary/25 rounded-[18px] rounded-bl-[4px] text-text'
                }`}
              >
                {msg.content}
              </div>
            </motion.div>
          ))}

          <AnimatePresence>
            {isThinking && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <ThinkingBubble />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Input bar ── */}
      <div
        className="absolute left-0 right-0 z-10 px-4 py-3 bg-page border-t-[3px] border-card-border"
        style={{ bottom: 72 }}
      >
        <div
          className="flex items-center gap-3 bg-card rounded-full px-4 py-2.5"
          dir="ltr"
          style={{ border: '3px solid #000000', boxShadow: '4px 4px 0 #000000' }}
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
            placeholder={t(locale, 'askMunami')}
            dir={locale === 'ar' ? 'rtl' : 'ltr'}
            disabled={isThinking}
            className="flex-1 bg-transparent text-text text-sm placeholder:text-muted outline-none min-w-0 disabled:opacity-50"
          />
          <button
            type="button"
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isThinking}
            className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shrink-0 disabled:opacity-40"
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path
                d="M12 1L5.5 7.5M12 1L8 12L5.5 7.5L1 5L12 1Z"
                stroke="#0E0E0E"
                strokeWidth="1.5"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
