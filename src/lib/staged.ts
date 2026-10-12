// Ruslan's explainable letter-based "staged" strategies (round 8).
// Stage 1 (turns 1..coverTurns): COVERAGE — any valid word, no repeated letters, covering letters whose presence rate
//   among the remaining answers is closest to 50%, plus a positional bonus (letter often/sometimes in that spot) and a
//   penalty for putting a letter where no remaining answer has it (e.g. Z first).
//   Optional pair awareness: 'pair' subtracts double counting of letters that tend to appear together; 'joint' scores
//   the exact split produced by the letters' joint presence (still only "is the letter in the word?", no positions).
// Stage 2 (up to clusterUntil): CLUSTER SPLITTER — if the answers contain a "trap" (≥ clusterMin words differing in a
//   single position, e.g. _ATCH), guess any valid word that hits the most distinguishing letters.
// Stage 3: CANDIDATES — only possible answers, Ruslan balanced f·(n−f) score with an optional TRAP penalty for
//   guesses that leave big one-letter-difference clusters unresolved.
import type { Strategy, Ctx } from './wordle'
import { CI, NL, L } from './alpha'
import { t } from './i18n'

export type PairMode = 'none' | 'pair' | 'joint'
export interface StagedParams {
  id: string; name: string
  coverTurns: number      // turns that may use the coverage stage
  switchN: number         // go to candidates when ≤ switchN answers remain
  posW: number            // positional bonus weight (coverage)
  posPen: number          // penalty for letter in a position no remaining answer has it
  pair: PairMode; pairW: number
  clusterUntil: number    // last turn on which the cluster splitter may fire
  clusterMin: number      // minimum cluster size that triggers the splitter
  trapW: number           // trap penalty weight in the candidates stage
  candPairs?: boolean     // candidates stage: use joint-presence instead of freqbal
  candBonus?: number      // coverage: bonus for a word that could itself be the answer (chance 1/n of winning now)
}

interface Cluster { m: number; letters: Set<number>; pos: number }
/** Groups of ≥2 answers identical except in one position (e.g. batch/catch/hatch/latch/match/patch/watch). Keeps the largest group per word. */
export function findClusters(cands: string[], min = 2): Cluster[] {
  const out: Cluster[] = []
  for (let p = 0; p < 5; p++) {
    const g = new Map<string, number[]>()
    for (const w of cands) { const k = w.slice(0, p) + '_' + w.slice(p + 1); const c = CI[w.charCodeAt(p)]; const a = g.get(k); a ? a.push(c) : g.set(k, [c]) }
    for (const a of g.values()) if (a.length >= min) out.push({ m: a.length, letters: new Set(a), pos: p })
  }
  return out.sort((a, b) => b.m - a.m)
}
/** How much a guess shrinks the clusters: a cluster of m with k of its letters hit becomes k singles + one group of m−k. Gain = Σ m² − ((m−k)² + k). */
function splitGain(w: string, cl: Cluster[]) {
  const ls = new Set<number>(); for (let i = 0; i < 5; i++) ls.add(CI[w.charCodeAt(i)])
  let g = 0
  for (const c of cl) { let k = 0; for (const l of c.letters) if (ls.has(l)) k++; if (k >= c.m) k = c.m - 1; g += c.m * c.m - ((c.m - k) * (c.m - k) + k) }
  return g
}
function stats(cands: string[], withPairs: boolean) {
  const n = cands.length, cnt = new Float64Array(NL), pos = Array.from({ length: 5 }, () => new Float64Array(NL))
  const co = withPairs ? new Float64Array(NL * NL) : null
  const lets: number[][] = []
  for (const w of cands) {
    const s: number[] = []
    for (let i = 0; i < 5; i++) { const c = CI[w.charCodeAt(i)]; pos[i][c]++; if (!s.includes(c)) s.push(c) }
    for (const c of s) cnt[c]++
    if (co) for (let a = 0; a < s.length; a++) for (let b = a + 1; b < s.length; b++) { co[s[a] * NL + s[b]]++; co[s[b] * NL + s[a]]++ }
    lets.push(s)
  }
  return { n, cnt, pos, co, lets }
}
type St = ReturnType<typeof stats>
const bal = (f: number, n: number) => 4 * (f / n) * (1 - f / n) // 1 when the letter is in exactly half the answers
function coverScore(w: string, S: St, P: StagedParams, cands: string[], noRepeat: boolean) {
  const { n, cnt, pos, co } = S
  const cs: number[] = []
  for (let i = 0; i < 5; i++) { const c = CI[w.charCodeAt(i)]; if (cs.includes(c)) { if (noRepeat) return -Infinity } else cs.push(c) }
  let s = 0
  if (P.pair === 'joint') {
    // entropy (bits) of the split by joint presence of this word's letters
    const b = new Map<number, number>()
    for (const set of S.lets) { let k = 0; for (let j = 0; j < cs.length; j++) if (set.includes(cs[j])) k |= 1 << j; b.set(k, (b.get(k) ?? 0) + 1) }
    for (const v of b.values()) { const p = v / n; s -= p * Math.log2(p) }
  } else {
    for (const c of cs) s += bal(cnt[c], n)
    if (P.pair === 'pair' && co) for (let a = 0; a < cs.length; a++) for (let b = a + 1; b < cs.length; b++) {
      const pab = co[cs[a] * NL + cs[b]] / n, pa = cnt[cs[a]] / n, pb = cnt[cs[b]] / n
      s -= P.pairW * 4 * Math.max(0, pab - pa * pb)
    }
  }
  for (let i = 0; i < 5; i++) { const c = CI[w.charCodeAt(i)], f = pos[i][c]; s += P.posW * bal(f, n); if (f === 0 && cnt[c] > 0) s -= P.posPen }
  void cands
  return s
}
function candScore(w: string, S: St) {
  const { n, cnt, pos } = S; let s = 0; const seen: number[] = []
  for (let i = 0; i < 5; i++) { const c = CI[w.charCodeAt(i)]; if (!seen.includes(c)) { seen.push(c); s += bal(cnt[c], n) } s += bal(pos[i][c], n) }
  return s
}

