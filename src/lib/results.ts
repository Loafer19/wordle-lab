import { shallowRef } from 'vue'
import { base } from './lang'
import type { SimResult } from './wordle'
export const precomputed = shallowRef<SimResult[]>([])
fetch(base + 'results.json').then(r => (r.ok ? r.json() : [])).then(j => (precomputed.value = j)).catch(() => {})
