// Notable words for Community › From Wordle Lab: computed from the precomputed simulations (public/sim/*.json).
//   bun scripts/notable.ts            → public/notable.json and public/ua/notable.json
// hardest: highest average guesses over every built-in strategy except Random (normal mode), with the worst case and
//          how many strategies needed more than 6; hardMode: most strategies failing (>6) in hard mode;
// families: the largest groups of answers that differ in one letter only (e.g. _IGHT), the classic Wordle traps.
const root = new URL('..', import.meta.url).pathname
for (const lang of ['en', 'ua']) {
  const P = root + (lang === 'en' ? 'public/' : 'public/ua/')
  const answers = (await Bun.file(P + 'answers.txt').text()).split(/\s+/).filter(Boolean)
  const index = (await Bun.file(P + 'sim/index.json').json()) as { id: string; mode: string }[]
  const ids = index.map(s => s.id).filter(id => !id.startsWith('random'))
  const g: Record<string, number[]> = {}
  for (const id of ids) g[id] = ((await Bun.file(`${P}sim/${id.replace('@', '_')}.json`).json()) as { guesses: number[] }).guesses
  const normal = ids.filter(id => !id.includes('@')), hard = ids.filter(id => id.includes('@'))
  const rows = answers.map((w, i) => {
    const n = normal.map(id => g[id][i]), h = hard.map(id => g[id][i])
    return { w, avg: n.reduce((a, b) => a + b, 0) / n.length, worst: Math.max(...n), fails: n.filter(x => x > 6).length, hardAvg: h.reduce((a, b) => a + b, 0) / h.length, hardFails: h.filter(x => x > 6).length, hardWorst: Math.max(...h) }
  })
  const r2 = (x: number) => +x.toFixed(2)
  const hardest = [...rows].sort((a, b) => b.avg - a.avg || b.worst - a.worst).slice(0, 12).map(r => ({ w: r.w, avg: r2(r.avg), worst: r.worst, fails: r.fails }))
  const hardMode = [...rows].sort((a, b) => b.hardFails - a.hardFails || b.hardAvg - a.hardAvg).slice(0, 12).map(r => ({ w: r.w, fails: r.hardFails, avg: r2(r.hardAvg), worst: r.hardWorst }))
  // one-letter families: same word with one position blanked; keep the largest family per word
  const fam = new Map<string, string[]>()
  for (const w of answers) for (let p = 0; p < 5; p++) { const k = [...w].map((c, i) => (i === p ? '_' : c)).join(''); (fam.get(k) ?? fam.set(k, []).get(k)!).push(w) }
  const used = new Set<string>(), avgOf = new Map(rows.map(r => [r.w, r.avg]))
  const families = [...fam.entries()].filter(([, ws]) => ws.length >= 4).sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]))
    .filter(([, ws]) => { if (ws.every(w => used.has(w))) return false; ws.forEach(w => used.add(w)); return true }).slice(0, 8)
    .map(([k, ws]) => ({ pattern: k, words: ws, avg: r2(ws.reduce((a, w) => a + avgOf.get(w)!, 0) / ws.length) }))
  const out = { strategies: normal.length, hardStrategies: hard.length, answers: answers.length, hardest, hardMode, families }
  await Bun.write(P + 'notable.json', JSON.stringify(out))
  console.log(lang, 'strategies', normal.length, '| hardest', hardest.slice(0, 5).map(r => `${r.w} ${r.avg}`).join(', '), '| hard fails', hardMode.slice(0, 3).map(r => `${r.w} ${r.fails}/${hard.length}`).join(', '), '| families', families.slice(0, 4).map(f => `${f.pattern}×${f.words.length}`).join(', '))
}
