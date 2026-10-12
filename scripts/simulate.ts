// bun run simulate [--lang ua] [--no-hard] [--no-pairs] [ids...]
// Simulates every strategy (normal + hard mode) over all 2,315 answers, verifies the published optimal trees,
// prints a table with the gap to the proven optimum and writes public/sim/*.json, public/results.json, public/opener-pairs.json.
import { STRATEGIES, type Strategy } from '../src/lib/wordle'
import { PRESET_STRATEGIES } from '../src/lib/compose'
import { STAGED_STRATEGIES } from '../src/lib/staged'
import { simulateEx, simulatePair, twoStepStrategy, parseSelbyTree, verifyTree, OPTIMUM, type RichResult, type TreeNode } from '../src/lib/advanced'
const root = new URL('..', import.meta.url).pathname
const args0 = process.argv.slice(2), LANG = args0.includes('--lang') ? args0[args0.indexOf('--lang') + 1] : 'en'
const D = LANG === 'en' ? 'data/' : `data/${LANG}/`, P = LANG === 'en' ? 'public/' : `public/${LANG}/`
const rd = async (p: string) => (await Bun.file(root + p).text()).split(/\s+/).filter(Boolean)
const answers = await rd(D + 'answers.txt'), allowed = await rd(D + 'allowed.txt')
const ctx = { answers, allowed }
const args = args0, ids = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--lang')
const merge = args.includes('--merge'), noHard = args.includes('--no-hard'), noPairs = args.includes('--no-pairs')
console.log(`answers=${answers.length} allowed=${allowed.length}`)

// optimal trees (Alex Selby, github.com/alex1770/wordle)
// UA: our own exact trees (scripts/ua-optimal/solver.c, see data/SOURCES.md): 'normal' = min average, 'max5' = min average with ≤5 guesses.
const trees: Record<string, TreeNode> | null = LANG === 'en' ? {
  normal: parseSelbyTree(await Bun.file(root + 'data/optimal/salet.easy.origwords.tree').text()),
  hard: parseSelbyTree(await Bun.file(root + 'data/optimal/salet.hard.origwordlist.tree').text()),
} : LANG === 'ua' ? {
  normal: await Bun.file(root + 'data/ua/optimal/kotra.normal.json').json(),
  max5: await Bun.file(root + 'data/ua/optimal/kotra.max5.json').json(),
} : null
if (trees) for (const m of Object.keys(trees)) { const e = verifyTree(trees[m], answers, m === 'hard'); console.log(`verify optimal ${m} tree: ${e.length ? e.length + ' ERRORS ' + e.slice(0, 3) : 'OK'}`); if (e.length) process.exit(1) }
if (trees) await Bun.write(root + P + 'optimal-tree.json', JSON.stringify(trees))

const treeStrats: Strategy[] = !trees ? [] : LANG === 'en'
  ? [{ id: 'optimal', name: 'Optimal tree (SALET)', desc: 'Provably optimal decision tree (Selby / Bertsimas–Paskov), loaded from alex1770/wordle.', pick: c => ({ guess: c[0], score: 0, why: '' }) }]
  : [{ id: 'optimal', name: 'Optimal tree (UA)', desc: 'Proven-optimal UA decision tree (КОТРА, exact search).', pick: c => ({ guess: c[0], score: 0, why: '' }) },
     { id: 'optimal-max5', name: 'Optimal tree (UA, ≤5 guesses)', desc: 'Best average with a 5-guess guarantee (КОТРА, exact search).', pick: c => ({ guess: c[0], score: 0, why: '' }) }]
