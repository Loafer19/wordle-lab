// Core Wordle engine + solver strategies. Pure TS: runs in browser, Web Worker and Bun.
export type Pattern = number // base-3, 0..242; digit i: 0 gray,1 yellow,2 green
export const ALL_GREEN = 242

export function feedback(guess: string, answer: string): Pattern {
  const res = [0, 0, 0, 0, 0]
  const counts = new Int8Array(26)
  for (let i = 0; i < 5; i++) {
    if (guess.charCodeAt(i) === answer.charCodeAt(i)) res[i] = 2
    else counts[answer.charCodeAt(i) - 97]++
  }
  for (let i = 0; i < 5; i++) {
    if (res[i]) continue
    const c = guess.charCodeAt(i) - 97
    if (counts[c] > 0) { res[i] = 1; counts[c]-- }
  }
  return res[0] + 3 * res[1] + 9 * res[2] + 27 * res[3] + 81 * res[4]
}
export const patternDigits = (p: Pattern) => [0, 1, 2, 3, 4].map(i => Math.floor(p / 3 ** i) % 3)
export const patternEmoji = (p: Pattern) => patternDigits(p).map(d => ['⬜', '🟨', '🟩'][d]).join('')
export const digitsToPattern = (d: number[]) => d.reduce((a, v, i) => a + v * 3 ** i, 0)

export function filter(cands: string[], guess: string, p: Pattern) {
  return cands.filter(w => feedback(guess, w) === p)
}
export function buckets(guess: string, cands: string[]) {
  const b = new Int32Array(243)
  for (const w of cands) b[feedback(guess, w)]++
  return b
}
export function entropy(guess: string, cands: string[]) {
  const b = buckets(guess, cands), n = cands.length
  let h = 0
  for (const c of b) if (c) { const p = c / n; h -= p * Math.log2(p) }
  return h
}
export function letterFreq(words: string[]) {
  const overall = new Array(26).fill(0)       // # words containing letter
  const pos = Array.from({ length: 5 }, () => new Array(26).fill(0))
  for (const w of words) {
    const seen = new Set<number>()
    for (let i = 0; i < 5; i++) { const c = w.charCodeAt(i) - 97; pos[i][c]++; seen.add(c) }
    for (const c of seen) overall[c]++
  }
  return { overall, pos }
}

export interface Ctx { answers: string[]; allowed: string[] }
export interface Suggestion { guess: string; score: number; why: string }
export interface Strategy {
  id: string; name: string; desc: string
  pick(cands: string[], ctx: Ctx, turn: number, hard?: HardState): Suggestion
}
export interface HardState { greens: (string | null)[]; mins: Record<string, number> }

const uniq = (w: string) => [...new Set(w)]
const L = (i: number) => String.fromCharCode(97 + i)

function bestBy(pool: string[], score: (w: string) => number, cands: Set<string>, minimize = false) {
  let best = pool[0], bs = minimize ? Infinity : -Infinity
  for (const w of pool) {
    let s = score(w)
    const better = minimize ? s < bs : s > bs
    const tie = s === bs && cands.has(w) && !cands.has(best)
    if (better || tie) { bs = s; best = w }
  }
  return { best, bs }
}

// Ruslan's strategy: count letter frequencies over remaining candidates, guess word covering most frequent letters, filter, recount.
function freqStrategy(id: string, name: string, fromAll: boolean, positional: boolean): Strategy {
  return {
    id, name,
    desc: `Letter-frequency recount (Ruslan). ${positional ? 'Positional+plain' : 'Plain'} frequency, guess from ${fromAll ? 'any allowed word' : 'remaining candidates only'}.`,
    pick(cands, ctx) {
      if (cands.length <= 2) return { guess: cands[0], score: 1, why: `${cands.length} candidate(s) left — just guess one.` }
      const n = cands.length
      const { overall, pos } = letterFreq(cands)
      // letters present in every candidate carry no information when exploring
      const w8 = overall.map(f => (fromAll && f === n ? 0 : f))
      const score = (w: string) => {
        let s = 0
        for (const c of uniq(w)) s += w8[c.charCodeAt(0) - 97]
        if (positional) for (let i = 0; i < 5; i++) s += pos[i][w.charCodeAt(i) - 97]
        return s
      }
      const pool = fromAll ? ctx.allowed : cands
      const { best, bs } = bestBy(pool, score, new Set(cands))
      const top = overall.map((f, i) => [L(i), f] as const).filter(x => x[1] < n || !fromAll).sort((a, b) => b[1] - a[1]).slice(0, 7)
      return { guess: best, score: bs, why: `Top letters among ${n} candidates: ${top.map(([l, f]) => `${l.toUpperCase()}(${f})`).join(' ')}. "${best.toUpperCase()}" covers the most frequent ones (score ${bs}).` }
    },
  }
}

