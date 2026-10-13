// Advanced solvers + rich simulation (hard mode, decision trees, per-answer stats).
import { CI, NL } from './alpha'
import { feedback, filter, buckets, entropy, ALL_GREEN, STRATEGIES, type Strategy, type Ctx, type Pattern } from './wordle'
import { t } from './i18n'

export const OPTIMUM = { normal: 7920 / 2315, hard: 8122 / 2315 } // 3.4212 / 3.5084 (Selby; Bertsimas & Paskov)

// ---------- hard mode ----------
export interface Step { g: string; p: Pattern }
/** Wordle hard mode: greens must stay in place, revealed (yellow/green) letters must be reused with at least the same multiplicity. */
export function hardValid(word: string, history: Step[]) {
  for (const { g, p } of history) {
    const need = new Int8Array(NL), have = new Int8Array(NL)
    let q = p
    for (let i = 0; i < 5; i++) {
      const d = q % 3; q = (q - d) / 3
      const c = CI[g.charCodeAt(i)]
      if (d === 2 && word.charCodeAt(i) !== g.charCodeAt(i)) return false
      if (d > 0) need[c]++
    }
    for (let i = 0; i < 5; i++) have[CI[word.charCodeAt(i)]]++
    for (let c = 0; c < NL; c++) if (need[c] > have[c]) return false
  }
  return true
}

// ---------- tree types ----------
export interface TreeNode { g: string; n: number; c?: Record<number, TreeNode> } // c keyed by pattern; solved branch (242) omitted

// ---------- two-step lookahead entropy ----------
function bestOneStep(pool: string[], cands: string[]) {
  let best = -1
  for (const w of pool) { const h = entropy(w, cands); if (h > best) best = h }
  return best
}
export function twoStepStrategy(K1 = 12, K2 = 150): Strategy {
  return {
    id: 'entropy2-all', name: 'Two-step entropy', desc: `Lookahead: maximise H(guess1) + E[max H(guess2)] over the resulting buckets. Prunes to the top ${K1} one-step guesses and ${K2} second-guess candidates per node.`,
    pick(cands, ctx) {
      const n = cands.length
      if (n <= 2) return { guess: cands[0], score: 0, why: t('{n} candidate(s) left — guess one.', { n }) }
      const cset = new Set(cands)
      const scored = ctx.allowed.map(w => ({ w, h: entropy(w, cands) + (cset.has(w) ? 1e-9 : 0) })).sort((a, b) => b.h - a.h)
      if (n <= 3 || scored[0].h >= Math.log2(n) - 1e-9) { const w = scored.find(s => cset.has(s.w) && s.h >= scored[0].h - 1e-6)?.w ?? scored[0].w; return { guess: w, score: scored[0].h, why: t('"{w}" splits all {n} candidates perfectly.', { w: w.toUpperCase(), n }) } }
      const top2 = scored.slice(0, K2).map(s => s.w)
      let best = { w: scored[0].w, s: -1, h1: 0, h2: 0 }
      for (const { w, h } of scored.slice(0, K1)) {
        const groups = new Map<number, string[]>()
        for (const a of cands) { const p = feedback(w, a); if (p === ALL_GREEN) continue; const g = groups.get(p); g ? g.push(a) : groups.set(p, [a]) }
        let e2 = 0
        for (const g of groups.values()) {
          if (g.length <= 2) { e2 += (g.length / n) * Math.log2(g.length); continue }
          e2 += (g.length / n) * Math.max(bestOneStep(g, g), bestOneStep(top2, g))
        }
        const s = h + e2 + (cset.has(w) ? 0.02 : 0)
        if (s > best.s) best = { w, s, h1: h, h2: e2 }
      }
      return { guess: best.w, score: best.s, why: t('"{w}": {a} bits now + {b} expected bits from the best follow-up = {c} bits over two guesses (of {d} needed).', { w: best.w.toUpperCase(), a: best.h1.toFixed(2), b: best.h2.toFixed(2), c: (best.h1 + best.h2).toFixed(2), d: Math.log2(n).toFixed(2) }) }
    },
  }
}

