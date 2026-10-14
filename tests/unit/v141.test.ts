// v1.4.1: share-card PNG layout, Watch "Compute all" planning, sim lookup and the worker's per-strategy play.
import { test, expect } from 'bun:test'
import { readFileSync } from 'node:fs'
import { cardLayout, CARD_THEME, CARD_W } from '../../src/lib/shareImage'
import { tile } from '../../src/lib/tokens'
import { planAll, fromSim, playJobs } from '../../src/lib/watchAll'
const base = { title: 'Wordle Lab', sub: '#100', rows: [[0, 1, 0, 0, 2], [2, 2, 2, 2, 2]], score: '2/6', url: 'wordle.fundsflow.fun' }

test('share card layout: one tile per letter in tile colours, themed background, grows with rows/badges', () => {
  const L = cardLayout({ ...base, dark: true })
  expect(L.w).toBe(CARD_W)
  const tiles = L.ops.filter(o => o.k === 'rect' && o.w === 52)
  expect(tiles.length).toBe(10)
  expect(tiles.filter(o => o.k === 'rect' && o.fill === tile.correct).length).toBe(6)
  expect(L.ops[0]).toMatchObject({ k: 'rect', x: 0, y: 0, fill: CARD_THEME.dark.bg, h: L.h })
  expect(cardLayout({ ...base, dark: false }).ops[0]).toMatchObject({ fill: CARD_THEME.light.bg })
  const more = cardLayout({ ...base, dark: false, skill: 'Skill 80%', luck: 'Luck −0.4', luckGood: false, optimal: 'Optimal: 3' })
  expect(more.h).toBeGreaterThan(L.h)
  const texts = more.ops.flatMap(o => (o.k === 'text' ? [o.s] : []))
  expect(texts).toEqual(expect.arrayContaining(['Wordle Lab', '#100', '2/6', 'Skill 80%', 'Luck −0.4', 'Optimal: 3', 'wordle.fundsflow.fun']))
  for (const o of more.ops) expect(o.x + (o.k === 'rect' ? o.w : 0)).toBeLessThanOrEqual(CARD_W)
})

test('Compute all: precomputed sims first, optimal trees on the main thread, the rest in the worker (incl. two-step when no sim)', () => {
  const p = planAll(['optimal', 'optimal-hard', 'entropy2-all', 'preset-x', 'freq-cand'], new Set(['optimal', 'entropy2-all', 'freq-cand']))
  expect(p).toEqual({ sim: ['optimal', 'entropy2-all', 'freq-cand'], tree: ['optimal-hard'], worker: ['preset-x'] })
  expect(planAll(['entropy2-all'], new Set()).worker).toEqual(['entropy2-all'])
})

test('sim lookup is aligned with the answer list and agrees with live play for two-step entropy', () => {
  const answers = readFileSync('public/answers.txt', 'utf8').split(/\s+/).filter(Boolean)
  const allowed = readFileSync('public/allowed.txt', 'utf8').split(/\s+/).filter(Boolean)
  const sim = JSON.parse(readFileSync('public/sim/entropy2-all.json', 'utf8'))
  expect(fromSim(sim.guesses, answers, 'zzzzz')).toBeUndefined()
  expect(fromSim([1, 2], answers, answers[0])).toBeUndefined()
  const results = JSON.parse(readFileSync('public/results.json', 'utf8')) as { id: string; opener: string }[]
  const opener = results.find(r => r.id === 'entropy2-all')?.opener
  const seen: string[] = []
  const live = playJobs([{ id: 'entropy2-all', opener }, { id: 'nope' }], { answers, allowed }, 'crane', id => seen.push(id))
  expect(seen).toEqual(['entropy2-all'])
  expect(live['entropy2-all']).toBe(fromSim(sim.guesses, answers, 'crane')!)
}, 60000)

test('luck never reads −0.0; long badges stay inside the card', async () => {
  const { signed1 } = await import('../../src/lib/fingerprint')
  expect(signed1(-0.02)).toBe('+0.0'); expect(signed1(-0.06)).toBe('−0.1'); expect(signed1(1.24)).toBe('+1.2')
  const L = cardLayout({ ...base, dark: true, skill: 'Майстерність 100%', luck: 'Удача +12.3' })
  const pills = L.ops.filter(o => o.k === 'rect' && o.h === 40)
  for (const o of pills) if (o.k === 'rect') { expect(o.w).toBeGreaterThanOrEqual('Майстерність 100%'.length * 11 + 36); expect(o.x + o.w).toBeLessThanOrEqual(CARD_W) }
})
