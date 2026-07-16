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

## Communication style (standing instruction — always follow)

- **Be concise.** No preamble, no narrating your process step by step.
- **Don't show UI previews, mockups, or descriptions of what you're about to
  build unless explicitly asked to.** Just implement the change, run it,
  and verify it works.
- After finishing, give a brief summary — a few sentences, not a report.
- This overrides the "explain your reasoning" habit below when the two
  conflict — brevity wins. Still flag anything genuinely important (a
  real bug found, a decision that needs input), just do it briefly.

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
- منمّي is a **real pixel-art robot character** (asset sheet: real logo/mascot
  files, cropped + keyed transparent into `src/assets/mascot/mascot-{mood}.png`,
  downscaled to ~200px since it's only ever shown at 20–56px). Not an SVG —
  `MunamiMascot` renders an `<img>`, mapping an `expression` prop to one of
  four real mood images. No circular frame around it anywhere — the art's
  own bold black outline makes a separate retro-card frame redundant.
- `size` is a MAX bounding box (`width: size, height: size` + `object-fit:
  contain`), not a fixed width — the character is letterboxed inside it, so
  it can never grow taller than intended and inflate a flex row's height.
  This is load-bearing: a wrapper without an explicit height (e.g. `w-10`
  with no `h-10`) once let the Copilot header grow past the chat thread's
  hardcoded top offset, overlapping the first message. Always give the
  wrapping element an explicit height too, not just width.
- Four expressions: `greeting` (waving hello — chat-open moments only),
  `happy` (on-track/positive/completed), `concerned` (mild/early warning —
  approaching a limit, a moderate bad trend), `unhappy` (serious/clear
  negative — actually over, a significant bad trend, a missed challenge).
  There is no separate "celebrating" art; the old celebrating state folded
  into `happy`. **This is now the app's only icon/logo graphic** — the old
  abstract sprout mark (`GrowthMark.jsx`) was removed entirely, along with
  every 🌱/🌿 emoji in copy strings (the *words* "grow/growing" stay — منمّي
  means "the one who grows" — only the plant *graphics* were purged). The
  bottom nav's منمّي tab icon and the Settings "About منمّي" row now show a
  real mascot crop instead of the old sprout glyph; DealsWall's tier icons
  (previously 🌰🌱🌿🌳) are plain numeral badges (1–4) instead.
- **Overview greeting** expression is derived from real spending data in
  `App.jsx`: `unhappy` if spend ratio ≥ 100% of income OR any single
  category's change is ≥50% in the bad direction (`badMood()`, shared with
  the insight cards below — this is the "significantly and clearly above
  usual" case); `concerned` if spend ratio > 85% or 2+ categories trending
  up (mildly); `happy` otherwise (verdict text still distinguishes a plain
  on-track month from a genuinely `celebrating` one via `isCelebrating`,
  even though both render the same `happy` art). Early-month mode = `happy`.
- **Overview insight cards** (`InsightCard.jsx`) render the mascot instead of
  a ✅/⚠️ emoji for the good/bad category-change cards (`mascotMood` prop) —
  good is always `happy`; a bad trend is `concerned` if the swing is under
  50%, `unhappy` if ≥50% (`badMood()` in `App.jsx`). The neutral
  pace-projection card keeps its plain 📈 emoji since it's informational,
  not a mood judgment.
- **Copilot**: header avatar = `greeting` (always); per-message avatar =
  `greeting` for the very first (chat-open) bubble only, `happy` for every
  reply after; the "thinking…" bubble avatar = `happy`.
- **Goals**: each budget card shows a small (22px) mood badge using
  `budgetMood()` — the SAME thresholds as the progress bar's color
  (`CONCERNED_PCT = 0.70`): <70% `happy`, 70–99% `concerned`, ≥100%
  `unhappy`. Each weekly challenge shows a mood via `challengeMood()`, which
  is mode-aware since the two demo challenges have opposite semantics: a
  `'limit'`-mode challenge (a cap to stay under, e.g. "spend under SAR 300")
  uses the same 70%/100% thresholds as budgets (approaching the cap =
  concerned, blowing through it = a genuine miss = unhappy); a `'goal'`-mode
  challenge (a target to reach, e.g. "hit 3 days") only shows a mood once
  completed (`happy`) — with no real deadline in the demo data, in-progress
  isn't treated as "at risk."
- **Accounts total-balance card**: no mascot — removed after review, it's
  just the label/number/divider/chip now (see below).
- Mascot verdict text appears as a pill below the hero number: "Crushing it",
  "Let's reel it in", "Over budget this month — let's fix that",
  "9 days in — keep it up!" etc.

**Typography**
- **Space Grotesk** (Google Fonts, weights 400–700) is the primary display font
  — geometric, distinctive, characterful at large sizes. Used for all headings,
  hero numbers, and the nav.
- **DM Sans** is the secondary body font — clean and readable at small sizes.
- **Nunito** has been replaced by Space Grotesk and is no longer loaded.
- `font-family` for the whole app is set via `.theme-dark, .theme-light` in `src/index.css`.
- Hero numbers (the dominant number per screen) use `.munami-hero`: Space Grotesk
  700, 44px, letter-spacing -1px. Apply to: SPENT (Overview), Total Balance
  (Accounts), Level (Goals).
- Hierarchy: one dominant `.munami-hero` number per screen. Supporting figures
  are `text-sm font-bold` in flanking rows — visually subordinate.

**Copy voice**
- Warm and direct, like a smart friend who is good with money — not a bank.
- Tab headers use personality phrases: "Keep growing" (Goals), "Every spend,
  tracked" (Transactions), "Your money, growing" (Copilot subtitle). (No
  trailing 🌱/🌿 anymore — see "no plant graphics" note above; the wording
  itself stays since منمّي means "the one who grows.")