export function stagedStrategy(P: StagedParams): Strategy {
  return {
    id: P.id, name: P.name,
    desc: t('Ruslan staged: turns 1–{k} cover letters present in about half the remaining answers (no repeats, positional bonus{pair}); then a cluster splitter breaks traps like _ATCH; then possible answers only (balanced letters{trap}).',
      { k: P.coverTurns, pair: P.pair === 'none' ? '' : P.pair === 'joint' ? t(', joint letter presence') : t(', pair-aware'), trap: P.trapW ? t(' + trap penalty') : '' }),
    pick(cands, ctx: Ctx, turn) {
      const n = cands.length
      if (n <= 2) return { guess: cands[0], score: 0, why: t('{n} candidate(s) left — guess one.', { n }) }
      const cset = new Set(cands)
      const S = stats(cands, P.pair === 'pair')
      const top = () => [...S.cnt].map((f, i) => [L(i), f] as const).filter(x => x[1] > 0 && x[1] < n).sort((a, b) => Math.abs(a[1] - n / 2) - Math.abs(b[1] - n / 2)).slice(0, 6).map(([l, f]) => `${l.toUpperCase()}(${Math.round(100 * f / n)}%)`).join(' ')
      const argmax = (pool: string[], f: (w: string) => number) => {
        let best = '', bs = -Infinity
        for (const w of pool) { const s = f(w); if (s > bs + 1e-12 || (Math.abs(s - bs) <= 1e-12 && cset.has(w) && !cset.has(best))) { bs = s; best = w } }
        return { best, bs }
      }
      // 1) coverage
      if (turn <= P.coverTurns && n > P.switchN) {
        const cb = (P.candBonus ?? 0) / n
        let r = argmax(ctx.allowed, w => coverScore(w, S, P, cands, true) + (cset.has(w) ? cb : 0))
        if (!r.best) r = argmax(ctx.allowed, w => coverScore(w, S, P, cands, false)) // hard mode may force repeats
        return { guess: r.best, score: r.bs, why: t('Coverage (turn {k}): "{w}" covers letters present in about half of the {n} answers: {top}.', { k: turn, w: r.best.toUpperCase(), n, top: top() }) }
      }
      // 2) cluster splitter
      const cl = findClusters(cands, 2)
      if (turn <= P.clusterUntil && n > P.switchN / 4 && cl.length && cl[0].m >= P.clusterMin) {
        const r = argmax(ctx.allowed, w => splitGain(w, cl) + 0.01 * candScore(w, S) + (cset.has(w) ? 0.5 : 0))
        const big = cl[0], pat = cands.find(w => { const k = CI[w.charCodeAt(big.pos)]; return big.letters.has(k) })!
        const shape = (pat.slice(0, big.pos) + '_' + pat.slice(big.pos + 1)).toUpperCase()
        return { guess: r.best, score: r.bs, why: t('Cluster splitter: {m} answers look like {shape} ({ls}); "{w}" tests the most of those letters at once.', { m: big.m, shape, ls: [...big.letters].map(c => L(c).toUpperCase()).join(''), w: r.best.toUpperCase() }) }
      }
      // 3) candidates only
      const allowedSet = new Set(ctx.allowed)
      const pool = cands.filter(w => allowedSet.has(w))
      const r = argmax(pool.length ? pool : cands, w => (P.candPairs ? coverScore(w, S, { ...P, pair: 'joint', posW: 0.5, posPen: 0 }, cands, false) : candScore(w, S)) + (P.trapW ? P.trapW * splitGain(w, cl) / n : 0))
      return { guess: r.best, score: r.bs, why: t('Possible answers only: "{w}" best balances the letters {top}{trap}.', { w: r.best.toUpperCase(), top: top(), trap: P.trapW && cl.length ? t(' and breaks the biggest look-alike group') : '' }) }
    },
  }
}
const base: Omit<StagedParams, 'id' | 'name'> = { coverTurns: 2, switchN: 12, posW: 0.5, posPen: 0.3, pair: 'none', pairW: 1, clusterUntil: 4, clusterMin: 4, trapW: 0 }
export const stagedVariant = (p: Partial<StagedParams> & { id: string; name: string }): StagedParams => ({ ...base, ...p })
// Best variants from the round-8 sweeps (scripts/staged-sweep.ts, scripts/sweeps/*.json).
export const STAGED_PRESETS: StagedParams[] = [
  stagedVariant({ id: 'staged-adaptive', name: 'Ruslan staged (coverage until ≤3 left)', coverTurns: 99, switchN: 3, posW: 0.25, posPen: 0, pair: 'joint', trapW: 2, clusterMin: 4, clusterUntil: 4, candPairs: true, candBonus: 4 }),
  stagedVariant({ id: 'staged-2turn', name: 'Ruslan staged (2 coverage turns + cluster splitter)', coverTurns: 2, switchN: 6, posW: 0.25, posPen: 0, pair: 'joint', trapW: 3, clusterMin: 3, clusterUntil: 4, candPairs: true, candBonus: 4 }),
]
export const STAGED_STRATEGIES = STAGED_PRESETS.map(stagedStrategy)
