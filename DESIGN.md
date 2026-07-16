# Monami — Complete Product UI Rebuild Brief

## 0. Purpose
Rebuild the existing Monami web app as a polished, production-quality mobile-first financial assistant using the supplied identity boards as the source of truth.

The result must look like a coherent product designed by one senior product-design team—not a collection of unrelated cards. The UI should feel Saudi, trustworthy, modern, calm, premium, and practical. It must not look childish, overly gamified, crypto-like, or like a generic AI dashboard.

Primary language: Arabic (RTL). English is secondary and available through a language toggle.

Primary flow:
1. الرئيسية / Home
2. الميزانية / Budget
3. منمّي / Monami Assistant
4. الأهداف / Goals
5. المعاملات / Transactions

Secondary screens:
- Accounts
- Funds
- Insights
- Notifications
- Settings
- Goal details
- Budget category details
- Transaction details
- Chat history drawer

---

## 1. Brand Direction

### Brand attributes
- موثوق / Trustworthy
- ذكي / Intelligent
- داعم / Supportive
- هادئ / Calm
- يساعد على النمو / Growth-oriented
- آمن / Secure

### Visual personality
- Deep navy foundation
- Warm ivory surfaces
- Coral as the main accent
- Mint only for positive states and healthy progress
- Red only for warnings, over-budget states, and destructive actions
- Rounded but disciplined geometry
- Fine navy outlines
- Restrained shadows
- Generous spacing
- Saudi identity appears through subtle pattern details, Arabic-first typography, and the mascot scarf—not through ornamental overload

### Do not do
- No neon gradients
- No glassmorphism everywhere
- No excessive cards inside cards
- No playful cartoon UI around financial data
- No random colors per category unless they are documented tokens
- No red for normal negative spending; use coral or neutral navy. Reserve red for alerts only
- No tiny unreadable labels
- No excessive explanatory copy on main screens
- No fake decorative charts that do not communicate data

---

## 2. Design Tokens

### Color palette
```css
:root {
  --navy-950: #081B2A;
  --navy-900: #0D1B2A;
  --navy-800: #14243C;
  --navy-700: #1A304D;
  --navy-600: #29415F;

  --ivory-50: #FAF8F3;
  --ivory-100: #F7F6F2;
  --surface-warm: #F4F6F8;
  --surface-muted: #EEF1F4;
  --white: #FFFFFF;

  --coral-600: #F46F5B;
  --coral-500: #FF7A59;
  --coral-300: #FFC1B0;
  --coral-100: #FFE6DF;

  --mint-600: #31B878;
  --mint-500: #66CFA7;
  --mint-200: #C9F1DF;

  --alert-600: #E33C4A;
  --alert-100: #FDECEE;

  --gray-700: #596575;
  --gray-500: #8792A0;
  --gray-300: #C7CDD5;
  --gray-200: #DDE2E8;
  --gray-100: #EEF1F4;

  --text-primary: #0D1B2A;
  --text-secondary: #596575;
  --text-inverse: #FFFFFF;
  --border: rgba(13, 27, 42, 0.12);
}
```

### Gradients
Use gradients sparingly.

```css
--gradient-hero: linear-gradient(145deg, #081B2A 0%, #14243C 62%, #2D394D 100%);
--gradient-coral: linear-gradient(135deg, #FF8A71 0%, #F46F5B 100%);
--gradient-soft: linear-gradient(180deg, #FFFFFF 0%, #F7F6F2 100%);
```

### Typography
Arabic: Cairo
English: Inter

```css
--font-ar: "Cairo", system-ui, sans-serif;
--font-en: "Inter", system-ui, sans-serif;
```

Type scale:
- Display: 32/40, 700
- H1: 28/36, 700
- H2: 24/32, 700
- H3: 20/28, 700
- Section title: 18/26, 600
- Body: 16/24, 400
- Supporting: 14/22, 400
- Caption: 12/18, 500
- Button: 14/20, 600
- Financial number large: 34/40, 700, tabular numerals

### Shape
- Main card radius: 20px
- Standard card radius: 16px
- Compact card radius: 14px
- Input/button radius: 14px
- Chip radius: 999px
- App icon radius: 24%

### Spacing
Use an 8px base grid.
- 4, 8, 12, 16, 20, 24, 32, 40
- Mobile page side padding: 16px
- Tablet: 24px
- Desktop content max-width: 1200px

