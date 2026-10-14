// Player fingerprint: every finished Play game with its coach skill/luck, stored in localStorage (per language).
import { useLocalStorage } from '@vueuse/core'
import { lang } from './lang'
import type { GameRecord } from './fingerprint'
export * from './fingerprint'
export const history = useLocalStorage<GameRecord[]>(`wl-history-${lang}`, [])
export function record(g: GameRecord) {
  if (history.value.some(x => x.id === g.id)) return
  history.value = [...history.value, g].slice(-500)
}
