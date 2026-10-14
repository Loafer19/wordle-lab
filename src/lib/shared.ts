// Small cross-view state: the Word inspector's word and the two strategies picked for Compare.
import { ref, reactive } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import { FAMOUS_OPENERS, BEST_ID, lang } from './lang'
export const inspectWord = ref(FAMOUS_OPENERS[0])
export const compareSel = useLocalStorage(`wl-compare-${lang}`, { a: 'freqbal-cand', b: BEST_ID, hardA: false, hardB: false })
export const guideSeen = useLocalStorage<Record<string, boolean>>('wl-guide-seen', {})
export const ui = reactive({ advancedOpen: false })
