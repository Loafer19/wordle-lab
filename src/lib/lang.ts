// Game language (word lists + keyboard). Chosen once per page load; switching reloads the app so every list/sim/cache is consistent.
export type Lang = 'en' | 'ua'
const fromHash = typeof location !== 'undefined' ? location.hash.match(/lang=(en|ua)/)?.[1] as Lang | undefined : undefined
if (fromHash) localStorage.setItem('wl-lang', fromHash)
export const lang: Lang = (typeof localStorage !== 'undefined' && localStorage.getItem('wl-lang') === 'ua') ? 'ua' : 'en'
export const isUA = lang === 'ua'
export const base = import.meta.env.BASE_URL + (isUA ? 'ua/' : '')
export const META = {
  en: { name: 'English', short: 'EN', answers: 2315, allowed: 12972, rows: ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'], letters: 'abcdefghijklmnopqrstuvwxyz' },
  ua: { name: 'Українська', short: 'UA', answers: 1717, allowed: 7158, rows: ['йцукенгшщзхї', 'фівапролджє', 'ячсмитьбюґ'], letters: 'абвгґдеєжзиіїйклмнопрстуфхцчшщьюя' },
}[lang]
export const NA = META.answers.toLocaleString('en-US'), NV = META.allowed.toLocaleString('en-US')
export const isLetter = (k: string) => k.length === 1 && META.letters.includes(k)
// Physical QWERTY key → Ukrainian letter (ЙЦУКЕН layout), so a Latin layout still types Ukrainian in UA mode.
const codeMap: Record<string, string> = {}
'KeyQ й KeyW ц KeyE у KeyR к KeyT е KeyY н KeyU г KeyI ш KeyO щ KeyP з BracketLeft х BracketRight ї KeyA ф KeyS і KeyD в KeyF а KeyG п KeyH р KeyJ о KeyK л KeyL д Semicolon ж Quote є KeyZ я KeyX ч KeyC с KeyV м KeyB и KeyN т KeyM ь Comma б Period ю Backquote ґ'
  .split(' ').reduce((k, v, i, a) => (i % 2 ? (codeMap[a[i - 1]] = v) : 0, k), 0)
/** Normalise a keyboard event to a game key: letter of current language, 'enter', 'back' or ''. */
export function gameKey(e: KeyboardEvent): string {
  const k = e.key.toLowerCase()
  if (k === 'enter') return 'enter'
  if (k === 'backspace') return 'back'
  if (isLetter(k)) return k
  if (isUA && codeMap[e.code]) return codeMap[e.code]
  return ''
}
export function setLang(l: Lang) { localStorage.setItem('wl-lang', l); const h = location.hash.replace(/&?lang=(en|ua)/, ''); location.hash = h; location.reload() }
/** Best precomputed strategy id for this language (EN has the proven-optimal tree). */
export const BEST_ID = isUA ? 'entropy-all' : 'optimal'
export const DEMO_WORD = isUA ? 'слово' : 'knoll'
export const FAMOUS_OPENERS = isUA
  ? ['котра', 'колар', 'косар', 'норка', 'корал', 'ранок', 'токар', 'барок', 'корма', 'крона', 'танок', 'комар', 'карта', 'актор', 'сокіл', 'мрія', 'слово'].filter(w => w.length === 5)
  : ['soare', 'salet', 'roate', 'raise', 'arise', 'crane', 'slate', 'trace', 'crate', 'tares', 'adieu', 'audio', 'irate', 'stare', 'arose', 'later', 'alert']
