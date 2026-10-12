// Navigation (real links, deep links, legacy redirects), daily countdown, settings, and a playable Ukrainian game.
import { test, expect } from 'bun:test'
import { open } from './helpers'

test('tabs and logo are real links; sub-views deep-link; legacy hashes redirect', async () => {
  const { b, p, errors } = await open('play')
  try {
    expect(await p.locator('a[data-tab-link]').evaluateAll(a => a.map(x => x.getAttribute('href')))).toEqual(['#tab=play', '#tab=solver', '#tab=strategies', '#tab=explore', '#tab=letters'])
    expect(await p.locator('a[data-home]').getAttribute('href')).toBe('#tab=play')
    await p.click('a[data-tab=explore]'); await p.waitForTimeout(500)
    expect(await p.evaluate(() => location.hash)).toBe('#tab=explore&view=paths')
    await p.click('a[data-view-link][href$="view=tree"]'); await p.waitForTimeout(800)
    expect(await p.evaluate(() => location.hash)).toBe('#tab=explore&view=tree')
    const [np] = await Promise.all([p.context().waitForEvent('page'), p.click('a[data-tab=strategies]', { modifiers: ['Control'] })])
    expect(np.url()).toContain('#tab=strategies')
    for (const [old, now] of [['sim', '#tab=strategies&view=simulation'], ['assist', '#tab=solver'], ['flow', '#tab=explore&view=flow'], ['openers', '#tab=letters&view=openers']]) {
      await p.goto(p.url().split('#')[0] + '#tab=' + old); await p.reload(); await p.waitForTimeout(600)
      expect(await p.evaluate(() => location.hash)).toBe(now)
    }
    expect(errors).toEqual([])
  } finally { await b.close() }
}, 40000)

test('daily mode shows a countdown instead of New game; random mode has New game; hard mode lives in Settings', async () => {
  const { b, p, errors } = await open('play')
  try {
    expect(await p.locator('[data-newgame]').count()).toBe(0)
    expect(await p.locator('[data-countdown]').innerText()).toMatch(/Next word in\s+\d\d:\d\d:\d\d/)
    await p.getByText('Random').click(); await p.waitForTimeout(300)
    expect(await p.locator('[data-newgame]').count()).toBe(1)
    expect(await p.locator('[data-countdown]').count()).toBe(0)
    await p.click('[data-settings]'); await p.waitForTimeout(300)
    expect(await p.locator('[data-hard]').count()).toBe(1)
    expect(errors).toEqual([])
  } finally { await b.close() }
}, 30000)

test('Ukrainian game is playable with the on-screen keyboard and a QWERTY physical keyboard', async () => {
  const { b, p, errors } = await open('play', { lang: 'ua' })
  try {
    expect(await p.locator('[aria-label=Keyboard] button[aria-label="ґ"]').count()).toBe(1)
    const ans: string = await p.evaluate(async () => { const a = (await (await fetch('/ua/answers.txt')).text()).split('\n').filter(Boolean); const d = Math.floor((Date.now() - new Date(2021, 5, 19).getTime()) / 864e5); return a[(d * 7919) % a.length] })
    const first = ans === 'котра' ? 'норка' : 'котра'
    for (const ch of first) await p.click(`[aria-label=Keyboard] button[aria-label="${ch}"]`)
    await p.click('[aria-label=Keyboard] button[aria-label=Enter]'); await p.waitForTimeout(1200)
    const code: Record<string, string> = { й: 'KeyQ', ц: 'KeyW', у: 'KeyE', к: 'KeyR', е: 'KeyT', н: 'KeyY', г: 'KeyU', ш: 'KeyI', щ: 'KeyO', з: 'KeyP', х: 'BracketLeft', ї: 'BracketRight', ф: 'KeyA', і: 'KeyS', в: 'KeyD', а: 'KeyF', п: 'KeyG', р: 'KeyH', о: 'KeyJ', л: 'KeyK', д: 'KeyL', ж: 'Semicolon', є: 'Quote', я: 'KeyZ', ч: 'KeyX', с: 'KeyC', м: 'KeyV', и: 'KeyB', т: 'KeyN', ь: 'KeyM', б: 'Comma', ю: 'Period', ґ: 'Backquote' }
    for (const ch of ans) await p.keyboard.press(code[ch])
    await p.keyboard.press('Enter'); await p.waitForTimeout(1500)
    expect(await p.locator('[data-banner]').innerText()).toContain('Solved in 2/6')
    expect(errors).toEqual([])
  } finally { await b.close() }
}, 30000)
