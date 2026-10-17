// 'Small groups' (singleton) strategy: score = Σ 1/|group|, largest group capped at ⌈n/4⌉, max-entropy fallback, ties prefer candidates.
import { test, expect } from 'bun:test'
import { readFileSync } from 'node:fs'
import { STRATEGIES, singletonScore, buckets, SINGLETON_OPENER } from '../../src/lib/wordle'
import { simulateEx } from '../../src/lib/advanced'
import { shortName } from '../../src/lib/names'
import UA_T from '../../src/lib/i18n-ua'
const rd = (f: string) => readFileSync('public/' + f, 'utf8').split(/\s+/).filter(Boolean)
const en = { answers: rd('answers.txt'), allowed: rd('allowed.txt') }, ua = { answers: rd('ua/answers.txt'), allowed: rd('ua/allowed.txt') }
const S = STRATEGIES.find(s => s.id === 'singleton-all')!

test('registered with a short name and Ukrainian name/description', () => {
  expect(S).toBeDefined()
  expect(shortName('singleton-all')).toBe('Small groups')
  for (const k of ['Small groups', S.name, S.desc]) expect(UA_T[k]).toBeTruthy()
})

test('singletonScore = Σ 1/|group| and the largest group', () => {
  for (const [g, c] of [['salet', en.answers.slice(0, 300)], ['crane', en.answers.slice(500, 650)]] as const) {
    const b = [...buckets(g, c)].filter(Boolean)
    const r = singletonScore(g, c)
    expect(r.s).toBeCloseTo(b.reduce((a, x) => a + 1 / x, 0), 12)
    expect(r.max).toBe(Math.max(...b))
  }
})

test('picks the best Σ 1/|group| among guesses within the ⌈n/4⌉ cap, preferring candidates on ties', () => {
  let tested = 0
  for (const cands of [en.answers.filter(w => w.endsWith('atch')), en.answers.filter(w => w.startsWith('sh')), en.answers.filter(w => w.includes('ou')).slice(0, 40), en.answers.filter(w => w.endsWith('ound'))]) {
    expect(cands.length).toBeGreaterThan(4)
    const n = cands.length, cap = Math.ceil(n / 4), g = S.pick(cands, en, 2).guess
    const ok = en.allowed.map(w => ({ w, ...singletonScore(w, cands) })).filter(x => x.max <= cap)
    if (!ok.length) { expect(S.pick(cands, en, 2).why).toContain('max entropy'); continue }
    const best = Math.max(...ok.map(x => x.s))
    const mine = singletonScore(g, cands)
    expect(mine.max).toBeLessThanOrEqual(cap)
    expect(mine.s).toBeCloseTo(best, 9)
    tested++
    if (ok.some(x => Math.abs(x.s - best) < 1e-9 && cands.includes(x.w))) expect(cands).toContain(g)
  }
  expect(tested).toBeGreaterThanOrEqual(2)
})

test('falls back to max entropy when no guess meets the cap', () => {
  // a pool of one word that cannot split the candidates enough
  const cands = en.answers.filter(w => w.endsWith('ight')), ctx = { answers: en.answers, allowed: ['zzzzz', ...cands.slice(0, 1)] }
  const r = S.pick(cands, ctx, 2)
  const ent = STRATEGIES.find(s => s.id === 'entropy-all')!.pick(cands, ctx, 2)
  expect(r.guess).toBe(ent.guess); expect(r.why).toContain('max entropy')
})

test('fixed openers: SALET (EN), КОТРА (UA); two or fewer candidates → guess one', () => {
  expect(S.pick(en.answers, en, 1).guess).toBe(SINGLETON_OPENER.en)
  expect(S.pick(ua.answers, ua, 1).guess).toBe(SINGLETON_OPENER.ua)
  expect(S.pick(['crane', 'crate'], en, 3).guess).toBe('crane')
})

test('UA simulation with КОТРА: ≈3.394 (between the optimum 3.3809 and max entropy 3.3960), never more than 6 guesses', () => {
  const r = simulateEx(S, ua)
  expect(r.opener).toBe('котра')
  expect(r.avg).toBeGreaterThan(3.3809); expect(r.avg).toBeLessThan(3.396); expect(Math.abs(r.avg - 3.3949)).toBeLessThan(0.002)
  expect(r.worst).toBeLessThanOrEqual(6)
}, 60000)
