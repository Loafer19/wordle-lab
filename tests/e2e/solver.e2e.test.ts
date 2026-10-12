// Regression: Ruslan's report — after ALERT → NOISY (all gray) with 'Ruslan freq (candidates)', tiles showed solid gray
// and 'No possible answer matches' appeared without pressing Apply. Root cause: a running demo kept auto-colouring + auto-applying.
import { test, expect } from 'bun:test'
import { open, tiles, alertText, suggestion } from './helpers'
async function pickStrategy(p: any, name: string) { await p.click('[role=combobox]'); await p.click(`li:has-text("${name}")`); await p.waitForTimeout(400) }
async function playAllGray(p: any, word: string, how: 'keys' | 'click' | 'tileEnter' | 'input') {
  if (how === 'input') { await p.fill('#guess-in', ''); await p.click('#guess-in'); await p.keyboard.type(word) } else { await p.mouse.click(5, 5); await p.keyboard.type(word) }
  if (how === 'keys' || how === 'input') { await p.mouse.click(5, 5); for (const k of '12345') await p.keyboard.press(k) }
  else for (let j = 1; j <= 5; j++) await p.click(`button[aria-label^="Tile ${j}:"]`)
  if (how === 'click') await p.click('button:has-text("Apply feedback")')
  else if (how === 'input') { await p.click('#guess-in'); await p.keyboard.press('Enter') }
  else await p.keyboard.press('Enter')
  await p.waitForTimeout(700)
}
for (const how of ['keys', 'click', 'tileEnter', 'input'] as const)
  test(`ALERT→NOISY all gray via ${how}: no phantom error, tiles unset, CHUMP suggested`, async () => {
    const { b, p, errors } = await open('assist')
    try {
      await pickStrategy(p, 'Ruslan freq (candidates)')
      for (const w of ['alert', 'noisy']) await playAllGray(p, w, how)
      expect(await suggestion(p)).toBe('CHUMP')
      expect(await tiles(p)).toEqual(Array(5).fill('not set'))
      await p.waitForTimeout(2500)
      expect(await alertText(p)).toBe('')
      expect(errors).toEqual([])
    } finally { await b.close() }
  }, 30000)
test('demo is stopped by user interaction (no background auto-apply)', async () => {
  const { b, p } = await open('assist')
  try {
    await p.click('button:has-text("Show me an example")'); await p.waitForTimeout(900)
    await pickStrategy(p, 'Ruslan freq (candidates)')
    await p.click('button:has-text("Reset")')
    for (const w of ['alert', 'noisy']) await playAllGray(p, w, 'keys')
    await p.waitForTimeout(4500)
    expect(await alertText(p)).toBe('')
    expect(await tiles(p)).toEqual(Array(5).fill('not set'))
  } finally { await b.close() }
}, 30000)
test('demo + interaction without reset also stops demo', async () => {
  const { b, p } = await open('assist')
  try {
    await p.click('button:has-text("Show me an example")'); await p.waitForTimeout(900)
    await p.mouse.click(5, 5); await p.keyboard.type('crane')
    await p.waitForTimeout(4500)
    expect(await p.locator('text=Demo stopped').count()).toBe(1)
    expect(await alertText(p)).toBe('')
  } finally { await b.close() }
}, 30000)
test('unset tiles → explicit message only after Apply; all-gray candidate → hint', async () => {
  const { b, p } = await open('assist')
  try {
    expect(await alertText(p)).toBe('')
    await p.click('button:has-text("Apply feedback")'); await p.waitForTimeout(300)
    expect(await alertText(p)).toContain('Set the colour of every tile')
  } finally { await b.close() }
}, 30000)
