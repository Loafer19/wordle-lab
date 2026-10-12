import { isUA, NA, NV } from './lang'
import { t } from './i18n'
export const ANSWERS_LABEL = t('Possible answers ({n})', { n: NA })
export const ALLOWED_LABEL = t('All valid guesses ({n})', { n: NV })
export const ANSWERS_HELP = isUA
  ? `Можливі відповіді: ${NA} поширених українських іменників (називний відмінок однини), які можуть бути загаданим словом — іменники VESUM/Kobza, впорядковані за частотою в OpenSubtitles.`
  : `Possible answers: the ${NA} words Wordle can pick as the secret word of the day (common words only).`
export const ALLOWED_HELP = isUA
  ? `Усі допустимі спроби: ${NV} п’ятилітерних українських словоформ зі словника Kobza (на основі VESUM / brown-uk), без апострофів. Рідкісніші слова теж можуть дати більше інформації.`
  : `All valid guesses: all ${NV} words Wordle accepts when you type a guess (includes the ${NA} answers plus 10,657 obscure words like SOARE, SALET, AAHED that are never the answer). Guessing them can still give more information.`
