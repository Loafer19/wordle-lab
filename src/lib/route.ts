// Tiny hash router: #tab=<section>&view=<sub-view>. Real <a href> links, back/forward, old tab/view hashes redirected (v1.0–v1.3 links keep working).
import { reactive } from 'vue'
import { href, resolve } from './routes'
export { SECTIONS, LEGACY, href, resolve } from './routes'
function parse() {
  const q = new URLSearchParams(location.hash.slice(1))
  const r = resolve(q.get('tab') ?? 'play', q.get('view') ?? undefined)
  const canonical = href(r.tab, r.view || undefined)
  if (location.hash && location.hash !== canonical && !q.has('lang')) history.replaceState(null, '', canonical)
  return r
}
export const route = reactive(parse())
window.addEventListener('hashchange', () => Object.assign(route, parse()))
export const go = (tab: string, view?: string) => { location.hash = href(tab, view) }
