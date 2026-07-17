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
  const money = (value) => Math.round(Number(value) || 0).toLocaleString('en-US')
  const has = (...terms) => terms.some((term) => lower.includes(term) || prompt.includes(term))
  const categoryAr = {
    Shopping: 'التسوق',
    'Food & Groceries': 'الطعام والبقالة',
    'Bills & Transport': 'الفواتير والمواصلات',
    Entertainment: 'الترفيه',
    Other: 'أخرى',
  }
  const categoryLabel = (category) => ar ? (categoryAr[category] || category) : category
  const topCategory = context?.topCategories?.[0]
  const bills = context?.upcomingBills || []
  const billsTotal = bills.reduce((sum, bill) => sum + (Number(bill.amount) || 0), 0)
  const budgets = context?.budgets || []

  if (!context) {
    return ar
      ? 'بياناتك المالية ما اكتملت عندي للحين. ارجع بعد ما تحمل الحسابات وجرب سؤالك مرة ثانية.'
      : 'Your financial data has not finished loading yet. Try again once the accounts are available.'
  }

  if (has('balance', 'free money', 'available', 'الرصيد', 'رصيدي', 'المتاح')) {
    return ar
      ? `إجمالي رصيدك ${money(context.totalBalance)} ريال، لكن المتاح فعلياً بعد المبالغ المخصصة هو ${money(context.unallocated)} ريال.`
      : `Your total balance is SAR ${money(context.totalBalance)}, but SAR ${money(context.unallocated)} is actually unallocated.`
  }

  if (has('bank', 'account', 'حساب', 'حساباتي', 'البنوك')) {
    const accounts = (context.accounts || []).map((account) => `${account.bank}: ${money(account.balance)} ريال`).join('، ')
    return ar ? `أرصدة حساباتك: ${accounts}.` : `Your account balances are ${accounts}.`
  }

  if (has('bill', 'bills', 'فاتورة', 'فواتير')) {
    if (!bills.length) return ar ? 'ما عندي فواتير قادمة مسجلة حالياً.' : 'You have no upcoming bills recorded.'
    const billList = bills.map((bill) => `${bill.name} ${money(bill.amount)} ريال`).join('، ')
    return ar ? `فواتيرك القادمة: ${billList}. الإجمالي ${money(billsTotal)} ريال.` : `Upcoming bills: ${billList}. Total: SAR ${money(billsTotal)}.`
  }

  if (has('budget', 'budgets', 'ميزانية', 'الميزانية', 'حدودي')) {
    const tightest = [...budgets]
      .map((budget) => ({ ...budget, remaining: Math.max(0, budget.limit - budget.spent) }))
      .sort((a, b) => a.remaining - b.remaining)[0]
    if (!tightest) return ar ? 'ما عندي حدود ميزانية مسجلة حالياً.' : 'You do not have budget limits recorded yet.'
    return ar
      ? `أضيق ميزانية عندك هي ${categoryLabel(tightest.category)}؛ صرفت ${money(tightest.spent)} من ${money(tightest.limit)} ريال، وباقي ${money(tightest.remaining)} ريال.`
      : `Your tightest budget is ${categoryLabel(tightest.category)}: SAR ${money(tightest.spent)} spent from SAR ${money(tightest.limit)}, with SAR ${money(tightest.remaining)} left.`
  }

  if (has('highest month', 'lowest month', 'history', 'أعلى شهر', 'أقل شهر', 'التاريخ')) {
    const highest = context.highestMonth
    const lowest = context.lowestMonth
    return ar
      ? `أعلى إنفاق كان في ${highest?.month || '—'} بمبلغ ${money(highest?.spend)} ريال، وأقل إنفاق في ${lowest?.month || '—'} بمبلغ ${money(lowest?.spend)} ريال.`
      : `Your highest-spend month was ${highest?.month || '—'} at SAR ${money(highest?.spend)}, and the lowest was ${lowest?.month || '—'} at SAR ${money(lowest?.spend)}.`
  }

  if (has('category', 'biggest', 'most spend', 'فئة', 'أكثر صرف', 'أكبر مصروف')) {
    if (!topCategory) return ar ? 'ما عندي تفاصيل الفئات لهذا الشهر.' : 'I do not have category details for this month.'
    return ar
      ? `أكبر فئة عندك هي ${categoryLabel(topCategory.category)}: ${money(topCategory.amount)} ريال، وتمثل ${topCategory.pct}% من مصروفات الشهر.`
      : `Your biggest category is ${categoryLabel(topCategory.category)} at SAR ${money(topCategory.amount)}, or ${topCategory.pct}% of this month's spending.`
  }

  if (has('emergency', 'fund', 'goal', 'صندوق', 'طوارئ', 'هدف')) {
    const emergency = context.goals?.emergencyFund
    return ar
      ? `صندوق الطوارئ عندك ${money(emergency?.current)} من ${money(emergency?.target)} ريال، يعني باقي ${money((emergency?.target || 0) - (emergency?.current || 0))} ريال للهدف.`
      : `Your emergency fund is SAR ${money(emergency?.current)} of SAR ${money(emergency?.target)}, leaving SAR ${money((emergency?.target || 0) - (emergency?.current || 0))}.`
  }

  if (lower.includes('week') || prompt.includes('الأسبوع')) {
    const budgetRemaining = budgets.reduce((sum, budget) => sum + Math.max(0, budget.limit - budget.spent), 0)
    const safeWeekly = Math.max(0, Math.round(Math.min(context.unallocated - billsTotal, budgetRemaining || context.unallocated) / 4))
    return ar
      ? `تقدر تصرف بأمان قرابة ${money(safeWeekly)} ريال هذا الأسبوع، بعد ما تحجز ${money(billsTotal)} ريال للفواتير القادمة.`
      : `You can safely spend about SAR ${money(safeWeekly)} this week after reserving SAR ${money(billsTotal)} for upcoming bills.`
  }

  return ar
    ? `أنفقت ${money(context.spent)} ريال في ${context.month}، ودخلك ${money(context.income)} ريال. عندك ${money(context.unallocated)} ريال غير مخصص، فخلّ الفواتير أولاً قبل أي صرف جديد.`
    : `You spent SAR ${money(context.spent)} in ${context.month} and earned SAR ${money(context.income)}. You have SAR ${money(context.unallocated)} unallocated, so reserve bills before new spending.`
}
