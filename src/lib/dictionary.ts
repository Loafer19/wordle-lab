// Word definitions: precomputed public/definitions.json (answers) → localStorage cache → dictionaryapi.dev, graceful null when not found.
import { fromDictApi, fromWiktionary, type Def } from './defparse'
export type { Def }
const mem = new Map<string, Def | null>()
let pre: Promise<Record<string, Def | null>> | null = null
const preload = () => (pre ??= fetch(import.meta.env.BASE_URL + 'definitions.json').then(r => (r.ok ? r.json() : {})).catch(() => ({}))) as Promise<Record<string, Def | null>>
const KEY = 'wl-def:'
let dictDown = false // dictionaryapi.dev unreachable this session → go straight to Wiktionary
const tmo = (ms: number) => { const c = new AbortController(); setTimeout(() => c.abort(), ms); return c.signal }
export async function define(word: string): Promise<Def | null> {
  const w = word.toLowerCase()
  if (mem.has(w)) return mem.get(w)!
  const p = await preload()
  if (p[w]) { mem.set(w, p[w]); return p[w] }
  try { const c = localStorage.getItem(KEY + w); if (c) { const v = JSON.parse(c); mem.set(w, v); return v } } catch {}
  // 1) dictionaryapi.dev (phonetics + audio), 2) Wiktionary REST as fallback when the first is down or has no entry
  let net = false, v: Def | null = null
  if (!dictDown) try { const r = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(w)}`, { signal: tmo(5000) }); net = true; if (r.ok) v = fromDictApi(await r.json()); else if (r.status >= 500) dictDown = true } catch { dictDown = true }
  if (!v) try { const r = await fetch(`https://en.wiktionary.org/api/rest_v1/page/definition/${encodeURIComponent(w)}`, { signal: tmo(6000) }); net = true; if (r.ok) v = fromWiktionary(await r.json()) } catch {}
  if (net) { mem.set(w, v); try { localStorage.setItem(KEY + w, JSON.stringify(v)) } catch {} }
  return v
}