### Shadows
```css
--shadow-sm: 0 2px 8px rgba(8, 27, 42, 0.06);
--shadow-md: 0 8px 24px rgba(8, 27, 42, 0.10);
--shadow-float: 0 12px 32px rgba(8, 27, 42, 0.16);
```

---

## 3. App Shell

### Mobile-first shell
- Background: ivory-50
- Sticky top app bar
- Sticky bottom navigation
- Content scrolls between them
- Respect safe areas on iPhone

### Top app bar
Height: 64px

Home:
- Right: greeting and date
- Left: notification icon + circular user avatar

Interior screens:
- Right: back button in RTL
- Center: page title
- Left: contextual action such as filter, calendar, or share

Assistant screen:
- Right: mascot avatar + “منمّي” and subtitle “المساعد المالي الذكي”
- Left: new chat button + menu button

### Bottom navigation
Five destinations, in this exact order for RTL:
1. الرئيسية
2. الميزانية
3. منمّي
4. الأهداف
5. المعاملات

Rules:
- Height: 74px plus safe area
- White/ivory surface
- 1px top border
- Active icon and label: coral-600
- Inactive: navy-600
- Center Monami action is a 54px floating rounded-square/circle hybrid with navy background and mascot face, raised 10px
- Do not use a giant floating action button that blocks content
- Labels always visible

### Desktop behavior
At >= 1024px:
- Replace bottom navigation with a left sidebar for English and right sidebar for Arabic
- Width: 248px
- Main content max-width: 960px
- Optional insight rail: 300px when screen width allows
- Preserve the same component hierarchy as mobile; do not invent a separate dashboard design

---

## 4. Core Reusable Components

### 4.1 Summary hero card
Used on Home.
- Dark navy gradient
- Displays total balance
- Eye icon to hide/reveal values
- Small monthly change indicator
- Subtle geometric diagonal shape in the background
- No mascot inside the financial balance card

Content:
- إجمالي الرصيد
- SAR symbol aligned correctly
- 25,680.50
- “+4.7% عن الشهر الماضي” in mint when positive

### 4.2 Quick action tile
Four across on mobile if space permits, otherwise horizontal scroll.
- Transfer
- Pay bill
- Add expense
- Support

Style:
- 56px icon container
- White card
- Thin outline
- Coral icon emphasis on hover/active only

### 4.3 Section header
- Title at right
- “عرض الكل” at left
- No long subtitles unless critical

### 4.4 Metric card
Compact card for income, expenses, savings, and remaining.
- Label
- Large value
- tiny contextual delta
- optional mini sparkline

### 4.5 Progress bar
- Height: 8px
- Background: gray-100
- Healthy fill: mint
- Near limit: coral
- Exceeded: alert red
- Always pair with exact amount and percentage

### 4.6 Transaction row
Never present every transaction as a separate floating card.
Use one grouped surface with rows.

Each row:
- Merchant/category icon on right
- Merchant title
- Category + date/time below
- Amount aligned left
- Income in mint with “+”
- Normal spending in navy text with minus sign
- Red only if failed, suspicious, overdue, or alert state

### 4.7 Goal card
- Goal image/icon
- Goal name
- saved amount / target
- percentage
- progress bar
- due date or monthly contribution
- optional streak badge, subtle only

### 4.8 Fund bar
Funds must look different from accounts.
Use thin horizontal “reserve bars” rather than account cards.
- Fund name
- amount
- target
- fill indicator
- small lock icon for protected funds
- side-by-side compact cards allowed on large mobile widths

### 4.9 Mascot bubble
Use mascot only where emotional guidance is useful:
- Empty states
- Assistant screen
- Onboarding
- Confirmation moments
- Alerts requiring explanation

Do not place a large mascot on every page.

### 4.10 Bottom sheet
Use for filters, transaction details, account selector, budget adjustments, and quick-add flows.
- Rounded top corners: 24px
- Drag handle
- Sticky primary action at bottom

---

## 5. Screen Specifications

# 5.1 Home / الرئيسية

### Objective
Give a clear financial snapshot and direct the user to the next useful action within 5 seconds.

### Layout order
1. App bar
2. Total balance hero card
3. Quick actions
4. “نظرة هذا الشهر” metrics
5. Spending pressure panel
6. Funds preview
7. Recent transactions
8. Small Monami insight card

### Exact structure

#### Header
- “مرحباً، طاهر”
- “الخميس، 16 يوليو”
- Notification bell with unread dot

