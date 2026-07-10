// All UI strings and locale utilities. Every function takes `locale` ('en'|'ar')
// as its first argument — pure functions, no module-level state.

const STRINGS = {
  en: {
    // Overview
    greeting: (name) => `Hi ${name} 👋`,
    summaryTitle: (month) => `${month} Summary`,
    summaryTitlePartial: (month) => `${month} · So Far`,
    income: 'Income',
    incomeCarriedOver: (month) => `Income · ${month}`,
    spent: 'Spent',
    net: 'Net',
    loading: 'Loading...',
    youveSpent: "You've spent",
    leftOver: 'Left over',
    mascotEarly: (n) => `${n} day${n !== 1 ? 's' : ''} in — keep it up!`,
    mascotCelebrating: 'Crushing it this month 🌿',
    mascotConcerned: "Let's reel it in a bit",
    mascotOnTrack: 'On track, keep going!',

    // Bottom nav
    navTransactions: 'Transactions',
    navGoals: 'Goals',
    navOverview: 'Overview',
    navAccounts: 'Accounts',

    // Goals tab
    goalsSubtitle: 'Your progress',
    goalsHeader: 'Keep growing 🌿',
    level: 'Level',
    xpToLevel: (n) => `XP to Level ${n}`,
    streakLabel: (n) => `${n}-day streak`,
    streakToBadge: (n) => `${n} days to your next badge!`,
    streakBest: 'Best',
    streakBestDays: (n) => `${n} days`,
    monthlyBudgets: 'Monthly Budgets',
    weeklyChallenges: 'Weekly Challenges',
    badges: 'Badges',
    overBudget: 'Over budget!',
    budgetSpent: 'spent',
    budgetOf: 'of',
    addBudget: 'Add Budget',
    addBudgetBtn: 'Add Budget',
    categoryLabel: 'Category',
    monthlyLimit: 'Monthly Limit (SAR)',

    // Accounts tab
    yourTotalBalance: 'Your total balance',
    acrossAccounts: (n) => `across ${n} accounts`,
    balance: 'Balance',
    yourFunds: 'Your Funds',
    unallocated: 'Unallocated',
    freeToAssign: 'Free to assign',
    addFunds: 'Add Funds',
    newBucket: 'New Bucket',
    selectBucket: 'Select Bucket',
    amountSAR: 'Amount (SAR)',
    availableFunds: (amt) => `${amt} available`,
    bucketName: 'Bucket Name',
    bucketNamePlaceholder: 'e.g. Wedding Fund',
    targetAmountSAR: 'Target Amount (SAR)',
    createBucket: 'Create Bucket',
    withdraw: 'Withdraw',
    depositToFund: (name) => `Add to ${name}`,
    withdrawFromFund: (name) => `Withdraw from ${name}`,
    availableToWithdraw: (amt) => `${amt} in fund`,

    // Transactions tab
    txSubtitle: 'Your activity',
    txHeader: 'Every spend, tracked 🌱',
    txSearchPlaceholder: 'Search merchants or categories…',
    txAllBanks: 'All Banks',
    txEmpty: 'No transactions found.',

    // Copilot tab
    copilotSubtitle: 'Your money, growing 🌿',
    whatsOnYourMind: "What's on your mind?",
    askMunami: 'Ask منمّي...',
  },

  ar: {
    // Overview
    greeting: (name) => `مرحباً ${name} 👋`,
    summaryTitle: (month) => `ملخص ${month}`,
    summaryTitlePartial: (month) => `${month} · حتى الآن`,
    income: 'الدخل',
    incomeCarriedOver: (month) => `الدخل · ${month}`,
    spent: 'الإنفاق',
    net: 'الصافي',
    loading: 'جارِ التحميل...',
    youveSpent: 'لقد أنفقت',
    leftOver: 'المتبقي',
    mascotEarly: (n) => `مضى ${n} ${n === 1 ? 'يوم' : 'أيام'} — استمر هكذا!`,
    mascotCelebrating: 'أداء رائع هذا الشهر 🌿',
    mascotConcerned: 'لنضبط الإنفاق قليلاً',
    mascotOnTrack: 'على المسار، واصل!',

    // Bottom nav
    navTransactions: 'المعاملات',
    navGoals: 'الأهداف',
    navOverview: 'نظرة عامة',
    navAccounts: 'الحسابات',

    // Goals tab
    goalsSubtitle: 'تقدمك',
    goalsHeader: 'واصل النمو 🌿',
    level: 'المستوى',
    xpToLevel: (n) => `نقطة للمستوى ${n}`,
    streakLabel: (n) => `${n} يوم متواصل`,
    streakToBadge: (n) => `${n} أيام لشارتك القادمة!`,
    streakBest: 'الأفضل',
    streakBestDays: (n) => `${n} يوم`,
    monthlyBudgets: 'الميزانيات الشهرية',
    weeklyChallenges: 'التحديات الأسبوعية',
    badges: 'الشارات',
    overBudget: 'تجاوز الميزانية!',
    budgetSpent: 'أُنفق',
    budgetOf: 'من',
    addBudget: 'إضافة ميزانية',
    addBudgetBtn: 'إضافة',
    categoryLabel: 'الفئة',
    monthlyLimit: 'الحد الشهري (ريال)',

    // Accounts tab
    yourTotalBalance: 'إجمالي رصيدك',
    acrossAccounts: (n) => `عبر ${n} حسابات`,
    balance: 'الرصيد',
    yourFunds: 'صناديقك',
    unallocated: 'غير مخصص',
    freeToAssign: 'متاح للتخصيص',
    addFunds: 'إضافة أموال',
    newBucket: 'صندوق جديد',
    selectBucket: 'اختر صندوقاً',
    amountSAR: 'المبلغ (ريال)',
    availableFunds: (amt) => `${amt} متاح`,
    bucketName: 'اسم الصندوق',
    bucketNamePlaceholder: 'مثل: صندوق الزفاف',
    targetAmountSAR: 'المبلغ المستهدف (ريال)',
    createBucket: 'إنشاء صندوق',
    withdraw: 'سحب',
    depositToFund: (name) => `إضافة إلى ${name}`,
    withdrawFromFund: (name) => `سحب من ${name}`,
    availableToWithdraw: (amt) => `${amt} في الصندوق`,

    // Transactions tab
    txSubtitle: 'نشاطك',
    txHeader: 'كل إنفاق، موثّق 🌱',
    txSearchPlaceholder: 'ابحث عن تاجر أو فئة...',
    txAllBanks: 'كل البنوك',
    txEmpty: 'لا توجد معاملات.',

    // Copilot tab
    copilotSubtitle: 'أموالك، تنمو 🌿',
    whatsOnYourMind: 'ما الذي تودّ معرفته؟',
    askMunami: 'اسأل منمّي...',
  },
}

