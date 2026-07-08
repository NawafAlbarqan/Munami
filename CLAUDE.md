# CLAUDE.md — منمّي (Munami)

This file is read automatically at the start of every Claude Code session.
It describes the project so we never have to re-explain it. Keep it up to date.

---

## What we're building

**منمّي (Munami)** is an AI-powered personal finance copilot — a mobile web app
built for the **AMAD Fintech Hackathon 2026** (track: Generative AI for Fintech,
with Gamification).

The product idea: a user links their bank accounts, and منمّي automatically
analyzes their spending, gives personalized AI advice in plain language, and
turns good money habits into a game (points, streaks, badges, challenges).

The name منمّي means "the one who grows/cultivates" — a financial companion that
helps your money grow.

---

## Team context (READ THIS — it changes how you should help)

- We are a **team that is light on coding**. We rely heavily on you (Claude Code).
- **Explain your choices in simple terms.** When you make a decision, say why in
  one plain sentence.
- **Prefer beginner-friendly, popular, well-documented tools** over clever or
  exotic ones. If there's a boring standard way and a fancy way, choose boring.
- When something breaks, explain what went wrong in plain language before fixing.
- Keep changes small and explain what you changed after each step.
- Never assume we know terminal/Git conventions — spell out commands.

---

## Tech stack

- **React + Vite** — the web app and fast live preview.
- **Tailwind CSS** — styling.
- **Custom hand-rolled SVG** for the donut chart (`src/components/SpendingDonut.jsx`)
  — not a charting library. We dropped Recharts once the design needed
  gradient-merged segments and percentage callouts that a library's chart
  primitives don't expose; the donut is small enough to own directly.
- **Motion** (`motion/react`) — UI animation. Convention: **subtle and fast,
  200–400ms**, easeOut, no bounce/spring playfulness (the donut's own
  draw-in is a deliberate exception, see below). Used for insight-card
  stagger-in, the donut's fade/scale-in + count-up total, and crossfading
  the header/donut/cards when the month switcher changes (`AnimatePresence`
  keyed on the selected month, see `src/App.jsx`). Don't add motion to
  things that aren't actually changing state — it should never replay on
  unrelated re-renders.
- **Plain CSV/JSON** for data (see below). No real backend for the demo.
- The app is a **website that looks like a phone** — not a native mobile app.

If a new library is needed, pick the most popular maintained option and tell us
why in one sentence before installing.

---

## Design identity

منمّي has a **warm, playful, characterful** personality — inspired by apps like
Cleo that give their AI a real persona. Think "fun financial advisor", not
"corporate bank portal." Premium and trustworthy, but sunny and approachable.

**The mascot — `src/components/MunamiMascot.jsx`**
- منمّي is a **friendly sprout character**: a round cream face with a two-leaf
  stalk growing from the top. This ties to the name "the one who grows."
- Three expressions: `happy` (default smile), `concerned` (worry brows + slight
  frown), `celebrating` (squinting joy eyes + cheek blush + sparkle lines).
- Expression is **derived from real spending data** in `App.jsx`: `concerned` if
  spend ratio > 85% of income or 2+ categories trending up; `celebrating` if 2+
  categories trending down; `happy` otherwise. Early-month mode always = `happy`.
- Used at 54px in the Overview greeting, 26px in Copilot chat avatar bubbles,
  and 28px (via GrowthMark) in the nav hero button.
- Mascot verdict text appears as a pill below the hero number: "Crushing it 🌿",
  "Let's reel it in", "9 days in — keep it up!" etc.

**The growth mark — `src/components/GrowthMark.jsx`**
- A minimal two-leaf sprout SVG (18×18 viewBox). Used as the brand icon where
  the full mascot face is too large: nav hero button (cream on forest green),
  copilot header avatar, the verdict pill in the Overview hero card.
- Color via `color` prop; default is `currentColor`.

**Typography**
- **Nunito** (Google Fonts, weights 400/700/800/900) is the primary display font
  — rounded, bold, friendly. Used for all headings, hero numbers, and the nav.
- **DM Sans** is the secondary body font — clean and readable at small sizes.
- **Space Grotesk** is still loaded but superseded by Nunito as the app's default.
- `font-family` for the whole app is set via `.theme-warm` in `src/index.css`.
- Hero numbers (the dominant number per screen) use `.munami-hero`: Nunito Black
  900, 44px, letter-spacing -0.5px. Apply to: SPENT (Overview), Total Balance
  (Accounts), Level (Goals).
