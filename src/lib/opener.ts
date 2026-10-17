// Custom opener for the interactive decision tree: validation (pure, unit-tested) and the full tree for "opener X, then strategy S".
// The precomputed trees only cover each strategy's own opener, so a custom opener is simulated client-side (opener.worker.ts).
import { simulateEx, type TreeNode } from './advanced'
import { composeStrategy, type Spec } from './compose'
import { workerStrategies } from './watchAll'
import { STRATEGIES, type Ctx, type Strategy } from './wordle'
import { CI, NL } from './alpha'

export type OpenerError = 'empty' | 'length' | 'letters' | 'unknown'
export interface OpenerCheck { ok: boolean; word: string; error?: OpenerError }
/** Normalise user input: trim, drop inner spaces, lower-case (Ukrainian included). */
export const normalizeOpener = (s: string) => s.replace(/\s+/g, '').toLowerCase()
/** A custom opener must be 5 letters of the current alphabet (Ukrainian letters in UA) and an allowed guess of the current language. */
export function validateOpener(input: string, allowed: ReadonlySet<string> | readonly string[], letters: string): OpenerCheck {
  const word = normalizeOpener(input)
  if (!word) return { ok: false, word, error: 'empty' }
  if ([...word].some(c => !letters.includes(c))) return { ok: false, word, error: 'letters' }
  if ([...word].length !== 5) return { ok: false, word, error: 'length' }
  const has = 'has' in allowed ? allowed.has(word) : allowed.includes(word)
  return has ? { ok: true, word } : { ok: false, word, error: 'unknown' }
}
/** English message keys for the errors (translated with t() by the caller). */
export const OPENER_ERROR_TEXT: Record<OpenerError, string> = {
  empty: 'Type a 5-letter word',
  length: 'The opener must have exactly 5 letters',
  letters: 'Use only letters of the current alphabet',
  unknown: '{w} is not in the word list',
}

/** Strategy used after a custom opener. Tree-lookup strategies (optimal*) have no moves off their own opener → max entropy. */
export const FALLBACK_FOLLOW = 'entropy-all'
export function followId(stratId: string, known: (id: string) => boolean): string {
  if (stratId.startsWith('custom:')) return stratId
  return !stratId.startsWith('optimal') && known(stratId) ? stratId : FALLBACK_FOLLOW
}
// Same picks as STRATEGIES' 'entropy-all' (pool order, ties prefer candidates, identical float sums) but on pre-encoded words with an
// allocation-free feedback: a full tree scans every allowed guess at every node, so this is the hot loop.
const codeCache = new Map<string, Uint8Array>()
const enc = (w: string) => { let c = codeCache.get(w); if (!c) { c = new Uint8Array(5); for (let i = 0; i < 5; i++) c[i] = CI[w.charCodeAt(i)]; codeCache.set(w, c) } return c }
const fbCounts = new Int8Array(NL), fbBuckets = new Int32Array(243)
/** feedback() on letter codes; equals feedback(g, a) for every pair (unit-tested). */
export function fastFeedback(g: Uint8Array, a: Uint8Array) {
  let p = 0, green = 0
  for (let i = 0; i < 5; i++) { if (g[i] === a[i]) green |= 1 << i; else fbCounts[a[i]]++ }
  for (let i = 0, m = 1; i < 5; i++, m *= 3) {
    if (green & (1 << i)) p += 2 * m
    else if (fbCounts[g[i]] > 0) { p += m; fbCounts[g[i]]-- }
  }
  for (let i = 0; i < 5; i++) fbCounts[a[i]] = 0
  return p
}
export const fastFeedbackStr = (g: string, a: string) => fastFeedback(enc(g), enc(a))
export function fastEntropyAll(): Strategy {
  const base = STRATEGIES.find(s => s.id === 'entropy-all')!
  return {
    ...base,
    pick(cands, ctx, turn) {
      const n = cands.length
      if (n <= 2) return base.pick(cands, ctx, turn)
      const cset = new Set(cands), cc = cands.map(enc), used = new Int32Array(Math.min(n, 243))
      let best = ctx.allowed[0], bs = -Infinity
      for (const w of ctx.allowed) {
        const g = enc(w)
        let k = 0
        for (let j = 0; j < n; j++) { const p = fastFeedback(g, cc[j]); if (fbBuckets[p]++ === 0) used[k++] = p }
        // sum in ascending pattern order (as entropy() does) so float ties break exactly like 'entropy-all'; reset only touched buckets
        const u = used.subarray(0, k).sort()
        let h = 0
        for (let i = 0; i < k; i++) { const q = fbBuckets[u[i]] / n; h -= q * Math.log2(q); fbBuckets[u[i]] = 0 }
        if (h > bs || (h === bs && cset.has(w) && !cset.has(best))) { bs = h; best = w }
      }
      return { guess: best, score: bs, why: '' }
    },
  }
}
export function resolveFollow(id: string, spec?: Spec): Strategy {
  if (spec) return composeStrategy({ ...spec, opener: '' })
  if (id === FALLBACK_FOLLOW) return fastEntropyAll()
  return workerStrategies().find(s => s.id === id) ?? workerStrategies().find(s => s.id === FALLBACK_FOLLOW)!
}
export interface OpenerTree { tree: TreeNode; avg: number; worst: number; failRate: number; dist: number[]; ms: number; follow: string }
/** Full decision tree: `opener` first, then `follow` for every answer (memoised per node, so each node is solved once). */
export function openerTree(opener: string, follow: Strategy, ctx: Ctx, hard = false, onProgress?: (f: number) => void): OpenerTree {
  const r = simulateEx(follow, ctx, { opener, hard, onProgress })
  return { tree: r.tree, avg: r.avg, worst: r.worst, failRate: r.failRate, dist: r.dist, ms: r.ms, follow: follow.id }
}
