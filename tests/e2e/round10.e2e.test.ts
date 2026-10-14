// Round 10 (v1.3.0): coach mode (Play + Coach tab, EN/UA), UA optimal-tree explanation, UA gaps vs the UA optimum, UA hard tree.
import { test, expect } from 'bun:test'
import { open, suggestion } from './helpers'
const SHOTS = process.env.SHOTS
async function pickStrategy(p: any, name: string) { await p.click('[role=combobox]'); await p.click(`li:has-text("${name}")`); await p.waitForTimeout(600) }
const waitCoach = (p: any) => p.waitForSelector('[data-coach-step]', { timeout: 20000 })

for (const lang of ['en', 'ua'] as const) {
  test(`${lang}: Coach tab analyses a pasted game`, async () => {
    const { b, p, errors } = await open('coach', { lang })
    try {
      const game = lang === 'en' ? 'ARISE(⬜⬜⬜🟨⬜) CLOTH(⬜⬜🟩🟨⬜)' : 'КОТРА(⬜🟨⬜⬜⬜) СОПЛО(🟩🟨⬜🟨🟩) СЛОВО(🟩🟩🟩🟩🟩)'
      await p.fill('[data-coach-text]', game); await p.click('[data-coach-run]')
      await waitCoach(p); await p.waitForTimeout(500)
      expect(await p.locator('[data-coach-step]').count()).toBe(lang === 'en' ? 2 : 3)
      const txt = await p.locator('[data-coach]').innerText()
      if (lang === 'en') { expect(txt).toContain('2315 → 80'); expect(txt).toContain('SOARE'); expect(txt).toContain('Best by entropy') }
      else { expect(txt).toContain('1717 →'); expect(txt).toContain('КОТРА'); expect(txt).toContain('Найкраще за ентропією'); expect(txt).toContain('Розгадано за 3'); expect(txt).not.toMatch(/\b(lucky|unlucky|bits|Best by entropy)\b/) }
      expect(await p.locator('[data-coach-tree]').count()).toBeGreaterThan(0)
      if (SHOTS) await p.screenshot({ path: `${SHOTS}/${lang}-coach-tab.png`, fullPage: true })
      expect(errors).toEqual([])
    } finally { await b.close() }
  }, 60000)

  test(`${lang}: finished Play game (free mode) shows the coach report`, async () => {
    const { b, p, errors } = await open('play', { lang })
    try {
      await p.click(lang === 'en' ? 'text=Random' : 'text=Випадкове')
      await p.waitForTimeout(400)
      // play six words; the game ends either way
      const ws = lang === 'en' ? ['crane', 'pilot', 'dumpy', 'shown', 'fight', 'vegas'] : ['котра', 'сопло', 'масло', 'весло', 'кошик', 'ліжко']
      for (const w of ws) { if (await p.locator('[data-play-coach]').count()) break; for (const c of w) await p.click(`[role=group] button[aria-label="${c}"]`); await p.keyboard.press('Enter'); await p.waitForTimeout(1800) } // on-screen keys: Cyrillic can't be typed via CDP keydown
      await waitCoach(p); await p.waitForTimeout(800)
      expect(await p.locator('[data-play-coach] [data-coach-step]').count()).toBeGreaterThan(0)
      if (SHOTS) await p.locator('[data-play-coach]').screenshot({ path: `${SHOTS}/${lang}-play-coach.png` })
      expect(errors).toEqual([])
    } finally { await b.close() }
  }, 60000)
}

test('mobile: Coach tab fits a 390px screen', async () => {
  const { b, p, errors } = await open('coach', { viewport: { width: 390, height: 844 } })
  try {
    await p.click('[data-coach-run]'); await waitCoach(p); await p.waitForTimeout(500)
    expect(await p.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(392)
    if (SHOTS) await p.screenshot({ path: `${SHOTS}/en-coach-mobile.png`, fullPage: true })
    expect(errors).toEqual([])
  } finally { await b.close() }
}, 60000)

test('UA Solver: optimal tree opener shows the tree explanation, not the precomputed text', async () => {
  const { b, p, errors } = await open('solver', { lang: 'ua' })
  try {
    await pickStrategy(p, 'Оптимальне дерево (UA)')
    await p.waitForTimeout(800)
    expect(await suggestion(p)).toBe('КОТРА')
    const txt = await p.locator('main').innerText()
    expect(txt).toContain('Перший хід оптимального дерева рішень')
    expect(txt).toContain('3.3809')
    expect(txt).not.toContain('(попередньо обчислено)')
    if (SHOTS) await p.screenshot({ path: `${SHOTS}/ua-solver-optimal-explained.png` })
    await pickStrategy(p, 'Оптимальне дерево (UA, складний)')
    expect(await suggestion(p)).toBe('КАРСТ')
    expect(errors).toEqual([])
  } finally { await b.close() }
}, 30000)

test('EN Solver: SALET tree opener shows the tree explanation', async () => {
  const { b, p, errors } = await open('solver')
  try {
    await pickStrategy(p, 'Optimal tree (SALET)')
    expect(await suggestion(p)).toBe('SALET')
    expect(await p.locator('main').innerText()).toContain('Opening move of the optimal decision tree')
    expect(errors).toEqual([])
  } finally { await b.close() }
}, 30000)

for (const lang of ['en', 'ua'] as const) test(`${lang}: gap table uses this language's optimum, no negative gaps`, async () => {
  const { b, p, errors } = await open('strategies&view=leaderboard', { lang })
  try {
    await p.waitForTimeout(1500)
    const txt = await p.locator('main').innerText()
    expect(txt).toContain(lang === 'en' ? '3.4212' : '3.3809')
    if (lang === 'ua') { expect(txt).not.toContain('3.4212'); expect(txt).toContain('3.4537') }
    await p.click('[data-board-mode] >> text=' + (lang === 'en' ? 'Both' : 'Обидва')); await p.waitForTimeout(300)
    expect(await p.locator('[data-board-table] thead').innerText()).toContain(lang === 'en' ? 'Hard avg' : 'складний')
    expect(txt).not.toMatch(/\+-\d|−0\.\d{3}|\s-0\.\d{3}/)
    const optRow = await p.locator('[data-board-row][data-id=optimal]').innerText()
    expect(optRow).toContain('+0.000')
    if (SHOTS) await p.screenshot({ path: `${SHOTS}/${lang}-gap.png` })
    expect(errors).toEqual([])
  } finally { await b.close() }
}, 30000)