- Hierarchy: one dominant `.munami-hero` number per screen. Supporting figures
  are `text-sm font-bold` in flanking rows — visually subordinate.

**Copy voice**
- Warm and direct, like a smart friend who is good with money — not a bank.
- Tab headers use personality phrases: "Keep growing 🌿" (Goals), "Every spend,
  tracked 🌱" (Transactions), "Your money, growing 🌿" (Copilot subtitle).
- AI messages in first person, casual: "You've got this." "Nice start." "Done!"
- Copilot suggested-questions label: "What's on your mind?" (not "Suggested").

---

## Design system (use these EXACTLY)

**Layout**
- Mobile-first. Max content width **400px**, centered on screen.
- Phone-style framing — the whole app renders inside a `PhoneFrame`
  (`src/components/PhoneFrame.jsx`): dark bezel, top notch, a fixed-size
  screen (`400px × min(844px, 88vh)`) centered on a neutral backdrop. The
  browser window itself never scrolls (`html/body/#root` are locked to
  `height: 100%; overflow: hidden`) — only the content *inside* the phone
  screen scrolls, with a thin custom scrollbar (`.scroll-thin` in
  `src/index.css`).
- Inside the screen, the scrollable content area and the bottom nav are
  siblings, not nested — the nav is `position: absolute; bottom: 0` against
  the non-scrolling screen wrapper, while the content area is a separate
  `absolute inset-0 overflow-y-auto` layer with bottom padding (`pb-24`) so
  the last card clears the nav. This is what keeps the nav pinned while
  content scrolls behind it — don't nest the nav inside the scrolling div
  or it will scroll away with the content.
- Rounded cards, generous spacing, light and airy feel.

**Colors — "Warm Playful" theme (THE OFFICIAL IDENTITY)**

The warm theme is applied globally via `.theme-warm` on the PhoneFrame's inner
screen div (`src/components/PhoneFrame.jsx`). All CSS variables cascade from
there — every tab and the nav inherit it automatically.

Root tokens (in `@theme` in `src/index.css`, overridden by `.theme-warm`):
- Page background (warm cream): `#F6F1EA`
- Secondary surface / tint (warm beige): `#EDE5D9`
- Card background (white): `#FFFFFF`
- Card border (warm sand): `#DDD3C4`
- Primary accent / identity color (forest green): `#2D6A4A`
- Positive / good spending (forest green): `#2D6A4A`
- Caution / overspend (terracotta): `#B5472A`
- Rewards / XP / butter gold: `#C87E1A`
- Primary text (dark forest): `#1A2B1F`
- Muted text (warm taupe): `#7B7568`

**Per-category colors** — fixed, not positional. Same color for every category's
donut slice, callout pill, and legend dot. Defined in `CATEGORY_COLOR_VAR` in
`src/lib/finance.js`. These are NOT overridden by `.theme-warm` — they read
from the root `@theme` and stay consistent:
  - Shopping → `#A8D5BA` (mint, `--color-primary` root value)
  - Bills & Transport → `#E8B4B8` (blush, `--color-caution` root value)
  - Entertainment → `#E8CF8E` (butter, `--color-rewards` root value)
  - Food & Groceries → `#7FB8B0` (dusty teal, `--color-teal`)
  - Other → `#C4B5E0` (soft lavender, `--color-lavender`)

IMPORTANT: `themeColor()` in components reads from `document.documentElement`,
which returns the ROOT `@theme` values (dark theme tokens), not the `.theme-warm`
overridden values. Tailwind classes like `text-primary`, `bg-card` DO cascade
correctly. For components that call `themeColor()` and need the warm-theme UI
color (not a category color), pass it as an explicit prop (e.g. `cardBg="#FFFFFF"`
in `SpendingDonut`).

**Shape language — soft, rounded, tactile**
- Cards: `border-radius: 20–28px`, white background, subtle `0.5px` border in
  `#DDD3C4`, faint green ambient shadow (`0 2px 16px rgba(45,106,74,0.08)`).
