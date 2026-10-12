import { shallowRef } from 'vue'
import { base } from './lang'
import type { SimResult } from './wordle'
import { t } from './i18n'
export const precomputed = shallowRef<SimResult[]>([])
fetch(base + 'results.json').then(r => (r.ok ? r.json() : [])).then((j: SimResult[]) => (precomputed.value = j.map(r => ({ ...r, name: t(r.name) })))).catch(() => {})
