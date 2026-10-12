import { shallowRef } from 'vue'
import { base } from './lang'
import type { RichResult, TreeNode } from './advanced'
export type Summary = Omit<RichResult, 'guesses' | 'sizes' | 'tree'>
export interface Full { guesses: number[]; sizes: number[][]; tree: TreeNode }
export const simIndex = shallowRef<Summary[]>([])
export const simReady = fetch(base + 'sim/index.json').then(r => (r.ok ? r.json() : [])).then((j: Summary[]) => (simIndex.value = j.map(s => ({ ...s, name: t(s.name) })))).catch(() => {})
const cache = new Map<string, Promise<Full>>()
import { customs, isCustom } from './custom'
import { answers, allowed, ready } from './words'
import { t } from './i18n'
/** Run a saved custom strategy in a worker (whole answer list) and return the same shape as precomputed sims. */
function simulateCustom(id: string): Promise<Full> {
  const [base, mode] = id.split('@'), spec = customs.value.find(c => c.id === base)
  if (!spec) return Promise.reject(new Error('unknown custom strategy ' + id))
  return ready.then(() => new Promise<Full>(res => {
    const w = new Worker(new URL('./lab.worker.ts', import.meta.url), { type: 'module' })
    w.onmessage = e => { if (e.data.type === 'done') { res(e.data.full); w.terminate() } }
    w.postMessage({ spec: { ...spec }, answers: [...answers.value], allowed: [...allowed.value], subset: null, hard: mode === 'hard', job: 1, rich: true })
  }))
}
export function loadFull(id: string): Promise<Full> {
  if (isCustom(id)) { if (!cache.has(id)) cache.set(id, simulateCustom(id)); return cache.get(id)! }
  if (!cache.has(id)) cache.set(id, fetch(`${base}sim/${id.replace('@', '_')}.json`).then(r => r.json()))
  return cache.get(id)!
}
export const baseIds = () => simIndex.value.filter(s => s.mode === 'normal').map(s => ({ id: s.id, name: s.name }))
export const fullId = (id: string, hard: boolean) => (hard ? id + '@hard' : id)