#### Balance hero
- إجمالي الرصيد
- 25,680.50 ر.س
- +4.7% عن الشهر الماضي
- Eye toggle
- Account count as a small pill: “4 حسابات”

Tap opens Accounts.

#### Quick actions
- تحويل سريع
- دفع فاتورة
- إضافة مصروف
- طلب مساعدة

#### Monthly metrics
Two-column grid:
- الدخل: 8,160 ر.س / +12%
- المصروفات: 6,240 ر.س / -6%
- الادخار: 1,920 ر.س
- المتبقي: 1,920 ر.س

#### Spending pressure panel
Title: “ضغط الإنفاق”
Large status: “متوسط”
Message: “أنت ضمن الخطة، لكن المطاعم أعلى من المعتاد.”
Horizontal pressure bar with markers:
- منخفض
- متوسط
- مرتفع

CTA: “عرض التفاصيل”

#### Funds
Show 3 compact horizontal reserves:
- صندوق الطوارئ — 7,500 / 15,000
- السفر — 3,200 / 8,000
- الأجهزة — 1,100 / 5,000

CTA: “إدارة الصناديق”

#### Recent transactions
Show 5 rows, grouped by Today / Yesterday.

#### Monami insight
Small navy card with mascot avatar, not full body.
Text:
“يمكنك توفير 430 ر.س هذا الشهر إذا خفّضت طلبات التوصيل مرتين أسبوعياً.”
Buttons:
- “اعرض الخطة” primary coral
- “لاحقاً” text

---

# 5.2 Budget / الميزانية

### Objective
Let the user understand category performance, warnings, and remaining spend without visual noise.

### Layout
1. App bar with month selector
2. Budget summary card
3. Category budgets
4. Upcoming bills
5. Monami recommendation

### Budget summary card
- Circular progress ring: 68%
- “8,160 ر.س من 12,000 ر.س”
- Remaining: 3,840 ر.س
- Forecast: “متوقع أن تنهي الشهر ضمن الميزانية”

### Category budgets
Use one clean white surface with separated rows:
- المطاعم — 2,120 / 3,000 — 71%
- المقاهي — 1,480 / 2,500 — 59%
- التسوق — 1,120 / 2,000 — 56%
- الفواتير — 1,100 / 2,000 — 55%
- أخرى — 340 / 500 — 68%

Each row contains:
- category icon
- label
- amount
- percentage
- progress bar
- small chevron

Near-limit behavior:
- At 80–99% use coral
- At >=100% use alert red and an alert icon

Tap opens category detail with transactions and editing.

### Upcoming bills
Compact timeline:
- STC — 190 ر.س — 18 يوليو
- Internet — 230 ر.س — 20 يوليو
- Netflix — 45 ر.س — 23 يوليو

### Recommendation card
“خفض ميزانية التسوق 300 ر.س وتحويلها إلى صندوق الطوارئ سيقربك من هدفك 12 يوماً.”
CTA: “تطبيق الاقتراح”

---

# 5.3 Monami Assistant / منمّي

### Objective
A focused financial conversation interface—not a generic chatbot.

### Screen design
- Dark navy background or navy conversation canvas
- Messages sit on a slightly lighter navy surface
- Assistant messages: navy-700 bubble with mascot avatar
- User messages: coral-tinted bubble aligned opposite
- Arabic RTL alignment throughout
- Timestamps discreet

### Top bar
- Mascot avatar
- منمّي
- “المساعد المالي الذكي”
- New chat icon
- History/menu icon

### Chat history drawer
Slides from the right in Arabic.
Sections:
- اليوم
- هذا الأسبوع
- أقدم

Chat titles must be meaningful:
- “تحليل مصاريف يوليو”
- “خطة توفير للرحلة”
- “مراجعة الاشتراكات”

Actions:
- New chat
- Rename
- Delete
- Search

Do not create empty chats automatically.

### Welcome state
Small mascot upper body, not full screen.
Title: “كيف أساعدك اليوم؟”
Suggestion chips:
- حلل مصاريفي هذا الشهر
- هل أستطيع شراء جهاز جديد؟
- أنشئ خطة لصندوق الطوارئ
- ما الاشتراكات التي يمكن إلغاؤها؟

### Rich assistant response blocks
Monami can insert structured cards inside chat:
- Spending breakdown
- Forecast
- Recommended action
- Confirmation before making a change

Example response:
“مصروفاتك هذا الشهر 6,240 ر.س، بانخفاض 6% عن الشهر الماضي. أكبر فرصة للتوفير هي طلبات التوصيل.”

