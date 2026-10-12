// The shipped UA optimal trees must cover every answer with our feedback() and match the solver's proven totals.
import { test, expect } from 'bun:test'
import { verifyTree, type TreeNode } from '../../src/lib/advanced'
import { feedback, ALL_GREEN } from '../../src/lib/wordle'
const root = new URL('../../', import.meta.url).pathname
const rd = async (p: string) => (await Bun.file(root + p).text()).split(/\s+/).filter(Boolean)
const depth = (t: TreeNode, a: string) => { let n: TreeNode | undefined = t, k = 0; while (n) { k++; const p = feedback(n.g, a); if (p === ALL_GREEN) return k; n = n.c?.[p] } return 99 }
for (const [file, total, worst] of [['kotra.normal.json', 5805, 6], ['kotra.max5.json', 5806, 5]] as const)
  test(`UA ${file}: valid, total ${total}, worst ${worst}`, async () => {
    const answers = await rd('data/ua/answers.txt'), allowed = new Set(await rd('data/ua/allowed.txt'))
    const t: TreeNode = await Bun.file(root + 'data/ua/optimal/' + file).json()
    expect(t.g).toBe('котра'); expect(t.n).toBe(answers.length)
    expect(verifyTree(t, answers)).toEqual([])
    const walk = (n: TreeNode): void => { expect(allowed.has(n.g)).toBe(true); for (const c of Object.values(n.c ?? {})) walk(c) }; walk(t)
    const d = answers.map(a => depth(t, a))
    expect(d.reduce((s, x) => s + x, 0)).toBe(total); expect(Math.max(...d)).toBe(worst)
  })
