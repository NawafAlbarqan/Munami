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

// ── /api/chat ─────────────────────────────────────────────────────────────────
// Real conversational chat. Receives message history + compact financial context.
app.post('/api/chat', async (req, res) => {
  const { messages, context, locale } = req.body
  if (!messages?.length) return res.status(400).json({ error: 'No messages' })

  const lang = locale === 'ar' ? 'Arabic' : 'English'

  const contextBlock = context ? `
User financial summary (use ONLY these numbers — never invent figures):
- Total balance: SAR ${context.totalBalance?.toLocaleString()} across ${context.accounts?.length} banks
${(context.accounts || []).map((a) => `  · ${a.bank}: SAR ${a.balance?.toLocaleString()}`).join('\n')}
- Unallocated / truly free to spend: SAR ${context.unallocated?.toLocaleString()} (total minus all committed funds)
- Committed to savings funds: SAR ${context.allocated?.toLocaleString()}
- Savings funds:
${(context.funds || []).map((f) => `  · ${f.name}: SAR ${f.balance?.toLocaleString()} saved / SAR ${f.target?.toLocaleString()} target`).join('\n')}
- This month (${context.month}): spent SAR ${context.spent?.toLocaleString()}, income SAR ${context.income?.toLocaleString()}, ${context.daysElapsed} days in${context.isEarlyMonth ? ' (partial month)' : ''}
- Top spending categories: ${(context.topCategories || []).map((c) => `${c.category} ${c.pct}%`).join(', ')}
- Budgets: ${(context.budgets || []).map((b) => `${b.category} SAR ${b.spent}/${b.limit}`).join(', ')}
- Emergency Fund: SAR ${context.goals?.emergencyFund?.current?.toLocaleString()} / SAR ${context.goals?.emergencyFund?.target?.toLocaleString()} goal
- Level ${context.goals?.level}, ${context.goals?.xpCurrent} XP, ${context.goals?.streak}-day streak
- Average monthly spend (full months only): SAR ${context.avgMonthlySpend?.toLocaleString()}
- Highest spending month: ${context.highestMonth?.month} — SAR ${context.highestMonth?.spend?.toLocaleString()}
- Lowest spending month: ${context.lowestMonth?.month} — SAR ${context.lowestMonth?.spend?.toLocaleString()}
- Monthly history (${context.monthlyHistory?.length} months, YYYY-MM format):
${(context.monthlyHistory || []).map((m) => `  ${m.month}: spent SAR ${m.spend?.toLocaleString()}, income SAR ${m.income?.toLocaleString()}`).join('\n')}` : ''

  const systemPrompt = `You are منمّي — a financially sharp, straight-talking friend who knows the user's exact money situation. Speak in ${lang}.

PERSONALITY (applies to every single message, not just greetings):
- You're a close friend who's genuinely sharp with money. Sound like it — casual, warm, a little playful.
- Short sentences. Contractions. No stiff phrasing, no corporate-speak, no "certainly!" or "great question!".
- Keep replies SHORT. 1-3 sentences for most things. Only go longer when a question genuinely has multiple moving parts.
- Don't open every message with a greeting or filler. Just get to it.
- Be a little cheeky when spending is off track — like a friend gently calling it out, not a bot flagging an anomaly.
- Be genuinely warm when things are going well — real hype, not neutral acknowledgement.
- Never pad with pleasantries or over-explain simple things. Simple question = simple answer.
- In Arabic: use natural Saudi Gulf colloquial phrasing — وش، زين، خلاص، عادي، يالله، etc. where it fits naturally. Read like a Saudi friend texting, not a formal report.
- Only cite specific numbers when they're directly relevant. Don't data-dump just because you have it.
- 🌱 is your vibe, not your signature. Use it when it fits, not on every single message.

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
