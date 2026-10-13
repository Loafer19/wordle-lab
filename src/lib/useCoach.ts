// Reactive wrapper: analyse a game in a worker whenever it (or hard mode) changes.
import { ref, shallowRef, watch, type Ref } from 'vue'
import { answers, allowed, ready } from './words'
import { optimalTrees } from './allStrategies'
import type { CoachStep, GameAnalysis } from './coach'
let seq = 0
export function useCoach(game: Ref<CoachStep[] | null>, hard: Ref<boolean>) {
  const result = shallowRef<GameAnalysis | null>(null), progress = ref(0), busy = ref(false)
  let w: Worker | null = null
  const run = async () => {
    const g = game.value
    w?.terminate(); w = null
    if (!g || !g.length) { result.value = null; busy.value = false; return }
    await ready
    const id = ++seq; busy.value = true; progress.value = 0
    w = new Worker(new URL('./coach.worker.ts', import.meta.url), { type: 'module' })
    w.onmessage = e => { if (e.data.id !== id) return; if (e.data.type === 'progress') progress.value = e.data.p; else { result.value = e.data.r; busy.value = false; w?.terminate(); w = null } }
    const tree = hard.value ? optimalTrees.value.hard : optimalTrees.value.normal
    w.postMessage({ id, game: g.map(s => ({ w: s.w, d: [...s.d] })), answers: [...answers.value], allowed: [...allowed.value], hard: hard.value, tree: tree ? JSON.parse(JSON.stringify(tree)) : undefined })
  }
  watch([game, hard, optimalTrees], run, { immediate: true, deep: true })
  return { result, progress, busy, run }
}
