// 2-ply lookahead trees (scripts/lookahead/lookahead.py), the instant 'Small groups + entropy' hybrid, the fixed-opener max-entropy
// baseline, leaderboard groups and the precomputed sim index.
import { test, expect } from 'bun:test'
import { readFileSync } from 'node:fs'
import { verifyTree, simulateEx, type TreeNode } from '../../src/lib/advanced'
import { feedback, ALL_GREEN, STRATEGIES, hybridScore, buckets } from '../../src/lib/wordle'
import { shortName, groupOf, blurb, GROUPS } from '../../src/lib/names'
import { isTreeId, LOOK_A_NAME, LOOK_B_NAME, LOOK_A_DESC, LOOK_B_DESC } from '../../src/lib/lookahead'
import UA_T from '../../src/lib/i18n-ua'
const rd = (f: string) => readFileSync(f, 'utf8').split(/\s+/).filter(Boolean)
const json = (f: string) => JSON.parse(readFileSync(f, 'utf8'))
const depth = (t: TreeNode, a: string) => { let n: TreeNode | undefined = t, k = 0; while (n) { k++; const p = feedback(n.g, a); if (p === ALL_GREEN) return k; n = n.c?.[p] } return 99 }
const D = { en: 'data/', ua: 'data/ua/' } as const

for (const [lang, file, opener, total, worst, le4] of [
  ['en', 'lookahead/salet.b.json', 'salet', 7920, 5, 2236], ['en', 'lookahead/salet.a.json', 'salet', 7996, 5, 2277],
  ['ua', 'lookahead/kotra.b.json', 'котра', 5805, 6, 1649], ['ua', 'lookahead/kotra.a.json', 'котра', 5842, 6, 1682],
] as const)
  test(`${lang} ${file}: valid tree, total ${total}, worst ${worst}`, () => {
    const answers = rd(D[lang] + 'answers.txt'), allowed = new Set(rd(D[lang] + 'allowed.txt'))
    const t: TreeNode = json(D[lang] + file)
    expect(t.g).toBe(opener); expect(t.n).toBe(answers.length)
    expect(verifyTree(t, answers)).toEqual([])
    const walk = (n: TreeNode): void => { expect(allowed.has(n.g)).toBe(true); for (const c of Object.values(n.c ?? {})) walk(c) }; walk(t)
    const d = answers.map(a => depth(t, a))
    expect(d.reduce((s, x) => s + x, 0)).toBe(total); expect(Math.max(...d)).toBe(worst)
    expect(d.filter(x => x <= 4).length).toBe(le4)
  })

test('public lookahead-tree.json = the shipped trees', () => {
  for (const [P, D0, o] of [['public/', 'data/lookahead/', 'salet'], ['public/ua/', 'data/ua/lookahead/', 'kotra']]) {
    const pub = json(P + 'lookahead-tree.json')
    expect(pub.b).toEqual(json(`${D0}${o}.b.json`)); expect(pub.a).toEqual(json(`${D0}${o}.a.json`))
  }
})

test('sim index: lookahead rows (normal only), hybrid and fixed-opener baseline', () => {
  const en = json('public/sim/index.json') as { id: string; avg: number; worst: number; opener: string }[], ua = json('public/ua/sim/index.json') as typeof en
  const g = (x: typeof en, id: string) => x.find(r => r.id === id)!
  expect(Math.round(g(en, 'lookahead-b').avg * 2315)).toBe(7920); expect(Math.round(g(en, 'lookahead-a').avg * 2315)).toBe(7996)
  expect(Math.round(g(ua, 'lookahead-b').avg * 1717)).toBe(5805); expect(Math.round(g(ua, 'lookahead-a').avg * 1717)).toBe(5842)
  expect(en.some(r => r.id === 'lookahead-b@hard')).toBe(false)
  expect(Math.round(g(en, 'hybrid-all').avg * 2315)).toBe(7932); expect(g(en, 'hybrid-all').opener).toBe('salet')
  expect(Math.round(g(en, 'entropy-fixed').avg * 2315)).toBe(7949); expect(g(en, 'entropy-fixed').opener).toBe('salet')
  expect(g(ua, 'hybrid-all').opener).toBe('котра'); expect(ua.some(r => r.id === 'entropy-fixed')).toBe(false)
})

test('hybrid = Σ 1/|group| + 20·H, first move matches the sim', () => {
  const answers = rd('data/answers.txt'), allowed = rd('data/allowed.txt')
  const c = answers.slice(0, 200), b = [...buckets('crane', c)].filter(Boolean)
  const h = -b.reduce((s, k) => s + (k / c.length) * Math.log2(k / c.length), 0)
  expect(hybridScore('crane', c).score).toBeCloseTo(b.reduce((s, k) => s + 1 / k, 0) + 20 * h, 9)
  const S = STRATEGIES.find(s => s.id === 'hybrid-all')!
  expect(S.pick(answers, { answers, allowed }, 1).guess).toBe('salet')
  const sub = answers.filter(a => feedback('salet', a) === feedback('salet', 'crane'))
  const r = simulateEx(S, { answers: sub, allowed }, {})
  expect(r.avg).toBeGreaterThan(1)
})

test('registration: names, groups, descriptions and Ukrainian translations', () => {
  for (const id of ['hybrid-all', 'entropy-fixed']) { const s = STRATEGIES.find(x => x.id === id)!; expect(s).toBeDefined(); for (const k of [s.name, s.desc, shortName(id)]) expect(UA_T[k]).toBeTruthy() }
  for (const k of [LOOK_A_NAME, LOOK_B_NAME, LOOK_A_DESC, LOOK_B_DESC, shortName('lookahead-a'), shortName('lookahead-b'), ...GROUPS.map(g => g.label)]) expect(UA_T[k]).toBeTruthy()
  expect(isTreeId('lookahead-b')).toBe(true); expect(isTreeId('optimal-max5')).toBe(true); expect(isTreeId('hybrid-all')).toBe(false)
  expect(groupOf('optimal')).toBe('optimal'); expect(groupOf('lookahead-a')).toBe('lookahead'); expect(groupOf('hybrid-all')).toBe('greedy')
  expect(groupOf('entropy-fixed')).toBe('baseline'); expect(groupOf('random@hard')).toBe('baseline'); expect(groupOf('freqbal-cand')).toBe('human')
  for (const r of json('public/sim/index.json') as { id: string }[]) expect(blurb(r.id)).toBeTruthy()
})
