import { chromium, type Page, type Browser } from 'playwright-core'
export const BASE = process.env.BASE_URL ?? 'http://localhost:5173'
export const CHROME = process.env.CHROME ?? '/usr/bin/google-chrome-stable'
export async function open(tab: string, opts: { reducedMotion?: 'reduce' | 'no-preference'; viewport?: { width: number; height: number } } = {}): Promise<{ b: Browser; p: Page; errors: string[] }> {
  const b = await chromium.launch({ executablePath: CHROME })
  const ctx = await b.newContext({ viewport: opts.viewport ?? { width: 1300, height: 1000 }, reducedMotion: opts.reducedMotion ?? 'reduce' })
  const p = await ctx.newPage(); const errors: string[] = []
  p.on('console', m => { if (['error', 'warning'].includes(m.type())) errors.push(m.text()) })
  p.on('pageerror', e => errors.push(e.message))
  await p.goto(`${BASE}/#tab=${tab}`); await p.reload(); await p.waitForTimeout(1500)
  return { b, p, errors }
}
export const tiles = (p: Page) => p.locator('button[data-tile]').evaluateAll(es => es.map(e => e.getAttribute('aria-label')!.split(': ')[1]))
export const alertText = async (p: Page) => ((await p.locator('[role=alert]').count()) ? await p.locator('[role=alert]').innerText() : '')
export const suggestion = async (p: Page) => (await p.locator('.text-display').first().innerText()).trim()