Embedded actions:
- “عرض المعاملات”
- “إنشاء حد إنفاق”

### Composer
- Plus button
- Input
- Voice icon
- Send button
- Fixed above bottom nav
- Placeholder: “اكتب سؤالك المالي…”

---

# 5.4 Goals / الأهداف

### Objective
Make savings progress feel motivating but mature.

### Layout
1. Header + add goal
2. Total goal progress summary
3. Active goals
4. Completed goals
5. Milestones / streaks

### Summary
- “وفّرت 13,800 ر.س من أصل 33,000 ر.س”
- 42% overall
- “أنت متقدم 5 أيام عن خطتك”

### Active goal cards
1. رحلة العمرة
   - 6,000 target
   - 3,600 saved
   - 60%
   - target date
   - monthly contribution

2. صندوق الطوارئ
   - 15,000 target
   - 7,500 saved
   - 50%

3. جهاز جديد
   - 12,000 target
   - 2,700 saved
   - 22.5%

### Goal detail
- Large progress number
- Contribution history chart
- Next contribution
- Adjust goal
- Pause goal
- Withdraw with confirmation
- Monami forecast

### Gamification
Use subtle badges only:
- “3 أشهر متتالية”
- “أول 5,000 ر.س”
- “أسبوع بدون تجاوز”

No coins, confetti everywhere, levels, or childish trophies.

---

# 5.5 Transactions / المعاملات

### Objective
Fast scanning, search, filtering, and category correction.

### Layout
1. Header
2. Search field
3. Filter chips
4. Monthly totals strip
5. Grouped transaction list

### Filters
- الكل
- دخل
- مصروفات
- الحساب
- الفئة
- التاريخ

### Monthly strip
- الداخل: 8,160
- الخارج: 6,240
- صافي: +1,920

### Transaction groups
- اليوم
- أمس
- 14 يوليو

### Transaction detail bottom sheet
- Merchant
- Amount
- Date/time
- Bank account
- Category
- AI confidence: “تم التصنيف تلقائياً بدقة 92%”
- Change category
- Add note
- Exclude from budget
- Report issue

---

# 5.6 Accounts / الحسابات

### Design distinction
Accounts are larger bank cards. Funds are thin progress reserves. Never style them identically.

### Account cards
- Alinma
- Al Rajhi
- SNB
- Al Ahli

Each card:
- Bank identity color used only as a small stripe or logo area
- Masked account number
- Balance
- Last sync
- Eye icon

### Account detail
- Balance
- In/out chart
- Recent transactions
- Connection status
- Disconnect account

---

# 5.7 Funds / الصناديق

### Purpose
User-created money reserves separate from formal goals.

Examples:
- طوارئ
- صيانة السيارة
- هدايا
- رسوم جامعية

### Layout
- Total reserved amount
- Thin horizontal reserve bars
- Add fund
- Move money between funds
- Lock/unlock fund

---

# 5.8 Insights / الرؤى

### Sections
- This month summary
- Spending anomalies
- Subscription review
- Cash-flow forecast
- Category trends
- Monami recommendations

Charts must be simple, labelled, and accessible.

---

## 6. States

### Empty states
Use small mascot expression plus one clear action.
Examples:
- No goals: “ابدأ بهدف صغير، وسيساعدك منمّي على تقسيمه.”
- No transactions: “لم تصل معاملات بعد.”
- No chat history: “ابدأ محادثتك الأولى مع منمّي.”

### Loading
- Skeletons matching component shapes
- Avoid full-screen spinners

### Error
- Calm copy
- Retry action
- Technical detail hidden behind “المزيد”

### Success
- Small mint confirmation banner
- Optional mascot happy expression only for meaningful success

### Warning
- Coral for attention
- Red only when action is urgent or a limit is exceeded

---

## 7. Motion
- 180–240ms ease-out for UI transitions
- Bottom sheets: 280ms
- Navigation indicator: 180ms
- Progress bars animate once on entry
- Mascot facial animation limited to blink, smile, or small wave
- Respect prefers-reduced-motion

---

## 8. Accessibility
- WCAG AA contrast
- Minimum tap target 44x44px
- Semantic HTML
- Visible focus rings
- Screen-reader labels on icons
- Charts need textual summaries
- Do not rely on color alone
- Proper RTL mirroring, but financial numbers remain LTR where necessary
- Use `dir="rtl"` at document/app root for Arabic

