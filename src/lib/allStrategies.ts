// Strategy list for interactive views: the base STRATEGIES plus two-step entropy and the optimal SALET trees.
import { shallowRef, computed } from 'vue'
import { STRATEGIES, filter, feedback, ALL_GREEN, type Strategy } from './wordle'
import { twoStepStrategy, type TreeNode } from './advanced'
import { answers } from './words'
import { isUA } from './lang'
import { PRESET_STRATEGIES, composeStrategy } from './compose'
import { customs } from './custom'
import { t } from './i18n'

/** Index an optimal tree by the exact candidate set reaching each node → guess. Falls back to two-step when the user left the tree. */
export function treeLookupStrategy(id: string, name: string, tree: TreeNode, all: string[], fallback: Strategy): Strategy {
  const map = new Map<string, string>()
  const walk = (node: TreeNode, cands: string[]) => {
    map.set(cands.join(','), node.g)
    const groups = new Map<number, string[]>()
    for (const a of cands) { const p = feedback(node.g, a); if (p !== ALL_GREEN) (groups.get(p) ?? groups.set(p, []).get(p)!).push(a) }
    for (const [p, g] of groups) if (node.c?.[p]) walk(node.c[p], g)
  }
  walk(tree, all)
  return {
    id, name, desc: 'Provably optimal decision tree (Alex Selby; Bertsimas & Paskov): average 3.4212 normal / 3.5084 hard. If your guesses leave the tree, it falls back to two-step entropy.',
    pick(cands, ctx, turn) {
      const g = map.get(cands.join(','))
      if (g) return { guess: g, score: 0, why: t('Optimal decision tree says "{w}" for these {n} possible answers (minimises the total number of guesses over all of them).', { w: g.toUpperCase(), n: cands.length }) }
      const s = fallback.pick(cands, ctx, turn); return { ...s, why: t('Off the optimal tree (an earlier guess differed) — falling back to two-step entropy.') + ' ' + s.why }
    },
  }
}
const two = twoStepStrategy()
export const extra = shallowRef<Strategy[]>([two])
if (!isUA) fetch(import.meta.env.BASE_URL + 'optimal-tree.json').then(r => r.json()).then(async (t: { normal: TreeNode; hard: TreeNode }) => {
  const wait = () => new Promise<void>(r => { const i = setInterval(() => { if (answers.value.length) { clearInterval(i); r() } }, 50) })
  await wait()
  extra.value = [treeLookupStrategy('optimal', 'Optimal tree (SALET)', t.normal, answers.value, two), treeLookupStrategy('optimal-hard', 'Optimal tree (SALET, hard mode)', t.hard, answers.value, two), two]
}).catch(() => {})
export const allStrategies = computed(() => [...extra.value, ...PRESET_STRATEGIES, ...customs.value.map(composeStrategy), ...STRATEGIES].map(s => (s.id.startsWith('custom:') ? s : { ...s, name: t(s.name), desc: t(s.desc) })))
void filter