// ---------- optimal tree (Alex Selby's published SALET trees) ----------
const B2D: Record<string, number> = { B: 0, Y: 1, G: 2 }
export const patFromBYG = (s: string) => [...s].reduce((a, ch, i) => a + B2D[ch] * 3 ** i, 0)
/** Parse Selby's indented .tree format into a TreeNode. */
export function parseSelbyTree(text: string): TreeNode {
  let prev = ''
  const root: TreeNode = { g: '', n: 0, c: {} }
  for (const raw of text.split('\n')) {
    if (!raw.trim()) continue
    const ind = raw.length - raw.trimStart().length
    const full = prev.slice(0, ind) + raw.trimStart(); prev = full
    const t = full.split(/\s+/)
    let node = root
    for (let i = 0; i < t.length; i += 2) {
      const g = t[i], pat = t[i + 1].slice(0, 5)
      if (!node.g) node.g = g
      node.n++
      if (pat === 'GGGGG') break
      const p = patFromBYG(pat)
      node.c ??= {}
      node = node.c[p] ??= { g: '', n: 0 }
    }
  }
  return root
}
/** Check every answer follows the tree to GGGGG using our feedback() and (optionally) hard-mode validity. */
export function verifyTree(tree: TreeNode, answers: string[], hard = false) {
  const errors: string[] = []
  for (const ans of answers) {
    let node: TreeNode | undefined = tree; const hist: Step[] = []; let k = 0
    while (node) {
      k++
      if (hard && !hardValid(node.g, hist)) { errors.push(`${ans}: ${node.g} violates hard mode`); break }
      const p = feedback(node.g, ans)
      if (p === ALL_GREEN) break
      hist.push({ g: node.g, p }); node = node.c?.[p]
      if (!node) errors.push(`${ans}: tree has no branch`)
    }
  }
  return errors
}

// ---------- tunable letter-frequency (Ruslan) ----------
export interface TuneParams { wPlain: number; wPos: number; balanced: boolean; topN: number; fromAll: boolean }
export function tunableStrategy(t: TuneParams): Strategy {
  return {
    id: 'ruslan-tuned', name: 'Ruslan tuned', desc: `plain ${t.wPlain}, positional ${t.wPos}, ${t.balanced ? 'balanced f(n−f)' : 'raw f'}, top ${t.topN} letters, ${t.fromAll ? 'any word' : 'candidates'}`,
    pick(cands, ctx) {
      const n = cands.length
      if (n <= 2) return { guess: cands[0], score: 0, why: `${n} left` }
      const overall = new Array(NL).fill(0), pos = Array.from({ length: 5 }, () => new Array(NL).fill(0))
      for (const w of cands) { const seen = new Set<number>(); for (let i = 0; i < 5; i++) { const c = CI[w.charCodeAt(i)]; pos[i][c]++; seen.add(c) } for (const c of seen) overall[c]++ }
      const f = (x: number) => (t.balanced ? x * (n - x) : t.fromAll && x === n ? 0 : x)
      const lw = overall.map(f)
      const cut = [...lw].sort((a, b) => b - a)[Math.min(25, Math.max(0, t.topN - 1))]
      const lw2 = lw.map(v => (v >= cut ? v : 0))
      const pool = t.fromAll ? ctx.allowed : cands, cset = new Set(cands)
      let best = pool[0], bs = -Infinity
      for (const w of pool) {
        let s = 0
        const seen = new Set<number>()
        for (let i = 0; i < 5; i++) { const c = CI[w.charCodeAt(i)]; if (!seen.has(c)) { seen.add(c); s += t.wPlain * lw2[c] } s += t.wPos * f(pos[i][c]) }
        if (s > bs || (s === bs && cset.has(w) && !cset.has(best))) { bs = s; best = w }
      }
      return { guess: best, score: bs, why: '' }
    },
  }
}