---

## 9. Responsive Breakpoints
- 0–479: compact mobile
- 480–767: large mobile
- 768–1023: tablet
- 1024–1439: desktop
- 1440+: wide desktop

Rules:
- Mobile is the canonical layout
- Tablet can use two-column sections
- Desktop uses sidebar plus content grid
- Never stretch cards edge-to-edge across huge screens

---

## 10. Technical Implementation Guidance

Recommended stack:
- Next.js 15+
- TypeScript
- Tailwind CSS or CSS variables + modules
- Lucide icons, customized to 2px rounded stroke
- Framer Motion for restrained transitions
- Recharts for charts
- Zustand or Context for demo state
- localStorage for persistence in prototype

Suggested structure:
```text
app/
  [locale]/
    page.tsx
    budget/page.tsx
    assistant/page.tsx
    goals/page.tsx
    transactions/page.tsx
    accounts/page.tsx
    funds/page.tsx
    insights/page.tsx
    settings/page.tsx
components/
  shell/
  navigation/
  cards/
  charts/
  transactions/
  assistant/
  mascot/
  forms/
lib/
  data/
  format/
  i18n/
  tokens/
```

### Data formatting
- SAR format: `25,680.50 ر.س`
- Arabic mode may retain Western numerals for clarity
- Use tabular numerals
- Dates localized to Arabic

---

## 11. Demo Data
Use consistent data across every page.

```ts
const demoUser = {
  name: "طاهر",
  totalBalance: 25680.5,
  monthlyIncome: 8160,
  monthlyExpenses: 6240,
  monthlySavings: 1920,
  budgetLimit: 12000,
  budgetUsed: 8160,
};
```

Accounts:
- Alinma: 11,420.50
- Al Rajhi: 6,810.00
- SNB: 4,950.00
- Al Ahli: 2,500.00

Make all totals reconcile.

---

## 12. Acceptance Criteria
The redesign is complete only when:
- All five primary screens are implemented
- All navigation works
- Arabic RTL is correct
- English toggle works
- Mobile and desktop layouts are polished
- All components use the design tokens
- Accounts and funds are visually distinct
- Red appears only for alerts and destructive states
- Chat history drawer works
- No empty chats are created automatically
- Transactions can be filtered
- Budget category details open
- Goal details open
- Values can be hidden globally
- The mascot is used selectively and consistently
- No placeholder lorem ipsum remains
- No inconsistent gradients, radii, or icon styles remain

---

# MASTER PROMPT FOR CLAUDE

You are rebuilding the Monami financial assistant application from the ground up.

Use the attached Monami identity boards as the only visual source of truth. Implement the complete specification in this document. Do not preserve the old visual layout merely because it already exists; preserve only the app’s functions, information architecture, and data.

Your output must be a complete, runnable, production-quality frontend—not a static mockup.

Requirements:
1. Use Next.js + TypeScript.
2. Build all five primary routes: Home, Budget, Monami Assistant, Goals, Transactions.
3. Build secondary routes/components for Accounts, Funds, Insights, Notifications, Settings, Goal Detail, Budget Category Detail, and Transaction Detail.
4. Arabic is the default language and the full interface must be true RTL. English must be available through a toggle.
5. Use the exact design tokens, spacing, typography, color rules, radii, and component hierarchy from this brief.
6. Build responsive mobile, tablet, and desktop layouts.
7. Use a bottom navigation on mobile and sidebar navigation on desktop.
8. Use the mascot selectively: assistant, onboarding, empty states, meaningful confirmations. Do not place it everywhere.
9. Use red only for alerts, exceeded limits, suspicious activity, failed transactions, and destructive actions.
10. Keep normal spending values navy, not red.
11. Make accounts look like bank account cards and funds look like thin reserve/progress bars.
12. Implement interactive filters, drawers, bottom sheets, language switch, dark/light mode, value hiding, and chat history.
13. Do not create empty chats automatically.
14. Use consistent demo data so totals reconcile across pages.
15. Avoid generic AI-dashboard styling, excessive cards, childish gamification, neon gradients, and decorative charts.

Before coding, create:
- a route map
- a component map
- a design-token file
- a data model

Then implement the app in logical batches. After each batch, verify:
- RTL alignment
- responsive behavior
- spacing consistency
- color-rule compliance
- data consistency

Do not ask me to choose between multiple visual directions. Follow this brief exactly and make reasonable implementation decisions where needed.
