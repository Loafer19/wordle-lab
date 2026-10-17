// Interactive tree › custom opener: validation (EN/UA), strategy used after the opener, and the fast max-entropy follow-up
// (must pick exactly what 'entropy-all' picks, it only exists to make the full tree ~8× faster).
import { test, expect } from 'bun:test'
import { readFileSync } from 'node:fs'
import { validateOpener, normalizeOpener, followId, FALLBACK_FOLLOW, fastFeedbackStr, fastEntropyAll, openerTree, resolveFollow } from '../../src/lib/opener'
import { STRATEGIES, feedback } from '../../src/lib/wordle'
const rd = (f: string) => readFileSync('public/' + f, 'utf8').split(/\s+/).filter(Boolean)
const EN = 'abcdefghijklmnopqrstuvwxyz', UA = 'абвгґдеєжзиіїйклмнопрстуфхцчшщьюя'
const en = { answers: rd('answers.txt'), allowed: rd('allowed.txt') }, ua = { answers: rd('ua/answers.txt'), allowed: rd('ua/allowed.txt') }

test('custom opener validation: 5 letters of the current alphabet, allowed guess of the current language', () => {
  const enSet = new Set(en.allowed), uaSet = new Set(ua.allowed)
  expect(validateOpener('crane', enSet, EN)).toEqual({ ok: true, word: 'crane' })
  expect(validateOpener('  CrAnE ', enSet, EN)).toEqual({ ok: true, word: 'crane' })
  expect(validateOpener('', enSet, EN).error).toBe('empty')
  expect(validateOpener('cran', enSet, EN).error).toBe('length')
  expect(validateOpener('cranes', enSet, EN).error).toBe('length')
  expect(validateOpener('cr4ne', enSet, EN).error).toBe('letters')
  expect(validateOpener('xxxxx', enSet, EN).error).toBe('unknown')
  expect(validateOpener('котра', enSet, EN).error).toBe('letters') // Cyrillic in EN mode
  expect(validateOpener('КОТРА', uaSet, UA)).toEqual({ ok: true, word: 'котра' })
  expect(validateOpener('слово', uaSet, UA).ok).toBe(true)
  expect(validateOpener('crane', uaSet, UA).error).toBe('letters') // Latin in UA mode
  expect(validateOpener('котрa', uaSet, UA).error).toBe('letters') // Latin "a" mixed in
  expect(validateOpener('ааааа', uaSet, UA).error).toBe('unknown')
  expect(validateOpener('crane', en.allowed, EN).ok).toBe(true) // arrays work too
  expect(normalizeOpener(' Ґ Р А Н Т ')).toBe('ґрант')
})

test('after a custom opener: tree strategies fall back to max entropy, others keep their own moves', () => {
  const known = (id: string) => ['entropy-all', 'entropy2-all', 'freq-cand'].includes(id)
  expect(followId('optimal', known)).toBe(FALLBACK_FOLLOW)
  expect(followId('optimal-max5', known)).toBe(FALLBACK_FOLLOW)
  expect(followId('entropy2-all', known)).toBe('entropy2-all')
  expect(followId('freq-cand', known)).toBe('freq-cand')
  expect(followId('nope', known)).toBe(FALLBACK_FOLLOW)
  expect(followId('custom:abc', known)).toBe('custom:abc')
})

test('fast feedback and fast max entropy agree with the engine', () => {
  let seed = 7; const rnd = (n: number) => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) % n)
  for (const c of [en, ua]) for (let i = 0; i < 3000; i++) { const g = c.allowed[rnd(c.allowed.length)], a = c.answers[rnd(c.answers.length)]; expect(fastFeedbackStr(g, a)).toBe(feedback(g, a)) }
  for (const g of ['speed', 'eerie', 'llama']) for (const a of ['abbey', 'erase', 'sleep', 'level']) expect(fastFeedbackStr(g, a)).toBe(feedback(g, a))
  const slow = STRATEGIES.find(s => s.id === 'entropy-all')!, fast = fastEntropyAll()
  for (const c of [en, ua]) for (let i = 0; i < 6; i++) {
    const g = c.allowed[rnd(c.allowed.length)], a = c.answers[rnd(c.answers.length)], p = feedback(g, a)
    const cands = c.answers.filter(w => feedback(g, w) === p)
    expect(fast.pick(cands, c, 2).guess).toBe(slow.pick(cands, c, 2).guess)
  }
}, 60000)

test('UA custom opener tree covers every answer, starts with the opener, reports its stats', () => {
  const r = openerTree('слово', resolveFollow(FALLBACK_FOLLOW), ua)
  expect(r.tree.g).toBe('слово'); expect(r.tree.n).toBe(ua.answers.length)
  expect(r.dist.reduce((a, b) => a + b, 0)).toBe(ua.answers.length)
  expect(r.avg).toBeGreaterThan(3.3809) // can't beat the proven UA optimum (КОТРА)
  expect(r.worst).toBeLessThanOrEqual(7)
}, 60000)
