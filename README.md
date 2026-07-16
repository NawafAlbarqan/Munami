# منمّي | Munami

Munami is an Arabic-first Saudi personal finance experience built with React and Vite. It combines accounts, cash, budgets, funds, goals, categorized transactions, and a bilingual financial assistant in a responsive iPhone-focused interface.

## Development

```bash
npm install
npm run dev
```

Live Gemini responses are optional. Add `GEMINI_API_KEY` to `.env` and set `VITE_USE_AI=true` only when testing the external AI service. Never commit `.env`.

## Presentation Build

Install dependencies:

```bash
npm install
```

Launch the deterministic, backend-free presentation mode:

```bash
npm run demo
```

The command opens `http://127.0.0.1:4173/?demo=true&onboarding=true`. Demo mode uses fixed Saudi financial data and local assistant responses, so it does not require Gemini or the Express API.

Generate five Arabic App Store-style promotional PNGs and five clean application screenshots:

```bash
npm run screenshots
```

Outputs are written to `presentation/app-store/`; clean screens are in `presentation/app-store/screens/`. The first run installs Playwright Chromium.

Build the production application:

```bash
npm run build
```

Reset the demo from **Settings → Reset demo**, or open:

```text
http://127.0.0.1:4173/?demo=true&onboarding=true
```

Switch Arabic and English from Settings. Arabic is the default and uses RTL layout; English uses LTR. The selected language and light/dark appearance persist locally.

### Direct presentation screens

Use these deterministic routes when recording or presenting:

- `?demo=true&screen=home`
- `?demo=true&screen=budget`
- `?demo=true&screen=copilot`
- `?demo=true&screen=goals`
- `?demo=true&screen=transactions`

### Walkthrough

1. Launch with `npm run demo` and complete the three onboarding screens.
2. Show the Home balance and expand the account wallet.
3. Open **View all** to inspect accounts and funds, then select a bank account.
4. Open **Spending** and inspect transaction search, filters, and grouped activity.
5. Open **Budget**, then the full budget view to show category pressure and upcoming bills.
6. Open **Munami**, select a seeded question, and show the deterministic financial response.
7. Open **Goals** and select a savings goal.
8. Return to Home.

### Remaining limitations

- Demo data is synthetic and bank connection screens do not connect to real financial institutions.
- PWA installation depends on browser support and HTTPS outside localhost.
- Live Gemini answers remain optional; presentation mode intentionally uses deterministic local responses.
