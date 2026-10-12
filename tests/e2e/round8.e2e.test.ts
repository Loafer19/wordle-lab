// Round 8: Ruslan staged strategies show up in Simulation (EN + UA labels).
import { test, expect } from 'bun:test'
import { open } from './helpers'
const SHOTS = process.env.SHOTS
for (const lang of ['en', 'ua'] as const) test(`${lang}: staged strategies listed in Simulation`, async () => {
  const { b, p, errors } = await open('strategies&view=simulation', { lang })
  try {
    await p.waitForTimeout(1500)
    const txt = await p.locator('main').innerText()
    expect(txt).toContain(lang === 'en' ? 'Ruslan staged (coverage until ≤3 left)' : 'Поетапна Руслана (покриття, доки не лишиться ≤3)')
    if (SHOTS) await p.screenshot({ path: `${SHOTS}/${lang}-simulation.png`, fullPage: true })
    expect(errors).toEqual([])
  } finally { await b.close() }
}, 30000)
