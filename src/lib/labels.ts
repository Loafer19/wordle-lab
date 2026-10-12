import { isUA, NA, NV } from './lang'
export const ANSWERS_LABEL = `Possible answers (${NA})`
export const ALLOWED_LABEL = `All valid guesses (${NV})`
export const ANSWERS_HELP = isUA
  ? `Possible answers: ${NA} common Ukrainian nouns (nominative singular) that can be the secret word — VESUM/Kobza nouns ranked by OpenSubtitles frequency.`
  : `Possible answers: the ${NA} words Wordle can pick as the secret word of the day (common words only).`
export const ALLOWED_HELP = isUA
  ? `All valid guesses: ${NV} five-letter Ukrainian word forms from the Kobza dictionary (built from VESUM / brown-uk), no apostrophes. Guessing rarer words can still give more information.`
  : `All valid guesses: all ${NV} words Wordle accepts when you type a guess (includes the ${NA} answers plus 10,657 obscure words like SOARE, SALET, AAHED that are never the answer). Guessing them can still give more information.`
