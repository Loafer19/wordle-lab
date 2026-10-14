// Share card as a PNG: a pure layout (list of draw ops, unit-tested) + a tiny canvas renderer. No dependencies.
import { tile, brand, danger } from './tokens'
export interface CardInput { title: string; sub: string; rows: number[][]; score: string; skill?: string; luck?: string; luckGood?: boolean; optimal?: string; url: string; dark: boolean }
export type Op =
  | { k: 'rect'; x: number; y: number; w: number; h: number; r: number; fill: string; stroke?: string }
  | { k: 'text'; x: number; y: number; s: string; size: number; weight: number; fill: string; align: CanvasTextAlign }
/** Surface colours mirror --c-* in style.css. */
export const CARD_THEME = {
  light: { bg: '#ffffff', surface: '#f1f1f3', line: '#e4e4e7', fg: '#18181b', muted: '#5f5f6b' },
  dark: { bg: '#161618', surface: '#1f1f23', line: '#2a2a2f', fg: '#f4f4f5', muted: '#a1a1aa' },
}
export const CARD_W = 600
const CELL = 52, GAP = 8
/** Layout of the card in CSS pixels; height depends on the number of rows and badges. */
export function cardLayout(c: CardInput): { w: number; h: number; ops: Op[] } {
  const th = c.dark ? CARD_THEME.dark : CARD_THEME.light, W = CARD_W, ops: Op[] = []
  let y = 40
  ops.push({ k: 'text', x: W / 2, y, s: c.title, size: 30, weight: 800, fill: th.fg, align: 'center' }); y += 34
  ops.push({ k: 'text', x: W / 2, y, s: c.sub, size: 20, weight: 500, fill: th.muted, align: 'center' }); y += 30
  const gw = 5 * CELL + 4 * GAP, x0 = (W - gw) / 2
  for (const r of c.rows) { r.forEach((d, j) => ops.push({ k: 'rect', x: x0 + j * (CELL + GAP), y, w: CELL, h: CELL, r: 6, fill: [tile.absent, tile.present, tile.correct][d] })); y += CELL + GAP }
  y += 40
  ops.push({ k: 'text', x: W / 2, y, s: c.score, size: 44, weight: 800, fill: th.fg, align: 'center' }); y += 24
  const badges: { s: string; fill: string }[] = []
  if (c.skill) badges.push({ s: c.skill, fill: brand[600] })
  if (c.luck) badges.push({ s: c.luck, fill: c.luckGood === false ? danger : tile.correct })
  if (badges.length) {
    const bw = Math.min((CARD_W - 40 - 12) / badges.length, Math.max(170, ...badges.map(b => b.s.length * 11 + 36))), tot = badges.length * bw + (badges.length - 1) * 12; let bx = (W - tot) / 2
    for (const b of badges) { ops.push({ k: 'rect', x: bx, y, w: bw, h: 40, r: 20, fill: b.fill }, { k: 'text', x: bx + bw / 2, y: y + 27, s: b.s, size: 19, weight: 700, fill: '#ffffff', align: 'center' }); bx += bw + 12 }
    y += 56
  }
  if (c.optimal) { y += 10; ops.push({ k: 'text', x: W / 2, y, s: c.optimal, size: 20, weight: 500, fill: th.muted, align: 'center' }); y += 16 }
  y += 30
  ops.push({ k: 'text', x: W / 2, y, s: c.url, size: 18, weight: 600, fill: brand[c.dark ? 400 : 700], align: 'center' }); y += 28
  ops.unshift({ k: 'rect', x: 0, y: 0, w: W, h: y, r: 28, fill: th.bg, stroke: th.line })
  return { w: W, h: y, ops }
}
export function drawCard(cv: HTMLCanvasElement, c: CardInput, scale = 2) {
  const L = cardLayout(c), g = cv.getContext('2d')!
  cv.width = L.w * scale; cv.height = L.h * scale; g.scale(scale, scale)
  for (const o of L.ops) {
    if (o.k === 'rect') { g.beginPath(); g.roundRect(o.x, o.y, o.w, o.h, o.r); g.fillStyle = o.fill; g.fill(); if (o.stroke) { g.strokeStyle = o.stroke; g.lineWidth = 2; g.stroke() } }
    else { g.font = `${o.weight} ${o.size}px Inter, system-ui, sans-serif`; g.fillStyle = o.fill; g.textAlign = o.align; g.fillText(o.s, o.x, o.y) }
  }
}
export function cardBlob(c: CardInput): Promise<Blob> {
  const cv = document.createElement('canvas'); drawCard(cv, c)
  return new Promise((res, rej) => cv.toBlob(b => (b ? res(b) : rej(new Error('toBlob failed'))), 'image/png'))
}
export function download(blob: Blob, name: string) {
  const a = document.createElement('a'), u = URL.createObjectURL(blob)
  a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 1000)
}
/** Share as an image file when the Web Share API accepts files, otherwise download it. Returns what happened. */
export async function shareImage(blob: Blob, name: string, text: string): Promise<'shared' | 'downloaded' | 'cancelled'> {
  const file = new File([blob], name, { type: 'image/png' }), nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean }
  if (nav.share && nav.canShare?.({ files: [file] })) {
    try { await nav.share({ files: [file], text }); return 'shared' } catch (e) { if ((e as Error).name === 'AbortError') return 'cancelled' }
  }
  download(blob, name); return 'downloaded'
}
