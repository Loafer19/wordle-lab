// Custom strategies saved from the Strategy Lab (localStorage, per language).
import { useLocalStorage } from '@vueuse/core'
import type { Spec } from './compose'
import { lang } from './lang'
export const customs = useLocalStorage<Spec[]>(`wl-custom-strategies-${lang}`, [])
export const isCustom = (id: string) => id.startsWith('custom:')
