// Lists English UI strings used via t('…') / $t('…') that have no Ukrainian translation in src/lib/i18n-ua.ts.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
const UA = (await import('../src/lib/i18n-ua.ts')).default as Record<string, string>
const files: string[] = []
const walk = (d: string) => { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) walk(p); else if (/\.(vue|ts)$/.test(f) && !f.includes('i18n-ua')) files.push(p) } }
walk('src')
const missing = new Set<string>()
const re = /(?<![\w.])(?:\$?t|tr)\(\s*(['"])((?:\\.|(?!\1).)*)\1/g
for (const f of files) {
  const s = readFileSync(f, 'utf8')
  for (const m of s.matchAll(re)) { const k = m[2].replace(/\\'/g, "'").replace(/\\"/g, '"'); if (!(k in UA)) missing.add(k) }
}
// short strategy names
const names = readFileSync('src/lib/names.ts', 'utf8').match(/const SHORT[^}]+}/)![0]
for (const m of names.matchAll(/:\s*'([^']+)'/g)) if (!(m[1] in UA)) missing.add(m[1])
// strings translated at runtime from data tables (strategy groups / one-line descriptions, lookahead study, strategy names + descriptions)
const N = await import('../src/lib/names.ts'), L = await import('../src/lib/lookahead.ts'), W = await import('../src/lib/wordle.ts')
const dyn = [...N.GROUPS.map(g => g.label), ...Object.values(N.BLURBS), ...L.OPENER_EFFECT.map(r => r[0]), ...L.CAP_SWEEP.map(r => r[0]), ...L.LOOK_SWEEP.flatMap(r => [r[0], r[2]]),
  L.LOOK_A_NAME, L.LOOK_B_NAME, L.LOOK_A_DESC, L.LOOK_B_DESC, ...W.STRATEGIES.flatMap(s => [s.name, s.desc])]
for (const k of dyn) if (!/^[\d\s.–⌈⌉n/]+$/.test(k) && !(k in UA)) missing.add(k)
for (const k of missing) console.log(JSON.stringify(k))
console.error(`${missing.size} missing`)
process.exit(missing.size ? 1 : 0)
