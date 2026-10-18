// Round 15: Community tab (EN/UA, desktop + phone) — sections, external links open in a new tab with rel=noopener, notable words link to Watch.
import { test, expect } from 'bun:test'
import { open } from './helpers'

for (const lang of ['en', 'ua'] as const) for (const phone of [false, true]) test(`${lang}${phone ? ' phone' : ''}: Community tab renders, links are safe, notable words open Watch`, async () => {
  const { b, p, errors } = await open('community', { lang, ...(phone ? { viewport: { width: 390, height: 844 } } : {}) })
  try {
    await p.waitForSelector('[data-community]')
    const nav = phone ? '[data-bottomnav] [data-tab="community"]' : '[data-topnav] [data-tab="community"]'
    expect((await p.locator(nav).innerText()).trim()).toBe(lang === 'en' ? 'Community' : 'Спільнота')
    expect(await p.locator(nav).getAttribute('aria-current')).toBe('page')
    for (const s of ['competitive', 'stories', 'discord', 'lab']) expect(await p.locator(`[data-community-section="${s}"]`).count()).toBe(1)
    const links = await p.locator('[data-community] a[target]').evaluateAll(as => as.map(a => ({ href: a.getAttribute('href')!, target: a.getAttribute('target'), rel: a.getAttribute('rel') ?? '' })))
    expect(links.length).toBeGreaterThanOrEqual(12)
    for (const l of links) { expect(l.href).toMatch(/^https:\/\//); expect(l.target).toBe('_blank'); expect(l.rel).toContain('noopener') }
    for (const u of ['worldwardle.com', 'wordledash.io', 'wordleunlimited.me/arena', 'v68zYyaEmEA', 'fRed0Xmc2Wg', '9WLOnz7k9pI', '_-AfhLQfb6w', 'sonorouschocolate.com', 'nytco.com', 'discord.gg/']) expect(links.some(l => l.href.includes(u))).toBe(true)
    await p.waitForSelector('[data-notable="hardest"] li', { timeout: 15000 })
    expect(await p.locator('[data-notable="hardest"] li').count()).toBeGreaterThanOrEqual(10)
    expect(await p.locator('[data-notable="families"] li').count()).toBeGreaterThanOrEqual(4)
    expect(await p.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(phone ? 391 : 1301)
    const w = (await p.locator('[data-notable="hardest"] li .font-mono').first().innerText()).trim().toLowerCase()
    await p.locator('[data-notable-watch]').first().click(); await p.waitForTimeout(2500)
    expect(p.url()).toContain('#tab=assistant&view=watch')
    expect((await p.inputValue('[data-watch-word] input, input[data-watch-word]')).toLowerCase()).toBe(w)
    expect(errors).toEqual([])
  } finally { await b.close() }
}, 60000)
