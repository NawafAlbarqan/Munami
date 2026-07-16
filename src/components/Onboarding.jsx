import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useLocale } from '../lib/LocaleContext'
import MunamiMascot from './MunamiMascot'

const STEPS = {
  ar: [
    ['افهم مصروفاتك', 'يجمع منمّي معاملاتك ويصنّفها لتعرف أين تذهب أموالك.', 'greeting'],
    ['خطط بثقة', 'ميزانية شهرية واضحة تنبّهك قبل أن تتجاوز حدودك.', 'concerned'],
    ['ادّخر لما يهمك', 'حوّل أهدافك إلى خطوات صغيرة وتابع تقدّمك مع منمّي.', 'happy'],
  ],
  en: [
    ['Understand your spending', 'Munami brings your transactions together and shows where your money goes.', 'greeting'],
    ['Plan with confidence', 'A clear monthly budget alerts you before you cross your limits.', 'concerned'],
    ['Save for what matters', 'Turn goals into small steps and track your progress with Munami.', 'happy'],
  ],
}

export default function Onboarding({ onComplete }) {
  const { locale } = useLocale()
  const [index, setIndex] = useState(0)
  const isAr = locale === 'ar'
  const [title, copy, expression] = STEPS[locale][index]
  const last = index === 2

  return (
    <div className="onboarding-screen" dir={isAr ? 'rtl' : 'ltr'}>
      <button className="onboarding-skip" type="button" onClick={onComplete}>{isAr ? 'تخطي' : 'Skip'}</button>
      <div className="onboarding-brand">منمّي</div>
      <AnimatePresence mode="wait">
        <motion.div key={index} className="onboarding-content" initial={{ opacity: 0, x: isAr ? -18 : 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: isAr ? 18 : -18 }}>
          <div className="onboarding-mascot"><MunamiMascot expression={expression} size={170} /></div>
          <p className="onboarding-kicker">{isAr ? `خطوتك ${index + 1} من 3` : `Step ${index + 1} of 3`}</p>
          <h1>{title}</h1>
          <p>{copy}</p>
        </motion.div>
      </AnimatePresence>
      <div className="onboarding-footer">
        <div className="onboarding-progress">{[0, 1, 2].map((step) => <span key={step} className={step === index ? 'is-active' : ''} />)}</div>
        <button type="button" onClick={() => last ? onComplete() : setIndex((value) => value + 1)}>
          {last ? (isAr ? 'ابدأ الآن' : 'Start') : (isAr ? 'التالي' : 'Next')}
          {last ? null : isAr ? <ArrowLeft size={18} /> : <ArrowRight size={18} />}
        </button>
      </div>
    </div>
  )
}
