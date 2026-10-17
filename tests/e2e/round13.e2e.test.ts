// Round 13: Play card order by game phase (EN/UA, desktop + phone), Tree › custom opener (validation, worker build, stats, persistence, reset), card order in Watch / Lab / Compare / Top openers.
import { test, expect } from 'bun:test'
import { open, BASE } from './helpers'
import type { Page } from 'playwright-core'
const y = async (p: Page, sel: string) => (await p.locator(sel).first().boundingBox())!.y
const nav = async (p: Page, tab: string) => { await p.goto(`${BASE}/#tab=${tab}`); await p.reload(); await p.waitForTimeout(1000) }
const type = async (p: Page, w: string) => { for (const c of w) await p.click(`[role=group] button[aria-label="${c}"]`); await p.keyboard.press('Enter'); await p.waitForTimeout(1800) }

for (const lang of ['en', 'ua'] as const) for (const phone of [false, true]) test(`${lang}${phone ? ' phone' : ''}: Play — possible words + info per guess appear after the first guess, above the stats`, async () => {
  const { b, p, errors } = await open('play', { lang, ...(phone ? { viewport: { width: 390, height: 844 } } : {}) })
  try {
    await p.click(lang === 'en' ? 'text=Random' : 'text=Випадкове'); await p.waitForTimeout(400)
    expect(await p.locator('[data-phase]').getAttribute('data-phase')).toBe('idle')
    expect(await p.locator('[data-candidates]').count()).toBe(0)
    expect(await y(p, '[data-play-stats]')).toBeLessThan(await y(p, '[data-fingerprint]'))
    await type(p, lang === 'en' ? 'crane' : 'котра')
    if ((await p.locator('[data-phase]').getAttribute('data-phase')) === 'over') return // solved in one: nothing to order
    expect(await p.locator('[data-phase]').getAttribute('data-phase')).toBe('playing')
    const cand = await y(p, '[data-candidates]'), bits = await y(p, 'text=' + (lang === 'en' ? 'Information per guess' : 'Інформація за спробу')), stats = await y(p, '[data-play-stats]')
    expect(cand).toBeLessThan(bits); expect(bits).toBeLessThan(stats)
    if (phone) expect(await y(p, '[role=group] button[aria-label="a"], [role=group] button[aria-label="а"]')).toBeLessThan(cand) // board + keyboard first
    expect(errors).toEqual([])
  } finally { await b.close() }
}, 60000)

for (const lang of ['en', 'ua'] as const) test(`${lang}: Tree — custom starting word (validated, built in a worker, compared, persisted, reset)`, async () => {
  const [def, mine, latin, bogus] = lang === 'en' ? ['SALET', 'crane', 'котра', 'xxxxx'] : ['КОТРА', 'слово', 'crane', 'ааааа']
  const { b, p, errors } = await open('explore&view=tree', { lang })
  try {
    await p.waitForSelector('canvas', { timeout: 20000 })
    expect(await p.locator('main').innerText()).toContain(def)
    await p.fill('[data-tree-opener]', bogus); expect(await p.locator('[data-tree-opener-error]').innerText()).toContain(bogus.toUpperCase())
    await p.fill('[data-tree-opener]', latin); expect(await p.locator('[data-tree-opener-error]').count()).toBe(1)
    await p.fill('[data-tree-opener]', 'abc'); expect(await p.locator('[data-tree-opener-error]').count()).toBe(1)
    await p.fill('[data-tree-opener]', mine); expect(await p.locator('[data-tree-opener-error]').count()).toBe(0)
    await p.click('[data-tree-opener-apply]')
    await p.waitForSelector('[data-tree-stat-row=cus]', { timeout: 60000 })
    expect(await p.locator('[data-tree-stat-row=def]').innerText()).toContain(def)
    expect(await p.locator('[data-tree-stat-row=cus]').innerText()).toContain(mine.toUpperCase())
    expect(await p.locator('main').innerText()).toContain(mine.toUpperCase())
    await p.reload(); await p.waitForSelector('[data-tree-stat-row=cus]', { timeout: 60000 }) // persisted in localStorage
    expect(await p.inputValue('[data-tree-opener]')).toBe(mine.toUpperCase())
    await p.click('[data-tree-opener-reset]'); await p.waitForTimeout(500)
    expect(await p.locator('[data-tree-opener-stats]').count()).toBe(0)
    expect(await p.locator('main').innerText()).toContain(def)
    expect(await p.evaluate(l => localStorage.getItem('wl-tree-opener-' + l), lang)).toBe('')
    expect(errors).toEqual([])
  } finally { await b.close() }
}, 120000)

for (const lang of ['en', 'ua'] as const) test(`${lang}: card order — Watch all-strategies above the review, Lab save under the builder, Compare differences above the chart, Top openers table above the chart`, async () => {
  const { b, p, errors } = await open('assistant&view=watch', { lang })
  try {
    await p.waitForSelector('[data-watch-review]', { timeout: 60000 })
    expect(await y(p, '[data-watch-all]')).toBeLessThan(await y(p, '[data-watch-review]'))
    await nav(p, 'strategies&view=lab'); await p.waitForSelector('[data-lab-save-card]', { timeout: 20000 })
    const lab = await y(p, '[data-lab]'), save = await y(p, '[data-lab-save-card]'), kpis = await y(p, '[data-lab-kpis]')
    expect(lab).toBeLessThan(save); expect(save).toBeLessThan(kpis)
    await nav(p, 'strategies&view=compare'); await p.waitForSelector('[data-diffs]', { timeout: 30000 })
    expect(await y(p, '[data-compare-diffs-card]')).toBeLessThan(await y(p, '[data-compare-dist]'))
    await nav(p, 'learn&view=openers'); await p.waitForSelector('[data-opener-row]', { timeout: 20000 })
    expect(await y(p, '[data-openers-table]')).toBeLessThan(await y(p, '[data-openers-chart]'))
    expect(errors).toEqual([])
  } finally { await b.close() }
}, 120000)
