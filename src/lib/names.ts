// Short strategy names for tables/charts; the full name + description go in a tooltip.
import { t } from './i18n'
const SHORT: Record<string, string> = {
  optimal: 'Optimal tree', 'optimal-max5': 'Optimal ≤5', 'optimal-hard': 'Optimal tree (hard)', 'entropy2-all': 'Two-step entropy',
  'explore1-cand': 'Explore 1 → cand.', 'explore2-cand': 'Explore 2 → balanced', 'freq-cand': 'Ruslan freq', 'freqpos-cand': 'Ruslan pos-freq',
  'freqbal-cand': 'Ruslan balanced', 'entropy-all': 'Max entropy', 'entropy-cand': 'Max entropy (cand.)', 'minimax-all': 'Minimax',
  'expsize-all': 'Min expected size', random: 'Random', 'staged-adaptive': 'Staged ≤3', 'staged-2turn': 'Staged 2+splitter',
  'singleton-all': 'Small groups', 'hybrid-all': 'Small groups + entropy', 'entropy-fixed': 'Max entropy (fixed opener)',
  'lookahead-b': 'Lookahead 2-ply', 'lookahead-a': 'Lookahead 2-ply safe',
}
export const baseId = (id: string) => id.replace(/@hard$/, '')
export const shortName = (id: string, fallback = id) => (SHORT[baseId(id)] ? t(SHORT[baseId(id)]) : fallback)
export const SHORT_NAMES = SHORT

// Leaderboard groups and one-line descriptions (the full description stays in the tooltip).
export type Group = 'optimal' | 'lookahead' | 'greedy' | 'human' | 'baseline'
export const GROUPS: { id: Group; label: string }[] = [
  { id: 'optimal', label: 'Optimal trees' }, { id: 'lookahead', label: 'Lookahead' }, { id: 'greedy', label: 'Greedy heuristics' },
  { id: 'human', label: 'Letter frequency & staged' }, { id: 'baseline', label: 'Baselines' },
]
export function groupOf(id: string): Group {
  const b = baseId(id)
  if (b.startsWith('optimal')) return 'optimal'
  if (b.startsWith('lookahead-') || b === 'entropy2-all') return 'lookahead'
  if (['entropy-all', 'entropy-fixed', 'random'].includes(b)) return 'baseline'
  if (/^(freq|staged|explore)/.test(b)) return 'human'
  return 'greedy'
}
const BLURB: Record<string, string> = {
  optimal: 'Proven minimum average: exhaustive search, read from a tree.', 'optimal-max5': 'Best average that never needs a 6th guess.', 'optimal-hard': 'Proven minimum average in hard mode.',
  'lookahead-b': 'Expected guesses with a 2-guess lookahead; matches the optimum.', 'lookahead-a': 'Prefers groups finishable within 2 more guesses: most games in ≤4.',
  'entropy2-all': 'Entropy of this guess plus the best next one.',
  'singleton-all': 'Most answers left alone in their group (Σ 1/group), largest group ≤ ⌈n/4⌉.', 'hybrid-all': 'Σ 1/group + 20 × entropy, no cap. Instant.',
  'expsize-all': 'Smallest expected number of answers left.', 'minimax-all': 'Smallest worst-case group.', 'entropy-cand': 'Max entropy, guessing only possible answers.',
  'entropy-all': 'Most information per guess (3Blue1Brown); picks its own opener.', 'entropy-fixed': 'Max entropy after the same opener as Small groups.', random: 'A random possible answer every turn.',
  'freq-cand': 'Most frequent letters among the possible answers.', 'freqpos-cand': 'Letter frequency plus letter-at-position frequency.', 'freqbal-cand': 'Letters in about half the possible answers count most.',
  'explore1-cand': 'One exploring guess, then possible answers only.', 'explore2-cand': 'Two exploring guesses, then balanced letter frequency.',
  'staged-adaptive': 'Letter coverage until ≤3 answers are left.', 'staged-2turn': 'Two letter-coverage turns, then a cluster splitter.',
}
export const blurb = (id: string) => (BLURB[baseId(id)] ? t(BLURB[baseId(id)]) : '')
export const BLURBS = BLURB