- Hero card (Overview spent): `rounded-[28px]` with a slightly stronger green shadow.
- Buttons: pill-shaped (fully rounded). Primary = forest green `#2D6A4A`.
- Charts stay circular (donut, XP ring, badge circles).
- **Donut chart** (`src/components/SpendingDonut.jsx`) is a hand-rolled SVG:
  - Segments in fixed `CATEGORY_RING_ORDER` (Shopping → Food → Bills → Entertainment
    → Other); gradient from each segment's color to the next so the ring reads as
    one continuous color melting around.
  - **Percentage callouts**: ALL segments get a pill (card-white fill, category-colored
    border + text) connected by a thin leader line. Color is explicitly derived as
    `themeColor(categoryColorVar(seg.category))` — the same token as the legend dot,
    so they always match. Multi-pass collision detection pushes overlapping pills
    outward. Segments < 2% of total are skipped (truly negligible slivers).
  - The legend below shows ALL categories with amount + % in the category color.
  - The ring draws in on mount via `strokeDashoffset` animation (600ms staggered).
- Track rings / progress bar backgrounds: use `var(--color-card-border)` (`#DDD3C4`
  in warm theme), NOT hardcoded `#2A2A2A`. This is important — hardcoded dark hex
  in track elements looks broken on the warm cream background.

**Bottom nav — `src/components/BottomNav.jsx`**
- Height: 72px, `overflow: visible` (hero button floats above).
- **منمّي center tab**: a 56×56px forest-green circle raised 24px above the nav
  line (`marginTop: -24`) containing a cream-colored `GrowthMark` icon. Active =
  full `--color-primary` opacity; inactive = 72% opacity. Green ambient shadow.
- **Regular tabs**: small SVG icon (18×18) + label. Active = icon and text in
  `--color-primary` + a 20×3px primary pill indicator above the icon. Inactive =
  muted color, no indicator.
- Nav background: `bg-card` (white in warm theme). Border-top `border-card-border`.

**Type**
- Nunito is the app's default font (set in `.theme-warm`). All headings,
  hero numbers, and body copy inherit it from the `.theme-warm` root.
- Page-level section headers follow the pattern:
  - Muted tiny uppercase label: `text-muted text-xs font-medium uppercase tracking-widest`
  - Bold heading below it: Nunito, 26px, `font-bold`, with a personality emoji.
- The app is **bilingual-capable but defaults to English (LTR)**. All UI strings
  go through `src/lib/i18n.js`. To switch to Arabic later, change `LOCALE` there.

**Vibe:** warm cream base, white cards, forest green as the growth identity color,
friendly rounded type, منمّي character presence throughout, tactile depth via
subtle green shadows on hero cards.

---

## The five tabs (bottom navigation, always visible)

The app has **five tabs**. The bottom nav is always visible on every screen, with
**منمّي (Copilot) pinned in the center position** as the hero tab — slightly larger
and more visually prominent than the others.

Bottom nav order, left → right:
`Transactions | Goals | منمّي (center/hero) | Overview | Accounts`

All five tabs are built and use the warm/playful identity consistently.

---

### 1. Transactions (leftmost) ← **built**
Full searchable, scrollable list of all transactions across every linked bank.
Warm header "Every spend, tracked 🌱", search bar, bank filter chips, grouped by date.

---

### 2. Overview ← **built**
The monthly spending snapshot.
- Greeting bar (user name + month) + income / spent / net for the
  **selected** month (see month switcher below).
- **Donut chart** of spending only (debits, grouped by category) — income
  never appears in the donut. Each slice shows its own whole-number %
  label directly on the slice (hidden on slices under ~6% of the total to
  avoid overlapping text); the legend below shows category + SAR amount.
- **Month switcher** (`src/components/MonthSwitcher.jsx`) sits directly
  under the heading, above the income/spent/net totals and the donut —
  it controls both, so it sits above them, not below. Left/right arrows
  step through every month present in the data, label shows e.g.
  "June 2026". The forward arrow is disabled/greyed out once you're on
  the latest month. Defaults to the latest month in the data. Switching
  it re-runs everything below it (totals, donut, insights) for that month.
- **Partial-month labeling**: when the selected month is early (see rule
  below), the heading reads "June · So Far" instead of "June Summary",
  and a small "9 days so far" line appears under the donut's center total
  (`daysSoFar` prop on `SpendingDonut`) so it's obvious the totals are
  incomplete, not a full month.
