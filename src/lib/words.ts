import { shallowRef } from 'vue'
import { base } from './lang'
const load = async (f: string) => (await (await fetch(base + f)).text()).split(/\s+/).filter(Boolean)
export const answers = shallowRef<string[]>([])
export const allowed = shallowRef<string[]>([])
export const ready = Promise.all([load('answers.txt'), load('allowed.txt')]).then(([a, b]) => { answers.value = a; allowed.value = b })
