import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

const CATEGORIES = ['Shopping', 'Food & Groceries', 'Bills & Transport', 'Entertainment', 'Other']

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { merchant } = req.body
  if (!merchant?.trim()) return res.status(400).json({ error: 'No merchant' })

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
}