- 3 insight cards (normal mode) or 2 small cards (early-month mode, see
  below).
- NO chat input bar on this tab.

**Dataset & "today"**: `/data` holds a full year (13 months) of
transactions. The latest month is intentionally partial (fewer than 10
days of data) so the early-month state is always reachable. **"Today" is
always derived from the data's own latest transaction date** (`getLatestMonth()`
in `finance.js`), never `new Date()` / the system clock — this keeps the
demo deterministic regardless of when it's actually run.

**Overview logic** (see `src/lib/finance.js` and `src/lib/aiCoach.js`):
- `direction` column splits rows: `debit` = spending, `credit` = income
  (matched case-insensitively via `isDirection`/`getDebits`/`getCredits`).
- **Merged categories**: raw data categories are collapsed via
  `mapCategory()` in `finance.js` before they ever reach the donut or the
  insight comparisons — `Food & Dining` + `Groceries` → `Food & Groceries`,
  `Transport` + `Utilities` → `Bills & Transport`, `Health` → `Other`.
  `Shopping` and `Entertainment` pass through unchanged. Any category not
  explicitly mapped and not in the passthrough list also falls into
  `Other`, so nothing gets silently dropped from the totals. Current
  category set shown in the app: `Food & Groceries`, `Bills & Transport`,
  `Shopping`, `Entertainment`, `Other`. Change the mapping in one place
  (`CATEGORY_MAP`) and both the chart and insights pick it up. Each of
  these categories also has a fixed color via `CATEGORY_COLOR_VAR` (see
  the color palette above) — colors are assigned per category, not by
  position in the data, so a category never randomly collides with another.
- **Income carryover**: salary often posts late in the month, so the
  selected month can have zero credit rows yet. `resolveMonthIncome()`
  falls back to the most recent prior month's income in that case, returning
  `isCarriedOver` + `incomeMonth` so the header can label it
  **"Income · {month name}"** (e.g. "Income · May") instead of a bare
  "Income" — it's clear at a glance which month the figure is actually from.
- Per category, the selected month's spend is compared to the **trailing
  average of all prior FULL months** in the data — the selected month is
  always excluded from its own average (`computeCategoryChanges()`), so a
  partial month never drags the comparison down.
- Guardrail: a category is skipped from comparisons if either period's
  amount is under 100 SAR, so tiny amounts don't produce huge misleading
  percentages.
- Top 3 categories by size of change (not just biggest spend) are shown.
- **Early-month rule**: if the selected month has data for fewer than 10
  distinct days, normal category-comparison cards are misleading, so we
  show exactly **two** small cards instead:
  1. A **pace card** (`phrasePace()`) — projects the full month from
     spend-so-far: `(spend so far ÷ days elapsed) × days in month`
     (`daysInMonth()` is plain calendar math, not the system clock), e.g.
     "9 days in — you've spent SAR 2,980 so far. At this pace you're
     heading toward an estimated SAR 9,934 this month."
  2. A **carryover card** (`summarizePriorMonth()` + `phrasePriorMonthSummary()`)
     — the last FULL month's total vs. the trailing average of the full
     months before *that*, e.g. "Last month (May 2026) you spent
     SAR 10,972 — that's 17% up from your usual."
  Months with 10+ days of data show the normal top-3 category cards instead.
- **Code computes, AI only phrases.** All totals/grouping/% math happens
  in plain JS in `finance.js`. The AI's only job is turning a finished
  fact into a short sentence — that step is isolated in `aiCoach.js` so
  it's a one-file swap when we wire a real LLM call. Right now those
  functions return placeholder template strings.
- `isGood(direction)` is the single place that decides good vs bad
  (spending down = good) — flip it there if a category should be treated
  as savings/income later.

---

### 3. منمّي / Copilot (CENTER — the hero tab, the app's centerpiece)
The AI financial advisor chat. This is the **main tab** and should feel like
the heart of the app. Visually emphasized in the nav (slightly larger icon/label).
Lives in `src/components/CopilotTab.jsx`. Uses **real Gemini AI** with graceful fallback.

- **Header**: منمّي name + 🌱 avatar + "AI" / "Demo" status dot, pinned at top.
- **Chat opens with only the greeting**: a single منمّي bubble built from real
  financial data (`buildGreeting()`) — total balance, bank count, month spend.
  No pre-seeded messages. No suggested chips. Clean slate, ready for input.
