<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { onKeyStroke } from '@vueuse/core'
import Select from 'primevue/select'; import Button from 'primevue/button'; import InputText from 'primevue/inputtext'; import Message from 'primevue/message'
import { answers, allowed } from '../lib/words'
import { precomputed } from '../lib/results'
import { STRATEGIES, filter, digitsToPattern, entropy, feedback, patternDigits, type Suggestion } from '../lib/wordle'
import InfoTip from './InfoTip.vue'
import { ANSWERS_HELP } from '../lib/labels'

const stratId = ref('freqbal-cand')
const steps = ref<{ w: string; d: number[]; sizeBefore: number; sizeAfter: number; sug: string }[]>([])
const guess = ref(''), digits = ref([0, 0, 0, 0, 0]), err = ref(''), demoMsg = ref(''), demoSecret = ref('')
const cands = computed(() => steps.value.reduce((c, s) => filter(c, s.w, digitsToPattern(s.d)), answers.value))
const solved = computed(() => steps.value.length > 0 && steps.value[steps.value.length - 1].d.every(d => d === 2))
const sug = ref<Suggestion | null>(null), busy = ref(false)
const allowedSet = computed(() => new Set(allowed.value))

function compute() {
  if (solved.value || cands.value.length === 0) { sug.value = null; return }
  busy.value = true; sug.value = null
  setTimeout(() => {
    const s = STRATEGIES.find(x => x.id === stratId.value)!
    const pre = precomputed.value.find(r => r.id === s.id)
    if (steps.value.length === 0 && pre && s.id !== 'random') sug.value = { guess: pre.opener, score: 0, why: `Best first word for this strategy (precomputed): "${pre.opener.toUpperCase()}" gives ${entropy(pre.opener, answers.value).toFixed(2)} bits of information on average.` }
    else sug.value = s.pick(cands.value, { answers: answers.value, allowed: allowed.value }, steps.value.length + 1)
    guess.value = sug.value.guess; digits.value = demoSecret.value ? patternDigits(feedback(guess.value, demoSecret.value)) : [0, 0, 0, 0, 0]; busy.value = false
  }, 10)
}
watch([stratId, () => steps.value.length, precomputed], compute, { immediate: true })

function apply() {
  err.value = ''
  const w = guess.value.toLowerCase()
  if (w.length !== 5) return (err.value = 'Type a 5-letter word first.')
  if (!allowedSet.value.has(w)) return (err.value = `"${w.toUpperCase()}" is not a valid Wordle guess.`)
  const after = filter(cands.value, w, digitsToPattern(digits.value)).length
  if (after === 0) return (err.value = 'No possible answer matches these colours — double-check the tiles.')
  steps.value.push({ w, d: [...digits.value], sizeBefore: cands.value.length, sizeAfter: after, sug: sug.value?.guess ?? '' })
}
const undo = () => { steps.value.pop(); err.value = '' }
const reset = () => { stopDemo(); steps.value = []; err.value = ''; demoSecret.value = ''; demoMsg.value = '' }
const cycle = (i: number) => (digits.value[i] = (digits.value[i] + 1) % 3)

onKeyStroke(e => {
  const tag = (e.target as HTMLElement)?.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA') { if (e.key === 'Enter') apply(); return }
  if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); return undo() }
  if (e.ctrlKey || e.metaKey || e.altKey) return
  const k = e.key.toLowerCase()
  if (k === 'enter') apply()
  else if (k === 'escape') reset()
  else if (k === 'backspace') guess.value = guess.value.slice(0, -1)
  else if (/^[1-5]$/.test(k)) cycle(+k - 1)
  else if (/^[a-z]$/.test(k)) { guess.value = guess.value.length >= 5 ? k : guess.value + k; digits.value = [0, 0, 0, 0, 0] }
})

