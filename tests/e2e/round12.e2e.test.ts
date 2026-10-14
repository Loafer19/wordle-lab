// Round 12 (v1.4.1): share card as PNG (download + share fallback), Watch "Compute all" incl. two-step entropy off the main thread, side-by-side replay.
import { test, expect } from 'bun:test'
import { open } from './helpers'
const SHOTS = process.env.SHOTS

for (const lang of ['en', 'ua'] as const) for (const theme of ['dark', 'light'] as const) test(`${lang} ${theme}: share card downloads as a PNG`, async () => {
  const { b, p, errors } = await open('play', { lang })
  try {
    await p.evaluate(t => localStorage.setItem('vueuse-color-scheme', t), theme); await p.reload(); await p.waitForTimeout(1200)
    await p.click(lang === 'en' ? 'text=Random' : 'text=Випадкове'); await p.waitForTimeout(400)
    const ws = lang === 'en' ? ['crane', 'pilot', 'dumpy', 'shown', 'fight', 'vegas'] : ['котра', 'сопло', 'масло', 'весло', 'кошик', 'ліжко']
    for (const w of ws) { if (await p.locator('[data-share-png]').count()) break; for (const c of w) await p.click(`[role=group] button[aria-label="${c}"]`); await p.keyboard.press('Enter'); await p.waitForTimeout(1800) }
    await p.waitForSelector('[data-play-coach] [data-coach-step]', { timeout: 30000 }); await p.waitForTimeout(800)
    const [dl] = await Promise.all([p.waitForEvent('download'), p.click('[data-share-png]')])
    expect(dl.suggestedFilename()).toMatch(/^wordle-lab-random\.png$/)
    const buf = await (await import('node:fs/promises')).readFile((await dl.path())!)
    expect([...buf.subarray(1, 4)].map(c => String.fromCharCode(c)).join('')).toBe('PNG')
    expect(buf.readUInt32BE(16)).toBe(1200) // 600 css px × 2
    // background pixel matches the theme
    const px = await p.evaluate(async b64 => { const i = new Image(); i.src = 'data:image/png;base64,' + b64; await i.decode(); const c = document.createElement('canvas'); c.width = i.width; c.height = i.height; const g = c.getContext('2d')!; g.drawImage(i, 0, 0); return [...g.getImageData(600, 30, 1, 1).data] }, buf.toString('base64'))
    if (theme === 'dark') expect(px[0]).toBeLessThan(60); else expect(px[0]).toBeGreaterThan(200)
    if (SHOTS && theme === 'dark') await (await import('node:fs/promises')).writeFile(`${SHOTS}/${lang}-share-card.png`, buf)
    expect(errors).toEqual([])
  } finally { await b.close() }
}, 90000)

for (const lang of ['en', 'ua'] as const) test(`${lang}: Watch — Compute all includes two-step entropy, UI stays responsive, side-by-side replay`, async () => {
  const { b, p, errors } = await open('assistant&view=watch', { lang })
  try {
    await p.waitForSelector('[data-replay-step]', { timeout: 20000 })
    await p.click('[data-watch-all]')
    // main thread is not blocked while it runs
    const t0 = Date.now(); await p.evaluate(() => 1); expect(Date.now() - t0).toBeLessThan(1500)
    await p.waitForSelector('[data-watch-all]', { timeout: 60000 })
    expect(await p.locator('[data-watch-all-list] [data-id="entropy2-all"]').count()).toBe(1)
    expect(await p.locator('[data-watch-all-list] [data-src=sim]').count()).toBeGreaterThan(5)
    expect(await p.locator('[data-watch-cancelled]').count()).toBe(0)
    // cancel: restart and cancel at once
    await p.click('[data-watch-all]')
    if (await p.locator('[data-watch-cancel]').count()) { await p.click('[data-watch-cancel]'); expect(await p.locator('[data-watch-all]').count()).toBe(1) }
    // second strategy side by side
    await p.click('[data-watch-strategy-b]'); await p.locator('.p-select-option').nth(1).click()
    await p.waitForSelector('[data-watch-replay-b] [data-replay-step]', { timeout: 20000 })
    expect(await p.locator('[data-replay]').count()).toBe(2)
    if (SHOTS) await p.screenshot({ path: `${SHOTS}/${lang}-watch-all.png`, fullPage: true })
    expect(errors).toEqual([])
  } finally { await b.close() }
}, 120000)
