// Runs the coach analysis off the main thread (scans every allowed word per guess).
import { analyzeGame, type CoachStep } from './coach'
import type { TreeNode } from './advanced'
self.onmessage = (e: MessageEvent<{ id: number; game: CoachStep[]; answers: string[]; allowed: string[]; hard: boolean; tree?: TreeNode }>) => {
  const { id, game, answers, allowed, hard, tree } = e.data
  const r = analyzeGame(game, answers, allowed, { hard, tree, onProgress: p => (self as unknown as Worker).postMessage({ id, type: 'progress', p }) })
  ;(self as unknown as Worker).postMessage({ id, type: 'done', r })
}
