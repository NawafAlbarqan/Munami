import { useRef, useEffect } from 'react'
import { motion } from 'motion/react'
import GrowthMark from './GrowthMark'
import MunamiMascot from './MunamiMascot'
import { useLocale } from '../lib/LocaleContext'
import { t } from '../lib/i18n'

const MESSAGES_EN = [
  { id: 1, role: 'user', text: 'How am I doing this month?' },
  { id: 2, role: 'ai', text: 'Hey Ahmed 👋 You\'re 9 days into June and you\'ve spent SAR 2,980 so far. At this pace you\'re heading toward about SAR 9,900 — which is a little under your usual, so you\'re on track. Nice start. 🌱' },
  { id: 3, role: 'user', text: 'Where is most of my money going?' },
  { id: 4, role: 'ai', text: 'Right now Shopping is your biggest category at SAR 1,201 (40% of your spend), followed by Bills & Transport at SAR 711. One thing I noticed — your dining spend mostly comes out of your Al Rajhi account, while your salary lands in Alinma. Want me to help balance that?' },
  { id: 5, role: 'user', text: 'How much do I actually have across all my accounts?' },
  { id: 6, role: 'ai', text: 'Across all three banks you\'re holding SAR 47,851. That\'s SAR 15,420 in Alinma, SAR 9,281 in Al Rajhi, and SAR 23,150 in your SNB savings. Of that, SAR 11,500 is set aside in your funds — so you have about SAR 36,350 unallocated and free to use.' },
  { id: 7, role: 'user', text: 'I want to build up my emergency fund. Any advice?' },
  { id: 8, role: 'ai', text: 'Love that. Your Emergency Fund is at SAR 6,000 — 40% of your SAR 15,000 goal. Based on your income and spending, you comfortably have room to move SAR 1,500/month into it without touching your lifestyle. At that pace you\'d hit your goal in about 6 months. Want me to set up an automatic transfer and turn it into a challenge for XP?' },
  { id: 9, role: 'user', text: 'Yes, do it 🔥' },
  { id: 10, role: 'ai', text: 'Done! I\'ve set SAR 1,500/month toward your Emergency Fund, and started a \'Safety Net\' challenge — you\'ll earn 300 XP each month you hit it. You\'ve got this. I\'ll keep an eye on things and nudge you if anything changes. 🌱' },
]

const CHIPS_EN = [
  'Why is my dining up?',
  'Can I afford a vacation?',
  'Show my spending trend',
]

const MESSAGES_AR = [
  { id: 1, role: 'user', text: 'كيف حالي هذا الشهر؟' },
  { id: 2, role: 'ai', text: 'أهلاً أحمد 👋 مضى 9 أيام من يونيو وأنفقت حتى الآن 2,980 ريال. بهذه الوتيرة أنت في طريقك نحو حوالي 9,900 ريال — أقل قليلاً من المعتاد، يعني أنت على المسار الصحيح. بداية رائعة. 🌱' },
  { id: 3, role: 'user', text: 'أين يذهب معظم أموالي؟' },
  { id: 4, role: 'ai', text: 'حالياً التسوق هو الفئة الأكبر بـ 1,201 ريال (40% من إنفاقك)، يليه الفواتير والمواصلات بـ 711 ريال. لاحظت شيئاً — معظم إنفاقك على الطعام يخرج من حساب الراجحي، بينما راتبك يصل إلى الأهلي. تريد مساعدتي في موازنة ذلك؟' },
  { id: 5, role: 'user', text: 'كم يوجد لدي في جميع حساباتي؟' },
  { id: 6, role: 'ai', text: 'عبر البنوك الثلاثة لديك 47,851 ريال. منها 15,420 في الأهلي، و9,281 في الراجحي، و23,150 في مدخرات SNB. من هذا المبلغ، 11,500 ريال مخصصة للصناديق — أي لديك حوالي 36,350 ريال غير مخصصة وحرة للاستخدام.' },
  { id: 7, role: 'user', text: 'أريد بناء صندوق الطوارئ. ما رأيك؟' },
  { id: 8, role: 'ai', text: 'أحب ذلك! صندوق طوارئك عند 6,000 ريال — 40% من هدفك البالغ 15,000 ريال. بناءً على دخلك وإنفاقك، بإمكانك براحة تحويل 1,500 ريال شهرياً دون التأثير على أسلوب حياتك. بهذه الوتيرة ستصل لهدفك خلال 6 أشهر. تريد مني إعداد تحويل تلقائي وتحويله إلى تحدي لكسب نقاط XP؟' },
  { id: 9, role: 'user', text: 'نعم، افعل ذلك 🔥' },
  { id: 10, role: 'ai', text: 'تم! ضبطت 1,500 ريال شهرياً لصندوق الطوارئ، وبدأت تحدي "شبكة الأمان" — ستكسب 300 نقطة XP كل شهر تحقق فيه الهدف. أنت قادر على ذلك. سأراقب الأمور وأنبهك إن تغير شيء. 🌱' },
]

