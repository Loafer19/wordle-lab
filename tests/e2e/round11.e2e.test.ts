// Round 11 (v1.4.0): 5-tab structure, mobile bottom bar + no overflow, leaderboard → compare, word inspector, watch a strategy,
// post-game optimal replay + share card with skill/luck, player fingerprint, tree/flow phone fallbacks.
import { test, expect } from 'bun:test'
import { open } from './helpers'
const SHOTS = process.env.SHOTS
const VIEWS = ['play', 'assistant&view=solve', 'assistant&view=review', 'assistant&view=watch', 'learn&view=guide', 'learn&view=letters', 'learn&view=openers', 'learn&view=inspector', 'strategies&view=leaderboard', 'strategies&view=compare', 'strategies&view=lab', 'explore&view=tree', 'explore&view=flow', 'explore&view=map']

for (const lang of ['en', 'ua'] as const) test(`${lang} 390px: bottom tab bar, no horizontal overflow on any view`, async () => {
  const { b, p, errors } = await open('play', { lang, viewport: { width: 390, height: 844 } })
  try {
    expect(await p.locator('[data-bottomnav]').isVisible()).toBe(true)
    expect(await p.locator('[data-topnav]').isVisible()).toBe(false)
    expect(await p.locator('[data-bottomnav] a').count()).toBe(6)
    const over: string[] = []
    for (const v of VIEWS) {
      await p.goto(p.url().split('#')[0] + '#tab=' + v); await p.waitForTimeout(1800)
      const sw = await p.evaluate(() => document.documentElement.scrollWidth)
      if (sw > 391) over.push(`${v}: ${sw}`)
    }
    expect(over).toEqual([])
    expect(errors).toEqual([])
  } finally { await b.close() }
}, 120000)

test('leaderboard: hard columns hidden by default, tick two rows → Compare, diffs capped at 15', async () => {
  const { b, p, errors } = await open('strategies&view=leaderboard')
  try {
    await p.waitForSelector('[data-board-row]')
    expect(await p.locator('[data-board-table] thead').innerText()).not.toContain('Hard avg')
    expect(await p.locator('[data-compare-open]').isDisabled()).toBe(true)
    await p.click('[data-board-row][data-id=optimal]'); await p.click('[data-board-row][data-id=random]')
    expect(await p.locator('[data-compare-open]').isDisabled()).toBe(false)
    await p.click('[data-compare-open]'); await p.waitForTimeout(1500)
    expect(await p.evaluate(() => location.hash)).toBe('#tab=strategies&view=compare')
    const k = await p.locator('[data-compare-kpis]').innerText()
    expect(k).toContain('Optimal tree'); expect(k).toContain('Random')
    expect(await p.locator('[data-diffs] tbody tr').count()).toBe(15)
    await p.click('[data-diffs-all]'); await p.waitForTimeout(300)
    expect(await p.locator('[data-diffs] tbody tr').count()).toBeGreaterThan(15)
    expect(errors).toEqual([])
  } finally { await b.close() }
}, 60000)

test('Learn: clicking an opener opens it in the Word inspector; one entropy explainer', async () => {
  const { b, p, errors } = await open('learn&view=openers')
  try {
    expect(await p.locator('text=What the numbers mean').count()).toBe(0)
    await p.locator('[data-opener-row]', { hasText: 'crane' }).click(); await p.waitForTimeout(1200)
    expect(await p.evaluate(() => location.hash)).toBe('#tab=learn&view=inspector')
    expect(await p.inputValue('[data-inspector-word] input')).toBe('crane')
    expect(await p.locator('[data-inspector-h]').innerText()).toMatch(/H =\s*5\.\d\d\s*bits/)
    expect(await p.locator('[data-entropy-explainer]').count()).toBe(1)
    expect(errors).toEqual([])
  } finally { await b.close() }
}, 60000)

test('Learn guide: four steps linking to letters → inspector → openers → tree', async () => {
  const { b, p, errors } = await open('learn')
  try {
    expect(await p.evaluate(() => location.hash)).toBe('#tab=learn&view=guide')
    expect(await p.locator('[data-guide-step]').count()).toBe(4)
    expect(await p.locator('[data-guide-step] a').evaluateAll(a => a.map(x => x.getAttribute('href')))).toEqual(['#tab=learn&view=letters', '#tab=learn&view=inspector', '#tab=learn&view=openers', '#tab=explore&view=tree'])
    expect(errors).toEqual([])
  } finally { await b.close() }
}, 30000)

