// Letter indexing must work for every alphabet (Latin + Ukrainian incl. ґ є і ї).
import { test, expect } from 'bun:test'
import { letterFreq, feedback, STRATEGIES } from '../../src/lib/wordle'
import { CI, ALPHA, LATIN, UKR } from '../../src/lib/alpha'
const rd = async (p: string) => (await Bun.file(new URL('../../' + p, import.meta.url).pathname).text()).split(/\s+/).filter(Boolean)

test('alphabet map is a bijection', () => {
  expect(new Set([...ALPHA].map(c => CI[c.charCodeAt(0)])).size).toBe(ALPHA.length)
  for (const c of 'ґєії') expect(CI[c.charCodeAt(0)]).toBeGreaterThanOrEqual(LATIN.length)
})
for (const [lang, letters, dir] of [['en', LATIN, 'data/'], ['ua', UKR, 'data/ua/']] as const) {
  test(`${lang}: positional frequencies sum to 5·N and every letter of the alphabet appears`, async () => {
    const allowed = await rd(dir + 'allowed.txt')
    const { overall, pos } = letterFreq(allowed)
    for (let i = 0; i < 5; i++) expect(letters.split('').reduce((t, l) => t + pos[i][CI[l.charCodeAt(0)]], 0)).toBe(allowed.length)
    const missing = letters.split('').filter(l => !overall[CI[l.charCodeAt(0)]])
    expect(missing).toEqual([])
    // no counts leak into indices outside this alphabet
    const idx = new Set(letters.split('').map(l => CI[l.charCodeAt(0)]))
    expect(overall.every((v, i) => idx.has(i) || v === 0)).toBe(true)
  })
}
test('ua feedback handles ї/є/ґ and duplicate letters', () => {
  expect(feedback('їжаки', 'їжаки')).toBe(242)
  expect(feedback('ґанок', 'ганок')).toBe(2 * 3 + 2 * 9 + 2 * 27 + 2 * 81)
})
test('ua Ruslan explanation lists Cyrillic letters', async () => {
  const answers = await rd('data/ua/answers.txt'), allowed = await rd('data/ua/allowed.txt')
  const s = STRATEGIES.find(x => x.id === 'freqbal-cand')!.pick(answers, { answers, allowed }, 0)
  expect(s.why).toMatch(/[А-ЯҐЄІЇ]\(\d+\)/)
  expect(s.why).not.toMatch(/[A-Z]\(\d+\)/)
})
