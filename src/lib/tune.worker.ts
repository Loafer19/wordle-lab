import { tunableStrategy, simulateEx, type TuneParams } from './advanced'
self.onmessage = (e: MessageEvent<{ params: TuneParams; answers: string[]; allowed: string[]; subset: string[] | null; job: number }>) => {
  const { params, answers, allowed, subset, job } = e.data
  const r = simulateEx(tunableStrategy(params), { answers, allowed }, { answers: subset ?? undefined, onProgress: p => self.postMessage({ type: 'progress', job, p }) })
  self.postMessage({ type: 'done', job, result: { avg: r.avg, dist: r.dist, failRate: r.failRate, worst: r.worst, opener: r.opener, ms: r.ms, n: r.guesses.length, worstWords: r.worstWords } })
}
