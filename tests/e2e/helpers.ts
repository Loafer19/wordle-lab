import { chromium, type Page, type Browser, type BrowserContext } from 'playwright-core'
import dictFixture from './fixtures/dictionaryapi.json'
import wiktFixture from './fixtures/wiktionary.json'
export const BASE = process.env.BASE_URL ?? 'http://localhost:5173'
export const CHROME = process.env.CHROME ?? '/usr/bin/google-chrome-stable'
// Word definitions come from third-party APIs (api.dictionaryapi.dev, Wiktionary REST as fallback). Their outages and CORS
// failures used to fail unrelated tests via console errors, so every context answers them from a small fixture instead.
// Set E2E_LIVE_DICT=1 to hit the real services.
const fill = (j: unknown, word: string) => JSON.parse(JSON.stringify(j).replaceAll('{word}', word))
const cors = { 'access-control-allow-origin': '*' }
export async function mockDictionaries(ctx: BrowserContext) {
  if (process.env.E2E_LIVE_DICT) return
  await ctx.route(/^https:\/\/api\.dictionaryapi\.dev\/api\/v2\/entries\/en\//, r => r.fulfill({ json: fill(dictFixture, decodeURIComponent(r.request().url().split('/').pop()!)), headers: cors }))
  await ctx.route(/^https:\/\/en\.wiktionary\.org\/api\/rest_v1\/page\/definition\//, r => r.fulfill({ json: fill(wiktFixture, decodeURIComponent(r.request().url().split('/').pop()!)), headers: cors }))
}
export async function open(tab: string, opts: { reducedMotion?: 'reduce' | 'no-preference'; viewport?: { width: number; height: number }; lang?: 'en' | 'ua' } = {}): Promise<{ b: Browser; p: Page; errors: string[] }> {
  const b = await chromium.launch({ executablePath: CHROME })
  const ctx = await b.newContext({ viewport: opts.viewport ?? { width: 1300, height: 1000 }, reducedMotion: opts.reducedMotion ?? 'reduce' })
  await mockDictionaries(ctx)
  if (opts.lang) await ctx.addInitScript(l => localStorage.setItem('wl-lang', l), opts.lang)
  const p = await ctx.newPage(); const errors: string[] = []
  p.on('console', m => { if (['error', 'warning'].includes(m.type())) errors.push(m.text()) })
  p.on('pageerror', e => errors.push(e.message))
  await p.goto(`${BASE}/#tab=${tab}`); await p.reload(); await p.waitForTimeout(1500)
  return { b, p, errors }
}
export const tiles = (p: Page) => p.locator('button[data-tile]').evaluateAll(es => es.map(e => e.getAttribute('aria-label')!.split(': ')[1]))
export const alertText = async (p: Page) => ((await p.locator('[role=alert]').count()) ? await p.locator('[role=alert]').innerText() : '')
export const suggestion = async (p: Page) => (await p.locator('.text-display').first().innerText()).trim()
