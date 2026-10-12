// Minimal i18n: English source strings are the keys; Ukrainian dictionary in i18n-ua.ts. Missing keys fall back to English.
import { isUA } from './lang'
import UA from './i18n-ua'
export function t(s: string, v?: Record<string, string | number>): string {
  let r = isUA ? (UA[s] ?? s) : s
  if (v) for (const k in v) r = r.split('{' + k + '}').join(String(v[k]))
  return r
}
export const missing = () => (isUA ? [] : [])
