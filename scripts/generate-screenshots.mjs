import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { mkdir, readFile } from 'node:fs/promises'
import path from 'node:path'

const ROOT = process.cwd()
const OUTPUT = path.join(ROOT, 'presentation', 'app-store')
const RAW = path.join(OUTPUT, 'screens')
const PORT = 4174
const BASE = `http://127.0.0.1:${PORT}`
const captures = [
  ['home', 'كل أموالك في مكان واحد'],
  ['budget', 'خطط لميزانيتك بوضوح'],
  ['copilot', 'اسأل منمّي'],
  ['goals', 'حوّل الادخار إلى تقدّم'],
  ['transactions', 'افهم مصروفاتك تلقائيًا'],
]

await mkdir(RAW, { recursive: true })
const server = spawn(process.execPath, [path.join(ROOT, 'node_modules/vite/bin/vite.js'), 'preview', '--host', '127.0.0.1', '--port', String(PORT)], { stdio: 'ignore' })

async function waitForServer() {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try { if ((await fetch(BASE)).ok) return } catch { /* server is starting */ }
    await new Promise((resolve) => setTimeout(resolve, 120))
  }
  throw new Error('Presentation server did not start')
}

try {
  await waitForServer()
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, locale: 'ar-SA', colorScheme: 'light' })
  await context.addInitScript(() => {
    localStorage.clear()
    localStorage.setItem('munami_locale', 'ar')
    localStorage.setItem('munami_theme', 'light')
    localStorage.setItem('munami_demo_onboarded', 'true')
  })
  const page = await context.newPage()
  const promoContext = await browser.newContext({ viewport: { width: 1290, height: 2796 }, deviceScaleFactor: 1, locale: 'ar-SA' })

  for (const [screen, caption] of captures) {
    await page.goto(`${BASE}/?demo=true&screen=${screen}`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(900)
    await page.screenshot({ path: path.join(RAW, `${screen}.png`) })
    const image = (await readFile(path.join(RAW, `${screen}.png`))).toString('base64')
    const promo = await promoContext.newPage()
    await promo.setContent(`<!doctype html><html dir="rtl"><style>
      *{box-sizing:border-box}body{margin:0;width:1290px;height:2796px;overflow:hidden;background:#FBF8F1;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#102235}
      main{height:100%;padding:190px 90px 0;text-align:center;background:radial-gradient(circle at 70% 18%,rgba(49,184,120,.10),transparent 27%),#FBF8F1}
      h1{margin:0 auto 125px;max-width:1050px;font-size:86px;line-height:1.25;font-weight:850;letter-spacing:0}.accent{display:block;width:90px;height:10px;margin:34px auto 0;background:#F46F5B;border-radius:9px}
      .phone{width:900px;margin:auto;padding:25px;background:#0b1726;border-radius:105px;box-shadow:0 70px 120px rgba(8,27,42,.24)}
      img{display:block;width:100%;border-radius:82px}
    </style><main><h1>${caption}<span class="accent"></span></h1><div class="phone"><img src="data:image/png;base64,${image}"></div></main></html>`)
    await promo.screenshot({ path: path.join(OUTPUT, `${screen}-promo.png`) })
    await promo.close()
  }
  await promoContext.close()
  await context.close()
  await browser.close()
  console.log(`Generated ${captures.length * 2} screenshots in ${OUTPUT}`)
} finally {
  server.kill('SIGTERM')
}
