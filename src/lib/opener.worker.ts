// Interactive tree › custom opener: compute "opener, then strategy" over every answer off the main thread.
import { openerTree, resolveFollow } from './opener'
import type { Spec } from './compose'
self.onmessage = (e: MessageEvent<{ job: number; opener: string; follow: string; spec?: Spec; answers: string[]; allowed: string[]; hard: boolean }>) => {
  const { job, opener, follow, spec, answers, allowed, hard } = e.data
  const r = openerTree(opener, resolveFollow(follow, spec), { answers, allowed }, hard, p => self.postMessage({ type: 'progress', job, p }))
  self.postMessage({ type: 'done', job, result: r })
}
