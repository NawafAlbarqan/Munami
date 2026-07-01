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
- Rounded cards, generous spacing, light and airy fintech feel.

**Colors — "Dark Premium" theme**
- Page background (near-black charcoal): `#0E0E0E`
- Secondary surface / tint: `#141414`
- Card background (slightly lighter charcoal): `#1A1A1A`
- Card border: `#2A2A2A` (subtle, no heavy shadows)
- Primary accent / main identity color (buttons, active nav, main chart,
  positive/spending-down): soft sage mint `#A8D5BA` (muted, not bright)
- Caution (spending up / over budget): muted blush pink `#E8B4B8`
- Rewards / XP / badges / secondary accent: warm butter yellow `#E8CF8E`
- Primary text (off-white, not stark white): `#F5F5F5`
- Muted text: `#9A9A9A`
- Extra chart colors (not used elsewhere in the UI): dusty teal `#7FB8B0`,
  soft lavender `#C4B5E0`
- **Per-category colors (fixed, not positional)** — each merged category
  always gets the same color everywhere (donut slice, legend dot, legend
  percentage), via `CATEGORY_COLOR_VAR` in `src/lib/finance.js`:
  - Shopping → `#A8D5BA` (mint)
  - Bills & Transport → `#E8B4B8` (blush)
  - Entertainment → `#E8CF8E` (butter)
  - Food & Groceries → `#7FB8B0` (dusty teal)
  - Other → `#C4B5E0` (soft lavender)

All colors live in **one place** — `src/index.css` as Tailwind `@theme` CSS
variables — so changing the palette cascades everywhere. Never hardcode hex
values directly in components; always use the theme color tokens.

**Shape language — soft & rounded**
- Cards: `border-radius: 20px`, charcoal `#1A1A1A` background, very subtle
  `0.5px` border in `#2A2A2A`, no heavy shadows, generous padding (`p-4`–`p-5`).
- Buttons: pill-shaped (fully rounded). Primary = mint accent.
- Charts stay circular (donut, XP ring, badge circles).
- **Donut chart** (`src/components/SpendingDonut.jsx`) is a hand-rolled SVG,
  not a charting library — built from `<circle>` strokes, not pie wedges:
  - Segments are **contiguous arcs with no gaps**, drawn in a fixed category
    order (`CATEGORY_RING_ORDER` in `finance.js`: Shopping → Food & Groceries
    → Bills & Transport → Entertainment → Other) so the color sequence
    around the ring is always the same.
  - Each segment's `linearGradient` runs from its own category color to the
    **next** segment's category color (last segment blends back to the
    first), so the ring reads as one continuous color that melts around —
    not separate flat-colored wedges. `strokeLinecap="round"` softens the
    seam between segments instead of a hard cut.
  - Segment sizes are exact proportions of spend (`fraction = amount / total`);
    drawn via `stroke-dasharray`/`stroke-dashoffset` math on a rotated
    (`rotate(-90)`) circle so the ring starts at 12 o'clock and fills
    clockwise.
  - **Percentage callouts**: the top 3–4 slices by size (the smallest is
    always skipped — the legend covers it) get a small pill (card-colored
    fill, category-colored border + text) connected to the ring by a thin
    leader line. Pill position is clamped to the canvas bounds and nudged
    outward if it would collide with the previous callout, so labels never
    get cut off or overlap on a phone-width screen.
  - The ring **draws in on mount** by animating `strokeDashoffset` per
    segment (Motion, staggered ~80ms apart, 600ms each) — an intentionally
    longer "explanatory" animation (see the duration table in CLAUDE's
    Motion convention), not a UI micro-interaction.
- Generous padding and whitespace.

**Type**
- Big, bold numbers as focal points (e.g. the donut's center total, header
  totals) with a small muted **uppercase, letter-spaced** label above them
  — never a stark-white-on-black look; text uses the off-white/muted tokens
  above, which stay legible on the charcoal background without feeling harsh.
- Clean modern sans-serif. Bold, confident headers.
- The app is **bilingual-capable but currently defaults to English (LTR)**.
  All UI strings go through `src/lib/i18n.js` (`t()`, `monthLabel()`,
  `formatSAR()`) instead of being hardcoded in components, and `DIR` there
  controls the page's `dir` attribute. To switch the default back to Arabic
  later, change `LOCALE` in that one file — components don't need touching.

**Vibe:** dark, premium, soft contrast. Near-black charcoal base, slightly
lighter charcoal cards, muted pastel accent pops (mint/blush/butter), lots of
rounded circles (donut chart, XP ring, badge circles, progress dots).

---

## The five tabs (bottom navigation, always visible)

The app has **five tabs**. The bottom nav is always visible on every screen, with
**منمّي (Copilot) pinned in the center position** as the hero tab — slightly larger
and more visually prominent than the others.

Bottom nav order, left → right:
`Transactions | Goals | منمّي (center/hero) | Overview | Accounts`

Build **ONE tab at a time**. Currently active: **Overview**. Do not build other
tab contents yet — just keep the full 5-tab structure in mind so the nav and
shared components (category colors, theme, phone frame) stay consistent.

---

### 1. Transactions (leftmost)
Full searchable, scrollable list of all transactions across every linked bank.
Design TBD — build after Overview is complete.

---

### 2. Overview ← **currently building**
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
- Chat thread with the AI coach.
- Suggested-question chips.
- An **"اسأل منمّي" (Ask Munami)** input bar at the bottom — this bar ONLY
  appears on this tab.
- Design TBD in detail — build after Overview is complete.

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

## Current status

- [x] Project scaffolded (React + Vite + Tailwind)
- [x] Data files placed in /data
- [x] **Overview tab** — spending donut + insight cards
- [x] **Transactions tab** — scrollable list, grouped by date, bank filter, search
- [x] **Accounts tab** — balance hero, bank carousel, fund buckets, + sheet
- [x] **Goals tab** — XP ring, streak, category budgets (real spend), challenges, badges
- [ ] **منمّي / Copilot tab** — AI chat + Ask Munami bar  ← next
- [ ] Goals tab — XP, streaks, budgets, badges
- [ ] Accounts tab — balance aggregation, bank carousel, fund buckets
- [ ] Mock "Connect bank" consent screen
- [ ] Wire real AI (categorization + chat)
- [ ] Demo polish + rehearsal

Update this checklist as we go.
