import { useRef, useEffect } from 'react'
import { motion } from 'motion/react'

const MESSAGES = [
  {
    id: 1,
    role: 'user',
    text: 'How am I doing this month?',
  },
  {
    id: 2,
    role: 'ai',
    text: 'Hey Ahmed 👋 You\'re 9 days into June and you\'ve spent SAR 2,980 so far. At this pace you\'re heading toward about SAR 9,900 — which is a little under your usual, so you\'re on track. Nice start. 🌱',
  },
  {
    id: 3,
    role: 'user',
    text: 'Where is most of my money going?',
  },
  {
    id: 4,
    role: 'ai',
    text: 'Right now Shopping is your biggest category at SAR 1,201 (40% of your spend), followed by Bills & Transport at SAR 711. One thing I noticed — your dining spend mostly comes out of your Al Rajhi account, while your salary lands in Alinma. Want me to help balance that?',
  },
  {
    id: 5,
    role: 'user',
    text: 'How much do I actually have across all my accounts?',
  },
  {
    id: 6,
    role: 'ai',
    text: 'Across all three banks you\'re holding SAR 47,851. That\'s SAR 15,420 in Alinma, SAR 9,281 in Al Rajhi, and SAR 23,150 in your SNB savings. Of that, SAR 11,500 is set aside in your funds — so you have about SAR 36,350 unallocated and free to use.',
  },
  {
    id: 7,
    role: 'user',
    text: 'I want to build up my emergency fund. Any advice?',
  },
  {
    id: 8,
    role: 'ai',
    text: 'Love that. Your Emergency Fund is at SAR 6,000 — 40% of your SAR 15,000 goal. Based on your income and spending, you comfortably have room to move SAR 1,500/month into it without touching your lifestyle. At that pace you\'d hit your goal in about 6 months. Want me to set up an automatic transfer and turn it into a challenge for XP?',
  },
  {
    id: 9,
    role: 'user',
    text: 'Yes, do it 🔥',
  },
  {
    id: 10,
    role: 'ai',
    text: 'Done! I\'ve set SAR 1,500/month toward your Emergency Fund, and started a \'Safety Net\' challenge — you\'ll earn 300 XP each month you hit it. You\'ve got this. I\'ll keep an eye on things and nudge you if anything changes. 🌱',
  },
]

const CHIPS = [
  'Why is my dining up?',
  'Can I afford a vacation?',
  'Show my spending trend',
]

// Stagger timings — last message finishes at MESSAGES.length * 120ms + 300ms ≈ 1.5s
const MSG_DELAY = 0.12 // seconds between each message
const CHIPS_DELAY = MESSAGES.length * MSG_DELAY + 0.3

export default function CopilotTab() {
  const scrollRef = useRef(null)

  // Auto-scroll to bottom after all messages have animated in
  useEffect(() => {
    const ms = (CHIPS_DELAY + 0.4) * 1000
    const timer = setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
    }, ms)
    return () => clearTimeout(timer)
  }, [])

  return (
    <>
      {/* ── Header ── */}
      <div className="absolute top-0 left-0 right-0 z-10 h-14 flex items-center px-4 gap-3 bg-page border-b border-card-border">
        <div className="w-9 h-9 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center text-lg shrink-0">
          🌱
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-text text-sm font-semibold leading-none">منمّي</p>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            <p className="text-muted text-[10px]">Online · Your financial copilot</p>
          </div>
        </div>
      </div>

      {/* ── Message thread ── */}
      <div
        ref={scrollRef}
        className="absolute inset-0 overflow-y-auto scroll-thin px-4 pt-[72px] pb-[140px]"
      >
        <div className="flex flex-col gap-3 py-2">
          {MESSAGES.map((msg, i) => (
            <motion.div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'items-end gap-2'}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, delay: i * MSG_DELAY, ease: 'easeOut' }}
            >
              {/* منمّي avatar — only on AI messages */}
              {msg.role === 'ai' && (
                <div className="w-7 h-7 rounded-full bg-primary/15 border border-primary/20 flex items-center justify-center text-xs shrink-0 mb-0.5">
                  🌱
                </div>
              )}

              {/* Bubble */}
              <div
                className={`max-w-[82%] px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-card border-[0.5px] border-card-border rounded-[18px] rounded-br-[4px] text-text'
                    : 'bg-tint border-[0.5px] border-primary/25 rounded-[18px] rounded-bl-[4px] text-text'
                }`}
              >
                {msg.text}
              </div>
            </motion.div>
          ))}

          {/* Suggested chips — appear after last message */}
          <motion.div
            className="mt-3 flex flex-col gap-2"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, delay: CHIPS_DELAY, ease: 'easeOut' }}
          >
            <p className="text-muted text-[11px] px-1 mb-1">Suggested</p>
            {CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                className="self-start bg-card border-[0.5px] border-card-border rounded-full px-4 py-2 text-text text-xs font-medium"
              >
                {chip}
              </button>
            ))}
          </motion.div>
        </div>
      </div>

      {/* ── Input bar — visual only, real AI wired later ── */}
      <div className="absolute bottom-16 left-0 right-0 z-10 px-4 py-3 bg-page border-t-[0.5px] border-card-border">
        <div className="flex items-center gap-3 bg-card border-[0.5px] border-card-border rounded-full px-4 py-2.5">
          <input
            type="text"
            placeholder="Ask منمّي..."
            className="flex-1 bg-transparent text-text text-sm placeholder:text-muted outline-none min-w-0"
            readOnly
          />
          <button
            type="button"
            className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shrink-0"
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
