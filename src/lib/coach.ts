// Coach mode: post-game analysis of a sequence of guesses + colours. Pure TS (browser, worker, Bun tests).
import { CI, NL } from './alpha'
import { feedback, filter, buckets, digitsToPattern, patternDigits, ALL_GREEN, type Pattern } from './wordle'
import { hardValid, type Step, type TreeNode } from './advanced'

export interface CoachStep { w: string; d: number[] }
export type TipKind = 'grey-reuse' | 'yellow-same-spot' | 'green-moved' | 'cluster-trap' | 'outside-better' | 'pick-candidate' | 'great' | 'solved' | 'lucky' | 'unlucky' | 'not-candidate-ok'
export interface Tip { kind: TipKind; v?: Record<string, string | number> }
export interface MoveEval { guess: string; bits: number; expRemaining: number; worst: number; isCandidate: boolean }
export interface StepAnalysis {
  i: number; w: string; d: number[]; p: Pattern
  before: number; after: number
  bits: number          // actual information log2(before/after)
  expBits: number       // expected information of the played guess
  expRemaining: number  // expected candidates left after the played guess
  isCandidate: boolean
  best: MoveEval        // best guess by entropy (hard-mode legal when hard)
  tree?: MoveEval       // optimal-tree move, when the game is still on the tree
  luck: number          // actual − expected bits
  luckPct: number       // share of answers that would have left MORE candidates (higher = luckier), 0..1
  efficiency: number    // expBits / best.bits (0..1)
  tips: Tip[]
  sample: string[]      // a few remaining candidates after this guess
}
export interface GameAnalysis { steps: StepAnalysis[]; solved: boolean; error?: { i: number; kind: 'invalid-word' | 'no-match' }; totalBits: number; neededBits: number; luck: number; efficiency: number; summary: Tip[] }

const log2 = Math.log2
// allocation-free feedback on letter codes (same result as wordle.feedback) — the coach scans every allowed word per step
const codeCache = new Map<string, Uint8Array>()
const codes = (w: string) => { let c = codeCache.get(w); if (!c) { c = new Uint8Array(5); for (let i = 0; i < 5; i++) c[i] = CI[w.charCodeAt(i)]; codeCache.set(w, c) } return c }
const cnt = new Int8Array(NL), B = new Int32Array(243)
const R = new Uint8Array(5)
function fastPattern(g: Uint8Array, a: Uint8Array) {
  for (let i = 0; i < 5; i++) if (g[i] !== a[i]) cnt[a[i]]++
  for (let i = 0; i < 5; i++) { if (g[i] === a[i]) R[i] = 2; else if (cnt[g[i]] > 0) { R[i] = 1; cnt[g[i]]-- } else R[i] = 0 }
  for (let i = 0; i < 5; i++) cnt[a[i]] = 0
  return R[0] + 3 * R[1] + 9 * R[2] + 27 * R[3] + 81 * R[4]
}
function fastBuckets(g: string, cc: Uint8Array[]) { B.fill(0); const gc = codes(g); for (const a of cc) B[fastPattern(gc, a)]++; return B }
export function evalGuess(g: string, cands: string[], candSet?: Set<string>, cc = cands.map(codes)): MoveEval {
  const b = fastBuckets(g, cc), n = cands.length
  let h = 0, sq = 0, worst = 0
  for (const c of b) if (c) { const q = c / n; h -= q * log2(q); sq += c * c; if (c > worst) worst = c }
  // a solved bucket leaves 0 candidates
  const solvedIn = candSet ? candSet.has(g) : cands.includes(g)
  return { guess: g, bits: h, expRemaining: (sq - (solvedIn ? 1 : 0)) / n, worst, isCandidate: solvedIn }
}
/** Best guess by expected information over pool (ties → prefer a possible answer). */
export function bestByEntropy(cands: string[], pool: string[]): MoveEval {
  const set = new Set(cands), cc = cands.map(codes)
  if (cands.length <= 2) return evalGuess(cands[0], cands, set, cc)
  let best: MoveEval | null = null
  for (const g of pool) {
    const e = evalGuess(g, cands, set, cc)
    if (!best || e.bits > best.bits + 1e-9 || (Math.abs(e.bits - best.bits) <= 1e-9 && e.isCandidate && !best.isCandidate)) best = e
  }
  return best!
}