const MONTH_NAMES = {
  en: ['January','February','March','April','May','June','July','August','September','October','November','December'],
  ar: ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'],
}

const CATEGORY_NAMES = {
  en: {
    'Shopping': 'Shopping',
    'Food & Groceries': 'Food & Groceries',
    'Bills & Transport': 'Bills & Transport',
    'Entertainment': 'Entertainment',
    'Other': 'Other',
  },
  ar: {
    'Shopping': 'التسوق',
    'Food & Groceries': 'الطعام والبقالة',
    'Bills & Transport': 'الفواتير والمواصلات',
    'Entertainment': 'الترفيه',
    'Other': 'أخرى',
  },
}

export function t(locale, key, ...args) {
  const strings = STRINGS[locale] || STRINGS.en
  const value = strings[key] ?? (STRINGS.en[key])
  return typeof value === 'function' ? value(...args) : (value ?? key)
}

export function monthLabel(locale, monthKey) {
  if (!monthKey) return ''
  return (MONTH_NAMES[locale] || MONTH_NAMES.en)[Number(monthKey.slice(5, 7)) - 1]
}

export function monthYearLabel(locale, monthKey) {
  if (!monthKey) return ''
  return `${monthLabel(locale, monthKey)} ${monthKey.slice(0, 4)}`
}

export function categoryName(locale, category) {
  return (CATEGORY_NAMES[locale] || CATEGORY_NAMES.en)[category] || category
}

export function formatSAR(amount) {
  return `SAR ${Math.round(amount).toLocaleString('en-US')}`
}

export function dir(locale) {
  return locale === 'ar' ? 'rtl' : 'ltr'
}
