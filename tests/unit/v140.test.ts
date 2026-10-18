// v1.4.0: route table + redirects of every old link, player fingerprint maths, share text.
import { test, expect } from 'bun:test'
import { resolve, SECTIONS, href } from '../../src/lib/routes'
import { fingerprint, nearest, shareText, type GameRecord } from '../../src/lib/fingerprint'

test('five tabs with their sub-views', () => {
  expect(Object.keys(SECTIONS)).toEqual(['play', 'assistant', 'learn', 'strategies', 'explore', 'community'])
  expect(SECTIONS.explore).toEqual(['tree', 'flow', 'map'])
  expect(href('learn', 'inspector')).toBe('#tab=learn&view=inspector')
})

test('old v1.0–v1.3 links resolve to the new places', () => {
  const cases: [string, string | undefined, string, string][] = [
    ['solver', undefined, 'assistant', 'solve'], ['assist', undefined, 'assistant', 'solve'], ['coach', undefined, 'assistant', 'review'],
    ['explore', 'paths', 'assistant', 'watch'], ['path', undefined, 'assistant', 'watch'],
    ['strategies', 'simulation', 'strategies', 'leaderboard'], ['sim', undefined, 'strategies', 'leaderboard'], ['strategies', 'tuner', 'strategies', 'lab'], ['tuner', undefined, 'strategies', 'lab'],
    ['strategies', 'compare', 'strategies', 'compare'], ['compare', undefined, 'strategies', 'compare'],
    ['analytics', 'letters', 'learn', 'letters'], ['analytics', 'patterns', 'learn', 'inspector'], ['analytics', 'openers', 'learn', 'openers'], ['analytics', undefined, 'learn', 'letters'],
    ['patterns', undefined, 'learn', 'inspector'], ['openers', undefined, 'learn', 'openers'], ['letters', undefined, 'learn', 'letters'],
    ['tree', undefined, 'explore', 'tree'], ['flow', undefined, 'explore', 'flow'], ['map', undefined, 'explore', 'map'],
    ['explore', 'map', 'explore', 'map'], ['explore', undefined, 'explore', 'tree'], ['learn', undefined, 'learn', 'guide'],
    ['nonsense', undefined, 'play', ''], ['play', 'x', 'play', ''], ['assistant', 'bogus', 'assistant', 'solve'],
  ]
  for (const [t, v, nt, nv] of cases) expect([t, v, resolve(t, v)]).toEqual([t, v, { tab: nt, view: nv }])
})

const g = (i: number, skill: number, luck: number, n = 4, won = true): GameRecord => ({ id: 'g' + i, t: i, word: 'crane', n, won, hard: false, skill, luck, mode: 'random' })
test('fingerprint averages, win rate and recent trend', () => {
  expect(fingerprint([])).toBeNull()
  const gs = [...Array.from({ length: 10 }, (_, i) => g(i, 0.6, -0.5, 5)), ...Array.from({ length: 10 }, (_, i) => g(10 + i, 0.9, 0.5, 3)), g(99, 0.75, 0, 7, false)]
  const f = fingerprint(gs)!
  expect(f.games).toBe(21)
  expect(f.winRate).toBeCloseTo(20 / 21, 6)
  expect(f.avgGuesses).toBeCloseTo(4, 6)
  expect(f.skill).toBeCloseTo((6 + 9 + 0.75) / 21, 6)
  expect(f.luck).toBeCloseTo(0, 6)
  expect(f.recentSkill).toBeCloseTo((9 * 0.9 + 0.75) / 10, 6)
  expect(f.trend).toBeGreaterThan(0.2)
})
test('nearest strategy by average guesses', () => {
  expect(nearest(3.62, [{ id: 'a', avg: 3.42 }, { id: 'b', avg: 3.6 }, { id: 'c', avg: 4.1 }])?.id).toBe('b')
})
test('share text has the grid, skill, luck and the optimum', () => {
  const s = shareText({ title: 'Wordle Lab #1943', n: 4, hard: true, rows: [[0, 1, 0, 0, 2], [2, 2, 2, 2, 2]], skill: 0.873, luck: -0.44, optimal: 3, labels: { skill: 'Skill', luck: 'Luck', optimal: 'Optimal', bits: 'bits' }, url: 'https://wordle.fundsflow.fun' })
  expect(s.split('\n')).toEqual(['Wordle Lab #1943 4/6*', '⬛🟨⬛⬛🟩', '🟩🟩🟩🟩🟩', 'Skill 87% · Luck −0.4 bits · Optimal 3', 'https://wordle.fundsflow.fun'])
})
