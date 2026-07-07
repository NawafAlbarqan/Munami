import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

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
}
