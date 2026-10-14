// Lists English UI strings used via t('…') / $t('…') that have no Ukrainian translation in src/lib/i18n-ua.ts.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
const UA = (await import('../src/lib/i18n-ua.ts')).default as Record<string, string>
const files: string[] = []
const walk = (d: string) => { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) walk(p); else if (/\.(vue|ts)$/.test(f) && !f.includes('i18n-ua')) files.push(p) } }
walk('src')
const missing = new Set<string>()
const re = /(?<![\w.])\$?t\(\s*(['"])((?:\\.|(?!\1).)*)\1/g
for (const f of files) {
  const s = readFileSync(f, 'utf8')
  for (const m of s.matchAll(re)) { const k = m[2].replace(/\\'/g, "'").replace(/\\"/g, '"'); if (!(k in UA)) missing.add(k) }
}
// short strategy names
const names = readFileSync('src/lib/names.ts', 'utf8').match(/const SHORT[^}]+}/)![0]
for (const m of names.matchAll(/:\s*'([^']+)'/g)) if (!(m[1] in UA)) missing.add(m[1])
for (const k of missing) console.log(JSON.stringify(k))
console.error(`${missing.size} missing`)
process.exit(missing.size ? 1 : 0)
