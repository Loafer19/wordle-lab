// Number formatting for casual views: short rounded value, full precision available on hover (title/tooltip).
export const round = (v: number, d = 2) => (Number.isFinite(v) ? v.toFixed(d) : '—')
export const full = (v: number) => (Number.isFinite(v) ? String(+v.toFixed(6)) : '')
export const signed = (v: number, d = 2) => (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(d)
export const pct = (v: number) => Math.round(v * 100) + '%'
