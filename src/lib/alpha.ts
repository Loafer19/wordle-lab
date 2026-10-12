// Letter index shared by all engines: Latin a–z → 0..25, Ukrainian alphabet → 26..58. NL = size of per-letter arrays.
export const LATIN = 'abcdefghijklmnopqrstuvwxyz'
export const UKR = 'абвгґдеєжзиіїйклмнопрстуфхцчшщьюя'
export const ALPHA = LATIN + UKR
export const NL = ALPHA.length
export const CI = new Uint8Array(1200)
for (let i = 0; i < NL; i++) CI[ALPHA.charCodeAt(i)] = i
export const L = (i: number) => ALPHA[i]
