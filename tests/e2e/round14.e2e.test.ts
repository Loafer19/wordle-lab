// Round 14: the review's "Result" tile (text, not a number) is never cut off — EN/UA, desktop/1400/390px, solved and not solved.
import { test, expect } from 'bun:test'
import { open } from './helpers'
import type { Page } from 'playwright-core'
const fits = (p: Page) => p.locator('[data-stat-text]').evaluateAll(es => es.map(e => ({ t: (e as HTMLElement).innerText, ok: e.scrollWidth <= e.clientWidth + 1 && e.getBoundingClientRect().right <= e.parentElement!.getBoundingClientRect().right + 1 })))
const games = { en: { solved: ['ARISE(⬜⬜⬜🟨⬜) CLOTH(⬜⬜🟩🟨⬜) STOUT(🟩🟩🟩🟩🟩)', 'Solved in 3'], lost: ['ARISE(⬜⬜⬜🟨⬜)', 'Not solved'] },
  ua: { solved: ['КОТРА(⬜🟨⬜⬜⬜) СОПЛО(🟩🟨⬜🟨🟩) СЛОВО(🟩🟩🟩🟩🟩)', 'Розгадано за 3'], lost: ['КОТРА(⬜🟨⬜⬜⬜)', 'Не розгадано'] } }

for (const lang of ['en', 'ua'] as const) for (const vp of [{ width: 1300, height: 1000 }, { width: 390, height: 844 }]) for (const k of ['solved', 'lost'] as const)
  test(`${lang} ${vp.width}px: review Result tile fits (${k})`, async () => {
    const { b, p, errors } = await open('assistant&view=review', { lang, viewport: vp })
    try {
      const [game, want] = games[lang][k]
      await p.fill('[data-coach-text]', game); await p.click('[data-coach-run]')
      await p.waitForFunction(w => [...document.querySelectorAll('[data-stat-text]')].some(e => (e as HTMLElement).innerText.trim() === w), want, { timeout: 20000 })
      const r = await fits(p)
      expect(r.map(x => x.t.trim())).toContain(want); expect(r.every(x => x.ok)).toBe(true)
      expect(errors).toEqual([])
    } finally { await b.close() }
  }, 60000)

for (const lang of ['en', 'ua'] as const) for (const vp of [{ width: 1400, height: 900 }, { width: 390, height: 844 }]) test(`${lang} ${vp.width}px: Play — "Your game, reviewed" Result tile fits`, async () => {
  const { b, p, errors } = await open('play', { lang, viewport: vp })
  try {
    await p.click(lang === 'en' ? 'text=Random' : 'text=Випадкове'); await p.waitForTimeout(400)
    const ws = lang === 'en' ? ['crane', 'pilot', 'dumpy', 'shown', 'fight', 'vegas'] : ['котра', 'сопло', 'масло', 'весло', 'кошик', 'ліжко']
    for (const w of ws) { if (await p.locator('[data-play-coach]').count()) break; for (const c of w) await p.click(`[role=group] button[aria-label="${c}"]`); await p.keyboard.press('Enter'); await p.waitForTimeout(1800) }
    await p.waitForSelector('[data-play-coach] [data-stat-text]', { timeout: 30000 })
    const r = await fits(p)
    expect(r.length).toBeGreaterThan(0); expect(r.every(x => x.ok)).toBe(true)
    expect(r[0].t).toMatch(lang === 'en' ? /^(Solved in \d|Not solved)$/ : /^(Розгадано за \d|Не розгадано)$/)
    expect(errors.filter(e => !/status of 404/.test(e))).toEqual([]) // a random answer may have no dictionary entry (404 from the definitions API)
  } finally { await b.close() }
}, 90000)
