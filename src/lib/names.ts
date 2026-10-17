// Short strategy names for tables/charts; the full name + description go in a tooltip.
import { t } from './i18n'
const SHORT: Record<string, string> = {
  optimal: 'Optimal tree', 'optimal-max5': 'Optimal ≤5', 'optimal-hard': 'Optimal tree (hard)', 'entropy2-all': 'Two-step entropy',
  'explore1-cand': 'Explore 1 → cand.', 'explore2-cand': 'Explore 2 → balanced', 'freq-cand': 'Ruslan freq', 'freqpos-cand': 'Ruslan pos-freq',
  'freqbal-cand': 'Ruslan balanced', 'entropy-all': 'Max entropy', 'entropy-cand': 'Max entropy (cand.)', 'minimax-all': 'Minimax',
  'expsize-all': 'Min expected size', random: 'Random', 'staged-adaptive': 'Staged ≤3', 'staged-2turn': 'Staged 2+splitter',
  'singleton-all': 'Small groups',
}
export const baseId = (id: string) => id.replace(/@hard$/, '')
export const shortName = (id: string, fallback = id) => (SHORT[baseId(id)] ? t(SHORT[baseId(id)]) : fallback)
export const SHORT_NAMES = SHORT
