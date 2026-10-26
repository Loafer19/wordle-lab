// Learn › Small groups in your head: the worked example and the group arithmetic behind it (pure; unit-tested).
import { feedback, ALL_GREEN } from './wordle'

export interface Group { p: number; words: string[] }
/** Feedback groups of `guess` over `cands`: singletons first, then by size; a group's words keep the candidates' order. */
export function groupsOf(guess: string, cands: string[]): Group[] {
  const m = new Map<number, string[]>()
  for (const c of cands) { const p = feedback(guess, c); m.set(p, [...(m.get(p) ?? []), c]) }
  return [...m].map(([p, words]) => ({ p, words })).sort((a, b) => a.words.length - b.words.length || (b.p === ALL_GREEN ? 1 : 0) - (a.p === ALL_GREEN ? 1 : 0) || a.p - b.p)
}
/** What you count in your head: groups of one (solved next turn; the all-green one is solved now) and the largest group (the tie-break). */
export function tally(guess: string, cands: string[]) {
  const g = groupsOf(guess, cands)
  return { groups: g.length, singletons: g.filter(x => x.words.length === 1).length, largest: Math.max(0, ...g.map(x => x.words.length)), score: g.reduce((s, x) => s + 1 / x.words.length, 0) }
}
/** Best guesses for the example over a whole word list: most singletons, then the smallest largest group. */
export function bestScouts(cands: string[], pool: string[], k = 3) {
  return pool.map(w => ({ w, ...tally(w, cands) })).sort((a, b) => b.singletons - a.singletons || a.largest - b.largest || a.w.localeCompare(b.w)).slice(0, k)
}
/** The worked example per language: six answers differing in one letter, the tempting candidate (trap) and the scout. Verified in tests. */
export const EXAMPLE = {
  en: { cands: ['batch', 'hatch', 'latch', 'match', 'patch', 'watch'], trap: 'match', scout: 'plumb', extra: ['catch', 'chomp'] },
  ua: { cands: ['мавка', 'майка', 'мамка', 'марка', 'маска', 'матка'], trap: 'маска', scout: 'створ', extra: ['банка', 'актор'] },
} as const
/** Leaderboard numbers quoted in the lesson (same opener for both): Small groups vs max entropy. */
export const LESSON_RESULT = { en: { sg: 3.4497, ent: 3.4337, opener: 'SALET' }, ua: { sg: 3.3943, ent: 3.3960, opener: 'КОТРА' } } as const
