// Strategy list for interactive views: the base STRATEGIES plus two-step entropy and the optimal SALET trees.
import { shallowRef, computed } from 'vue'
import { STRATEGIES, filter, feedback, ALL_GREEN, type Strategy } from './wordle'
import { twoStepStrategy, type TreeNode } from './advanced'
import { answers } from './words'
import { isUA, base } from './lang'
import { PRESET_STRATEGIES, composeStrategy } from './compose'
import { customs } from './custom'
import { STAGED_STRATEGIES } from './staged'
import { t } from './i18n'

/** Index an optimal tree by the exact candidate set reaching each node → guess. Falls back to two-step when the user left the tree. */
export const EN_TREE_DESC = 'Provably optimal decision tree (Alex Selby; Bertsimas & Paskov): average 3.4212 normal / 3.5084 hard. If your guesses leave the tree, it falls back to two-step entropy.'
export const UA_TREE_DESC = 'Proven-optimal Ukrainian decision tree from our exact search (opener КОТРА): average 3.3809 (5805/1717), worst case 6. If your guesses leave the tree, it falls back to two-step entropy.'
export const UA_TREE5_DESC = 'Best possible average with a 5-guess guarantee (exact search, opener КОТРА): 3.3815 (5806/1717). A 4-guess guarantee is impossible in UA. Falls back to two-step entropy off the tree.'
export function treeLookupStrategy(id: string, name: string, tree: TreeNode, all: string[], fallback: Strategy, desc = EN_TREE_DESC): Strategy {
  const map = new Map<string, string>()
  const walk = (node: TreeNode, cands: string[]) => {
    map.set(cands.join(','), node.g)
    const groups = new Map<number, string[]>()
    for (const a of cands) { const p = feedback(node.g, a); if (p !== ALL_GREEN) (groups.get(p) ?? groups.set(p, []).get(p)!).push(a) }
    for (const [p, g] of groups) if (node.c?.[p]) walk(node.c[p], g)
  }
  walk(tree, all)
  return {
    id, name, desc,
    pick(cands, ctx, turn) {
      const g = map.get(cands.join(','))
      if (g) return { guess: g, score: 0, why: t('Optimal decision tree says "{w}" for these {n} possible answers (minimises the total number of guesses over all of them).', { w: g.toUpperCase(), n: cands.length }) }
      const s = fallback.pick(cands, ctx, turn); return { ...s, why: t('Off the optimal tree (an earlier guess differed) — falling back to two-step entropy.') + ' ' + s.why }
    },
  }
}
const two = twoStepStrategy()
export const extra = shallowRef<Strategy[]>([two])
fetch(base + 'optimal-tree.json').then(r => r.json()).then(async (t: { normal: TreeNode; hard?: TreeNode; max5?: TreeNode }) => {
  const wait = () => new Promise<void>(r => { const i = setInterval(() => { if (answers.value.length) { clearInterval(i); r() } }, 50) })
  await wait()
  extra.value = isUA
    ? [treeLookupStrategy('optimal', 'Optimal tree (UA)', t.normal, answers.value, two, UA_TREE_DESC), treeLookupStrategy('optimal-max5', 'Optimal tree (UA, ≤5 guesses)', t.max5!, answers.value, two, UA_TREE5_DESC), two]
    : [treeLookupStrategy('optimal', 'Optimal tree (SALET)', t.normal, answers.value, two), treeLookupStrategy('optimal-hard', 'Optimal tree (SALET, hard mode)', t.hard!, answers.value, two), two]
}).catch(() => {})
export const allStrategies = computed(() => [...extra.value, ...PRESET_STRATEGIES, ...STAGED_STRATEGIES, ...customs.value.map(composeStrategy), ...STRATEGIES].map(s => (s.id.startsWith('custom:') ? s : { ...s, name: t(s.name), desc: t(s.desc) })))
void filter
