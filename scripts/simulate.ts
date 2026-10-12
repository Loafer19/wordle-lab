// bun run simulate [strategyId ...]  — simulates every strategy over all 2,315 answers
import { STRATEGIES, simulate } from '../src/lib/wordle'
const read = async (p: string) => (await Bun.file(new URL(p, import.meta.url)).text()).split(/\s+/).filter(Boolean)
const answers = await read('../data/answers.txt'), allowed = await read('../data/allowed.txt')
const want = process.argv.slice(2)
const strats = want.length ? STRATEGIES.filter(s => want.includes(s.id)) : STRATEGIES
console.log(`answers=${answers.length} allowed=${allowed.length}\n`)
const results = []
for (const s of strats) {
  const r = simulate(s, { answers, allowed })
  results.push(r)
  console.log(`done ${s.id.padEnd(14)} avg ${r.avg.toFixed(4)}  (${(r.ms / 1000).toFixed(1)}s)`)
}
results.sort((a, b) => a.avg - b.avg)
console.log('\n' + ['Strategy'.padEnd(30), 'Opener', ' Avg  ', 'Fail%', 'Worst', '  1    2    3    4    5    6   >6'].join(' | '))
console.log('-'.repeat(100))
for (const r of results) {
  const d = [1, 2, 3, 4, 5, 6].map(i => String(r.dist[i] ?? 0).padStart(4)).join(' ') + ' ' + String(r.dist.slice(7).reduce((a, b) => a + b, 0)).padStart(4)
  console.log([r.name.padEnd(30), r.opener.toUpperCase().padEnd(6), r.avg.toFixed(3).padStart(6), (r.failRate * 100).toFixed(2).padStart(5), String(r.worst).padStart(5), d].join(' | '))
}
if (!want.length) { await Bun.write(new URL('../public/results.json', import.meta.url), JSON.stringify(results)); console.log('\nSaved public/results.json') }