const COLOR: Record<string, number> = { '⬜': 0, '⬛': 0, '🟨': 1, '🟦': 1, '🟩': 2, '🟧': 2, '0': 0, '1': 1, '2': 2, b: 0, x: 0, w: 0, '.': 0, '-': 0, '_': 0, y: 1, g: 2 }
/** Parse "ARISE(⬜⬜⬜🟨⬜) CLOTH(⬜⬜🟩🟨⬜)", "arise 00010", "arise bbbyb" (one game per text; any separators). */
export function parseGame(text: string): { steps: CoachStep[]; error?: string } {
  const steps: CoachStep[] = []
  const re = /([a-zа-яґєії']{5})[\s:=(\[\-–—]*((?:⬜|⬛|🟨|🟩|🟦|🟧|[012bxw.\-_yg]){5})/giu
  for (const m of text.normalize('NFC').matchAll(re)) {
    const w = m[1].toLowerCase(), cs = [...m[2].toLowerCase()].map(c => COLOR[c])
    if (cs.length !== 5 || cs.some(c => c === undefined)) return { steps, error: m[0] }
    steps.push({ w, d: cs })
  }
  return { steps, error: steps.length ? undefined : text.trim() ? text.trim().slice(0, 40) : undefined }
}
export const formatGame = (steps: CoachStep[]) => steps.map(s => `${s.w.toUpperCase()}(${s.d.map(d => ['⬜', '🟨', '🟩'][d]).join('')})`).join(' ')

export interface CoachOpts { hard?: boolean; tree?: TreeNode; bestFirst?: MoveEval; onProgress?: (f: number) => void }
export function analyzeGame(game: CoachStep[], answers: string[], allowed: string[], o: CoachOpts = {}): GameAnalysis {
  const allowedSet = new Set(allowed)
  let cands = answers
  const steps: StepAnalysis[] = [], hist: Step[] = []
  let node: TreeNode | undefined = o.tree, error: GameAnalysis['error']
  const grey = new Set<string>(), present = new Set<string>(), greenAt: (string | null)[] = [null, null, null, null, null], yellowAt: Set<string>[] = [0, 1, 2, 3, 4].map(() => new Set())
  for (let i = 0; i < game.length; i++) {
    const { w, d } = game[i], p = digitsToPattern(d)
    if (!allowedSet.has(w) && !answers.includes(w)) { error = { i, kind: 'invalid-word' }; break }
    const n = cands.length, set = new Set(cands)
    const played = evalGuess(w, cands, set)
    const pool = o.hard && hist.length ? allowed.filter(g => hardValid(g, hist)) : allowed
    const best = i === 0 && o.bestFirst && !o.hard ? o.bestFirst : bestByEntropy(cands, pool)
    const treeMove = node ? evalGuess(node.g, cands, set) : undefined
    const after = filter(cands, w, p)
    if (!after.length) { error = { i, kind: 'no-match' }; break }
    const bits = log2(n / after.length)
    const b = buckets(w, cands); let more = 0; for (const a of cands) if (b[feedback(w, a)] > after.length) more++
    const tips: Tip[] = []
    const solved = p === ALL_GREEN
    // letter knowledge checks (before this guess)
    const greyUsed = [...new Set(w)].filter(c => grey.has(c) && !present.has(c))
    if (greyUsed.length) tips.push({ kind: 'grey-reuse', v: { l: greyUsed.map(c => c.toUpperCase()).join(', ') } })
    const sameSpot = [...w].map((c, j) => (yellowAt[j].has(c) ? c : '')).filter(Boolean)
    if (sameSpot.length) tips.push({ kind: 'yellow-same-spot', v: { l: sameSpot.map(c => c.toUpperCase()).join(', ') } })
    const moved = greenAt.map((c, j) => (c && w[j] !== c ? j + 1 : 0)).filter(Boolean)
    if (moved.length && !solved && n > 2) tips.push({ kind: 'green-moved', v: { k: moved.join(', ') } })
    if (!solved) {
      // cluster trap: many candidates differing in one/two positions only
      const fixed = n >= 3 ? [0, 1, 2, 3, 4].filter(j => cands.every(c => c[j] === cands[0][j])).length : 0
      if (n >= 4 && fixed >= 3 && set.has(w) && !best.isCandidate && best.bits - played.bits > 0.3) tips.push({ kind: 'cluster-trap', v: { n, f: fixed, b: best.guess.toUpperCase() } })
      else if (n >= 3 && set.has(w) && !best.isCandidate && best.bits - played.bits >= 0.5) tips.push({ kind: 'outside-better', v: { b: best.guess.toUpperCase(), x: (best.bits - played.bits).toFixed(2) } })
      if (n <= 2 && !set.has(w)) tips.push({ kind: 'pick-candidate', v: { n } })
    }
    const eff = best.bits > 0 ? Math.min(1, played.bits / best.bits) : 1
    if (solved) tips.push({ kind: 'solved', v: { k: i + 1 } })
    else if (eff >= 0.97 && n > 2) tips.push({ kind: 'great', v: { p: Math.round(eff * 100) } })
    const luck = bits - played.bits
    if (!solved && luck >= 1) tips.push({ kind: 'lucky', v: { x: luck.toFixed(2) } })
    else if (!solved && luck <= -1) tips.push({ kind: 'unlucky', v: { x: (-luck).toFixed(2) } })
    steps.push({ i, w, d, p, before: n, after: solved ? 0 : after.length, bits: solved ? log2(n) : bits, expBits: played.bits, expRemaining: played.expRemaining, isCandidate: set.has(w), best, tree: treeMove, luck: solved ? log2(n) - played.bits : luck, luckPct: n > 1 ? more / n : 0.5, efficiency: eff, tips, sample: after.slice(0, 8) })
    // update knowledge
    d.forEach((x, j) => { const c = w[j]; if (x === 2) { greenAt[j] = c; present.add(c) } else if (x === 1) { yellowAt[j].add(c); present.add(c) } })
    d.forEach((x, j) => { if (x === 0 && !present.has(w[j])) grey.add(w[j]) })
    hist.push({ g: w, p }); cands = after
    node = node && node.g === w ? node.c?.[p] : undefined
    o.onProgress?.((i + 1) / game.length)
    if (solved) break
  }
  const solved = steps.at(-1)?.p === ALL_GREEN
  const totalBits = steps.reduce((s, x) => s + x.bits, 0), luck = steps.reduce((s, x) => s + x.luck, 0)
  const scored = steps.filter(s => s.before > 2)
  const efficiency = scored.length ? scored.reduce((s, x) => s + x.efficiency, 0) / scored.length : 1
  const summary: Tip[] = []
  const wasted = steps.filter(s => s.tips.some(t => t.kind === 'grey-reuse')).length
  if (wasted) summary.push({ kind: 'grey-reuse', v: { k: wasted } })
  if (steps.some(s => s.tips.some(t => t.kind === 'cluster-trap'))) summary.push({ kind: 'cluster-trap' })
  if (steps.some(s => s.tips.some(t => t.kind === 'outside-better'))) summary.push({ kind: 'outside-better' })
  return { steps, solved, error, totalBits, neededBits: log2(answers.length), luck, efficiency, summary }
}
void patternDigits
