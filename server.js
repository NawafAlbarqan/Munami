// منمّي API server — keeps the Gemini key server-side.
// The React app calls /api/* here; this server calls Gemini.
// The key is never sent to the browser.
import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { GoogleGenerativeAI } from '@google/generative-ai'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:4173'] }))
app.use(express.json())

if (!process.env.GEMINI_API_KEY) {
  console.error('❌  GEMINI_API_KEY missing from .env — AI routes will fail.')
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

// ── /api/insights ─────────────────────────────────────────────────────────────
// Takes the pre-computed category changes and asks Gemini to phrase them warmly.
app.post('/api/insights', async (req, res) => {
  const { changes, locale } = req.body
  if (!changes?.length) return res.json({ phrases: [] })

  const lang = locale === 'ar' ? 'Arabic' : 'English'
  const factsBlock = changes
    .map((c) => `- ${c.category}: ${c.direction === 'up' ? '+' : '-'}${Math.abs(c.pctChange)}% vs usual (${c.direction})`)
    .join('\n')

  const prompt = `You are منمّي, a warm friendly Saudi financial coach. \
Write exactly ${changes.length} short sentences in ${lang} — one per fact. \
Each sentence must mention the % change and give a brief practical tip. \
Max 18 words per sentence. \
Reply with ONLY the sentences, one per line, no bullet points, no numbers.

Spending facts:
${factsBlock}`

  try {
    const result = await model.generateContent(prompt)
    const raw = result.response.text().trim()
    const phrases = raw.split('\n').map((l) => l.replace(/^[-•\d.)\s]+/, '').trim()).filter(Boolean)
    res.json({ phrases })
  } catch (err) {
    console.error('[insights]', err.message)
    res.status(500).json({ error: err.message })
  }
})

// ── /api/weekly-challenge ─────────────────────────────────────────────────────
// Code already computed every candidate (category, weeklyAvg, target, xp —
// see src/lib/challengeGen.js). Gemini's ONLY job here is to pick the most
// meaningful candidate for this week and phrase it in منمّي's voice — it
// must never invent a number, only reuse the ones we hand it.
app.post('/api/weekly-challenge', async (req, res) => {
  const { candidates, lastCategory, locale, status } = req.body
  if (!candidates?.length) return res.status(400).json({ error: 'No candidates' })

  const lang = locale === 'ar' ? 'Arabic' : 'English'
  const isOnTrack = status === 'on_track'
  const candidatesBlock = candidates
    .map((c, i) => `${i}: ${c.category} — trending ${c.overagePct}% above its usual SAR ${c.weeklyAvg}/week, target SAR ${c.target}/week (a ${c.reductionPct}% cut), actual spend so far SAR ${c.currentSpend}, worth ${c.xp} XP`)
    .join('\n')

  const prompt = isOnTrack
    ? `You are منمّي, a warm straight-talking Saudi financial coach encouraging the user about a spending challenge THIS week that they are currently on track on (the week isn't over yet).

Candidate (index: category — trend — target — actual spend so far — XP):
${candidatesBlock}

Rules:
- Write in ${lang}, in منمّي's voice: warm, encouraging, 1-2 short sentences, present tense — this is still in progress, not finished, so don't claim victory yet.
- You MUST use the category name, target SAR amount, actual spend so far, and XP value EXACTLY as given. Do not invent, round, or estimate any number.
- Reply with EXACTLY 3 lines, nothing else:
  line 1: the number 0 (only one candidate is ever sent for an on-track update)
  line 2: a short encouraging title (under 6 words)
  line 3: the one-to-two sentence update, must include the actual spend so far and the target SAR amounts`
    : `You are منمّي, a warm straight-talking Saudi financial coach picking this week's ONE spending challenge for the user.

Candidates (index: category — trend — target — XP):
${candidatesBlock}

Last week's challenge category was: ${lastCategory || 'none yet'}

Rules:
- Pick the candidate that is most over its own trend (highest overage %), UNLESS its category matches "last week's challenge category" above — in that case pick the next-most-over-trend candidate instead, so the same category never repeats two weeks in a row.
- Write in ${lang}, in منمّي's voice: casual, warm, a little cheeky, 1-2 short sentences.
- You MUST use the category name, target SAR amount, and XP value EXACTLY as given for your chosen candidate. Do not invent, round, or estimate any number.
- Reply with EXACTLY 3 lines, nothing else:
  line 1: the chosen candidate's index number, alone
  line 2: a short challenge title (under 6 words)
  line 3: the one-to-two sentence challenge description, must include the target SAR amount`

  try {
    const result = await model.generateContent(prompt)
    const lines = result.response.text().trim().split('\n').map((l) => l.trim()).filter(Boolean)
    const index = parseInt(lines[0], 10)
    if (Number.isNaN(index) || !candidates[index]) {
      return res.status(500).json({ error: 'Model returned an invalid candidate index' })
    }
    res.json({ index, title: lines[1] || '', desc: lines[2] || '' })
  } catch (err) {
    console.error('[weekly-challenge]', err.message)
    res.status(500).json({ error: err.message })
  }
})

