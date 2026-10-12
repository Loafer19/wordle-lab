import { STRATEGIES, simulate } from './wordle'
import { STAGED_STRATEGIES } from './staged'
self.onmessage = (e: MessageEvent<{ id: string; answers: string[]; allowed: string[] }>) => {
  const { id, answers, allowed } = e.data
  const s = [...STAGED_STRATEGIES, ...STRATEGIES].find(x => x.id === id)!
  const r = simulate(s, { answers, allowed }, i => self.postMessage({ type: 'progress', id, p: i / answers.length }))
  self.postMessage({ type: 'done', id, result: r })
}
