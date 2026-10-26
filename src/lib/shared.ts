// Small cross-view state: the Word inspector's word and the two strategies picked for Compare.
import { ref, reactive } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import { FAMOUS_OPENERS, BEST_ID, lang } from './lang'
export const inspectWord = ref(FAMOUS_OPENERS[0])
export const compareSel = useLocalStorage(`wl-compare-${lang}`, { a: 'freqbal-cand', b: BEST_ID, hardA: false, hardB: false })
/** Removed strategy ids → the strategy that replaced them (stored Compare / Watch picks keep working). */
export const ID_ALIAS: Record<string, string> = { 'entropy-fixed': 'entropy-all' }
export const canonicalId = (id: string) => ID_ALIAS[id] ?? id
for (const k of ['a', 'b'] as const) if (ID_ALIAS[compareSel.value[k]]) compareSel.value = { ...compareSel.value, [k]: canonicalId(compareSel.value[k]) }
export const guideSeen = useLocalStorage<Record<string, boolean>>('wl-guide-seen', {})
export const ui = reactive({ advancedOpen: false })
