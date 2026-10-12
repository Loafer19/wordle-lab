import { shallowRef } from 'vue'
import type { SimResult } from './wordle'
export const precomputed = shallowRef<SimResult[]>([])
fetch(import.meta.env.BASE_URL + 'results.json').then(r => (r.ok ? r.json() : [])).then(j => (precomputed.value = j)).catch(() => {})
