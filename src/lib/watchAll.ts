// Watch › "Every strategy on this word": prefer the precomputed simulation (one lookup per strategy), compute the rest
// (presets, two-step entropy without a sim file…) in a Web Worker with progress and cancel.
import { playOne, STRATEGIES, type Strategy, type Ctx } from './wordle'
import { STAGED_STRATEGIES } from './staged'
import { PRESET_STRATEGIES } from './compose'
import { twoStepStrategy } from './advanced'
export type Source = 'sim' | 'tree' | 'worker'
export interface Job { id: string; opener?: string }
/** Decide per strategy where its guess count comes from. Optimal trees off the sim are cheap lookups on the main thread. */
export function planAll(ids: string[], simIds: Set<string>): Record<Source, string[]> {
  const r: Record<Source, string[]> = { sim: [], tree: [], worker: [] }
  for (const id of ids) r[simIds.has(id) ? 'sim' : id.startsWith('optimal') ? 'tree' : 'worker'].push(id)
  return r
}
/** Guesses for `word` from a precomputed sim file (guesses[] is aligned with the answer list); undefined if absent. */
export const fromSim = (guesses: number[] | undefined, answers: string[], word: string) => { const i = answers.indexOf(word); return i >= 0 && guesses && guesses.length === answers.length ? guesses[i] : undefined }
let pool: Strategy[] | null = null
export const workerStrategies = () => (pool ??= [twoStepStrategy(), ...PRESET_STRATEGIES, ...STAGED_STRATEGIES, ...STRATEGIES])
/** Play `word` with each job's strategy (what the worker runs); onEach after each one. */
export function playJobs(jobs: Job[], ctx: Ctx, word: string, onEach?: (id: string, n: number, i: number) => void) {
  const out: Record<string, number> = {}
  jobs.forEach((j, i) => { const s = workerStrategies().find(x => x.id === j.id); if (!s) return; out[j.id] = playOne(s, ctx, word, j.opener).length; onEach?.(j.id, out[j.id], i) })
  return out
}
