// Shared parsers for dictionaryapi.dev and Wiktionary REST responses → compact Def.
export type Def = { ph?: string; au?: string; m: { p: string; d: string; e?: string }[]; src?: 'dictionaryapi' | 'wiktionary' }
export function fromDictApi(j: any): Def | null {
  if (!Array.isArray(j) || !j.length) return null
  const ph = j.flatMap((e: any) => e.phonetics ?? []), m: Def['m'] = []
  for (const e of j) for (const mm of e.meanings ?? []) { const d = mm.definitions?.[0]; if (d && m.length < 3 && !m.some(x => x.p === mm.partOfSpeech)) m.push({ p: mm.partOfSpeech, d: d.definition, ...(d.example ? { e: d.example } : {}) }) }
  return m.length ? { ph: j[0].phonetic ?? ph.find((p: any) => p.text)?.text, au: ph.find((p: any) => p.audio)?.audio || undefined, m, src: 'dictionaryapi' } : null
}
const strip = (h: string) => h.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim()
export function fromWiktionary(j: any): Def | null {
  const m: Def['m'] = []
  for (const e of j?.en ?? []) {
    const p = String(e.partOfSpeech ?? '').toLowerCase()
    if (m.some(x => x.p === p) || m.length >= 3) continue
    const d = (e.definitions ?? []).map((x: any) => ({ d: strip(x.definition ?? ''), e: x.parsedExamples?.[0]?.example ?? x.examples?.[0] })).find((x: any) => x.d && !/^\(?(obsolete|archaic)/i.test(x.d))
    if (d) m.push({ p, d: d.d, ...(d.e ? { e: strip(d.e) } : {}) })
  }
  return m.length ? { m, src: 'wiktionary' } : null
}