// ---------- rich simulation ----------
export interface RichResult {
  id: string; name: string; mode: 'normal' | 'hard'; avg: number; failRate: number; worst: number; dist: number[]
  opener: string; gap: number; ms: number; worstWords: string[]
  guesses: number[]          // per answer (same order as ctx.answers)
  sizes: number[][]          // per answer: candidate-set size before each guess
  avgSizes: number[]
  tree: TreeNode
}
export interface SimOpts { optimum?: { normal: number; hard: number }; hard?: boolean; tree?: TreeNode; opener?: string; answers?: string[]; maxTurns?: number; onProgress?: (f: number) => void }

export function simulateEx(strat: Strategy, ctx: Ctx, o: SimOpts = {}): RichResult {
  const t0 = performance.now(), maxTurns = o.maxTurns ?? 12
  const targets = o.answers ?? ctx.answers
  const memo = new Map<string, string>()
  const root: TreeNode = { g: '', n: 0 }
  const guesses: number[] = [], sizes: number[][] = []
  const isRandom = strat.id === 'random'
  targets.forEach((ans, idx) => {
    let cands = ctx.answers, path = '', node = root, tnode: TreeNode | undefined = o.tree
    const hist: Step[] = [], sz: number[] = []
    let turn = 0
    while (turn < maxTurns) {
      sz.push(cands.length); turn++
      let g: string
      if (tnode) g = tnode.g
      else if (turn === 1 && o.opener) g = o.opener
      else if (!isRandom && memo.has(path)) g = memo.get(path)!
      else {
        const pool = o.hard && hist.length ? ctx.allowed.filter(w => hardValid(w, hist)) : ctx.allowed
        g = strat.pick(cands, { answers: ctx.answers, allowed: pool }, turn).guess
        if (!isRandom) memo.set(path, g)
      }
      node.g ||= g; node.n++
      const p = feedback(g, ans)
      if (p === ALL_GREEN) break
      hist.push({ g, p }); path += g + p + '|'
      cands = filter(cands, g, p)
      node.c ??= {}; node = node.c[p] ??= { g: '', n: 0 }
      tnode = tnode?.c?.[p]
    }
    guesses.push(turn); sizes.push(sz)
    if (o.onProgress && idx % 25 === 0) o.onProgress(idx / targets.length)
  })
  const N = targets.length
  const dist = new Array(maxTurns + 2).fill(0); guesses.forEach(k => dist[Math.min(k, maxTurns + 1)]++)
  const worst = Math.max(...guesses)
  const avg = guesses.reduce((a, b) => a + b, 0) / N
  const maxLen = Math.max(...sizes.map(s => s.length))
  const avgSizes = Array.from({ length: maxLen }, (_, i) => sizes.reduce((a, s) => a + (s[i] ?? 0), 0) / N)
  return {
    id: strat.id + (o.hard ? '@hard' : ''), name: strat.name + (o.hard ? ' [hard]' : ''), mode: o.hard ? 'hard' : 'normal',
    avg, failRate: guesses.filter(k => k > 6).length / N, worst, dist, opener: root.g, gap: Math.max(0, avg - (o.hard ? (o.optimum ?? OPTIMUM).hard : (o.optimum ?? OPTIMUM).normal)),
    ms: performance.now() - t0, worstWords: targets.filter((_, i) => guesses[i] === worst).slice(0, 8), guesses, sizes, avgSizes, tree: root,
  }
}

/** Fixed two-word start (word1, word2 regardless of feedback) then continue with `follow`. */
export function simulatePair(w1: string, w2: string, follow: Strategy, ctx: Ctx) {
  let total = 0, fails = 0
  const memo = new Map<string, string>()
  for (const ans of ctx.answers) {
    let cands = ctx.answers, turn = 0, path = ''
    while (turn < 12) {
      turn++
      let g: string
      if (turn === 1) g = w1
      else if (turn === 2 && cands.length > 1) g = w2
      else if (memo.has(path)) g = memo.get(path)!
      else { g = follow.pick(cands, ctx, turn).guess; memo.set(path, g) }
      const p = feedback(g, ans)
      if (p === ALL_GREEN) break
      path += g + p + '|'; cands = filter(cands, g, p)
    }
    total += turn; if (turn > 6) fails++
  }
  return { avg: total / ctx.answers.length, fails }
}

export const strategyById = (id: string) => STRATEGIES.find(s => s.id === id)
export { buckets }
