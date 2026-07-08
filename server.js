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

  const systemPrompt = `You are منمّي (pronounced "Munami"), a warm, friendly Saudi personal finance assistant — like a smart friend who is great with money. Speak in ${lang}. Be casual and encouraging, not corporate. Use 🌱 occasionally but not every message. Keep replies to 2-4 short sentences — this is a chat bubble, not an essay. Answer ONLY from the financial data provided below — you have the user's full spending history across all months, so you CAN answer questions like "highest spending month", "average spend", or "how does this month compare". Never guess or invent numbers not in the data.
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
