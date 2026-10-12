// Strategy Lab worker: simulate a composed strategy (sample or full; full returns per-answer data for Compare/Tree/Map).
import { composeStrategy, type Spec } from './compose'
import { simulateEx } from './advanced'
self.onmessage = (e: MessageEvent<{ spec: Spec; answers: string[]; allowed: string[]; subset: string[] | null; hard: boolean; job: number; rich?: boolean }>) => {
  const { spec, answers, allowed, subset, hard, job, rich } = e.data
  const r = simulateEx(composeStrategy(spec), { answers, allowed }, { hard, answers: subset ?? undefined, onProgress: p => self.postMessage({ type: 'progress', job, p }) })
  const summary = { avg: r.avg, dist: r.dist, failRate: r.failRate, worst: r.worst, opener: r.opener, ms: r.ms, n: r.guesses.length, worstWords: r.worstWords }
  self.postMessage({ type: 'done', job, result: summary, full: rich ? { guesses: r.guesses, sizes: r.sizes, tree: r.tree } : undefined })
}
