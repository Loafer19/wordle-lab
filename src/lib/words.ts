import { shallowRef } from 'vue'
const load = async (f: string) => (await (await fetch(import.meta.env.BASE_URL + f)).text()).split(/\s+/).filter(Boolean)
export const answers = shallowRef<string[]>([])
export const allowed = shallowRef<string[]>([])
export const ready = Promise.all([load('answers.txt'), load('allowed.txt')]).then(([a, b]) => { answers.value = a; allowed.value = b })
