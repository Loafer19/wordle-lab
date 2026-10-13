// UA hard-mode optimal tree (scripts/ua-optimal/solver.c, WL_HARD=1): valid in hard mode, total 5930, opener КАРСТ; gaps use the per-language optimum.
import { test, expect } from 'bun:test'
import { verifyTree, hardValid, type TreeNode, type Step } from '../../src/lib/advanced'
import { feedback, ALL_GREEN } from '../../src/lib/wordle'
import { OPTIMA, gapTo } from '../../src/lib/optimum'
const root = new URL('../../', import.meta.url).pathname
const rd = async (p: string) => (await Bun.file(root + p).text()).split(/\s+/).filter(Boolean)
test('UA karst.hard.json: hard-valid, covers all answers, total 5930, worst 7', async () => {
  const answers = await rd('data/ua/answers.txt'), allowed = new Set(await rd('data/ua/allowed.txt'))
  const t: TreeNode = await Bun.file(root + 'data/ua/optimal/karst.hard.json').json()
  expect(t.g).toBe('карст'); expect(t.n).toBe(answers.length)
  expect(verifyTree(t, answers, true)).toEqual([])
  let total = 0, worst = 0
  for (const a of answers) { let n: TreeNode | undefined = t, k = 0; const h: Step[] = []; while (n) { k++; expect(allowed.has(n.g)).toBe(true); expect(hardValid(n.g, h)).toBe(true); const p = feedback(n.g, a); if (p === ALL_GREEN) break; h.push({ g: n.g, p }); n = n.c?.[p] } total += k; worst = Math.max(worst, k) }
  expect(total).toBe(5930); expect(worst).toBe(7)
  expect(OPTIMA.ua.hard).toBeCloseTo(5930 / 1717, 10)
})
test('gaps are measured against the language optimum and never negative', async () => {
  expect(gapTo(3.38, 'ua', false)).toBe(0)
  expect(gapTo(OPTIMA.ua.normal, 'ua', false)).toBe(0)
  expect(gapTo(3.5, 'ua', false)).toBeCloseTo(3.5 - 5805 / 1717, 10)
  expect(gapTo(3.5, 'en', false)).toBeCloseTo(3.5 - 7920 / 2315, 10)
  for (const f of ['public/ua/sim/index.json', 'public/sim/index.json']) for (const r of await Bun.file(root + f).json()) expect(r.gap).toBeGreaterThanOrEqual(0)
  const ua = await Bun.file(root + 'public/ua/sim/index.json').json()
  expect(ua.find((r: any) => r.id === 'optimal').gap).toBe(0); expect(ua.find((r: any) => r.id === 'optimal@hard').gap).toBe(0)
})
