// Pure helpers for the player fingerprint (unit-tested).
export interface GameRecord { id: string; t: number; word: string; n: number; won: boolean; hard: boolean; skill: number; luck: number; mode: 'daily' | 'random' }
export interface Fingerprint { games: number; skill: number; luck: number; avgGuesses: number; winRate: number; recentSkill: number; trend: number }
/** Summary of a list of games: averages, recent (last 10) skill and its change vs the earlier games. */
export function fingerprint(gs: GameRecord[]): Fingerprint | null {
  if (!gs.length) return null
  const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length)
  const won = gs.filter(g => g.won)
  const recent = gs.slice(-10), older = gs.slice(0, -10)
  const recentSkill = avg(recent.map(g => g.skill))
  return { games: gs.length, skill: avg(gs.map(g => g.skill)), luck: avg(gs.map(g => g.luck)), avgGuesses: won.length ? avg(won.map(g => g.n)) : 0, winRate: won.length / gs.length, recentSkill, trend: older.length ? recentSkill - avg(older.map(g => g.skill)) : 0 }
}
/** Nearest strategy by average guesses (what your play "looks like"). */
export function nearest<T extends { avg: number }>(avgGuesses: number, strategies: T[]): T | undefined {
  return [...strategies].sort((a, b) => Math.abs(a.avg - avgGuesses) - Math.abs(b.avg - avgGuesses))[0]
}
/** Signed number with 1 decimal that never reads "−0.0". */
export const signed1 = (v: number) => { const r = +v.toFixed(1); return (r >= 0 ? '+' : '−') + Math.abs(r).toFixed(1) }
/** Share text: emoji grid + skill/luck (+ the optimum's count on this word when known). */
export function shareText(o: { title: string; n: number | 'X'; hard: boolean; rows: number[][]; skill?: number; luck?: number; optimal?: number; labels: { skill: string; luck: string; optimal: string; bits: string }; url: string }) {
  const lines = [`${o.title} ${o.n}/6${o.hard ? '*' : ''}`, ...o.rows.map(d => d.map(x => ['⬛', '🟨', '🟩'][x]).join(''))]
  const extra: string[] = []
  if (o.skill !== undefined) extra.push(`${o.labels.skill} ${Math.round(o.skill * 100)}%`)
  if (o.luck !== undefined) extra.push(`${o.labels.luck} ${signed1(o.luck)} ${o.labels.bits}`)
  if (o.optimal !== undefined) extra.push(`${o.labels.optimal} ${o.optimal}`)
  if (extra.length) lines.push(extra.join(' · '))
  lines.push(o.url)
  return lines.join('\n')
}