for (const lang of ['en', 'ua'] as const) test(`${lang}: Assistant › Watch a strategy plays the word with the shared per-guess card`, async () => {
  const { b, p, errors } = await open('assistant&view=watch', { lang })
  try {
    await p.waitForSelector('[data-replay-step]', { timeout: 20000 })
    await p.waitForSelector('[data-coach-step]', { timeout: 30000 })
    expect(await p.locator('[data-coach-step]').count()).toBe(await p.locator('[data-replay-step]').count())
    expect(await p.locator('[data-step-note]').count()).toBeGreaterThan(0)
    expect(await p.locator('.p-autocomplete-empty-message').count()).toBe(0); expect(await p.getByText('No results found').count()).toBe(0)
    if (SHOTS) await p.screenshot({ path: `${SHOTS}/${lang}-watch.png`, fullPage: true })
    expect(errors).toEqual([])
  } finally { await b.close() }
}, 60000)

for (const lang of ['en', 'ua'] as const) test(`${lang}: after a game — optimal replay, share card with skill + luck, fingerprint saved`, async () => {
  const { b, p, errors } = await open('play', { lang })
  try {
    expect(await p.locator('[data-fingerprint-empty]').count()).toBe(1)
    await p.click(lang === 'en' ? 'text=Random' : 'text=Випадкове'); await p.waitForTimeout(400)
    const ws = lang === 'en' ? ['crane', 'pilot', 'dumpy', 'shown', 'fight', 'vegas'] : ['котра', 'сопло', 'масло', 'весло', 'кошик', 'ліжко']
    for (const w of ws) { if (await p.locator('[data-play-coach]').count()) break; for (const c of w) await p.click(`[role=group] button[aria-label="${c}"]`); await p.keyboard.press('Enter'); await p.waitForTimeout(1800) }
    await p.waitForSelector('[data-play-coach] [data-coach-step]', { timeout: 30000 })
    await p.waitForSelector('[data-play-optimal] [data-replay-step]', { timeout: 30000 }); await p.waitForTimeout(800)
    const share = await p.locator('[data-share-text]').innerText()
    expect(share).toMatch(lang === 'en' ? /Skill \d+% · Luck [+−]\d\.\d bits · Optimal \d/ : /Майстерність \d+% · Удача [+−]\d\.\d біт · Оптимум \d/)
    const hist = await p.evaluate(l => JSON.parse(localStorage.getItem('wl-history-' + l) ?? '[]'), lang)
    expect(hist.length).toBe(1); expect(hist[0].skill).toBeGreaterThan(0)
    expect(await p.locator('[data-fingerprint] [data-stat]').count()).toBe(4)
    if (SHOTS) await p.screenshot({ path: `${SHOTS}/${lang}-play-after.png`, fullPage: true })
    expect(errors).toEqual([])
  } finally { await b.close() }
}, 90000)

test('phone fallbacks: tree as an accordion list, flow as a list', async () => {
  const { b, p, errors } = await open('explore&view=tree', { viewport: { width: 390, height: 844 } })
  try {
    await p.waitForSelector('[data-tree-list] [data-tree-branch]', { timeout: 20000 })
    const before = await p.locator('[data-tree-branch]').count()
    await p.locator('[data-tree-branch] [data-tree-branch] button').first().click(); await p.waitForTimeout(300)
    expect(await p.locator('[data-tree-branch]').count()).toBeGreaterThan(before)
    await p.goto(p.url().split('#')[0] + '#tab=explore&view=flow'); await p.waitForTimeout(1800)
    expect(await p.locator('[data-flow-list]').innerText()).toContain('Guess 1')
    expect(errors).toEqual([])
  } finally { await b.close() }
}, 60000)

test('Answer map: hover hint is muted text, not a heading', async () => {
  const { b, p, errors } = await open('explore&view=map')
  try {
    const hint = p.locator('[data-map-hint]')
    expect(await hint.innerText()).toBe('Hover or tap a cell to see the word')
    expect(await hint.evaluate(e => e.tagName)).toBe('SPAN')
    expect(errors).toEqual([])
  } finally { await b.close() }
}, 30000)
