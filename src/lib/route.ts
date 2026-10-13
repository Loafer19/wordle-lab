// Tiny hash router: #tab=<section>&view=<sub-view>. Real <a href> links, back/forward, legacy tab hashes redirected.
import { reactive } from 'vue'
export const SECTIONS: Record<string, string[]> = {
  play: [], solver: [], coach: [],
  strategies: ['simulation', 'compare', 'lab'],
  explore: ['paths', 'tree', 'flow', 'map'],
  analytics: ['letters', 'patterns', 'openers'],
}
const LEGACY: Record<string, [string, string?]> = {
  assist: ['solver'], sim: ['strategies', 'simulation'], compare: ['strategies', 'compare'], tuner: ['strategies', 'lab'], letters: ['analytics', 'letters'],
  path: ['explore', 'paths'], tree: ['explore', 'tree'], flow: ['explore', 'flow'], map: ['explore', 'map'],
  patterns: ['analytics', 'patterns'], openers: ['analytics', 'openers'],
}
export const href = (tab: string, view?: string) => `#tab=${tab}${view ? '&view=' + view : ''}`
function parse() {
  const q = new URLSearchParams(location.hash.slice(1))
  let tab = q.get('tab') ?? 'play', view = q.get('view') ?? undefined
  if (LEGACY[tab]) [tab, view] = [LEGACY[tab][0], view && tab === 'letters' ? view : LEGACY[tab][1] ?? view]
  if (tab === 'strategies' && view === 'tuner') view = 'lab'
  if (!(tab in SECTIONS)) tab = 'play'
  const views = SECTIONS[tab]
  if (views.length && (!view || !views.includes(view))) view = views[0]
  if (!views.length) view = undefined
  const canonical = href(tab, view)
  if (location.hash && location.hash !== canonical && !q.has('lang')) history.replaceState(null, '', canonical)
  return { tab, view: view ?? '' }
}
export const route = reactive(parse())
window.addEventListener('hashchange', () => Object.assign(route, parse()))
