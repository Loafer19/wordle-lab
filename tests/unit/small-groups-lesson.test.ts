// Learn › Small groups in your head: the worked example must be exactly what the game engine says.
import { test, expect } from 'bun:test'
import { readFileSync } from 'node:fs'
import { feedback, patternDigits } from '../../src/lib/wordle'
import { groupsOf, tally, bestScouts, EXAMPLE, LESSON_RESULT } from '../../src/lib/smallGroups'
import { resolve, href } from '../../src/lib/routes'
const rd = (f: string) => readFileSync(f, 'utf8').split('\n').map(s => s.trim()).filter(Boolean)
const pat = (g: string, a: string) => patternDigits(feedback(g, a)).join('')

test('EN example: MATCH is a trap, PLUMB gives 4 groups of one + 1 pair (colours as in the lesson)', () => {
  const A = new Set(rd('data/answers.txt')), V = new Set(rd('data/allowed.txt')), E = EXAMPLE.en, C = [...E.cands]
  expect(V.size).toBe(12972)
  for (const w of [...C, E.trap, E.scout, ...E.extra]) expect(V.has(w)).toBe(true)
  for (const w of C) expect(A.has(w)).toBe(true)
  expect(tally('match', C)).toMatchObject({ singletons: 1, largest: 5, groups: 2 })
  for (const w of C) if (w !== 'match') expect(pat('match', w)).toBe('02222')
  expect(pat('plumb', 'batch')).toBe('00001') // yellow B
  expect(pat('plumb', 'latch')).toBe('01000') // yellow L
  expect(pat('plumb', 'match')).toBe('00010') // yellow M
  expect(pat('plumb', 'patch')).toBe('20000') // green P
  expect(pat('plumb', 'hatch')).toBe('00000'); expect(pat('plumb', 'watch')).toBe('00000') // all grey: the pair
  expect(tally('plumb', C)).toMatchObject({ singletons: 4, largest: 2, groups: 5 })
  expect(groupsOf('plumb', C).at(-1)!.words).toEqual(['hatch', 'watch'])
  expect(bestScouts(C, [...V], 3).map(x => [x.w, x.singletons, x.largest])).toEqual([['blimp', 4, 2], ['plumb', 4, 2], ['abamp', 3, 3]])
})

test('UA example: МАСКА is a trap, СТВОР (not an answer) gives 4 groups of one + 1 pair', () => {
  const A = new Set(rd('data/ua/answers.txt')), V = new Set(rd('data/ua/allowed.txt')), E = EXAMPLE.ua, C = [...E.cands]
  for (const w of [...C, E.trap, E.scout, ...E.extra]) expect(V.has(w)).toBe(true)
  for (const w of C) expect(A.has(w)).toBe(true)
  expect(A.has(E.scout)).toBe(false)
  expect(tally(E.trap, C)).toMatchObject({ singletons: 1, largest: 5 })
  expect(tally(E.scout, C)).toMatchObject({ singletons: 4, largest: 2 })
  expect(groupsOf(E.scout, C).at(-1)!.words).toEqual(['майка', 'мамка'])
  const best = bestScouts(C, [...V], 1)[0]; expect([best.singletons, best.largest]).toEqual([4, 2])
})

test('lesson numbers match the leaderboard; the lesson is deep-linkable', () => {
  for (const [l, P] of [['en', 'public/'], ['ua', 'public/ua/']] as const) {
    const idx = JSON.parse(readFileSync(P + 'sim/index.json', 'utf8')) as { id: string; avg: number; opener: string }[]
    const g = (id: string) => idx.find(r => r.id === id)!
    expect(g('singleton-all').avg).toBeCloseTo(LESSON_RESULT[l].sg, 4); expect(g('entropy-all').avg).toBeCloseTo(LESSON_RESULT[l].ent, 4)
    expect(g('singleton-all').opener).toBe(g('entropy-all').opener); expect(g('entropy-all').opener.toUpperCase()).toBe(LESSON_RESULT[l].opener)
  }
  expect(LESSON_RESULT.en.sg.toFixed(3)).toBe('3.450'); expect(LESSON_RESULT.en.ent.toFixed(3)).toBe('3.434')
  expect(resolve('learn', 'small-groups')).toEqual({ tab: 'learn', view: 'small-groups' })
  expect(href('learn', 'small-groups')).toBe('#tab=learn&view=small-groups')
})
