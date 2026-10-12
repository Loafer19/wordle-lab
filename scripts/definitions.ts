// bun run definitions — precompute dictionaryapi.dev definitions for the 2,315 answers → data/definitions.json + public/definitions.json
import { existsSync } from 'fs'
import { fromDictApi, fromWiktionary, type Def } from '../src/lib/defparse'
const words = (await Bun.file('data/answers.txt').text()).split('\n').map(s => s.trim()).filter(Boolean)
const out: Record<string, Def | null> = existsSync('data/definitions.json') ? await Bun.file('data/definitions.json').json() : {}
const DICTAPI = !process.argv.includes('--wiktionary-only')
const todo = words.filter(w => !(w in out))
let i = 0
async function worker() {
  while (i < todo.length) {
    const w = todo[i++]
    let v: Def | null = null, ok = false
    for (let t = 0; t < 3 && !ok; t++) {
      if (DICTAPI) { const r = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${w}`, { signal: AbortSignal.timeout(6000) }).catch(() => null); if (r?.ok) { v = fromDictApi(await r.json()); ok = true } else if (r?.status === 404) ok = true }
      if (!v) { const r = await fetch(`https://en.wiktionary.org/api/rest_v1/page/definition/${w}`, { headers: { 'User-Agent': 'WordleLab/1.0 (personal project)' }, signal: AbortSignal.timeout(8000) }).catch(() => null); if (r?.ok) { v = fromWiktionary(await r.json()); ok = true } else if (r?.status === 404) ok = true }
      if (!ok) await Bun.sleep(20000 * (t + 1))
    }
    if (ok) out[w] = v
    if (i % 50 === 0) { console.log(i, '/', todo.length); await Bun.write('data/definitions.json', JSON.stringify(out)) }
    await Bun.sleep(900)
  }
}
await worker()
await Bun.write('data/definitions.json', JSON.stringify(out))
await Bun.write('public/definitions.json', JSON.stringify(out))
console.log('done', Object.keys(out).length, 'found', Object.values(out).filter(Boolean).length)
