import { useRef, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import MunamiMascot from './MunamiMascot'
import { useLocale } from '../lib/LocaleContext'
import { t } from '../lib/i18n'
import {
  loadCurrentConversation,
  saveCurrentConversation,
  loadHistory,
  makeConversation,
  startNewConversation,
  restoreConversation,
  conversationPreview,
} from '../lib/chatStorage'

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
      <div
        className="rounded-[16px] rounded-bl-[4px] px-4 py-3"
        style={{ background: 'var(--chat-bubble-ai)', border: '1px solid var(--chat-border)' }}
      >
        <div className="flex gap-1.5 items-center">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: 'var(--color-primary)' }}
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

  // Chat persists in localStorage (see src/lib/chatStorage.js) so it survives
  // switching tabs and returning — CopilotTab unmounts when another tab is
  // active, so React state alone wouldn't survive that. Loaded once on mount;
  // if there's no saved conversation yet, start with just the greeting.
  const [conversation, setConversation] = useState(
    () => loadCurrentConversation() || makeConversation(pickRandomGreeting(locale))
  )
  const [history, setHistory] = useState(() => loadHistory())
  const [historyOpen, setHistoryOpen] = useState(false)
  const messages = conversation.messages

  function setMessages(update) {
    setConversation((prev) => ({
      ...prev,
      messages: typeof update === 'function' ? update(prev.messages) : update,
      updatedAt: Date.now(),
    }))
  }

  const [input, setInput] = useState('')
  const [isThinking, setIsThinking] = useState(false)

  // Every change to the current conversation is saved immediately.
  useEffect(() => {
    saveCurrentConversation(conversation)
  }, [conversation])

  // On locale switch, swap greeting to the new language (only if still at the opening message)
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].role === 'ai') {
        return [{ role: 'ai', content: pickRandomGreeting(locale) }]
      }
      return prev
    })
  }, [locale])

  // Starting a new conversation is a deliberate action (the "new chat"
  // button) — never automatic on tab switch. Archives the current
  // conversation into history first (only if the user actually said
  // something in it).
  function handleNewChat() {
    const fresh = startNewConversation(conversation, pickRandomGreeting(locale))
    setConversation(fresh)
    setHistory(loadHistory())
  }

  function openHistory() {
    setHistory(loadHistory())
    setHistoryOpen(true)
  }

  function handleRestore(picked) {
    const restored = restoreConversation(conversation, picked)
    setConversation(restored)
    setHistory(loadHistory())
    setHistoryOpen(false)
  }

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
    // Conversation canvas follows the theme: deep navy in dark mode, warm
    // ivory in light mode (--chat-* tokens in src/index.css).
    <div className="absolute inset-0" style={{ background: 'var(--chat-canvas)' }}>
      {/* ── Header ── */}
      {/* pr-16 keeps the title row clear of the floating hamburger (top-right) */}
      <div
        className="absolute top-0 left-0 right-0 z-10 pl-5 pr-16 pt-4 pb-3.5"
        style={{ background: 'var(--chat-canvas)', borderBottom: '1px solid var(--chat-border)' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center shrink-0">
            <MunamiMascot expression="greeting" size={36} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 leading-none">
              <p className="text-base font-bold" style={{ color: 'var(--chat-ink)' }}>منمّي</p>
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: 'var(--color-positive)' }} />
              <span className="text-[10px]" style={{ color: 'var(--chat-muted)' }}>{USE_AI ? 'AI' : 'Demo'}</span>
            </div>
            <p className="text-[11px] mt-1" style={{ color: 'var(--chat-muted)' }}>{t(locale, 'copilotSubtitle')}</p>
          </div>
          <button
            type="button"
            onClick={openHistory}
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
            style={{ background: 'var(--chat-surface)', color: 'var(--chat-muted)' }}
            aria-label={t(locale, 'chatHistory')}
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <circle cx="7.5" cy="7.5" r="6.25" stroke="currentColor" strokeWidth="1.4" />
              <path d="M7.5 4v3.5L10 9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </button>
          <button
            type="button"
            onClick={handleNewChat}
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
            style={{ background: 'var(--chat-surface)', color: 'var(--chat-muted)' }}
            aria-label={t(locale, 'newChat')}
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <path d="M7.5 2.5v10M2.5 7.5h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── History panel — bottom sheet listing up to the last 5 archived
          conversations. Picking one restores it as the current conversation
          (archiving whatever was on screen first); this is the only other
          way (besides "new chat") the current conversation ever changes. ── */}
      <AnimatePresence>
        {historyOpen && (
          <motion.div
            className="absolute inset-0 z-20 flex flex-col justify-end"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setHistoryOpen(false)}
            />
            <motion.div
              className="relative rounded-t-[24px] px-5 pt-3 pb-6 max-h-[70%] overflow-y-auto scroll-thin"
              style={{ background: 'var(--chat-surface)', borderTop: '1px solid var(--chat-border)' }}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
            >
              <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: 'var(--chat-handle)' }} />
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-bold" style={{ color: 'var(--chat-ink)' }}>{t(locale, 'chatHistory')}</p>
                <button type="button" onClick={() => setHistoryOpen(false)} className="text-xs font-semibold" style={{ color: 'var(--chat-muted)' }}>
                  {t(locale, 'close')}
                </button>
              </div>
              {history.length === 0 ? (
                <p className="text-sm py-6 text-center" style={{ color: 'var(--chat-muted)' }}>{t(locale, 'noPastChats')}</p>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {history.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleRestore(c)}
                      className="text-left rounded-[16px] px-4 py-3"
                      style={{ background: 'var(--chat-bubble-ai)', border: '1px solid var(--chat-border)' }}
                      dir={locale === 'ar' ? 'rtl' : 'ltr'}
                    >
                      <p className="text-sm font-semibold truncate" style={{ color: 'var(--chat-ink)' }}>{conversationPreview(c)}</p>
                      <p className="text-[11px] mt-1" style={{ color: 'var(--chat-muted)' }}>
                        {new Date(c.updatedAt).toLocaleString(locale === 'ar' ? 'ar-SA' : 'en-US', {
                          month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
                        })}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
                    ? 'rounded-[16px] rounded-br-[4px]'
                    : 'rounded-[16px] rounded-bl-[4px]'
                }`}
                style={
                  msg.role === 'user'
                    // soft orange-tinted user bubble — navy ink in both themes
                    ? { background: 'var(--chat-bubble-user)', color: '#0D1B2A' }
                    : { background: 'var(--chat-bubble-ai)', color: 'var(--chat-ink)', border: '1px solid var(--chat-border)' }
                }
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
        className="absolute left-0 right-0 z-10 px-4 py-3"
        style={{ bottom: 72, background: 'var(--chat-canvas)', borderTop: '1px solid var(--chat-border)' }}
      >
        <div
          className="flex items-center gap-3 rounded-[14px] px-4 py-2.5"
          dir="ltr"
          style={{ background: 'var(--chat-surface)', border: '1px solid var(--chat-border)' }}
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
            className="flex-1 bg-transparent text-sm outline-none min-w-0 disabled:opacity-50 placeholder:text-[color:var(--chat-muted)]"
            style={{ color: 'var(--chat-ink)', caretColor: 'var(--color-primary)' }}
          />
          <button
            type="button"
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isThinking}
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 disabled:opacity-40"
            style={{ background: 'var(--gradient-coral)' }}
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path
                d="M12 1L5.5 7.5M12 1L8 12L5.5 7.5L1 5L12 1Z"
                stroke="#081B2A"
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
