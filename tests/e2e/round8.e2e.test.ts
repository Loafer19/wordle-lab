// Round 8: Ruslan staged strategies show up in the leaderboard (short EN + UA labels; full name in the tooltip).
import { test, expect } from 'bun:test'
import { open } from './helpers'
const SHOTS = process.env.SHOTS
for (const lang of ['en', 'ua'] as const) test(`${lang}: staged strategies listed in the leaderboard`, async () => {
  const { b, p, errors } = await open('strategies&view=leaderboard', { lang })
  try {
    await p.waitForTimeout(1500)
    const txt = await p.locator('main').innerText()
    expect(txt).toContain(lang === 'en' ? 'Staged ≤3' : 'Поетапна ≤3')
    await p.hover('[data-id=staged-adaptive] td:nth-child(2) span'); await p.waitForTimeout(400)
    expect(await p.locator('.p-tooltip').innerText()).toContain(lang === 'en' ? 'Ruslan staged (coverage until ≤3 left)' : 'Поетапна Руслана (покриття, доки не лишиться ≤3)')
    if (SHOTS) await p.screenshot({ path: `${SHOTS}/${lang}-simulation.png`, fullPage: true })
    expect(errors).toEqual([])
  } finally { await b.close() }
}, 30000)
