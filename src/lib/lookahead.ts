// 2-ply lookahead strategies (precomputed trees from scripts/lookahead/lookahead.py) and the study data shown in Strategies › Lookahead.
// Pure module (no Vue) so scripts/simulate.ts can import the names.
export const LOOK_B_NAME = 'Lookahead 2-ply (min expected guesses)'
export const LOOK_B_DESC = 'Looks two guesses ahead: for each candidate guess it computes the expected number of guesses, where every feedback group gets the best possible next guess (searched over all allowed words) and groups that still have 3+ answers after that are estimated optimistically plus a 0.25 penalty. Only the top 50 guesses by Σ 1/group plus all possible answers are tried. Precomputed decision tree (opener SALET / КОТРА); it reaches the proven optimal average in both languages. Normal mode only; off the tree it falls back to Small groups + entropy.'
export const LOOK_A_NAME = 'Lookahead 2-ply safe (finish within 2 more)'
export const LOOK_A_DESC = 'Prefers guesses whose feedback groups can each be finished within 2 more guesses (the group has 1–2 answers, or some next guess splits it into single answers): maximises the number of such answers, ties by Σ 1/group. Fewer long games (most games in ≤4) at a slightly higher average. Precomputed decision tree (opener SALET / КОТРА), normal mode only; off the tree it falls back to Small groups + entropy.'
/** Strategies played from a precomputed decision tree (no own opener choice, no Web Worker re-run). */
export const isTreeId = (id: string) => id.startsWith('optimal') || id.startsWith('lookahead-')
/** Parameters used for the shipped trees (see scripts/lookahead/README.md). */
export const LOOK_PARAMS = { K: 50, x: 0.25 }

// Study data (EN, normal mode, full 2,315 answers) — from the experiments behind this strategy (scripts/lookahead/README.md).
/** Same greedy rule, different opener: [rule, opener, total guesses, worst]. */
export const OPENER_EFFECT: [string, string, number, number][] = [
  ['Small groups (cap ⌈n/4⌉)', 'soare', 8039, 6], ['Small groups (cap ⌈n/4⌉)', 'salet', 7986, 6], ['Small groups (cap ⌈n/4⌉)', 'trace', 7967, 6], ['Small groups (cap ⌈n/4⌉)', 'crane', 7968, 6],
  ['Σ 1/group + 20·H', 'soare', 8014, 6], ['Σ 1/group + 20·H', 'salet', 7932, 6], ['Σ 1/group + 20·H', 'trace', 7946, 6], ['Σ 1/group + 20·H', 'crane', 7944, 6],
  ['Max entropy', 'soare', 8021, 6], ['Max entropy', 'salet', 7949, 6], ['Max entropy', 'trace', 7952, 5], ['Max entropy', 'crane', 7961, 6],
]
/** Small groups with a different cap on the largest group (opener SALET): [cap, total guesses, worst]. */
export const CAP_SWEEP: [string, number, number][] = [
  ['≤ 3 answers', 7956, 6], ['≤ 10 answers', 7965, 6], ['⌈n/10⌉', 7967, 6], ['≤ 5 answers', 7970, 6], ['⌈n/16⌉', 7979, 6], ['⌈n/6⌉', 7981, 6],
  ['⌈n/4⌉ (current)', 7986, 6], ['⌈n/3⌉', 7989, 6], ['⌈n/5⌉', 7992, 6], ['⌈n/2⌉', 7994, 6], ['⌈n/8⌉', 7997, 5],
]
/** Lookahead parameter sweep (EN, opener SALET): [variant, K, x, total, worst, % in ≤4]. T = only below n answers, else Small groups. */
export const LOOK_SWEEP: [string, number, string, number, number, number][] = [
  ['B (expected cost)', 50, '0.25 – 0.5', 7920, 5, 96.6], ['B (expected cost)', 20, '0.25', 7921, 5, 96.5], ['B (expected cost)', 10, '0.25', 7922, 5, 96.5],
  ['B (expected cost)', 50, '0 (no penalty)', 7922, 7, 96.5], ['B (expected cost)', 50, '1.0', 7922, 5, 96.7],
  ['B only when n ≤ 120', 50, '0.25', 7938, 5, 96.2], ['B only when n ≤ 30', 50, '0.25', 7969, 6, 95.3],
  ['A (finish within 2 more)', 50, '–', 7996, 5, 98.4], ['A (finish within 2 more)', 100, '–', 7998, 5, 98.4],
]
