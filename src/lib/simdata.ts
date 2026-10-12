import { shallowRef } from 'vue'
import { base } from './lang'
import type { RichResult, TreeNode } from './advanced'
export type Summary = Omit<RichResult, 'guesses' | 'sizes' | 'tree'>
export interface Full { guesses: number[]; sizes: number[][]; tree: TreeNode }
export const simIndex = shallowRef<Summary[]>([])
export const simReady = fetch(base + 'sim/index.json').then(r => (r.ok ? r.json() : [])).then(j => (simIndex.value = j)).catch(() => {})
const cache = new Map<string, Promise<Full>>()
export function loadFull(id: string): Promise<Full> {
  if (!cache.has(id)) cache.set(id, fetch(`${base}sim/${id.replace('@', '_')}.json`).then(r => r.json()))
  return cache.get(id)!
}
export const baseIds = () => simIndex.value.filter(s => s.mode === 'normal').map(s => ({ id: s.id, name: s.name }))
export const fullId = (id: string, hard: boolean) => (hard ? id + '@hard' : id)
