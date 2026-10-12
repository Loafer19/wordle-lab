// Composable strategies ("Strategy Lab") + the Explore-then-exploit family.
// Turns 1..K ("explore"): guess from ALL valid words with the explore score. Later turns ("exploit"): guess only among possible answers.
import { buckets, letterFreq, type Strategy, type Ctx } from './wordle'
import { CI, L } from './alpha'

export type Score = 'entropy' | 'expsize' | 'minimax' | 'freq' | 'freqpos' | 'freqbal'
export interface Spec {
  id: string; name: string
  opener: string            // '' = computed by the explore score
  exploreTurns: number      // K: turns 1..K may use any valid word (0 = candidates only from the start)
  explore: Score; exploit: Score
  tie: 'candidate' | 'alpha'
}
export const SCORE_LABEL: Record<Score, string> = {
  entropy: 'Max entropy (bits)', expsize: 'Min expected remaining', minimax: 'Minimax (smallest worst case)',
  freq: 'Ruslan freq', freqpos: 'Ruslan positional', freqbal: 'Ruslan balanced f·(n−f)',
}
/** Returns a "higher is better" scorer for one candidate set. */
function scorer(kind: Score, cands: string[]): (w: string) => number {
  const n = cands.length
  if (kind === 'entropy') return w => { let h = 0; for (const c of buckets(w, cands)) if (c) { const p = c / n; h -= p * Math.log2(p) } return h }
  if (kind === 'expsize') return w => { let s = 0; for (const c of buckets(w, cands)) s += c * c; return -s / n }
  if (kind === 'minimax') return w => { let m = 0; for (const c of buckets(w, cands)) if (c > m) m = c; return -m }
  const { overall, pos } = letterFreq(cands)
  const w8 = overall.map(f => (kind === 'freqbal' ? f * (n - f) : f === n ? 0 : f))
  return w => {
    let s = 0; const seen = new Set<number>()
    for (let i = 0; i < 5; i++) {
      const c = CI[w.charCodeAt(i)]
      if (!seen.has(c)) { seen.add(c); s += w8[c] }
      if (kind === 'freqbal') { const f = pos[i][c]; s += f * (n - f) } else if (kind === 'freqpos') s += pos[i][c]
    }
    return s
  }
}
const explain = (kind: Score, cands: string[], g: string, s: number) => {
  const n = cands.length
  if (kind === 'entropy') return `${s.toFixed(2)} bits expected (≈ ${(n / 2 ** s).toFixed(1)} of ${n} left)`
  if (kind === 'expsize') return `≈ ${(-s).toFixed(1)} of ${n} expected to remain`
  if (kind === 'minimax') return `at most ${-s} of ${n} remain whatever the colours`
  const { overall } = letterFreq(cands)
  const top = overall.map((f, i) => [L(i), f] as const).filter(x => x[1] > 0 && x[1] < n).sort((a, b) => b[1] - a[1]).slice(0, 5)
  return `covers frequent letters ${top.map(([l, f]) => `${l.toUpperCase()}(${f})`).join(' ')}; score ${Math.round(s)}`
  void g
}
export function composeStrategy(sp: Spec): Strategy {
  return {
    id: sp.id, name: sp.name,
    desc: `${sp.opener ? `Opener ${sp.opener.toUpperCase()}. ` : ''}${sp.exploreTurns ? `Turns 1–${sp.exploreTurns}: any valid word by ${SCORE_LABEL[sp.explore]}. ` : ''}Then possible answers only, by ${SCORE_LABEL[sp.exploit]}.`,
    pick(cands, ctx: Ctx, turn) {
      const n = cands.length
      if (n <= 2) return { guess: cands[0], score: 0, why: `${n} candidate(s) left — guess one.` }
      if (turn === 1 && sp.opener && ctx.allowed.includes(sp.opener)) return { guess: sp.opener, score: 0, why: `Fixed opener ${sp.opener.toUpperCase()}.` }
      const exploring = turn <= sp.exploreTurns
      const kind = exploring ? sp.explore : sp.exploit
      const allowedSet = exploring ? null : new Set(ctx.allowed)
      const pool = exploring ? ctx.allowed : cands.filter(w => allowedSet!.has(w)) // hard-mode pools stay respected
      const sc = scorer(kind, cands), cset = new Set(cands)
      let best = pool[0] ?? cands[0], bs = -Infinity
      for (const w of pool) {
        const s = sc(w)
        if (s > bs || (s === bs && (sp.tie === 'candidate' ? cset.has(w) && !cset.has(best) : w < best))) { bs = s; best = w }
      }
      return { guess: best, score: bs, why: `${exploring ? `Explore (turn ${turn} of ${sp.exploreTurns}, any word)` : 'Exploit (possible answers only)'}: "${best.toUpperCase()}" — ${explain(kind, cands, best, bs)}.` }
    },
  }
}
export const PRESETS: Spec[] = [
  { id: 'explore1-cand', name: 'Explore 1 → candidates (entropy)', opener: '', exploreTurns: 1, explore: 'entropy', exploit: 'entropy', tie: 'candidate' },
  { id: 'explore2-cand', name: 'Explore 2 → candidates (Ruslan balanced)', opener: '', exploreTurns: 2, explore: 'entropy', exploit: 'freqbal', tie: 'candidate' },
]
export const PRESET_STRATEGIES = PRESETS.map(composeStrategy)
