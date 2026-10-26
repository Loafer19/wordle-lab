// Learn › Small groups in your head: deep link, worked example rendered from the engine's colours, guide link.
import { test, expect } from 'bun:test'
import { open } from './helpers'

for (const lang of ['en', 'ua'] as const) test(`${lang}: Small groups lesson`, async () => {
  const { b, p, errors } = await open('learn&view=small-groups', { lang })
  const [trap, scout] = lang === 'en' ? ['match', 'plumb'] : ['маска', 'створ']
  try {
    await p.waitForSelector('[data-lesson-small-groups] [data-lesson-group]')
    expect(await p.evaluate(() => location.hash)).toBe('#tab=learn&view=small-groups')
    expect(await p.locator('[data-lesson-group]').count()).toBe(2) // trap: itself + the other five
    expect(await p.locator('[data-lesson-group]').evaluateAll(es => es.map(e => e.getAttribute('data-size')))).toEqual(['1', '5'])
    await p.click(`[data-lesson-guess="${scout}"]`)
    expect(await p.locator('[data-lesson-group]').evaluateAll(es => es.map(e => e.getAttribute('data-size')))).toEqual(['1', '1', '1', '1', '2'])
    expect(await p.locator('[data-lesson-singletons]').innerText()).toContain('4')
    if (lang === 'en') expect(await p.locator('[data-lesson-pattern]').evaluateAll(es => es.map(e => e.getAttribute('aria-label')))).toEqual(['20000', '01000', '00010', '00001', '00000'])
    await p.waitForSelector('[data-lesson-best]')
    expect(await p.locator('[data-lesson-best]').innerText()).toContain(lang === 'en' ? 'PLUMB' : 'СТВОР')
    expect(await p.locator('[data-lesson-result]').innerText()).toContain('3.450')
    expect(await p.locator('[data-lesson-result]').innerText()).toContain('3.434')
    await p.fill('[data-lesson-input]', trap); await p.press('[data-lesson-input]', 'Enter')
    expect(await p.locator('[data-lesson-group]').count()).toBe(2)
    expect(await p.locator('[data-lesson-small-groups]').innerText()).toContain(lang === 'en' ? 'How to play Small groups in your head' : 'Як грати «Малими групами» в голові')
    await p.goto(p.url().replace(/#.*/, '#tab=learn&view=guide')); await p.waitForSelector('[data-guide-small-groups]')
    expect(await p.locator('[data-guide-small-groups]').getAttribute('href')).toBe('#tab=learn&view=small-groups')
    expect(errors).toEqual([])
  } finally { await b.close() }
}, 60000)
