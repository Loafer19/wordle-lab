// Core Wordle engine + solver strategies. Pure TS: runs in browser, Web Worker and Bun.
import { CI, NL, L } from './alpha'
import { t as tr } from './i18n'
export type Pattern = number // base-3, 0..242; digit i: 0 gray,1 yellow,2 green
export const ALL_GREEN = 242

export function feedback(guess: string, answer: string): Pattern {
  const res = [0, 0, 0, 0, 0]
  const counts = new Int8Array(NL)
  for (let i = 0; i < 5; i++) {
    if (guess.charCodeAt(i) === answer.charCodeAt(i)) res[i] = 2
    else counts[CI[answer.charCodeAt(i)]]++
  }
  for (let i = 0; i < 5; i++) {
    if (res[i]) continue
    const c = CI[guess.charCodeAt(i)]
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
  const overall = new Array(NL).fill(0)       // # words containing letter
  const pos = Array.from({ length: 5 }, () => new Array(NL).fill(0))
  for (const w of words) {
    const seen = new Set<number>()
    for (let i = 0; i < 5; i++) { const c = CI[w.charCodeAt(i)]; pos[i][c]++; seen.add(c) }
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
function freqStrategy(id: string, name: string, fromAll: boolean, positional: boolean, balanced = false): Strategy {
  return {
    id, name,
    desc: `Letter-frequency recount (Ruslan). ${balanced ? 'Balanced score f·(n−f) for letters and for letter-at-position: letters in about half the remaining words count most' : positional ? 'Positional+plain' : 'Plain'} frequency, guess from ${fromAll ? 'any allowed word' : 'remaining candidates only'}.`,
    pick(cands, ctx) {
      if (cands.length <= 2) return { guess: cands[0], score: 1, why: tr('{n} candidate(s) left — guess one.', { n: cands.length }) }
      const n = cands.length
      const { overall, pos } = letterFreq(cands)
      // letters present in every candidate carry no information when exploring
      const w8 = overall.map(f => (balanced ? f * (n - f) : fromAll && f === n ? 0 : f))
      const score = (w: string) => {
        let s = 0
        for (const c of uniq(w)) s += w8[CI[c.charCodeAt(0)]]
        if (balanced) for (let i = 0; i < 5; i++) { const f = pos[i][CI[w.charCodeAt(i)]]; s += f * (n - f) }
        else if (positional) for (let i = 0; i < 5; i++) s += pos[i][CI[w.charCodeAt(i)]]
        return s
      }
      const pool = fromAll ? ctx.allowed : cands
      const { best, bs } = bestBy(pool, score, new Set(cands))
      const top = overall.map((f, i) => [L(i), f] as const).filter(x => x[1] < n || !fromAll).sort((a, b) => b[1] - a[1]).slice(0, 7)
      return { guess: best, score: bs, why: tr('Top letters among {n} candidates: {top}. "{w}" covers the most frequent ones (score {s}).', { n, top: top.map(([l, f]) => `${l.toUpperCase()}(${f})`).join(' '), w: best.toUpperCase(), s: bs }) }
    },
  }
}

function bucketStrategy(id: string, name: string, desc: string, fromAll: boolean, kind: 'entropy' | 'minimax' | 'expsize'): Strategy {
  return {
    id, name, desc,
    pick(cands, ctx) {
      const n = cands.length
      if (n <= 2) return { guess: cands[0], score: 0, why: tr('{n} candidate(s) left — guess one.', { n }) }
      const pool = fromAll ? ctx.allowed : cands
      const sc = (w: string) => {
        const b = buckets(w, cands)
        if (kind === 'entropy') { let h = 0; for (const c of b) if (c) { const p = c / n; h -= p * Math.log2(p) } return h }
        if (kind === 'minimax') { let m = 0; for (const c of b) if (c > m) m = c; return m }
        let s = 0; for (const c of b) s += c * c; return s / n
      }
      const { best, bs } = bestBy(pool, sc, new Set(cands), kind !== 'entropy')
      const why = kind === 'entropy'
        ? tr('"{w}" gives {b} bits expected info (max possible log2({n}) = {m}); expected remaining ≈ {r}.', { w: best.toUpperCase(), b: bs.toFixed(2), n, m: Math.log2(n).toFixed(2), r: (n / 2 ** bs).toFixed(1) })
        : kind === 'minimax' ? tr('"{w}" guarantees at most {b} candidates remain whatever the feedback.', { w: best.toUpperCase(), b: bs })
        : tr('"{w}" minimises expected remaining candidates: {b} of {n}.', { w: best.toUpperCase(), b: bs.toFixed(1), n })
      return { guess: best, score: bs, why }
    },
  }
}

/** Singleton score of a guess: Σ over feedback groups of 1/|group| (= expected chance of knowing the answer next turn, × n), plus its largest group. */
export function singletonScore(guess: string, cands: string[]) {
  const b = buckets(guess, cands)
  let s = 0, max = 0
  for (const c of b) if (c) { s += 1 / c; if (c > max) max = c }
  return { s, max }
}
export const SINGLETON_OPENER = { en: 'salet', ua: 'котра' } as const
const SINGLETON_EPS = 1e-9
// 'Small groups': maximise Σ 1/|group| (many singleton groups → a good chance to solve on the next turn), but only among guesses
// whose largest group is at most ⌈n/4⌉; with no such guess fall back to max entropy. Any allowed word; ties prefer candidates.
function singletonStrategy(): Strategy {
  const entropyFallback = bucketStrategy('entropy-all', 'Max entropy', '', true, 'entropy')
  return {
    id: 'singleton-all', name: 'Small groups (singletons, ⌈n/4⌉ cap)',
    desc: 'Maximise the sum of 1/group size over the feedback groups (many groups of one → a good chance to solve next turn), only among guesses whose largest group is at most ⌈n/4⌉ of the n remaining answers; if no guess meets the cap, max entropy. Any allowed word; ties prefer possible answers. Fixed opener: SALET (EN) / КОТРА (UA).',
    pick(cands, ctx, turn) {
      const n = cands.length
      if (n <= 2) return { guess: cands[0], score: 1, why: tr('{n} candidate(s) left — guess one.', { n }) }
      if (turn === 1 && n === ctx.answers.length) {
        const o = /^[a-z]/.test(cands[0]) ? SINGLETON_OPENER.en : SINGLETON_OPENER.ua
        if (ctx.allowed.includes(o)) { const r = singletonScore(o, cands); return { guess: o, score: r.s, why: tr('Opener "{w}": {k} feedback groups, the largest has {m} of {n} answers.', { w: o.toUpperCase(), k: buckets(o, cands).filter(Boolean).length, m: r.max, n }) } }
      }
      const cap = Math.ceil(n / 4), cs = new Set(cands)
      let best = '', bs = -Infinity, bm = 0
      for (const w of ctx.allowed) {
        const r = singletonScore(w, cands)
        if (r.max > cap) continue
        if (r.s > bs + SINGLETON_EPS || (r.s > bs - SINGLETON_EPS && cs.has(w) && !cs.has(best))) { best = w; bs = r.s; bm = r.max }
      }
      if (!best) { const f = entropyFallback.pick(cands, ctx, turn); return { ...f, why: tr('No guess keeps every group at ⌈{n}/4⌉ = {c} or fewer — falling back to max entropy.', { n, c: cap }) + ' ' + f.why } }
      return { guess: best, score: bs, why: tr('"{w}" leaves about {s} answers alone in their group (chance {p}% to know the answer next turn); its largest group is {m} ≤ ⌈{n}/4⌉ = {c}.', { w: best.toUpperCase(), s: bs.toFixed(1), p: Math.round((100 * bs) / n), m: bm, n, c: cap }) }
    },
  }
}

let seed = 12345
const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff)
export const STRATEGIES: Strategy[] = [
  freqStrategy('freq-cand', 'Ruslan freq (candidates)', false, false),
  freqStrategy('freqpos-cand', 'Ruslan pos-freq (candidates)', false, true),
  freqStrategy('freqbal-cand', 'Ruslan balanced f·(n−f) (candidates)', false, false, true),
  bucketStrategy('entropy-all', 'Max entropy (3b1b)', 'Maximise expected information (Shannon entropy of feedback distribution), any allowed word; ties prefer candidates.', true, 'entropy'),
  bucketStrategy('entropy-cand', 'Max entropy (candidates)', 'Max entropy but only guessing possible answers (hard-mode-ish).', false, 'entropy'),
  bucketStrategy('minimax-all', 'Minimax worst bucket', 'Minimise the largest remaining group (Knuth Mastermind style).', true, 'minimax'),
  bucketStrategy('expsize-all', 'Min expected size', 'Minimise expected number of remaining candidates (sum of squares of bucket sizes).', true, 'expsize'),
  singletonStrategy(),
  { id: 'random', name: 'Random candidate', desc: 'Baseline: random word still consistent with feedback.',
    pick(c) { const g = c[Math.floor(rnd() * c.length)]; return { guess: g, score: 0, why: tr('Random pick among {n} consistent words.', { n: c.length }) } } },
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

/** Play one game with a strategy; returns guesses + candidate sizes and explanations. opener can short-circuit the expensive first pick. */
export function playOne(strat: Strategy, ctx: Ctx, answer: string, opener?: string, maxTurns = 10) {
  let cands = ctx.answers
  const steps: { guess: string; pattern: Pattern; before: number; after: number; why: string }[] = []
  for (let t = 1; t <= maxTurns; t++) {
    const s = t === 1 && opener ? { guess: opener, why: tr('Opener "{w}" (precomputed for this strategy).', { w: opener.toUpperCase() }), score: 0 } : strat.pick(cands, ctx, t)
    const p = feedback(s.guess, answer), next = filter(cands, s.guess, p)
    steps.push({ guess: s.guess, pattern: p, before: cands.length, after: next.length, why: s.why })
    if (p === ALL_GREEN) break
    cands = next
  }
  return steps
}