function bucketStrategy(id: string, name: string, desc: string, fromAll: boolean, kind: 'entropy' | 'minimax' | 'expsize'): Strategy {
  return {
    id, name, desc,
    pick(cands, ctx) {
      const n = cands.length
      if (n <= 2) return { guess: cands[0], score: 0, why: `${n} candidate(s) left — guess one.` }
      const pool = fromAll ? ctx.allowed : cands
      const sc = (w: string) => {
        const b = buckets(w, cands)
        if (kind === 'entropy') { let h = 0; for (const c of b) if (c) { const p = c / n; h -= p * Math.log2(p) } return h }
        if (kind === 'minimax') { let m = 0; for (const c of b) if (c > m) m = c; return m }
        let s = 0; for (const c of b) s += c * c; return s / n
      }
      const { best, bs } = bestBy(pool, sc, new Set(cands), kind !== 'entropy')
      const why = kind === 'entropy'
        ? `"${best.toUpperCase()}" gives ${bs.toFixed(2)} bits expected info (max possible log2(${n}) = ${Math.log2(n).toFixed(2)}); expected remaining ≈ ${(n / 2 ** bs).toFixed(1)}.`
        : kind === 'minimax' ? `"${best.toUpperCase()}" guarantees at most ${bs} candidates remain whatever the feedback.`
        : `"${best.toUpperCase()}" minimises expected remaining candidates: ${bs.toFixed(1)} of ${n}.`
      return { guess: best, score: bs, why }
    },
  }
}

let seed = 12345
const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff)
export const STRATEGIES: Strategy[] = [
  freqStrategy('freq-cand', 'Ruslan freq (candidates)', false, false),
  freqStrategy('freq-all', 'Ruslan freq (any word)', true, false),
  freqStrategy('freqpos-cand', 'Ruslan pos-freq (candidates)', false, true),
  freqStrategy('freqpos-all', 'Ruslan pos-freq (any word)', true, true),
  bucketStrategy('entropy-all', 'Max entropy (3b1b)', 'Maximise expected information (Shannon entropy of feedback distribution), any allowed word; ties prefer candidates.', true, 'entropy'),
  bucketStrategy('entropy-cand', 'Max entropy (candidates)', 'Max entropy but only guessing possible answers (hard-mode-ish).', false, 'entropy'),
  bucketStrategy('minimax-all', 'Minimax worst bucket', 'Minimise the largest remaining group (Knuth Mastermind style).', true, 'minimax'),
  bucketStrategy('expsize-all', 'Min expected size', 'Minimise expected number of remaining candidates (sum of squares of bucket sizes).', true, 'expsize'),
  { id: 'random', name: 'Random candidate', desc: 'Baseline: random word still consistent with feedback.',
    pick(c) { const g = c[Math.floor(rnd() * c.length)]; return { guess: g, score: 0, why: `Random pick among ${c.length} consistent words.` } } },
]

export interface GameTrace { answer: string; guesses: string[]; sizes: number[] }
export interface SimResult {
  id: string; name: string; avg: number; failRate: number; worst: number
  dist: number[] /* index = guesses (1..), last bucket >6 = fail */; avgSizes: number[]; opener: string; ms: number; worstWords: string[]
}

export function simulate(strat: Strategy, ctx: Ctx, onProgress?: (i: number) => void, maxTurns = 12): SimResult {
  const t0 = performance.now(); seed = 12345
  const memo = new Map<string, string>() // candidate-set key -> guess (deterministic strategies form a tree)
  const keyOf = (c: string[]) => c.join('')
  const dist = new Array(maxTurns + 2).fill(0)
  const sizeSum = new Array(maxTurns + 1).fill(0), sizeCnt = new Array(maxTurns + 1).fill(0)
  let total = 0, worst = 0, fails = 0, worstWords: string[] = [], opener = ''
  ctx.answers.forEach((ans, idx) => {
    let cands = ctx.answers, turn = 0
    while (turn < maxTurns) {
      sizeSum[turn] += cands.length; sizeCnt[turn]++
      turn++
      let g: string
      const k = keyOf(cands)
      if (strat.id !== 'random' && memo.has(k)) g = memo.get(k)!
      else { g = strat.pick(cands, ctx, turn).guess; if (strat.id !== 'random') memo.set(k, g) }
      if (turn === 1 && !opener) opener = g
      const p = feedback(g, ans)
      if (p === ALL_GREEN) break
      cands = filter(cands, g, p)
    }
    total += turn; dist[Math.min(turn, maxTurns + 1)]++
    if (turn > 6) fails++
    if (turn > worst) { worst = turn; worstWords = [ans] } else if (turn === worst && worstWords.length < 8) worstWords.push(ans)
    if (onProgress && idx % 50 === 0) onProgress(idx)
  })
  const n = ctx.answers.length
  return { id: strat.id, name: strat.name, avg: total / n, failRate: fails / n, worst, dist,
    avgSizes: sizeSum.map((s, i) => (sizeCnt[i] ? s / n : 0)).filter((_, i) => sizeCnt[i]), opener, ms: performance.now() - t0, worstWords }
}
