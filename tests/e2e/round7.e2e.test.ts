// v1.2.0: UA letter analytics, Ukrainian UI, footer pills, Strategy Lab custom strategies.
import { test, expect } from 'bun:test'
import { open } from './helpers'

test('UA Analytics letter chart covers (almost) the whole Ukrainian alphabet', async () => {
  const { b, p, errors } = await open('analytics&view=letters', { lang: 'ua' })
  try {
    const card = p.locator('[data-letters-chart]')
    expect(Number(await card.getAttribute('data-total'))).toBe(33)
    expect(Number(await card.getAttribute('data-nonzero'))).toBeGreaterThanOrEqual(30)
    expect(await p.locator('canvas').count()).toBeGreaterThanOrEqual(2)
    expect(errors).toEqual([])
  } finally { await b.close() }
}, 30000)

test('Ukrainian UI: tabs, settings, footer and html lang are translated', async () => {
  const { b, p, errors } = await open('play', { lang: 'ua' })
  try {
    expect(await p.evaluate(() => document.documentElement.lang)).toBe('uk')
    const tabs = await p.locator('a[data-tab-link]').allInnerTexts()
    expect(tabs.map(s => s.trim())).toEqual(['Гра', 'Розв’язувач', 'Стратегії', 'Дослідження', 'Аналітика'])
    expect(await p.locator('[data-countdown]').innerText()).toContain('Наступне слово через')
    expect(await p.locator('[data-updated]').innerText()).toContain('оновлено')
    await p.click('[data-settings]'); await p.waitForTimeout(300)
    expect(await p.locator('[data-settings-panel]').innerText()).toContain('Складний режим')
    await p.goto(p.url().split('#')[0] + '#tab=strategies&view=simulation'); await p.waitForTimeout(1500)
    expect(await p.locator('main').innerText()).toContain('Симуляція стратегій')
    expect(errors).toEqual([])
  } finally { await b.close() }
}, 30000)

test('footer: left info pills, right version + updated pills with real links', async () => {
  const { b, p, errors } = await open('play')
  try {
    expect(await p.locator('[data-footer-left] > *').count()).toBe(3)
    const v = p.locator('[data-footer-right] [data-version]')
    expect((await v.innerText()).trim()).toMatch(/^v\d+\.\d+\.\d+$/)
    expect(await v.getAttribute('href')).toMatch(/releases\/tag\/v\d+\.\d+\.\d+$/)
    const u = p.locator('[data-footer-right] [data-updated]')
    expect(await u.innerText()).toMatch(/updated \d{1,2} \w{3} \d{4}/)
    expect(await u.getAttribute('href')).toMatch(/github\.com\/Loafer19\/wordle-lab\/(commit\/\w+|blob\/main\/CHANGELOG\.md)$/)
    expect(errors).toEqual([])
  } finally { await b.close() }
}, 30000)

test('Strategy Lab: live sample run, save custom strategy, pick it in Compare', async () => {
  const { b, p, errors } = await open('strategies&view=lab')
  try {
    await p.waitForFunction(() => parseFloat(document.querySelector('[data-lab-avg]')?.textContent ?? '0') > 3, null, { timeout: 30000 })
    await p.fill('[data-lab-name]', 'E2E explorer'); await p.click('[data-lab-save]'); await p.waitForTimeout(300)
    expect(await p.locator('[data-custom]').allInnerTexts()).toEqual([expect.stringContaining('E2E explorer')])
    await p.goto(p.url().split('#')[0] + '#tab=strategies&view=compare'); await p.waitForTimeout(1200)
    await p.locator('.p-select').first().click(); await p.waitForTimeout(300)
    expect(await p.locator('.p-select-option').allInnerTexts()).toContain('★ E2E explorer')
    expect(errors).toEqual([])
  } finally { await b.close() }
}, 60000)
