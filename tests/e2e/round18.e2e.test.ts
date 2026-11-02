// Final footer (issue #2): the current pill footer without the "Source on GitHub" chip.
import { test, expect } from 'bun:test'
import { open } from './helpers'

for (const lang of ['en', 'ua'] as const)
  test(`${lang}: footer has two info pills (licence, author) and version + updated pills, no GitHub chip`, async () => {
    const { b, p, errors } = await open('play', { lang })
    try {
      const left = p.locator('[data-footer-left] > *')
      expect(await left.count()).toBe(2)
      const texts = (await left.allInnerTexts()).map(s => s.trim())
      expect(texts[0]).toContain('MIT')
      expect(texts[1]).toContain('@Loafer19')
      expect(await p.locator('[data-footer] a[href="https://github.com/Loafer19/wordle-lab"]').count()).toBe(0)
      expect(await p.locator('[data-footer]').innerText()).not.toMatch(/GitHub/)
      expect(await p.locator('[data-footer-right] [data-version]').getAttribute('href')).toMatch(/releases\/tag\/v\d+\.\d+\.\d+$/)
      if (lang === 'en') for (const t of texts) expect(t).not.toMatch(/\.$/) // UI copy has no trailing periods
      expect(errors).toEqual([])
    } finally {
      await b.close()
    }
  }, 30000)
