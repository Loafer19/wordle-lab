// Round 8: Ruslan staged strategies (coverage → cluster splitter → candidates).
import { test, expect } from 'bun:test'
import { findClusters, stagedStrategy, STAGED_PRESETS } from '../../src/lib/staged'
import { simulateEx } from '../../src/lib/advanced'
const rd = async (p: string) => (await Bun.file(new URL('../../' + p, import.meta.url).pathname).text()).split(/\s+/).filter(Boolean)

test('findClusters detects _ATCH-style traps', () => {
  const c = findClusters(['batch', 'catch', 'hatch', 'latch', 'match', 'crane'], 2)
  expect(c[0].m).toBe(5); expect(c[0].pos).toBe(0)
})
test('coverage opener has no repeated letters and the explanation names letters', async () => {
  const answers = await rd('data/answers.txt'), allowed = await rd('data/allowed.txt')
  const s = stagedStrategy(STAGED_PRESETS[0]).pick(answers, { answers, allowed }, 1)
  expect(new Set(s.guess).size).toBe(5)
  expect(s.why).toMatch(/[A-Z]\(\d+%\)/)
})
test('EN: adaptive staged solves every answer within 6, avg < 3.55', async () => {
  const answers = await rd('data/answers.txt'), allowed = await rd('data/allowed.txt')
  const r = simulateEx(stagedStrategy(STAGED_PRESETS[0]), { answers, allowed })
  expect(r.failRate).toBe(0); expect(r.avg).toBeLessThan(3.55)
}, 60000)