// ── /api/chat ─────────────────────────────────────────────────────────────────
// Real conversational chat. Receives message history + compact financial context.
app.post('/api/chat', async (req, res) => {
  const { messages, context, locale } = req.body
  if (!messages?.length) return res.status(400).json({ error: 'No messages' })

  const contextBlock = context ? `
User financial summary (use ONLY these numbers — never invent figures):
- Total balance: SAR ${context.totalBalance?.toLocaleString()} across ${context.accounts?.length} banks
${(context.accounts || []).map((a) => `  · ${a.bank}: SAR ${a.balance?.toLocaleString()}`).join('\n')}
- Unallocated / truly free to spend: SAR ${context.unallocated?.toLocaleString()} (total minus all committed funds)
- Committed to savings funds: SAR ${context.allocated?.toLocaleString()}
- Savings funds:
${(context.funds || []).map((f) => `  · ${f.name}: SAR ${f.balance?.toLocaleString()} saved / SAR ${f.target?.toLocaleString()} target`).join('\n')}
- This month (${context.month}): spent SAR ${context.spent?.toLocaleString()}, income SAR ${context.income?.toLocaleString()}, ${context.daysElapsed} days in${context.isEarlyMonth ? ' (partial month)' : ''}
- Top spending categories: ${(context.topCategories || []).map((c) => `${c.category} SAR ${c.amount?.toLocaleString()} (${c.pct}%)`).join(', ')}
- Budgets: ${(context.budgets || []).map((b) => `${b.category} SAR ${b.spent}/${b.limit}`).join(', ')}
- Upcoming bills: ${(context.upcomingBills || []).map((b) => `${b.name} SAR ${b.amount} due ${b.dueDate}`).join(', ')}
- Emergency Fund: SAR ${context.goals?.emergencyFund?.current?.toLocaleString()} / SAR ${context.goals?.emergencyFund?.target?.toLocaleString()} goal
- Level ${context.goals?.level}, ${context.goals?.xpCurrent} XP, ${context.goals?.streak}-day streak
- Average monthly spend (full months only): SAR ${context.avgMonthlySpend?.toLocaleString()}
- Highest spending month: ${context.highestMonth?.month} — SAR ${context.highestMonth?.spend?.toLocaleString()}
- Lowest spending month: ${context.lowestMonth?.month} — SAR ${context.lowestMonth?.spend?.toLocaleString()}
- Monthly history (${context.monthlyHistory?.length} months, YYYY-MM format):
${(context.monthlyHistory || []).map((m) => `  ${m.month}: spent SAR ${m.spend?.toLocaleString()}, income SAR ${m.income?.toLocaleString()}`).join('\n')}
- Category breakdown by month (YYYY-MM format — use this for ANY month asked about, not just the current one):
${(context.categoriesByMonth || []).map((m) => `  ${m.month}: ${m.categories.map((c) => `${c.category} SAR ${c.amount?.toLocaleString()} (${c.pct}%)`).join(', ')}`).join('\n')}` : ''

  const personalityBlock = locale === 'ar'
    ? `أنت منمّي — صاحب ذكي في المال، تعرف وضع المستخدم بالضبط. رد دايماً بالعربي فقط — ممنوع تخلط أي كلمة إنجليزية في ردودك.

الشخصية (في كل رسالة):
- اكتب زي صاحب يراسل — قصير، مباشر، دافي، أحياناً خفيف الدم.
- استخدم اللهجة الخليجية السعودية بشكل طبيعي: وش، زين، خلاص، عادي، يالله، كذا، تبي، وغيرها.
- ما تبدأ كل رسالة بتحية أو تمهيد — وصل للنقطة مباشرة.
- إذا الإنفاق زايد، كن صريح بطريقة ودية — زي صاحب يقولها بصراحة مو بوت يحلل.
- إذا الأمور زينة، كن حماسي فعلاً — مو مجرد إيجابية فارغة.
- جمل قصيرة. 1-3 جمل لأغلب الردود.
- الأرقام بس لما تكون ضرورية فعلاً. ما تحشو بيانات.
- 🌱 أحياناً، مو في كل رسالة.`
    : `You are Munami — a financially sharp, straight-talking friend who knows the user's exact money situation. Respond ENTIRELY in English — do not use any Arabic words, phrases, or characters in your replies.

PERSONALITY (every message, not just greetings):
- Sound like a friend texting — casual, warm, occasionally funny.
- Short sentences. Contractions. No stiff phrasing, no "certainly!" or "great question!".
- 1-3 sentences for most replies. Only go longer when the question genuinely has multiple parts.
- Don't open with a greeting or filler. Just answer.
- Be a little cheeky when spending is off — like a friend calling it out, not a bot flagging an anomaly.
- Be genuinely warm when things are going well — real enthusiasm, not polite acknowledgement.
- Simple question = simple answer. Don't over-explain.
- Only cite numbers when they're directly relevant. Don't data-dump.
- 🌱 occasionally — not as a sign-off on every message.`

  const systemPrompt = `${personalityBlock}

REASONING:
- On every money-related question, think it through from the actual data — don't pattern-match to a rehearsed answer.
- Critical distinction: total balance ≠ free money. Free money = unallocated funds only. Total balance includes money already committed to savings goals. Never conflate the two.
- Purchases and affordability: always reason from unallocated funds, not total balance. If a relevant savings fund already exists, mention it. If a purchase would leave very little buffer, say so. Give a real recommendation — not just yes or no.
- Spending and trends: use monthly history, averages, and budget status — not just the current month snapshot.
- Ambiguous questions: ask one clarifying question rather than guessing. A real advisor does this.
- NEVER invent or estimate numbers not in the data. If something isn't available, say so in one short sentence.
${contextBlock}`

  // Convert our message format to Gemini history format
  const history = messages.slice(0, -1).map((m) => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: m.content }],
  }))
  const lastMsg = messages[messages.length - 1]

  try {
    const chat = model.startChat({
      history: [
        { role: 'user', parts: [{ text: systemPrompt }] },
        {
          role: 'model',
          parts: [{ text: locale === 'ar' ? 'مرحباً! أنا منمّي، هنا لمساعدتك في أموالك 🌱' : "Got it! I'm منمّي, ready to help with your finances 🌱" }],
        },
        ...history,
      ],
    })
    const result = await chat.sendMessage(lastMsg.content)
    res.json({ reply: result.response.text().trim() })
  } catch (err) {
    console.error('[chat]', err.message)
    res.status(500).json({ error: err.message })
  }
})

// ── /api/categorize ───────────────────────────────────────────────────────────
// Given a raw merchant string, return which of our 5 categories it belongs to.
app.post('/api/categorize', async (req, res) => {
  const { merchant } = req.body
  if (!merchant?.trim()) return res.status(400).json({ error: 'No merchant' })

  const CATEGORIES = ['Shopping', 'Food & Groceries', 'Bills & Transport', 'Entertainment', 'Other']

  const prompt = `You are a Saudi bank transaction categorizer. \
Classify this merchant into exactly one category: ${CATEGORIES.join(' | ')}.
Merchant: "${merchant.trim()}"
Reply with ONLY the category name, nothing else.`

  try {
    const result = await model.generateContent(prompt)
    const raw = result.response.text().trim()
    const matched = CATEGORIES.find((c) => c.toLowerCase() === raw.toLowerCase()) || 'Other'
    res.json({ category: matched })
  } catch (err) {
    console.error('[categorize]', err.message)
    res.status(500).json({ error: err.message })
  }
})

app.listen(PORT, () => {
  console.log(`✅  منمّي API server running on http://localhost:${PORT}`)
})
