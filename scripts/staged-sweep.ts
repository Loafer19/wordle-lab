// bun scripts/staged-sweep.ts [--lang ua] [--hard] [--set name] — sweeps staged-strategy parameters.
import { stagedStrategy, stagedVariant, type StagedParams } from '../src/lib/staged'
import { simulateEx } from '../src/lib/advanced'
const root = new URL('..', import.meta.url).pathname, a = process.argv.slice(2)
const LANG = a.includes('--lang') ? a[a.indexOf('--lang') + 1] : 'en', hard = a.includes('--hard')
const D = LANG === 'en' ? 'data/' : `data/${LANG}/`
const rd = async (p: string) => (await Bun.file(root + p).text()).split(/\s+/).filter(Boolean)
const ctx = { answers: await rd(D + 'answers.txt'), allowed: await rd(D + 'allowed.txt') }
const set = a.includes('--set') ? a[a.indexOf('--set') + 1] : 'base'
const V: Partial<StagedParams>[] = JSON.parse(await Bun.file(root + `scripts/sweeps/${set}.json`).text())
for (const [i, v] of V.entries()) {
  const P = stagedVariant({ id: 'v' + i, name: JSON.stringify(v), ...v })
  const r = simulateEx(stagedStrategy(P), ctx, { hard })
  const tail = r.dist.slice(7).reduce((x, y) => x + y, 0)
  console.log(JSON.stringify({ v, avg: +r.avg.toFixed(4), fail: tail, d4: r.dist[4], d5: r.dist[5], d6: r.dist[6], worst: r.worst, opener: r.opener, s: +(r.ms / 1000).toFixed(1) }))
}
