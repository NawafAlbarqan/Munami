export const DEMO_NOW = new Date('2026-07-16T12:00:00+03:00')

export function isDemoMode() {
  return typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('demo') === 'true'
}

export function demoScreen() {
  if (typeof window === 'undefined') return null
  return new URLSearchParams(window.location.search).get('screen')
}

export function shouldShowOnboarding() {
  if (typeof window === 'undefined') return false
  const params = new URLSearchParams(window.location.search)
  return params.get('onboarding') === 'true' || (isDemoMode() && !localStorage.getItem('munami_demo_onboarded'))
}

export function completeDemoOnboarding() {
  localStorage.setItem('munami_demo_onboarded', 'true')
}

export function resetDemo() {
  const keys = [
    'munami-primary-cash', 'munami-cash-transactions', 'munami-budget-limits',
    'munami-upcoming-bills', 'munami_chat_current', 'munami_chat_history',
    'munami_demo_onboarded',
  ]
  keys.forEach((key) => localStorage.removeItem(key))
  window.location.assign(`${window.location.pathname}?demo=true&onboarding=true`)
}

export function demoAssistantReply(locale, prompt, context) {
  const lower = prompt.toLowerCase()
  const ar = locale === 'ar'
  if (lower.includes('week') || prompt.includes('الأسبوع')) {
    return ar
      ? `تقدر تصرف بأمان حوالي 1,420 ريال هذا الأسبوع وتبقى ضمن خطتك، بعد حجز 295 ريال للفواتير القادمة.`
      : `You can safely spend about SAR 1,420 this week and stay on plan, after reserving SAR 295 for upcoming bills.`
  }
  if (lower.includes('restaurant') || prompt.includes('المطاعم')) {
    return ar
      ? 'ارتفع إنفاق المطاعم بسبب 4 طلبات إضافية هذا الشهر. تقليل طلب واحد أسبوعياً يوفر لك قرابة 180 ريال شهرياً.'
      : 'Restaurant spending rose because of 4 additional orders this month. Skipping one order a week would save about SAR 180 monthly.'
  }
  if (lower.includes('travel') || prompt.includes('السفر')) {
    return ar
      ? 'نعم. بإضافة 750 ريال شهرياً تصل لهدف السفر قبل 15 ديسمبر 2026، مع هامش يقارب أسبوعين.'
      : 'Yes. Contributing SAR 750 monthly gets you to your travel goal before December 15, 2026, with roughly two weeks to spare.'
  }
  if (lower.includes('subscription') || prompt.includes('اشتراك')) {
    return ar
      ? 'ابدأ بمراجعة Netflix؛ استخدامه أقل من بقية الاشتراكات وإيقافه يوفر 55 ريال شهرياً.'
      : 'Review Netflix first. It has the lowest usage among your subscriptions and pausing it saves SAR 55 monthly.'
  }
  return ar
    ? `أنفقت ${Math.round(context?.spent || 877)} ريال هذا الشهر. وضعك مستقر، وأفضل خطوة الآن هي حجز الفواتير قبل أي مصروف ترفيهي جديد.`
    : `You have spent SAR ${Math.round(context?.spent || 877)} this month. You are stable; reserve upcoming bills before adding new discretionary spending.`
}