- AI messages in first person, casual: "You've got this." "Nice start." "Done!"
- Copilot suggested-questions label: "What's on your mind?" (not "Suggested").

**منمّي Personality (Chat)**
- **Core rule**: chill friend energy in TONE, sharp financial substance in REASONING. Casualness never replaces real reasoning.
- **English greeting pool** (one picked randomly on each chat load): "Hey, what's up?", "Yo, how's it going?", "Hey! What do you need?", "Sup", "Hey hey, what's on your mind?", "Hi! Ready when you are."
- **Arabic greeting pool**: "يالله حياك، كيف أقدر أخدمك اليوم؟", "يا مرحبا", "سم", "اهلين، وش عندك؟", "حياك، تبي تشوف وضعك المالي؟", "هلا هلا، جاهز أساعدك"
- **Tone in every message**: casual and warm, a little playful. Short sentences, contractions, no corporate-speak. Cheeky when spending is off track, genuinely hype when things go well.
- **Arabic register**: Saudi Gulf colloquial (وش، زين، خلاص، عادي، يالله) — reads like a friend texting, not a formal report.
- **Numbers**: only when directly relevant. Never data-dump.
- **Emoji**: none of the old plant emoji; keep any other emoji sparing and occasional, not a sign-off on every message.

---

## Design system (use these EXACTLY)

**Layout**
- Mobile-first. Max content width **400px**, centered on screen.
- Phone-style framing — the whole app renders inside a `PhoneFrame`
  (`src/components/PhoneFrame.jsx`): a screen that is ALWAYS **400×844px
  internally** (real iPhone proportions). On viewports too short/narrow for
  the full frame, the whole frame is scaled down with `transform: scale()`
  (computed in a resize listener) — the layout is never compressed, it just
  appears smaller. Do NOT go back to `min(844px, 88dvh)` heights: that
  squished the layout on laptop screens. The browser window itself never
  scrolls (`html/body/#root` are locked to `height: 100%; overflow: hidden`)
  — only the content *inside* the phone screen scrolls, with a thin custom
  scrollbar (`.scroll-thin` in
  `src/index.css`).
- **PhoneFrame chrome, made to pop**: a deep, theme-independent vignette
  backdrop (`radial-gradient(120% 90% at 50% 32%, #232226 0%, #0D0C0E 62%,
  #050506 100%)`) — deliberately dark enough to contrast against BOTH the
  dark-theme charcoal screen (`#1E1E1E`) and the light-theme warm-grey
  screen (`#D8D8D4`). An earlier flat `#1C1C1E` backdrop sat almost the same
  tone as the dark screen, which is why the phone read as flat in dark mode
  — don't reintroduce a flat single-color backdrop for this reason. The
  bezel (`#0C0C0E`, 14px padding, 52px radius) has a layered shadow — inset
  top-highlight + inset bottom-shadow (metal-edge rim) plus two soft
  offset-down shadows (device resting on a lit surface) — instead of a
  generic symmetric `shadow-2xl`. The notch is a Dynamic-Island-style pill
  with a small camera-lens dot, not a plain black bar.
  `src/index.css`).
