// Route table + old-link redirects (pure; unit-tested).
export const SECTIONS: Record<string, string[]> = {
  play: [],
  assistant: ['solve', 'review', 'watch'],
  learn: ['guide', 'letters', 'openers', 'inspector'],
  strategies: ['leaderboard', 'compare', 'lab', 'lookahead'],
  explore: ['tree', 'flow', 'map'],
  community: [],
}
/** Old tab (and optional old view) → new [tab, view]. Exported for tests. */
export const LEGACY: Record<string, [string, string?]> = {
  assist: ['assistant', 'solve'], solver: ['assistant', 'solve'], coach: ['assistant', 'review'], path: ['assistant', 'watch'], paths: ['assistant', 'watch'],
  sim: ['strategies', 'leaderboard'], simulation: ['strategies', 'leaderboard'], compare: ['strategies', 'compare'], tuner: ['strategies', 'lab'], lab: ['strategies', 'lab'],
  letters: ['learn', 'letters'], patterns: ['learn', 'inspector'], openers: ['learn', 'openers'], analytics: ['learn', 'letters'],
  tree: ['explore', 'tree'], flow: ['explore', 'flow'], map: ['explore', 'map'],
}
const LEGACY_VIEW: Record<string, Record<string, [string, string]>> = {
  strategies: { simulation: ['strategies', 'leaderboard'], tuner: ['strategies', 'lab'] },
  explore: { paths: ['assistant', 'watch'] },
  analytics: { letters: ['learn', 'letters'], patterns: ['learn', 'inspector'], openers: ['learn', 'openers'] },
}
export const href = (tab: string, view?: string) => `#tab=${tab}${view ? '&view=' + view : ''}`
/** Resolve any (possibly old) tab/view pair to the current one. */
export function resolve(tab: string, view?: string): { tab: string; view: string } {
  if (LEGACY_VIEW[tab] && view && LEGACY_VIEW[tab][view]) [tab, view] = LEGACY_VIEW[tab][view]
  else if (LEGACY[tab] && !(tab in SECTIONS)) [tab, view] = [LEGACY[tab][0], LEGACY[tab][1]]
  if (!(tab in SECTIONS)) tab = 'play'
  const views = SECTIONS[tab]
  if (views.length && (!view || !views.includes(view))) view = views[0]
  if (!views.length) view = undefined
  return { tab, view: view ?? '' }
}
