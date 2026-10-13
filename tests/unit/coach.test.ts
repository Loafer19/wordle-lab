// Coach analysis: parsing pasted games, per-guess numbers, tips, optimal-tree moves (EN + UA).
import { test, expect } from 'bun:test'
import { parseGame, formatGame, analyzeGame, bestByEntropy } from '../../src/lib/coach'
import { feedback, patternDigits, entropy } from '../../src/lib/wordle'
import type { TreeNode } from '../../src/lib/advanced'
const root = new URL('../../', import.meta.url).pathname
const rd = async (p: string) => (await Bun.file(root + p).text()).split(/\s+/).filter(Boolean)
const EN = { a: await rd('data/answers.txt'), w: await rd('data/allowed.txt') }
const UA = { a: await rd('data/ua/answers.txt'), w: await rd('data/ua/allowed.txt') }
const game = (ws: string[], ans: string) => ws.map(w => ({ w, d: patternDigits(feedback(w, ans)) }))

test('parseGame reads emoji, digits and letters; formatGame round-trips', () => {
  const g = parseGame('ARISE(⬜⬜⬜🟨⬜) CLOTH(⬜⬜🟩🟨⬜)')
  expect(g.error).toBeUndefined()
  expect(g.steps).toEqual([{ w: 'arise', d: [0, 0, 0, 1, 0] }, { w: 'cloth', d: [0, 0, 2, 1, 0] }])
  expect(parseGame('arise 00010\ncloth bbgyb').steps).toEqual(g.steps)
  expect(parseGame(formatGame(g.steps)).steps).toEqual(g.steps)
  expect(parseGame('котра ⬛🟨⬛⬛⬛ слово 🟩🟩🟩🟩🟩').steps).toEqual([{ w: 'котра', d: [0, 1, 0, 0, 0] }, { w: 'слово', d: [2, 2, 2, 2, 2] }])
  expect(parseGame('hello world').error).toBeTruthy()
})

test('EN: ARISE → CLOTH → STOUT numbers', () => {
  const r = analyzeGame(game(['arise', 'cloth', 'stout'], 'stout'), EN.a, EN.w)
  expect(r.solved).toBe(true); expect(r.steps.length).toBe(3)
  const [s1, s2, s3] = r.steps
  expect(s1.before).toBe(2315); expect(s1.after).toBe(80)
  expect(s1.bits).toBeCloseTo(Math.log2(2315 / 80), 6)
  expect(s1.expBits).toBeCloseTo(entropy('arise', EN.a), 6)
  expect(s1.best.guess).toBe('soare'); expect(s1.best.bits).toBeGreaterThan(s1.expBits)
  expect(s2.before).toBe(80); expect(s2.after).toBe(7)
  expect(s2.luck).toBeCloseTo(s2.bits - s2.expBits, 6)
  expect(s3.after).toBe(0); expect(s3.tips.some(t => t.kind === 'solved')).toBe(true)
  for (const s of r.steps) { expect(s.luckPct).toBeGreaterThanOrEqual(0); expect(s.luckPct).toBeLessThanOrEqual(1); expect(s.efficiency).toBeLessThanOrEqual(1) }
})

test('EN: cluster trap (_ATCH) and grey-letter reuse are flagged', () => {
  const r = analyzeGame(game(['slate', 'catch', 'match', 'hatch', 'patch', 'watch'], 'watch'), EN.a, EN.w)
  expect(r.solved).toBe(true)
  expect(r.steps.some(s => s.tips.some(t => t.kind === 'cluster-trap' || t.kind === 'outside-better'))).toBe(true)
  const g = analyzeGame(game(['crane', 'crust', 'stout'], 'stout'), EN.a, EN.w) // C,R reused after grey
  expect(g.steps[1].tips.find(t => t.kind === 'grey-reuse')?.v?.l).toBe('C, R')
  expect(g.summary.some(t => t.kind === 'grey-reuse')).toBe(true)
})

test('optimal-tree move is reported while on the tree', async () => {
  const t: TreeNode = (await Bun.file(root + 'public/optimal-tree.json').json()).normal
  const r = analyzeGame(game(['salet', 'cloth'], 'stout'), EN.a, EN.w, { tree: t })
  expect(r.steps[0].tree?.guess).toBe('salet')
  expect(r.steps[1].tree?.guess).toBe(t.c![feedback('salet', 'stout')].g)
  const off = analyzeGame(game(['arise', 'cloth'], 'stout'), EN.a, EN.w, { tree: t })
  expect(off.steps[0].tree?.guess).toBe('salet'); expect(off.steps[1].tree).toBeUndefined()
})

test('inconsistent colours and unknown words stop the analysis with an error', () => {
  expect(analyzeGame([{ w: 'arise', d: [2, 2, 2, 2, 1] }], EN.a, EN.w).error?.kind).toBe('no-match')
  expect(analyzeGame([{ w: 'zzzzz', d: [0, 0, 0, 0, 0] }], EN.a, EN.w).error?.kind).toBe('invalid-word')
})

test('UA: КОТРА is the best entropy opener; hard mode restricts the best move to legal guesses', async () => {
  expect(bestByEntropy(UA.a, UA.w).guess).toBe('котра')
  const t: TreeNode = (await Bun.file(root + 'public/ua/optimal-tree.json').json()).hard
  const r = analyzeGame(game(['карст', 'сопло', 'слово'], 'слово'), UA.a, UA.w, { hard: true, tree: t })
  expect(r.steps[0].tree?.guess).toBe('карст')
  expect(r.solved).toBe(true)
  const { hardValid } = await import('../../src/lib/advanced')
  const s2 = r.steps[1]; expect(hardValid(s2.best.guess, [{ g: 'карст', p: r.steps[0].p }])).toBe(true)
})