- **Chat thread**: منمّي bubbles left-aligned (mint-tinted bg), user bubbles
  right-aligned (white card bg). Messages animate in on send (not on mount).
- **"Ask منمّي..." input bar**: pinned above the bottom nav, fully functional.
  Sends to `/api/chat` with the full message history + financial context object.
  The context includes the **full monthly history** (spend + income for every month
  in the dataset, precomputed in `App.jsx`), plus average monthly spend, highest
  and lowest spending months. This lets منمّي answer historical questions ("highest
  spending month", "how does this month compare", "my average") using real data.
  Code computes all aggregates; the AI only reads finished numbers, never raw rows.
- **Conversational categorization**: if the user asks "what category is X?" or
  "categorize STARBUCKS RIYADH SA", `isCategoryQuestion()` detects the intent,
  extracts the merchant via `extractMerchant()`, calls `/api/categorize`, and
  replies in the normal chat bubble with the category + emoji. No separate panel.
- **Thinking bubble**: three-dot pulse animation shown while waiting for AI reply.
- **Fallback chain**:
  1. `VITE_USE_AI=false` → friendly "demo mode" message, no API call at all
  2. API call fails → friendly error message in chat bubble
- **No `CategorizationDemo` widget, no scripted conversation, no suggestion chips.**

---

### 4. Goals / Gamification ← **built**
Budgeting + game layer. Lives in `src/components/GoalsTab.jsx`, receives `rows`
prop from App.jsx and computes current-month spend independently of the Overview
month-switcher (always uses the data's own latest month).

Sections top to bottom:
- **XP / Level ring**: SVG stroke-dashoffset arc (same technique as donut), shows
  Level 7, 2340/3000 XP. Ring animates on mount; XP count-up via `useCountUp`.
  Static demo values.
- **Streak tracker**: card with 🔥, "7-day streak", days-to-next-badge, longest
  streak. Static demo values.
- **Monthly Budgets**: pre-populated with Shopping/Food & Groceries/Entertainment
  limits. Each budget reads **real spend** for the current month from `rows` via
  `groupByCategory(thisMonthDebits)`. Progress bar color shifts: category color
  (healthy) → butter yellow (≥75%) → coral red (≥100%). "+" opens a bottom sheet
  to add a new budget for any un-budgeted category; local state only.
- **Weekly Challenges**: two static challenge cards with progress bars and +XP labels.
- **Badges**: 3×2 grid — 3 earned (colored), 3 locked (greyed, 🔒 icon). Static.

---

### 5. Accounts (rightmost) ← **built**
Bank account aggregation + money buckets. Data from `data/munami_accounts.json`
(imported directly as a Vite JSON import — not fetched from public/).

- **Total balance hero**: large bold number (count-up animation) with "Total Balance"
  label and "across N accounts" subtitle.
- **Bank card carousel** (`BankCarousel` inside `AccountsTab.jsx`): horizontal
  scroll-snap slider, one card per bank. Each card uses the account's own `color`
  field as an accent (background tint + border + balance text). Dot indicators below
  the carousel expand/color to match the active card.
- **Fund buckets ("pots")**: list of named savings goals from the `funds` array.
  Each bucket shows icon, name, `balance_sar / target_sar`, a progress bar animated
  on mount, and a % label — all in the bucket's own color.
- **Unallocated balance**: shown above the fund list as free-to-assign cash
  (`unallocated_sar` from the data).
- **"+" button**: opens a bottom sheet (Motion slide-up) with two modes:
  - *Add Funds*: pick an existing bucket, enter an amount ≤ unallocated;
    moves money from unallocated into the bucket, updates progress bar in place.
  - *New Bucket*: enter name + target; new bucket appears in the list with 0 balance
    and a color auto-assigned from the palette cycle.
  State is local (React `useState`) — no persistence needed for the demo.

---

## Data

Data files live in **`/data`**:
- `munami_transactions.csv` — 173 transactions across 3 Saudi banks
  (Alinma, Al Rajhi, SNB), ~3 months, pre-categorized, with salary income.
- `munami_openbanking.json` — the same data wrapped in an Open Banking–style
  payload (consent id, linked accounts, nested transactions).

CSV columns include: `transaction_id, account_id, bank, account_type, timestamp,
date, merchant_raw, merchant, category, amount_sar, direction, currency`.

Categories used: Food & Dining, Groceries, Utilities, Transport, Shopping,
Entertainment, Health, Income.

For the Overview chart, aggregate **debit** transactions by `category` to build
the donut. Treat `direction == "credit"` (e.g. Salary) as income, not spending.

---

## Data strategy (important for how we frame things)

- **In the pitch**, the data story is **Saudi Open Banking** (SAMA-regulated) —
  one consent links every bank into one feed.
- **In this build**, we use our **own synthetic data** (the files above) plus a
  **mocked "Connect bank" consent screen**. We do NOT integrate real banks.
- The **AI parts are real** — categorization and the chat coach call a real LLM
  API (OpenAI/Gemini). Only the bank connection is simulated.

Don't build real bank integrations. Build against the local data files.

---

## What's real vs mocked in the demo

- Real: the UI, the charts, the AI chat, AI categorization (live LLM calls).
- Mocked: the bank connection / consent flow, and account balances.
- Backup plan: if a live AI call is risky on stage, we may hardcode a few perfect
  responses. Keep AI calls easy to swap for canned responses.

---

## Working conventions

- After a screen works and looks right, we'll commit. You can remind us:
  "want me to commit this progress?"
- Keep components small and clearly named.
- Put reusable colors as Tailwind theme values or CSS variables so we change them
  in one place.
- Comment code lightly in plain English so a non-coder can follow.
- Don't refactor large areas without asking first.

---

## AI integration

**Provider**: Google Gemini (`@google/generative-ai` SDK), model `gemini-2.0-flash-lite`.

**Security pattern — why a backend server?**
The API key lives ONLY in `.env` on the Express server (`server.js`, port 3001).
The React app never talks to Gemini directly — it calls `/api/*` on our own server,
which the Vite proxy forwards to Express. If the key were in the React code it would
be visible to anyone in DevTools → Network. Server-side = invisible to the browser.

**Key file**: `.env` at the project root. NEVER commit it — it's in `.gitignore`.
```
GEMINI_API_KEY=your_key_here
VITE_USE_AI=true   ← set to false to fall back to scripted responses instantly
PORT=3001
```

**Backend routes** (`server.js`):
- `POST /api/insights` — takes pre-computed category changes, returns AI-phrased sentences
- `POST /api/chat` — takes conversation history + compact financial context, returns reply
- `POST /api/categorize` — takes raw merchant string, returns one of our 5 categories

**Safety switch**: Set `VITE_USE_AI=false` in `.env` and restart — the entire AI
system shuts off instantly and falls back to scripted responses. Use this if the API
is unstable right before a demo. No code change needed.

**Fallback chain**:
1. If `VITE_USE_AI=false` → scripted responses (always)
2. If API call fails → template strings / scripted fallback (graceful, no error shown)
3. If AI returns fewer phrases than expected → template fills the gap

**Running locally**:
```
npm run dev    # starts both Express (:3001) and Vite (:5173) via concurrently
```

**Getting a working API key**:
Go to https://aistudio.google.com → Get API Key → Create API key in new project.
The free tier gives 15 requests/minute for Flash models — plenty for a demo.
Paste the key into `.env` as `GEMINI_API_KEY=your_key`.

---

## Current status

- [x] Project scaffolded (React + Vite + Tailwind)
- [x] Data files placed in /data
- [x] **Warm/playful design identity** — MunamiMascot, Nunito font, cream palette, warm theme global
- [x] **Overview tab** — mascot greeting, hero card, donut + callouts, insight cards, month switcher
- [x] **Transactions tab** — scrollable list, grouped by date, bank filter, search
- [x] **Accounts tab** — Nunito hero balance, bank carousel, fund buckets, + sheet
- [x] **Goals tab** — XP ring, streak, category budgets (real spend), challenges, badges
- [x] **منمّي / Copilot tab** — real AI chat with context, live categorization demo, scripted fallback
- [x] **Bottom nav** — hero منمّي circle, active indicators, clean 5-tab layout
- [x] **EN/AR bilingual** — full RTL support, Noto Sans Arabic, language toggle
- [x] **AI backend** — Express server, Gemini wired, security pattern, fallback switch
- [ ] Mock "Connect bank" consent screen
- [ ] Demo polish + rehearsal

Update this checklist as we go.
