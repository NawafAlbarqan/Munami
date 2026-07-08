import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

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
- Top spending categories: ${(context.topCategories || []).map((c) => `${c.category} ${c.pct}%`).join(', ')}
- Budgets: ${(context.budgets || []).map((b) => `${b.category} SAR ${b.spent}/${b.limit}`).join(', ')}
- Emergency Fund: SAR ${context.goals?.emergencyFund?.current?.toLocaleString()} / SAR ${context.goals?.emergencyFund?.target?.toLocaleString()} goal
- Level ${context.goals?.level}, ${context.goals?.xpCurrent} XP, ${context.goals?.streak}-day streak
- Average monthly spend (full months only): SAR ${context.avgMonthlySpend?.toLocaleString()}
- Highest spending month: ${context.highestMonth?.month} — SAR ${context.highestMonth?.spend?.toLocaleString()}
- Lowest spending month: ${context.lowestMonth?.month} — SAR ${context.lowestMonth?.spend?.toLocaleString()}
- Monthly history (${context.monthlyHistory?.length} months, YYYY-MM format):
${(context.monthlyHistory || []).map((m) => `  ${m.month}: spent SAR ${m.spend?.toLocaleString()}, income SAR ${m.income?.toLocaleString()}`).join('\n')}` : ''

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