// Demo: walks through a sample game automatically
let timer: number | undefined
function stopDemo() { clearTimeout(timer); timer = undefined }
function demo() {
  reset()
  demoSecret.value = 'knoll'
  demoMsg.value = 'Demo: the secret word is KNOLL (pretend you don\'t know it). Watch: the suggested word is typed, its colours are filled in, then Apply is pressed.'
  const tick = () => {
    if (solved.value) { demoMsg.value = `Demo finished: solved in ${steps.value.length} guesses. Press Reset to start your own game.`; demoSecret.value = ''; return }
    if (busy.value) { timer = window.setTimeout(tick, 300); return }
    timer = window.setTimeout(() => { apply(); timer = window.setTimeout(tick, 1800) }, 1800)
  }
  timer = window.setTimeout(tick, 800)
}
onUnmounted(stopDemo)
const alts = computed(() => { const c = cands.value; if (c.length > 400 || c.length < 2) return []; return c.map(w => ({ w, h: entropy(w, c) })).sort((a, b) => b.h - a.h).slice(0, 6) })
const colourNames = ['gray', 'yellow', 'green']
</script>
<template>
  <div class="flex flex-col gap-4">
    <div class="card">
      <div class="font-semibold mb-2">How to use the solver while playing real Wordle</div>
      <ol class="grid sm:grid-cols-3 gap-3 text-sm">
        <li class="sub rounded-lg p-3"><b class="text-green-500">1.</b> Type the word you guessed in Wordle (or keep the suggested one and play it there).</li>
        <li class="sub rounded-lg p-3"><b class="text-green-500">2.</b> Click the tiles until they match the colours Wordle showed you: gray → yellow → green.</li>
        <li class="sub rounded-lg p-3"><b class="text-green-500">3.</b> Press <b>Apply</b>. The solver removes impossible words and suggests your next guess.</li>
      </ol>
      <div class="text-xs muted mt-2">Keyboard: type letters = edit word · <kbd>1</kbd>–<kbd>5</kbd> = cycle tile colour · <kbd>Enter</kbd> = Apply · <kbd>Backspace</kbd> = delete letter · <kbd>Ctrl+Z</kbd> = undo · <kbd>Esc</kbd> = reset</div>
      <div class="flex flex-wrap gap-2 items-center mt-3">
        <span class="text-sm">Strategy:</span>
        <Select v-model="stratId" :options="STRATEGIES" optionLabel="name" optionValue="id" class="w-72" />
        <InfoTip :text="STRATEGIES.find(s => s.id === stratId)?.desc ?? ''" />
        <div class="flex-1"></div>
        <Button label="▶ Show me an example" size="small" severity="help" @click="demo" />
        <Button label="Undo" size="small" severity="secondary" @click="undo" :disabled="!steps.length" />
        <Button label="Reset" size="small" severity="secondary" @click="reset" />
      </div>
    </div>
    <Message v-if="demoMsg" severity="info">{{ demoMsg }}</Message>

    <div class="grid lg:grid-cols-5 gap-4">
      <div class="card lg:col-span-3 flex flex-col gap-4">
        <div v-if="steps.length" class="flex flex-col gap-2">
          <div class="text-sm muted">Your guesses so far</div>
          <div v-for="(s, i) in steps" :key="i" class="flex items-center gap-3 flex-wrap">
            <div class="flex gap-1"><div v-for="j in 5" :key="j" class="tile !w-10 !h-10 !text-lg" :class="'t' + s.d[j - 1]">{{ s.w[j - 1] }}</div></div>
            <div class="text-sm">{{ s.sizeBefore }} → <b>{{ s.sizeAfter }}</b> possible words <span class="muted">(kept {{ Math.round((100 * s.sizeAfter) / s.sizeBefore) }}%)</span></div>
          </div>
        </div>

        <div v-if="solved" class="text-center py-6"><div class="text-4xl">🎉</div><div class="text-xl font-bold mt-2">Solved in {{ steps.length }}!</div><Button class="mt-3" label="New game" @click="reset" /></div>
        <template v-else>
          <div class="sub rounded-xl p-4 text-center">
            <div class="text-sm muted">Suggested next guess</div>
            <div v-if="busy" class="text-3xl font-bold my-3 animate-pulse">thinking…</div>
            <div v-else-if="sug" class="text-5xl font-black tracking-[0.3em] uppercase text-green-500 my-2">{{ sug.guess }}</div>
            <div v-if="sug && !busy" class="text-sm max-w-xl mx-auto">{{ sug.why }}</div>
          </div>
          <div class="flex flex-col items-center gap-3">
            <div class="text-sm font-semibold">Step 1 – the word you entered in Wordle:</div>
            <InputText v-model="guess" maxlength="5" class="w-40 text-center uppercase tracking-widest text-lg" @update:modelValue="digits = [0, 0, 0, 0, 0]" />
            <div class="text-sm font-semibold">Step 2 – click tiles to match Wordle's colours:</div>
            <div class="flex gap-2">
              <button v-for="j in 5" :key="j" class="tile cursor-pointer hover:scale-105" :class="'t' + digits[j - 1]" :title="`Tile ${j}: ${colourNames[digits[j - 1]]} (click or press ${j})`" @click="cycle(j - 1)">{{ guess[j - 1] }}</button>
            </div>
            <div class="text-xs muted">Gray = letter not in word · Yellow = in word, wrong spot · Green = right spot</div>
            <Button label="Step 3 – Apply feedback  ⏎" size="large" @click="apply" />
            <Message v-if="err" severity="error" size="small">{{ err }}</Message>
          </div>
        </template>
      </div>

      <div class="card lg:col-span-2 text-sm">
        <div class="font-semibold">Possible answers left: {{ cands.length }}<InfoTip :text="ANSWERS_HELP" /></div>
        <div class="muted text-xs mb-2">{{ Math.log2(Math.max(1, cands.length)).toFixed(2) }} bits of uncertainty</div>
        <div v-if="alts.length" class="mb-3"><div class="muted mb-1">Most informative of these (entropy):</div>
          <div v-for="a in alts" :key="a.w" class="flex gap-2 items-center font-mono"><span class="w-14 uppercase">{{ a.w }}</span><div class="bg-sky-500 h-3 rounded" :style="{ width: a.h * 30 + 'px' }"></div><span class="text-xs">{{ a.h.toFixed(2) }} bits</span></div></div>
        <div v-if="cands.length <= 150" class="font-mono muted break-words leading-relaxed">{{ cands.join(' ') }}</div>
        <div v-else class="muted">Too many to list; apply a guess first.</div>
      </div>
    </div>
  </div>
</template>
