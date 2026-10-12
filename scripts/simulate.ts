// bun run simulate [--no-hard] [--no-pairs] [ids...]
// Simulates every strategy (normal + hard mode) over all 2,315 answers, verifies the published optimal trees,
// prints a table with the gap to the proven optimum and writes public/sim/*.json, public/results.json, public/opener-pairs.json.
import { STRATEGIES, type Strategy } from '../src/lib/wordle'
import { simulateEx, simulatePair, twoStepStrategy, parseSelbyTree, verifyTree, OPTIMUM, type RichResult } from '../src/lib/advanced'
const root = new URL('..', import.meta.url).pathname
const rd = async (p: string) => (await Bun.file(root + p).text()).split(/\s+/).filter(Boolean)
const answers = await rd('data/answers.txt'), allowed = await rd('data/allowed.txt')
const ctx = { answers, allowed }
const args = process.argv.slice(2), ids = args.filter(a => !a.startsWith('--'))
const noHard = args.includes('--no-hard'), noPairs = args.includes('--no-pairs')
console.log(`answers=${answers.length} allowed=${allowed.length}`)

// optimal trees (Alex Selby, github.com/alex1770/wordle)
const trees = {
  normal: parseSelbyTree(await Bun.file(root + 'data/optimal/salet.easy.origwords.tree').text()),
  hard: parseSelbyTree(await Bun.file(root + 'data/optimal/salet.hard.origwordlist.tree').text()),
}
for (const m of ['normal', 'hard'] as const) { const e = verifyTree(trees[m], answers, m === 'hard'); console.log(`verify optimal ${m} tree: ${e.length ? e.length + ' ERRORS ' + e.slice(0, 3) : 'OK'}`) }
await Bun.write(root + 'public/optimal-tree.json', JSON.stringify(trees))

const optimal: Strategy = { id: 'optimal', name: 'Optimal tree (SALET)', desc: 'Provably optimal decision tree (Selby / Bertsimas–Paskov), loaded from alex1770/wordle.', pick: c => ({ guess: c[0], score: 0, why: '' }) }
const all: Strategy[] = [optimal, twoStepStrategy(), ...STRATEGIES].filter(s => !ids.length || ids.includes(s.id))
const results: RichResult[] = []
for (const s of all) for (const hard of noHard ? [false] : [false, true]) {
  const r = simulateEx(s, ctx, { hard, tree: s.id === 'optimal' ? trees[hard ? 'hard' : 'normal'] : undefined })
  results.push(r)
  console.log(`done ${r.id.padEnd(20)} avg ${r.avg.toFixed(4)} (${(r.ms / 1000).toFixed(1)}s)`)
  if (!ids.length) await Bun.write(`${root}public/sim/${r.id.replace('@', '_')}.json`, JSON.stringify({ guesses: r.guesses, sizes: r.sizes, tree: r.tree }))
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
if (!ids.length) {
  await Bun.write(root + 'public/sim/index.json', JSON.stringify(results.map(summary)))
  await Bun.write(root + 'public/results.json', JSON.stringify(results.filter(r => r.mode === 'normal').map(summary)))
  console.log('\nSaved public/sim/*.json, public/results.json, public/optimal-tree.json')
}
if (!noPairs && !ids.length) {
  const first = ['salet', 'slate', 'crane', 'trace', 'soare', 'roate', 'raise', 'arise', 'adieu', 'audio']
  const second = ['courd', 'clint', 'doing', 'pudgy', 'humid', 'lunch', 'minty', 'bough', 'dumpy', 'wonky']
  const follow = STRATEGIES.find(s => s.id === 'entropy-cand')!
  const t0 = performance.now(), cells: number[][] = []
  first.forEach((a, i) => second.forEach((b, j) => { const r = simulatePair(a, b, follow, ctx); cells.push([j, i, +r.avg.toFixed(4), r.fails]) }))
  await Bun.write(root + 'public/opener-pairs.json', JSON.stringify({ first, second, follow: follow.name, cells }))
  console.log(`opener pairs: ${cells.length} cells in ${((performance.now() - t0) / 1000).toFixed(0)}s; best`, cells.sort((a, b) => a[2] - b[2])[0].map(String).join(','))
}
