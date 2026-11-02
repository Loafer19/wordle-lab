// Footer preview variants for issue #2: ?footer=a|b|c|d renders a candidate, no or an unknown value keeps the current footer.
import { test, expect } from 'bun:test'
import { open, BASE } from './helpers'

const REPO = 'https://github.com/Loafer19/wordle-lab'
for (const v of ['a', 'b', 'c', 'd'] as const) for (const lang of ['en', 'ua'] as const) test(`${lang}: footer variant ${v} renders with a release link and the GitHub link`, async () => {
  const { b, p, errors } = await open('play', { lang })
  try {
    await p.goto(`${BASE}/?footer=${v}#tab=play`); await p.waitForSelector(`[data-footer][data-footer-variant="${v}"]`)
    expect(await p.locator('[data-footer]').count()).toBe(1)
    expect(await p.locator('[data-footer] [data-version]').getAttribute('href')).toMatch(/releases\/tag\/v\d+\.\d+\.\d+$/)
    expect(await p.locator(`[data-footer] a[href="${REPO}"]`).count()).toBe(1)
    const text = (await p.locator('[data-footer]').innerText()).trim()
    if (lang === 'en') expect(text).not.toMatch(/\.$/) // UI copy has no trailing periods (the UA date ends in the locale abbreviation «р.»)
    if (v === 'a') expect(text.replace(/\s+/g, ' ')).toMatch(/^v\d+\.\d+\.\d+ · GitHub$/)
    if (v === 'b') expect(await p.locator('[data-footer] [data-updated]').innerText()).toMatch(lang === 'en' ? /^updated / : /^оновлено /)
    if (v === 'c') expect(text).toContain('@Loafer19')
    if (v === 'd') expect(await p.locator('[data-footer] a').count()).toBe(3)
    expect(errors).toEqual([])
  } finally { await b.close() }
}, 30000)

test('unknown ?footer value keeps the current footer', async () => {
  const { b, p, errors } = await open('play')
  try {
    await p.goto(`${BASE}/?footer=zzz#tab=play`); await p.waitForSelector('[data-footer]')
    expect(await p.locator('[data-footer]').getAttribute('data-footer-variant')).toBeNull()
    expect(await p.locator('[data-footer-left] > *').count()).toBe(3)
    expect(errors).toEqual([])
  } finally { await b.close() }
}, 30000)
