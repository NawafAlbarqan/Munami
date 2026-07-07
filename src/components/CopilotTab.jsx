import { useRef, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import GrowthMark from './GrowthMark'
import MunamiMascot from './MunamiMascot'
import { useLocale } from '../lib/LocaleContext'
import { t, formatSAR } from '../lib/i18n'

const USE_AI = import.meta.env.VITE_USE_AI === 'true'

// ── Scripted fallback (used when VITE_USE_AI=false or API fails) ──────────────

const SCRIPTED_EN = [
  { role: 'ai', content: 'Hey Ahmed 👋 You\'re 9 days into June and you\'ve spent SAR 2,980 so far. At this pace you\'re heading toward about SAR 9,900 — a little under your usual, so you\'re on track. Nice start. 🌱' },
  { role: 'user', content: 'Where is most of my money going?' },
  { role: 'ai', content: 'Shopping is your biggest category at SAR 1,201 (40%), followed by Bills & Transport at SAR 711. Your dining spend mostly flows through Al Rajhi while your salary lands in Alinma — want help balancing that?' },
  { role: 'user', content: 'How much do I have across all my accounts?' },
  { role: 'ai', content: 'You\'re holding SAR 47,851 across three banks — SAR 15,420 in Alinma, SAR 9,281 in Al Rajhi, and SAR 23,150 in SNB savings. About SAR 36,350 is unallocated and free to use. 🌱' },
]

const SCRIPTED_AR = [
  { role: 'ai', content: 'مرحباً أحمد 👋 مضى 9 أيام من يونيو وأنفقت حتى الآن 2,980 ريال. بهذه الوتيرة أنت في طريقك نحو 9,900 ريال — أقل قليلاً من المعتاد، أنت على المسار. بداية رائعة. 🌱' },
  { role: 'user', content: 'أين يذهب معظم أموالي؟' },
  { role: 'ai', content: 'التسوق هو الفئة الأكبر بـ 1,201 ريال (40%)، يليه الفواتير والمواصلات بـ 711 ريال. معظم إنفاقك على الطعام يخرج من الراجحي بينما راتبك يصل للأهلي — تريد مساعدة في موازنة ذلك؟' },
  { role: 'user', content: 'كم يوجد لدي في جميع حساباتي؟' },
  { role: 'ai', content: 'رصيدك الإجمالي 47,851 ريال عبر ثلاثة بنوك — 15,420 في الأهلي، و9,281 في الراجحي، و23,150 في SNB. حوالي 36,350 ريال غير مخصصة وحرة للاستخدام. 🌱' },
]

const CHIPS_EN = ['Why is my dining up?', 'Can I afford a vacation?', 'Show my spending trend']
const CHIPS_AR = ['لماذا ارتفع إنفاق الطعام؟', 'هل أستطيع تحمّل إجازة؟', 'أرني مسار إنفاقي']

// Builds a short dynamic greeting using real financial context
function buildGreeting(locale, context) {
  if (!context) {
    return locale === 'ar'
      ? 'مرحباً! 👋 جارِ تحميل بياناتك... 🌱'
      : 'Hey! 👋 Loading your finances... 🌱'
  }
  if (locale === 'ar') {
    return `مرحباً أحمد! 👋 رصيدك الإجمالي ${formatSAR(context.totalBalance)} عبر ${context.accounts.length} بنوك. هذا الشهر أنفقت ${formatSAR(context.spent)} حتى الآن. ما الذي تودّ معرفته؟ 🌱`
  }
  return `Hey Ahmed! 👋 You've got ${formatSAR(context.totalBalance)} across ${context.accounts.length} banks. This month you've spent ${formatSAR(context.spent)} so far. What would you like to know? 🌱`
}

// ── Thinking bubble ───────────────────────────────────────────────────────────

function ThinkingBubble() {
  return (
    <div className="flex items-end gap-2">
      <div className="w-8 h-8 rounded-full bg-primary/15 border border-primary/20 flex items-center justify-center shrink-0 mb-0.5 overflow-hidden">
        <MunamiMascot size={26} expression="happy" />
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

// ── Live categorization demo ──────────────────────────────────────────────────

function CategorizationDemo({ locale }) {
  const [merchant, setMerchant] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const EXAMPLES = ['STARBUCKS RIYADH SA', 'NETFLIX SUBSCRIPTION', 'STC BILL PAYMENT', 'H&M RIYADH PARK']

  async function categorize() {
    const text = merchant.trim()
    if (!text) return
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/categorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchant: text }),
      })
      const data = await res.json()
      setResult(data.category || 'Other')
    } catch {
      setResult('Other')
    } finally {
      setLoading(false)
    }
  }

  const label = locale === 'ar' ? 'تصنيف حي للمعاملات ✨' : '✨ Live AI Categorization'
  const placeholder = locale === 'ar' ? 'أدخل اسم التاجر...' : 'Enter a merchant name...'
  const btnLabel = locale === 'ar' ? 'صنّف' : 'Categorize'

  return (
    <div className="mx-4 mb-3 bg-card border-[0.5px] border-card-border rounded-[20px] p-4">
      <p className="text-text text-xs font-semibold mb-3">{label}</p>

      {/* Example chips */}
      <div className="flex gap-1.5 flex-wrap mb-3">
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            type="button"
            onClick={() => setMerchant(ex)}
            className="text-[10px] px-2.5 py-1 rounded-full bg-tint border-[0.5px] border-card-border text-muted"
          >
            {ex}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={merchant}
          onChange={(e) => setMerchant(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && categorize()}
          placeholder={placeholder}
          dir="ltr"
          className="flex-1 bg-tint border-[0.5px] border-card-border rounded-[12px] px-3 py-2 text-text text-xs outline-none"
        />
        <button
          onClick={categorize}
          disabled={!merchant.trim() || loading}
          className="px-3 py-2 rounded-[12px] bg-primary text-page text-xs font-semibold disabled:opacity-40"
        >
          {loading ? '...' : btnLabel}
        </button>
      </div>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-3 flex items-center gap-2"
          >
            <span className="text-muted text-xs">{locale === 'ar' ? 'الفئة:' : 'Category:'}</span>
            <span className="bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded-full">
              {result}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Main tab ──────────────────────────────────────────────────────────────────

export default function CopilotTab({ financialContext }) {
  const { locale } = useLocale()
  const scrollRef = useRef(null)
  const inputRef = useRef(null)

  // Initialise with the greeting, scripted fallback, or empty depending on mode
  const initialMessages = USE_AI
    ? [{ role: 'ai', content: buildGreeting(locale, financialContext) }]
    : locale === 'ar' ? SCRIPTED_AR : SCRIPTED_EN

  const [messages, setMessages] = useState(initialMessages)
  const [input, setInput] = useState('')
  const [isThinking, setIsThinking] = useState(false)

  // Update greeting when financial context loads (AI mode only)
  useEffect(() => {
    if (!USE_AI || !financialContext) return
    setMessages([{ role: 'ai', content: buildGreeting(locale, financialContext) }])
  }, [financialContext, locale])

  // Re-init scripted messages on locale change (scripted mode)
  useEffect(() => {
    if (USE_AI) return
    setMessages(locale === 'ar' ? SCRIPTED_AR : SCRIPTED_EN)
  }, [locale])

  // Auto-scroll to bottom when messages change
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
    setIsThinking(true)

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
        ? 'أواجه بعض الصعوبة في الاتصال الآن. حاول مرة أخرى قريباً! 🌱'
        : "I'm having a bit of trouble connecting right now. Please try again in a moment! 🌱"
      setMessages((prev) => [...prev, { role: 'ai', content: fallback }])
    } finally {
      setIsThinking(false)
    }
  }

  const chips = USE_AI
    ? (locale === 'ar' ? CHIPS_AR : CHIPS_EN)
    : []

  const showChips = !USE_AI || messages.length <= 2

  return (
    <>
      {/* ── Header ── */}
      <div className="absolute top-0 left-0 right-0 z-10 px-5 pt-4 pb-3.5 bg-page border-b border-card-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0">
            <GrowthMark size={19} color="var(--color-primary)" />
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

      {/* ── Message thread — always LTR (AI left, user right is universal) ── */}
      <div
        ref={scrollRef}
        className="absolute inset-0 overflow-y-auto scroll-thin px-4 pt-[78px] pb-[220px]"
        dir="ltr"
      >
        <div className="flex flex-col gap-3 py-2">
          {messages.map((msg, i) => (
            <motion.div
              key={`${locale}-${i}`}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'items-end gap-2'}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: USE_AI ? 0 : i * 0.1, ease: 'easeOut' }}
            >
              {msg.role === 'ai' && (
                <div className="w-8 h-8 rounded-full bg-primary/15 border border-primary/20 flex items-center justify-center shrink-0 mb-0.5 overflow-hidden">
                  <MunamiMascot size={26} expression="happy" />
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

          {/* Thinking animation */}
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

          {/* Suggested chips — show at the start or in scripted mode */}
          {showChips && chips.length > 0 && (
            <motion.div
              className="mt-2 flex flex-col gap-2 items-start"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.4 }}
            >
              <p className="text-muted text-[11px] px-1 mb-1">{t(locale, 'whatsOnYourMind')}</p>
              {chips.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  dir={locale === 'ar' ? 'rtl' : 'ltr'}
                  onClick={() => sendMessage(chip)}
                  className="bg-card border-[0.5px] border-card-border rounded-full px-4 py-2 text-text text-xs font-medium active:bg-tint"
                >
                  {chip}
                </button>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      {/* ── Live categorization demo ── */}
      {USE_AI && (
        <div className="absolute left-0 right-0 z-10" style={{ bottom: 72 + 64 }}>
          <CategorizationDemo locale={locale} />
        </div>
      )}

      {/* ── Input bar ── */}
      <div
        className="absolute left-0 right-0 z-10 px-4 py-3 bg-page border-t-[0.5px] border-card-border"
        style={{ bottom: 72 }}
      >
        <div className="flex items-center gap-3 bg-card border-[0.5px] border-card-border rounded-full px-4 py-2.5" dir="ltr">
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
    </>
  )
}