- **System strip (hamburger zone)**: the top ~56px of every tab is reserved.
  The floating hamburger/settings button (in `App.jsx`) is `position: fixed`
  (not `absolute`) so it never moves with any tab's own scroll container —
  it sits at `top: 32, right: 30`, which looks like `18, 16` visually: since
  PhoneFrame's bezel div is the one with `transform: scale()`, it becomes the
  containing block for `fixed` descendants (per spec), and that bezel is
  14px bigger on every side than the screen itself, so the offsets carry a
  +14 compensation baked in. If PhoneFrame's bezel padding ever changes,
  update this compensation too. Every scrollable tab starts its content at
  **60px top padding** (Overview greeting `paddingTop: 40` on top of the
  scroller's `pt-5`; Transactions/Goals/Accounts `paddingTop: 60`). The
  Copilot tab is the exception — its pinned header uses `pr-16` so the title
  row stays clear of the button. Keep this invariant when adding new tabs.
- Inside the screen, the scrollable content area and the bottom nav are
  siblings, not nested — the nav is `position: absolute; bottom: 0` against
  the non-scrolling screen wrapper, while the content area is a separate
  `absolute inset-0 overflow-y-auto` layer with bottom padding (`pb-24`) so
  the last card clears the nav. This is what keeps the nav pinned while
  content scrolls behind it — don't nest the nav inside the scrolling div
  or it will scroll away with the content.
- Rounded cards, generous spacing, light and airy feel.

**═══ RETRO 90s / NEUBRUTALIST THEME (CURRENT OFFICIAL IDENTITY) ═══**

The app was redesigned from the soft "Warm Playful" cream look into a bold
**retro 90s / neubrutalist** style — now with a real **light/dark mode
switch**. Signature traits, applied consistently across ALL FIVE tabs +
Settings, in BOTH themes:
- **Thick 3px solid black outlines** on every card, button, input, chip, chat
  bubble, and the mascot face. Black outlines/shadows never change between themes.
- **Solid offset "sticker" shadows** — flat black blocks offset `5px 5px 0 #000`
  on cards (`4px 4px 0` on buttons/inputs), never soft/blurred.
- **Bold saturated flat colors** — vivid category palette, no pastels, no gradients.
- **Chunky rounded corners** (18–28px) — tactile sticker feel.
- **Gold hero cards**: the "spent" (Overview) and "total balance" (Accounts)
  hero cards are solid gold `#FFC93C` with charcoal ink (`.retro-hero`) —
  a FIXED color island, identical in both themes (not a surface color).
  Chart/ring cards (donut, XP ring) stay in the theme's card tone so their
  vivid strokes pop.
- **منمّي mascot**: same character, thicker black linework + vivid leaves.
- **Contrast rule**: anything sitting ON a colored fill uses a clearly
  contrasting ink/fill, never a near-tone that blends (e.g. the verdict pill
  on the gold hero is a charcoal sticker with cream text via `.retro-verdict`;
  chat bubbles/buttons use a dedicated `--color-on-accent` ink, never the
  page/text color, since those differ between themes).

**How it's built** — `src/index.css` + `src/lib/ThemeContext.jsx`:
- **One root, one class.** `ThemeProvider` (wraps the whole app in `main.jsx`)
  holds `theme: 'dark' | 'light'` in React state (default `'dark'`, no
  persistence — mirrors `LocaleProvider`'s pattern). `PhoneFrame.jsx` puts
  `theme-dark` or `theme-light` on the phone screen's single root div —
  **not** per-tab. Every tab, the bottom nav, the hamburger, and Settings all
  live inside that one root, so the whole app reskins from one class. (An
  earlier per-tab `.tab-retro` opt-in was retired for exactly this reason —
  it left Settings unstyled since it lived outside every tab's scope.)
- `ThemeProvider` also mirrors the theme class onto `<html>` in a `useEffect`,
  because `themeColor()` helpers (GoalsTab/TransactionsTab) read
  `getComputedStyle(document.documentElement)` for the donut/legend/budget-bar
  colors — they need the class on `<html>`, not just the screen div.
  Category colors (`--color-teal`, `--color-lavender`) are the same in both
  themes; primary/positive/caution/rewards differ (see below), so this
  mirroring is what keeps those reads correct.
- `.theme-dark, .theme-light [class*="rounded-["]` auto-applies the black
  outline + offset shadow to every rounded-bracket card, app-wide (this now
  reaches Settings automatically — no per-component opt-in needed).
  `button.bg-primary` gets the same treatment on buttons.
- `.retro-hero` = gold fill + charcoal ink; `.retro-verdict` = charcoal pill +
  cream ink; `[class*="border-primary/"]` = teal AI chat bubbles/avatars with
  charcoal ink. All three are fixed color islands, identical in both themes.
- `--color-on-accent: #0E1F14` (near-black) is a THEME-INDEPENDENT token for
  ink that sits on a vivid accent fill (buttons, chips, the hero nav button).
  Use `text-on-accent` / `var(--color-on-accent)` for this — never `text-page`
  or `var(--color-page)`, since page color differs between themes and using
  it as button-ink breaks contrast in light mode (this was a real bug, fixed
  across AccountsTab/GoalsTab/TransactionsTab).

**Dark theme tokens** (`.theme-dark` in `src/index.css`, the default):
- Page `#1E1E1E`, tint `#2A2A2A`, card `#262626`, border `#000000`
- Text `#F5F0E6` (off-white), muted `#A79E8E`
- Primary/positive `#2FBF71`, caution `#FF5C39`, rewards `#FFC93C` — full-bright

**Light theme tokens** (`.theme-light`) — a real second theme, not an
afterthought:
- Page `#D8D8D4` (warm medium grey — deliberately NOT white/pale, still reads
  as retro), tint `#EBE5D6`, card `#F7F3EA` (warm cream), border `#000000`
  (same black as dark — only the base colors shift)
- Text `#1A1A1A`, muted `#5C5C52`
- Primary/positive `#0F6B3A`, caution `#AC2E12`, rewards `#7A5200` — **deepened,
  not desaturated**, versions of the dark-theme hues. The dark theme's
  full-bright hex values fail WCAG text contrast on a light ground (as low as
  ~2:1); these were computed to hit ≥4.5:1 against BOTH the page and card
  colors while staying fully saturated (deep ≠ muted — a deep emerald/rust/
  amber still reads as bold, just calibrated for a light surface instead of
  a dark one). If you add a new place that uses `--color-primary`/etc. as a
  TEXT color, sanity-check contrast in light mode before shipping it — fills
  with dark ink on top (buttons, badges) are always safe regardless.
- Category colors (`--color-teal`, `--color-lavender`) and the fixed color
  islands (gold hero, teal chat bubbles, real bank brand colors) are
  IDENTICAL in both themes — only page/card/text/muted/primary/positive/
  caution/rewards actually change between `.theme-dark` and `.theme-light`.

**Toggling themes**: a sliding switch in Settings → Preferences → Appearance
(`ThemeSwitch` in `SettingsPanel.jsx`, next to the language toggle — a real
binary switch, visually distinct from the segmented EN/AR control).

**Vivid category colors** (root `@theme`, read by `themeColor()` for the donut /
legend / budget bars — same in both themes): Shopping `#2FBF71`, Bills &
Transport `#FF5C39`, Entertainment `#FFC93C`, Food & Groceries `#17C3B2`,
Other `#A66CFF`.

**Shape language — bold, chunky, tactile**
- Cards: `border-radius: 18–28px`, 3px black outline, `5px 5px 0 #000` offset shadow.
- Hero card (Overview spent, Accounts total balance): `rounded-[28px]`, gold fill.
- Buttons: pill-shaped (fully rounded) or chunky rounded-rect. Primary = vivid green.
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
  - The ring draws in on mount via a plain CSS `stroke-dashoffset` transition
    (600ms staggered by `transitionDelay`) toggled by a `drawn` state flip on
    mount — not Motion's `initial`/`animate` on the raw SVG attribute, which
    could get stuck mid-transition in some environments; a native CSS
    transition is guaranteed by the browser to reach and hold its final value.
  - **Callout anchor angle**: each segment's arc gradient runs from its own
    color at the segment's start to the NEXT segment's color at its end, so
    the exact angular midpoint of any sweep is always a 50/50 blend — a pill
    anchored there (via a naive `midAngle`) sits next to a ring pixel that
    isn't its pure color at all, reading as a color mismatch. `labelAngle`
    (`SpendingDonut.jsx`) instead sits at 22% into the segment's own sweep,
    where the gradient is still ~85% the segment's own color, so the pill's
    solid category-colored fill honestly matches the ring right under it.
  - **Gradient rotation bug (real root cause of a color/slice mismatch)**:
    each `<linearGradient>` uses `gradientUnits="userSpaceOnUse"`, and it's
    referenced by a `<circle>` that carries its own `transform="rotate(-90
    ...)"` — per the SVG spec, that transform ALSO applies to the gradient's
    vector, since a `userSpaceOnUse` gradient inherits the coordinate system
    of the element that references it. The gradient's `x1,y1,x2,y2` must
    therefore be computed WITHOUT the `-90` baked in (unlike the callout
    anchor/label angles, which have no such transform and do need it) — the
    circle's own transform supplies that rotation. Baking `-90` into both
    double-rotated the gradient a further 90° away from the arc's real
    on-screen position, so a segment's "pure" color rendered nowhere near
    that segment's actual visible arc, even though the callout position math
    (anchor angle, label placement) was already correct on its own.
- Track rings / progress bar backgrounds: use `var(--color-card-border)`
  (always black in both themes), NOT a hardcoded hex.

**Bottom nav — `src/components/BottomNav.jsx`**
- Height: 74px, `overflow: visible` (hero button floats above). Fully
  tokenized (no hardcoded hex except black outlines/shadows and the fixed
  `--color-on-accent` ink) so it adapts automatically between themes.
- Nav background: `var(--color-card)` + thick `3px solid #000` top rule.
- **منمّي center tab (hero)**: icon-only — no text label under it, unlike the
  other 4 tabs (a deliberate call: it's visually distinct enough as the
  larger, colored circle that a label was redundant). A 58×58px circle sits
  dead-center in a `position: relative; h-full` button via
  `position: absolute; top: 50%; left: 50%` + `translate(-50%, -50%)` — true
  centering in the box, not a hand-tuned offset `top`/`margin-top` pixel
  value. (Two earlier attempts got this wrong: flex `items-center` +
  negative `margin-top` centers a negative-margined child by its shrunk
  *effective* margin-box size, which "eats" about half of any margin
  change and barely moved the position when tuned; a fixed `top: -22px`
  offset then overshot into "floating too high.") Solid
  `var(--color-primary)` fill, 3px black border, offset shadow (`4px 4px 0
  #000` active / `3px 3px 0 #000` inactive). Active = full opacity +
  `scale(1.05)`; inactive = 90% opacity (combined with the centering
  `translate(-50%, -50%)` in one `transform`). Contains a real
  `MunamiMascot` (`happy`, 32px) instead of the old abstract sprout icon.
- **Regular tabs**: small SVG icon (18×18) + label. Active = a solid
  `var(--color-primary)` **pill fill behind the icon** (46×28px, 2.5px black
  border, `2.5px 2.5px 0 #000` shadow) + icon in `--color-on-accent` +
  label in `--color-primary`. Inactive = `--color-muted` icon/label on
  transparent.
- The Overview donut icon is drawn as a true annular sector (no
  background-colored masking circle) so it renders correctly on any fill.

**Type**
- Space Grotesk is the app's default font (set on `.theme-dark, .theme-light`
  in `src/index.css`). All headings, hero numbers, and body copy inherit it.
- Page-level section headers follow the pattern:
  - Muted tiny uppercase label: `text-muted text-xs font-medium uppercase tracking-widest`
  - Bold heading below it: Space Grotesk, 26px, `font-bold`, with a personality emoji.
- The app is **bilingual (EN/AR)**. All UI strings go through `src/lib/i18n.js`.
  Language switching is via the **Settings screen** (hamburger icon → top-right
  corner, present on all tabs). `SettingsPanel.jsx` slides in from the right
  (`x: 100% → 0` via Motion), fully retro-styled (see theme section above),
  and contains: a profile header (placeholder: Ahmed), the language segmented
  control, the light/dark `ThemeSwitch`, and placeholder rows for
  Notifications / Linked Accounts / About (dimmed, `comingSoon` label, non-functional).

**Vibe (current):** bold retro 90s / neubrutalist, with a real light/dark
switch — thick black outlines, flat solid "sticker" offset shadows, vivid
saturated colors, gold hero cards, chunky rounded corners, Space Grotesk
geometric type, منمّي character (thicker linework) present throughout.
Confident and playful in both themes, never soft/pastel or washed out.

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
Warm header "Every spend, tracked", search bar, bank filter chips, grouped by date.

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

- **Header**: منمّي name + real mascot avatar (`greeting` mood) + "AI" / "Demo" status dot,
  plus a "past chats" (clock icon) button and a "new chat" (+ icon) button, pinned at top.
- **A fresh chat opens with only the greeting**: a single منمّي bubble built from real
  financial data (`buildGreeting()`) — total balance, bank count, month spend.
  No pre-seeded messages. No suggested chips. Clean slate, ready for input.
- **Persistence — `src/lib/chatStorage.js`**: the current conversation is saved to
  `localStorage` (key `munami_chat_current`) on every change and reloaded on mount,
  so switching tabs and coming back to Copilot resumes exactly where you left off —
  CopilotTab unmounts when another tab is active, so this is real persistence, not
  just React state surviving a re-render. Starting a genuinely new conversation is
  a **deliberate action only** (the "+" button, `handleNewChat`) — it never happens
  automatically on tab switch. Tapping "new chat" archives the current conversation
  into history first, but only if the user actually said something in it (a chat
  that's still just the opening greeting isn't worth keeping).
- **History — up to the last 5 conversations** (`munami_chat_history` in
  `localStorage`, capped by `MAX_HISTORY` in `chatStorage.js`, newest first).
  The clock-icon button opens a bottom sheet listing each past conversation's
  first user message + timestamp; tapping one restores it as the current
  conversation (archiving whatever was on screen first, same "only if it has
  real content" rule). No backend — plain `localStorage`, matching the rest
  of the demo's "no real backend" data strategy.
- **Chat thread**: منمّي bubbles left-aligned (mint-tinted bg), user bubbles
  right-aligned (white card bg). Messages animate in on send (not on mount).
- **"Ask منمّي..." input bar**: pinned above the bottom nav, fully functional.
  Sends to `/api/chat` with the full message history + financial context object.
  The context includes the **full monthly history** (spend + income for every month
  in the dataset, precomputed in `App.jsx`), a **per-month category breakdown for
  every month** (`categoriesByMonth`), plus average monthly spend, highest
  and lowest spending months. This lets منمّي answer historical questions ("highest
  spending month", "how does this month compare", "my biggest category in April")
  using real data. Code computes all aggregates; the AI only reads finished
  numbers, never raw rows.
  **Independent of the Overview tab's month switcher — this is load-bearing.**
  `financialContext` (`App.jsx`) is a `useMemo` keyed only on `[rows, locale]`,
  never on `activeMonth` (Overview's selected month). "This month" for the chat
  (`context.month`, `context.spent`, `context.income`, `context.topCategories`,
  etc.) is always derived from `getLatestMonth(rows)` — the data's own true
  latest month, same logic used everywhere else for "today" — computed as
  `currentMonth` inside the memo, completely separate from Overview's
  `selectedMonth` state. This was a real bug: the context used to reuse the
  Overview tab's `activeMonth`/`chartData`/`spendByCategory` variables, so
  switching Overview to an old month made منمّي think that old month was
  "now," and `topCategories` only ever covered whatever month Overview had
  selected. `categoriesByMonth` fixes the second half by sending every
  month's category breakdown up front, so a question about any month works
  regardless of what's currently shown in Overview.
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
- **Weekly Challenges — real, AI-generated, two cards, both from the
  current week** (not static demo data): a clean code/AI split, same
  philosophy as the rest of the app ("code computes, AI only phrases"):
  - **Fixed weeks, not a rolling window** (`src/lib/challengeGen.js`):
    weeks are fixed 7-day blocks counted from the account's registration
    date (`getRegistrationDate()` — the earliest date in the data), not
    "the last 7 days from today." Week 0 = regDate..regDate+6, week 1 =
    next 7 days, etc. (`getCurrentWeekIndex()`).
  - **Causally-correct candidate detection** (`computeCandidatesForWeek()`):
    whether a category gets challenged for week `w` is decided from week
    `w-1` (the "detection week") trending >10% above ITS OWN prior average
    — never from week `w`'s own spend, which hasn't fully happened yet.
    Week `w`'s actual spend is then the thing evaluated against the
    target. (An earlier version compared the same week's spend for both
    detection and evaluation, which made "target met" mathematically
    impossible — a candidate was defined as over-trend on the very data
    being checked against a stricter target.) Guardrail: the detection
    week's own prior average must be ≥ SAR 30/week.
  - **Code computes the target and XP by formula** — not arbitrary round
    numbers: `reductionPct = clamp(10 + overagePct/10, 10, 15)` (a bigger
    overage asks for a bigger cut, capped at 15% so it stays realistic),
    `target = round(avgBeforeDetection × (1 − reductionPct/100))`,
    `xp = round(100 + (avgBeforeDetection − target) × 2)` (a more demanding
    target pays more XP). Candidates are sorted by overage % descending.
  - **Two cards, both current-week** (`computeCurrentWeekChallenges()`):
    - **Active/failed**: the top candidate by overage, target and spend
      both real and untouched — shown with a muted "This week" tag; the
      progress bar turns caution-red once spend reaches/exceeds target.
    - **On track**: a *different* current-week candidate whose **target**
      (never its real spend) is adjusted — `adjustedTarget =
      max(naturalTarget, currentSpend)` — so it genuinely reads as
      achievable this week. If the natural formula target already covers
      real spend, nothing changes; the override only loosens a target that
      real spend would otherwise have already blown through. XP is
      recomputed from the adjusted target so the reward stays consistent
      with how demanding it actually is. Shown with a green "✓ On track"
      pill + tinted card background.
  - **AI selects + phrases only** (`POST /api/weekly-challenge` in
    `server.js`, `status: 'active' | 'on_track'`): for the active card,
    given the full candidate list and which category last week's challenge
    used, Gemini picks the most over-trend candidate — skipping last
    week's category so it never repeats two weeks running — and writes
    the title/description in منمّي's voice, present tense. For the
    on-track card there's no selection ambiguity (code already picked it),
    so the AI's only job is an encouraging, present-tense phrasing (the
    week isn't over, so it never claims victory) — a separate prompt
    branch in `server.js`. Both prompts require reusing the exact
    category/target/XP numbers given; neither invents figures.
    `getLastChallengeCategory()` / `saveLastChallengeCategory()` persist
    the active card's category in `localStorage`
    (`munami_last_challenge_category`) purely for the repeat-avoidance
    check.
  - **Fallback chain** matches Copilot's: `VITE_USE_AI=false` or a failed
    API call both fall back to `templateChallenge()` — a plain sentence
    built from the same code-computed candidate, never blank.
  - If no category is currently trending over its average, the section
    shows a plain positive message instead (`noChallengeThisWeek`).
- **Deals Wall** (`src/components/DealsWall.jsx`) — Lane 1 of the gamification
  pitch: badges became real partner deals with SAR/percentage value, replacing
  the old plain badge grid.
  - **Tier ladder**: Seed → Sprout → Branch → Tree, derived from the same
    `LEVEL` constant the XP ring uses (`tierIndexForLevel()` — Level 7 → Tree,
    the top tier). Shown as a connected row above the deals, current tier lit
    up in `--color-primary`.
  - **Deal cards**: icon, partner name (placeholder brands), category, a bold
    SAR/% value badge, and either an "Unlocked" tag + Redeem button, or a
    muted (55% opacity) card with a `🔒 {tier} + {requirement}` line. Demo
    persona ("the deal redeemer"): one deal (🚗 Car, −SAR 10,000) is
    genuinely unlocked — Tree tier + a completed "Car Down Payment" goal —
    the other three are locked on real, specific, almost-there requirements
    (`DEMO` object in `DealsWall.jsx`).
  - **"How it works"**: a "?" icon in the section header opens a standalone
    3-step visual explainer (🎯 Hit the milestone → 🏅 Badge unlocks → 🛍️
    Redeem at partner, icon + short title + one-line caption, connecting
    arrows). The same steps (icon + title only, no caption) are embedded in
    every deal's detail sheet.
  - **Worked example**: tapping the car deal's detail sheet shows a concrete
    price breakdown — original price, "منمّي deal" discount, "You pay" total —
    labeled "Illustrative pricing" per the pitch's own convention.
  - Scoped to Lane 1 only: no rate simulator, no SIMAH/credit-builder, no
    internal partner-split math (no "dealer gets / Alinma gets" breakdown).
  - Tap-to-redeem is local UI state only (`redeemedIds` in `DealsWall.jsx`) —
    no persistence, no backend.

---

### 5. Accounts (rightmost) ← **built**
Bank account aggregation + money buckets. Data from `data/munami_accounts.json`
(imported directly as a Vite JSON import — not fetched from public/).

- **Total balance hero** (`.retro-hero`, gold fill): asymmetric layout, not
  plain centered text — left-aligned eyebrow label → huge left-aligned number
  → a short thick black divider rule → a `.retro-verdict` chip (charcoal
  pill, cream text) for "across N accounts". No mascot/icon on this card —
  an earlier corner-emblem treatment was tried and removed after review.
- **Bank card stack** (`src/components/BankCardStack.jsx`) — replaced the old
  carousel. The three bank cards sit stacked like a fanned deck (top card fully
  visible, others peeking out diagonally below-right); **tap the stack to fan
  out** into a readable vertical spread (Motion, ~420ms staggered), tap again to
  restack. No visible hint text — a small chevron below the stack (rotates
  180° on expand) is the only tap cue; the expand/collapse action is still
  announced via `aria-label` (i18n `bankStackExpand` / `bankStackCollapse`)
  for screen readers.
- **Real bank logos + brand colors**: actual logo PNGs live in
  `src/assets/banks/` (`alinma.png`, `alrajhi.png`, `snb.png`), imported as Vite
  assets and shown on a white chip per card. Each account's `color` (and optional
  `accent`) in `munami_accounts.json` is the bank's REAL brand color, not our
  category palette: Alinma navy `#0A2647`, Al Rajhi blue `#2323FF`, SNB green
  `#1B5E3A` + light-green accent `#6FCF5C`. These are FIXED brand colors —
  identical in both light and dark theme, same as the gold hero cards.
- **Retro bank cards**: solid saturated brand fill, 3px black outline,
  `5px 5px 0 #000` offset shadow (matches the app-wide retro system exactly —
  this was tightened from an earlier one-off `7px 7px 0` treatment), 22px
  corners, white text (SNB's balance in its light-green accent).
- **Fund buckets ("pots")**: `data/munami_accounts.json` now contains exactly two
  fund types — **Unallocated** (display-only row) and **Emergency Fund** (the only
  real fund). Vacation and New Car were deleted from the data entirely (not hidden);
  their balances were folded back into `unallocated_sar`.
  - `total_balance_sar`: 47,851.25 — unchanged
  - `allocated_sar`: 6,000 (Emergency Fund only)
  - `unallocated_sar`: 41,851.25 (= 47,851.25 − 6,000)
- **Unallocated row**: display-only, no tap/click interaction.
- **Fund card (Emergency Fund)**: tappable — opens a bottom sheet with Add / Withdraw
  toggle. Add moves money from unallocated into the fund; Withdraw moves it back.
  Both update balances in local React state.
- **"+" button** (top-right of Funds section): opens the *Create New Fund* sheet only
  — name + target amount. Does NOT open the add-money flow (that's on the fund card).
  New fund appears in the list with 0 balance and an auto-assigned palette color.
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
- [x] **Retro 90s / neubrutalist design identity** — MunamiMascot, Space Grotesk
      font, thick black outlines + offset sticker shadows, vivid saturated
      colors, gold hero cards, applied consistently across all 5 tabs + Settings
- [x] **Light/dark theme system** — `ThemeContext` + `ThemeSwitch` in Settings,
      warm-grey light mode with contrast-safe deepened accents, real bank
      colors and gold hero cards fixed across both themes
- [x] **Overview tab** — mascot greeting, hero card, donut + callouts, insight cards, month switcher
- [x] **Transactions tab** — scrollable list, grouped by date, bank filter, search
- [x] **Accounts tab** — asymmetric badge-treatment hero balance, tap-to-fan bank
      card stack with real logos/brand colors, fund buckets, + sheet
- [x] **Goals tab** — XP ring, streak, category budgets (real spend), challenges,
      Deals Wall (Lane 1 gamification: tiered partner deals, worked example, redeem flow)
- [x] **منمّي / Copilot tab** — real AI chat with context, live categorization demo, scripted fallback
- [x] **Bottom nav** — hero منمّي circle, active indicators, clean 5-tab layout, theme-tokenized
- [x] **EN/AR bilingual** — full RTL support, Noto Sans Arabic, language toggle in Settings
- [x] **Settings screen** — hamburger icon (top-right, all tabs), slides in from
      right, fully retro-styled, profile header + language switch + theme switch + placeholder rows
- [x] **AI backend** — Express server, Gemini wired, security pattern, fallback switch
- [ ] Mock "Connect bank" consent screen
- [ ] Demo polish + rehearsal

Update this checklist as we go.
