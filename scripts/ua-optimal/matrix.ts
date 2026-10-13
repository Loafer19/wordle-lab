// Precompute the guess × answer feedback matrix (uint8, row-major [guess][answer]) with the app's own feedback().
// bun scripts/ua-optimal/matrix.ts [lang]  → /tmp/wl-<lang>.mat (header: u32 nGuess, u32 nAns)
import { feedback } from '../../src/lib/wordle'
const lang = process.argv[2] ?? 'ua', root = new URL('../..', import.meta.url).pathname, D = lang === 'en' ? 'data/' : `data/${lang}/`
const rd = async (p: string) => (await Bun.file(root + p).text()).split(/\s+/).filter(Boolean)
const answers = await rd(D + 'answers.txt'), allowed = await rd(D + 'allowed.txt')
const buf = new Uint8Array(8 + allowed.length * answers.length), dv = new DataView(buf.buffer)
dv.setUint32(0, allowed.length, true); dv.setUint32(4, answers.length, true)
let k = 8
for (const g of allowed) for (const a of answers) buf[k++] = feedback(g, a)
await Bun.write(`/tmp/wl-${lang}.mat`, buf)
await Bun.write(`/tmp/wl-${lang}.words`, allowed.join('\n') + '\n')
// answer index in allowed list
await Bun.write(`/tmp/wl-${lang}.ansidx`, answers.map(a => allowed.indexOf(a)).join('\n') + '\n')
console.log(allowed.length, answers.length, 'done')
// letter codes (alpha.ts CI) of every allowed word, 5 per line — for the hard-mode solver (WL_CODES)
import { CI } from '../../src/lib/alpha'
await Bun.write(`/tmp/wl-${lang}.codes`, allowed.map(w => [...w].map(ch => CI[ch.charCodeAt(0)]).join(' ')).join('\n') + '\n')
