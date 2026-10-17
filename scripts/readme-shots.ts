// README screenshots into docs/readme/ (run against a preview build so the footer shows the release version):
//   bun run build && bunx vite preview --port 4173 & BASE_URL=http://localhost:4173 bun scripts/readme-shots.ts
import { chromium, type Page } from 'playwright-core'
const BASE = process.env.BASE_URL ?? 'http://localhost:4173', CHROME = process.env.CHROME ?? '/usr/bin/google-chrome-stable', OUT = process.env.OUT ?? 'docs/readme'
const b = await chromium.launch({ executablePath: CHROME })
const DESK = { width: 1300, height: 1000 }, PHONE = { width: 390, height: 844 }
async function page(o: { lang?: 'en' | 'ua'; theme?: 'dark' | 'light'; vp?: { width: number; height: number }; motion?: boolean } = {}) {
  const ctx = await b.newContext({ viewport: o.vp ?? DESK, deviceScaleFactor: o.vp === PHONE ? 2 : 1, reducedMotion: o.motion ? 'no-preference' : 'reduce' })
  await ctx.addInitScript(([l, t]) => { localStorage.setItem('wl-lang', l); localStorage.setItem('vueuse-color-scheme', t) }, [o.lang ?? 'en', o.theme ?? 'dark'])
  const p = await ctx.newPage(); const errs: string[] = []
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()) })
  return { p, errs, close: () => ctx.close() }
}
const go = async (p: Page, tab: string, wait = 2200) => { await p.goto(`${BASE}/#tab=${tab}`); await p.reload(); await p.waitForTimeout(wait) }
// the share text links to the current origin; show the public site instead of localhost
const publicUrl = (p: Page) => p.evaluate(() => { const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); for (let n = w.nextNode(); n; n = w.nextNode()) n.nodeValue = n.nodeValue!.replace(/https?:\/\/localhost:\d+\/?/g, 'https://wordle.fundsflow.fun') })
const shot = async (p: Page, name: string, fullPage = true) => { await publicUrl(p); await p.screenshot({ path: `${OUT}/${name}.png`, fullPage }); console.log('✓', name) }
const type = async (p: Page, w: string) => { for (const c of w) await p.click(`[role=group] button[aria-label="${c}"]`); await p.keyboard.press('Enter') }
// today's daily answer, computed the way PlayView does
const daily = (p: Page, lang: string) => p.evaluate(async l => {
  const a = (await (await fetch((l === 'ua' ? '/ua/' : '/') + 'answers.txt')).text()).split(/\s+/).filter(Boolean)
  const d = Math.floor((Date.now() - new Date(2021, 5, 19).getTime()) / 864e5); return a[(d * 7919) % a.length]
}, lang)
const all: string[] = []
async function run(name: string, f: (p: Page) => Promise<void>, o: Parameters<typeof page>[0] = {}) {
  if (process.env.ONLY && !process.env.ONLY.split(',').includes(name)) return
  const { p, errs, close } = await page(o)
  try { await f(p) } catch (e) { console.log('✗', name, (e as Error).message.slice(0, 300)) }
  if (errs.length) all.push(`${name}: ${errs.join(' | ').slice(0, 300)}`)
  await close()
}

await run('hero + play-after', async p => {
  await go(p, 'play'); const ans = await daily(p, 'en')
  await type(p, ans === 'crane' ? 'slate' : 'crane'); await p.waitForTimeout(1800); await type(p, ans); await p.waitForTimeout(2800)
  await shot(p, 'hero', false)
  await p.waitForSelector('[data-play-coach] [data-coach-step]', { timeout: 30000 }); await p.waitForSelector('[data-play-optimal] [data-replay-step]', { timeout: 30000 }); await p.waitForTimeout(1500)
  await shot(p, 'play-after')
}, { motion: true, vp: { width: 1400, height: 900 } })
await run('leaderboard', async p => { await go(p, 'strategies&view=leaderboard'); await shot(p, 'leaderboard') })
await run('ua-leaderboard', async p => { await go(p, 'strategies&view=leaderboard'); await shot(p, 'ua-leaderboard') }, { lang: 'ua' })
await run('compare', async p => { await go(p, 'strategies&view=compare', 3000); await p.waitForSelector('[data-diffs]', { timeout: 30000 }); await p.waitForTimeout(800); await shot(p, 'dark-compare') })
await run('light-compare', async p => { await go(p, 'strategies&view=compare', 3000); await p.waitForSelector('[data-diffs]', { timeout: 30000 }); await p.waitForTimeout(800); await shot(p, 'light-compare') }, { theme: 'light' })
await run('lab', async p => { await go(p, 'strategies&view=lab', 4000); await p.waitForSelector('[data-lab-avg]'); await p.waitForTimeout(2500); await shot(p, 'dark-lab') })
await run('assist', async p => { await go(p, 'assistant&view=solve'); await shot(p, 'dark-assist') })
await run('review', async p => { await go(p, 'assistant&view=review'); await p.waitForSelector('[data-coach-step]', { timeout: 30000 }); await p.waitForTimeout(1000); await shot(p, 'review') })
await run('watch', async p => {
  await go(p, 'assistant&view=watch', 3000); await p.waitForSelector('[data-watch-review] [data-coach-step]', { timeout: 60000 })
  await p.click('[data-watch-all]'); await p.waitForSelector('[data-watch-all-list] li', { timeout: 30000 }); await p.waitForSelector('[data-watch-cancel]', { state: 'detached', timeout: 120000 }); await p.waitForTimeout(800)
  await shot(p, 'watch')
})
await run('openers', async p => { await go(p, 'learn&view=openers'); await shot(p, 'dark-openers') })
await run('light-patterns', async p => { await go(p, 'learn&view=inspector'); await shot(p, 'light-patterns') }, { theme: 'light' })
await run('tree', async p => { await go(p, 'explore&view=tree', 3000); await p.waitForSelector('canvas', { timeout: 20000 }); await p.waitForTimeout(1500); await shot(p, 'dark-tree') })
await run('tree-opener', async p => {
  await go(p, 'explore&view=tree', 3000); await p.waitForSelector('canvas', { timeout: 20000 })
  await p.fill('[data-tree-opener]', 'crane'); await p.click('[data-tree-opener-apply]'); await p.waitForSelector('[data-tree-stat-row=cus]', { timeout: 90000 }); await p.waitForTimeout(1500)
  await shot(p, 'tree-opener')
})
await run('flow', async p => { await go(p, 'explore&view=flow', 3000); await p.waitForTimeout(1500); await shot(p, 'dark-flow') })
await run('map', async p => { await go(p, 'explore&view=map', 3000); await p.waitForTimeout(1500); await shot(p, 'dark-map') })
await run('ua-play-mob', async p => {
  await go(p, 'play'); const ans = await daily(p, 'ua'); await type(p, ans === 'котра' ? 'сопло' : 'котра'); await p.waitForTimeout(2200); await shot(p, 'ua-play-mob', false)
}, { lang: 'ua', vp: PHONE })
await run('leaderboard-mob', async p => { await go(p, 'strategies&view=leaderboard'); await shot(p, 'leaderboard-mob', false) }, { vp: PHONE })
await run('tree-mob', async p => { await go(p, 'explore&view=tree', 3000); await shot(p, 'tree-mob', false) }, { vp: PHONE })
await b.close()
console.log(all.length ? 'console errors:\n' + all.join('\n') : 'no console errors')
