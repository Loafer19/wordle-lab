// Visual sweep: every tab/view, EN + UA, desktop + 390px. Reports console errors and horizontal overflow; optional screenshots.
import { chromium } from 'playwright-core'
const BASE = process.env.BASE_URL ?? 'http://localhost:5173', OUT = process.env.OUT, CHROME = process.env.CHROME ?? '/usr/bin/google-chrome-stable'
const VIEWS = ['play', 'assistant&view=solve', 'assistant&view=review', 'assistant&view=watch', 'learn&view=guide', 'learn&view=letters', 'learn&view=openers', 'learn&view=inspector', 'strategies&view=leaderboard', 'strategies&view=compare', 'strategies&view=lab', 'explore&view=tree', 'explore&view=flow', 'explore&view=map']
const b = await chromium.launch({ executablePath: CHROME })
let bad = 0
for (const lang of ['en', 'ua']) for (const [dev, vp] of [['desk', { width: 1300, height: 1000 }], ['mob', { width: 390, height: 844 }]] as const) {
  const ctx = await b.newContext({ viewport: vp, reducedMotion: 'reduce', deviceScaleFactor: dev === 'mob' ? 2 : 1 })
  await ctx.addInitScript(l => localStorage.setItem('wl-lang', l), lang)
  const p = await ctx.newPage(); const errs: string[] = []
  p.on('console', m => { if (['error', 'warning'].includes(m.type())) errs.push(m.text()) }); p.on('pageerror', e => errs.push(e.message))
  for (const v of VIEWS) {
    errs.length = 0
    await p.goto(`${BASE}/#tab=${v}`); await p.waitForTimeout(v.includes('lab') || v.includes('watch') ? 3500 : 2200)
    const sw = await p.evaluate(() => document.documentElement.scrollWidth)
    const over = sw > vp.width + 1
    if (over || errs.length) { bad++; console.log(`${lang} ${dev} ${v}: scrollWidth=${sw}${errs.length ? ' errors: ' + errs.join(' | ').slice(0, 400) : ''}`) }
    if (OUT) await p.screenshot({ path: `${OUT}/${v.replace('&view=', '-')}_${lang}_${dev}.png`, fullPage: dev === 'desk' })
  }
  await ctx.close()
}
await b.close()
console.log(bad ? `${bad} problem(s)` : 'all clean')
