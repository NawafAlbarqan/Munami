import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

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
- Level ${context.goals?.level}, ${context.goals?.xpCurrent} XP, ${context.goals?.streak}-day streak` : ''

  const systemPrompt = `You are منمّي (pronounced "Munami"), a warm, friendly Saudi personal finance assistant — like a smart friend who is great with money. Speak in ${lang}. Be casual and encouraging, not corporate. Use 🌱 occasionally but not every message. Keep replies to 2-4 short sentences — this is a chat bubble, not an essay. Answer ONLY from the financial data provided below. If something is not in the data, say you don't have that info yet rather than guessing.
${contextBlock}`

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
}