const CHIPS_AR = [
  'لماذا ارتفع إنفاق الطعام؟',
  'هل أستطيع تحمّل إجازة؟',
  'أرني مسار إنفاقي',
]

const MSG_DELAY = 0.12
const CHIPS_DELAY = 10 * MSG_DELAY + 0.3

export default function CopilotTab() {
  const { locale } = useLocale()
  const scrollRef = useRef(null)

  const messages = locale === 'ar' ? MESSAGES_AR : MESSAGES_EN
  const chips = locale === 'ar' ? CHIPS_AR : CHIPS_EN

  // Auto-scroll to bottom after all messages animate in
  useEffect(() => {
    const ms = (CHIPS_DELAY + 0.4) * 1000
    const timer = setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
    }, ms)
    return () => clearTimeout(timer)
  }, [locale])

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
            </div>
            <p className="text-muted text-[11px] mt-1">{t(locale, 'copilotSubtitle')}</p>
          </div>
        </div>
      </div>

      {/* ── Message thread — always LTR: AI left, user right ── */}
      <div
        ref={scrollRef}
        className="absolute inset-0 overflow-y-auto scroll-thin px-4 pt-[78px] pb-[140px]"
        dir="ltr"
      >
        <div className="flex flex-col gap-3 py-2">
          {messages.map((msg, i) => (
            <motion.div
              key={`${locale}-${msg.id}`}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'items-end gap-2'}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, delay: i * MSG_DELAY, ease: 'easeOut' }}
            >
              {/* منمّي avatar — AI messages only */}
              {msg.role === 'ai' && (
                <div className="w-8 h-8 rounded-full bg-primary/15 border border-primary/20 flex items-center justify-center shrink-0 mb-0.5 overflow-hidden">
                  <MunamiMascot size={26} expression="happy" />
                </div>
              )}

              {/* Bubble — text direction follows locale */}
              <div
                dir={locale === 'ar' ? 'rtl' : 'ltr'}
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

          {/* Suggested chips */}
          <motion.div
            className="mt-3 flex flex-col gap-2 items-start"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, delay: CHIPS_DELAY, ease: 'easeOut' }}
          >
            <p className="text-muted text-[11px] px-1 mb-1">{t(locale, 'whatsOnYourMind')}</p>
            {chips.map((chip) => (
              <button
                key={chip}
                type="button"
                dir={locale === 'ar' ? 'rtl' : 'ltr'}
                className="bg-card border-[0.5px] border-card-border rounded-full px-4 py-2 text-text text-xs font-medium"
              >
                {chip}
              </button>
            ))}
          </motion.div>
        </div>
      </div>

      {/* ── Input bar — visual only ── */}
      <div className="absolute bottom-16 left-0 right-0 z-10 px-4 py-3 bg-page border-t-[0.5px] border-card-border">
        <div className="flex items-center gap-3 bg-card border-[0.5px] border-card-border rounded-full px-4 py-2.5" dir="ltr">
          <input
            type="text"
            placeholder={t(locale, 'askMunami')}
            className="flex-1 bg-transparent text-text text-sm placeholder:text-muted outline-none min-w-0"
            dir={locale === 'ar' ? 'rtl' : 'ltr'}
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