const treeFor = (id: string, hard: boolean) => !trees ? undefined : LANG === 'en' ? (id === 'optimal' ? trees[hard ? 'hard' : 'normal'] : undefined) : hard ? undefined : ({ optimal: trees.normal, 'optimal-max5': trees.max5 } as Record<string, TreeNode>)[id]
const all: Strategy[] = [...treeStrats, twoStepStrategy(), ...PRESET_STRATEGIES, ...STAGED_STRATEGIES, ...STRATEGIES].filter(s => !ids.length || ids.includes(s.id))
const results: RichResult[] = []
for (const s of all) for (const hard of noHard ? [false] : [false, true]) {
  if (LANG !== 'en' && hard && s.id.startsWith('optimal')) continue // UA trees are normal-mode only
  const r = simulateEx(s, ctx, { hard, tree: treeFor(s.id, hard) })
  results.push(r)
  console.log(`done ${r.id.padEnd(20)} avg ${r.avg.toFixed(4)} (${(r.ms / 1000).toFixed(1)}s)`)
  if (!ids.length || merge) await Bun.write(`${root}${P}sim/${r.id.replace('@', '_')}.json`, JSON.stringify({ guesses: r.guesses, sizes: r.sizes, tree: r.tree }))
}
const summary = (r: RichResult) => { const { guesses, sizes, tree, ...rest } = r; void guesses; void sizes; void tree; return rest }
for (const mode of ['normal', 'hard'] as const) {
  const rs = results.filter(r => r.mode === mode).sort((a, b) => a.avg - b.avg)
  if (!rs.length) continue
  console.log(`\n=== ${mode.toUpperCase()} MODE (optimum ${OPTIMUM[mode].toFixed(4)}) ===`)
  console.log(['Strategy'.padEnd(38), 'Opener', '  Avg ', '  Gap ', 'Fail%', 'Worst', '   1    2    3    4    5    6   >6'].join(' | '))
  console.log('-'.repeat(112))
  for (const r of rs) {
    const d = [1, 2, 3, 4, 5, 6].map(i => String(r.dist[i] ?? 0).padStart(4)).join(' ') + ' ' + String(r.dist.slice(7).reduce((a, b) => a + b, 0)).padStart(4)
    console.log([r.name.padEnd(38), r.opener.toUpperCase().padEnd(6), r.avg.toFixed(3).padStart(6), ('+' + r.gap.toFixed(3)).padStart(6), (r.failRate * 100).toFixed(2).padStart(5), String(r.worst).padStart(5), d].join(' | '))
  }
}
if (merge && ids.length) {
  const idx = (await Bun.file(root + P + 'sim/index.json').json() as { id: string }[]).filter(r => !results.some(x => x.id === r.id)).concat(results.map(summary) as never)
  await Bun.write(root + P + 'sim/index.json', JSON.stringify(idx))
  await Bun.write(root + P + 'results.json', JSON.stringify(idx.filter(r => !r.id.includes('@'))))
  console.log('merged', results.length, 'results into', P + 'sim/index.json')
}
if (!ids.length) {
  await Bun.write(root + P + 'sim/index.json', JSON.stringify(results.map(summary)))
  await Bun.write(root + P + 'results.json', JSON.stringify(results.filter(r => r.mode === 'normal').map(summary)))
  console.log('\nSaved public/sim/*.json, public/results.json, public/optimal-tree.json')
}
if (!noPairs && !ids.length && LANG === 'en') {
  const first = ['salet', 'slate', 'crane', 'trace', 'soare', 'roate', 'raise', 'arise', 'adieu', 'audio']
  const second = ['courd', 'clint', 'doing', 'pudgy', 'humid', 'lunch', 'minty', 'bough', 'dumpy', 'wonky']
  const follow = STRATEGIES.find(s => s.id === 'entropy-cand')!
  const t0 = performance.now(), cells: number[][] = []
  first.forEach((a, i) => second.forEach((b, j) => { const r = simulatePair(a, b, follow, ctx); cells.push([j, i, +r.avg.toFixed(4), r.fails]) }))
  await Bun.write(root + 'public/opener-pairs.json', JSON.stringify({ first, second, follow: follow.name, cells }))
  console.log(`opener pairs: ${cells.length} cells in ${((performance.now() - t0) / 1000).toFixed(0)}s; best`, cells.sort((a, b) => a[2] - b[2])[0].map(String).join(','))
}
