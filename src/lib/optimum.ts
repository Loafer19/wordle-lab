// Proven optimal averages per language (min total guesses / answers). EN: Selby, Bertsimas & Paskov. UA: our exact solver (scripts/ua-optimal).
export const OPTIMA = {
  en: { normal: 7920 / 2315, hard: 8122 / 2315, opener: 'SALET', hardOpener: 'SALET' },
  ua: { normal: 5805 / 1717, hard: 5930 / 1717, opener: 'КОТРА', hardOpener: 'КАРСТ' },
} as const
export type OptLang = keyof typeof OPTIMA
/** Gap of an average to the language/mode optimum, never negative (rounding noise is clamped). */
export const gapTo = (avg: number, l: OptLang, hard: boolean) => Math.max(0, avg - OPTIMA[l][hard ? 'hard' : 'normal'])
