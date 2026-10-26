// v1.5: leaderboard grouped by type with one-line descriptions, head-to-head Compare panel, Strategies › Lookahead page.
import { test, expect } from 'bun:test'
import { open } from './helpers'

for (const lang of ['en', 'ua'] as const) test(`${lang}: leaderboard groups, lookahead rows, head-to-head compare`, async () => {
  const { b, p, errors } = await open('strategies&view=leaderboard', { lang })
  try {
    await p.waitForSelector('[data-board-row][data-id=lookahead-b]')
    expect(await p.locator('[data-board-group]').evaluateAll(es => es.map(e => e.getAttribute('data-board-group')))).toEqual(['optimal', 'lookahead', 'greedy', 'human', 'baseline'])
    expect(await p.locator('[data-board-group=lookahead] [data-board-row]').evaluateAll(es => es.map(e => e.getAttribute('data-id')))).toContain('lookahead-a')
    expect(await p.locator('[data-board-row][data-id=lookahead-b]').innerText()).toContain('+0.000')
    expect(await p.locator('[data-board-row][data-id=hybrid-all] [data-board-blurb]').innerText()).toContain(lang === 'en' ? '20 × entropy' : '20 × ентропія')
    await p.click('[data-board-row][data-id=lookahead-a] input'); await p.click('[data-board-row][data-id=lookahead-b] input'); await p.click('[data-compare-open]')
    await p.waitForSelector('[data-compare-wdl]', { timeout: 15000 })
    const a = await p.locator('[data-compare-side=A]').innerText(), bb = await p.locator('[data-compare-side=B]').innerText()
    expect(a).toContain(lang === 'en' ? 'Lookahead 2-ply safe' : 'Погляд на 2 ходи, надійний'); expect(a).toContain(lang === 'en' ? 'SALET' : 'КОТРА')
    expect(bb).toContain(lang === 'en' ? '3.421' : '3.381')
    const pcts = await p.locator('[data-wdl]').allInnerTexts(); expect(pcts.length).toBe(3); for (const x of pcts) expect(x).toMatch(/\d+%/)
    expect(await p.locator('[data-compare-delta]').innerText()).toContain('B')
    expect(errors).toEqual([])
  } finally { await b.close() }
}, 60000)

for (const lang of ['en', 'ua'] as const) test(`${lang}: Strategies › Lookahead page`, async () => {
  const { b, p, errors } = await open('strategies&view=lookahead', { lang })
  try {
    await p.waitForSelector('[data-lookahead-table] [data-id=lookahead-b]', { timeout: 15000 })
    expect(await p.locator('[data-lookahead-table] [data-id=lookahead-b]').innerText()).toContain(lang === 'en' ? '7920' : '5805')
    expect(await p.locator('[data-lookahead-openers]').innerText()).toContain('8039')
    expect(await p.locator('[data-lookahead-cap] tbody tr').count()).toBe(11)
    await p.click('[data-lookahead-compare]'); await p.waitForTimeout(800)
    expect(await p.evaluate(() => location.hash)).toBe('#tab=strategies&view=compare')
    expect(errors).toEqual([])
  } finally { await b.close() }
}, 60000)
