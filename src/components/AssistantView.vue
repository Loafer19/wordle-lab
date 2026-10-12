<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { onKeyStroke } from '@vueuse/core'
import Select from 'primevue/select'; import InputText from 'primevue/inputtext'
import { Play, Undo2, RotateCcw, Check, PartyPopper, Lightbulb, Keyboard, ListFilter, History, CircleAlert, Info, ArrowRight } from 'lucide-vue-next'
import { allStrategies } from '../lib/allStrategies'
import WordLink from './WordLink.vue'
import UiCard from './ui/UiCard.vue'; import UiButton from './ui/UiButton.vue'; import UiBadge from './ui/UiBadge.vue'; import UiIcon from './ui/UiIcon.vue'; import CountUp from './ui/CountUp.vue'
import { answers, allowed } from '../lib/words'
import { precomputed } from '../lib/results'
import { filter, digitsToPattern, entropy, feedback, patternDigits, type Suggestion } from '../lib/wordle'
import InfoTip from './InfoTip.vue'
import BitsPanel from './BitsPanel.vue'
import PatternSquares from './PatternSquares.vue'
import { ANSWERS_HELP } from '../lib/labels'

const stratId = ref('freqbal-cand')
const steps = ref<{ w: string; d: number[]; sizeBefore: number; sizeAfter: number; sug: string }[]>([])
const guess = ref(''), digits = ref<number[]>([-1, -1, -1, -1, -1]), err = ref(''), errHint = ref<{ w: string; p: number }[]>([]), demoMsg = ref(''), demoSecret = ref('')
const cands = computed(() => steps.value.reduce((c, s) => filter(c, s.w, digitsToPattern(s.d)), answers.value))
const solved = computed(() => steps.value.length > 0 && steps.value[steps.value.length - 1].d.every(d => d === 2))
const sug = ref<Suggestion | null>(null), busy = ref(false)
const allowedSet = computed(() => new Set(allowed.value))

function compute() {
  if (solved.value || cands.value.length === 0) { sug.value = null; return }
  busy.value = true; sug.value = null
  setTimeout(() => {
    const s = allStrategies.value.find(x => x.id === stratId.value)!
    const pre = precomputed.value.find(r => r.id === s.id)
    if (steps.value.length === 0 && pre && s.id !== 'random') sug.value = { guess: pre.opener, score: 0, why: `Best first word for this strategy (precomputed): "${pre.opener.toUpperCase()}" gives ${entropy(pre.opener, answers.value).toFixed(2)} bits of information on average.` }
    else sug.value = s.pick(cands.value, { answers: answers.value, allowed: allowed.value }, steps.value.length + 1)
    guess.value = sug.value.guess; digits.value = demoSecret.value ? patternDigits(feedback(guess.value, demoSecret.value)) : [-1, -1, -1, -1, -1]; err.value = ''; errHint.value = []; busy.value = false
  }, 10)
}
watch([stratId, () => steps.value.length, precomputed], compute, { immediate: true })
watch(stratId, () => userAction())

let lastApply = 0
const isCandidate = computed(() => cands.value.includes(guess.value.toLowerCase()))
function solvedAllGreen() { userAction(); digits.value = [2, 2, 2, 2, 2]; apply() }
/** Any user interaction ends a running demo (otherwise its timer keeps auto-colouring and auto-applying). */
function userAction() { if (timer !== undefined || demoSecret.value) { stopDemo(); demoSecret.value = ''; demoMsg.value = 'Demo stopped — you are in control now.' } }
function userApply() { userAction(); apply() }
function apply() {
  // guard against double-trigger (Enter on a focused button fires click + keydown)
  if (busy.value || Date.now() - lastApply < 300) return
  err.value = ''; errHint.value = []
  const w = guess.value.toLowerCase()
  if (w.length !== 5) return (err.value = 'Type a 5-letter word first.')
  if (!allowedSet.value.has(w)) return (err.value = `"${w.toUpperCase()}" is not a valid Wordle guess.`)
  if (digits.value.some(d => d < 0)) return (err.value = 'Set the colour of every tile first (click each tile until it matches Wordle).')
  const after = filter(cands.value, w, digitsToPattern(digits.value)).length
  if (after === 0) {
    err.value = 'No possible answer matches these colours — double-check the tiles.'
    errHint.value = cands.value.slice(0, 4).map(a => ({ w: a, p: feedback(w, a) }))
    return
  }
  lastApply = Date.now()
  steps.value.push({ w, d: [...digits.value], sizeBefore: cands.value.length, sizeAfter: after, sug: sug.value?.guess ?? '' })
}
const undo = () => { userAction(); steps.value.pop(); err.value = '' }
const reset = () => { stopDemo(); steps.value = []; err.value = ''; demoSecret.value = ''; demoMsg.value = '' }
const cycle = (i: number) => { userAction(); digits.value[i] = (digits.value[i] + 1) % 3; err.value = ''; errHint.value = [] }

onKeyStroke(e => {
  const tag = (e.target as HTMLElement)?.tagName
  if (['Shift', 'Control', 'Alt', 'Meta', 'Tab'].includes(e.key)) return
  if (tag === 'INPUT' || tag === 'TEXTAREA') { if (e.key === 'Enter') userApply(); else userAction(); return }
  // Enter on a focused tile = apply (not cycle the tile); Enter/Space on other buttons = their native click
  if (tag === 'BUTTON' && e.key === 'Enter' && (e.target as HTMLElement).dataset.tile) { e.preventDefault(); return userApply() }
  if (tag === 'BUTTON' && (e.key === 'Enter' || e.key === ' ')) return
  if (tag === 'DIV' && (e.target as HTMLElement).closest('[role=listbox],[role=combobox]')) return
  userAction()
  if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); return undo() }
  if (e.ctrlKey || e.metaKey || e.altKey) return
  const k = e.key.toLowerCase()
  if (k === 'enter') apply()
  else if (k === 'escape') reset()
  else if (k === 'backspace') guess.value = guess.value.slice(0, -1)
  else if (/^[1-5]$/.test(k)) cycle(+k - 1)
  else if (/^[a-z]$/.test(k)) { guess.value = guess.value.length >= 5 ? k : guess.value + k; digits.value = [-1, -1, -1, -1, -1] }
})

// Demo: walks through a sample game automatically
let timer: number | undefined
function stopDemo() { clearTimeout(timer); timer = undefined }
function demo() {
  reset()
  demoSecret.value = 'knoll'
  demoMsg.value = 'Demo: the secret word is KNOLL (pretend you don\'t know it). Watch: the suggested word is typed, its colours are filled in, then Apply is pressed.'
  const tick = () => {
    if (solved.value) { demoMsg.value = `Demo finished: solved in ${steps.value.length} guesses. Press Reset to start your own game.`; demoSecret.value = ''; timer = undefined; return }
    if (busy.value) { timer = window.setTimeout(tick, 300); return }
    timer = window.setTimeout(() => { apply(); timer = window.setTimeout(tick, 1800) }, 1800)
  }
  timer = window.setTimeout(tick, 800)
}
onUnmounted(stopDemo)
const alts = computed(() => { const c = cands.value; if (c.length > 400 || c.length < 2) return []; return c.map(w => ({ w, h: entropy(w, c) })).sort((a, b) => b.h - a.h).slice(0, 6) })
const howto = ['Type the word you guessed in Wordle — or keep the suggestion and play it there.', 'Click the tiles until they match the colours Wordle showed you: gray → yellow → green.', 'Press Apply. Impossible words are removed and your next guess is suggested.']
const colourNames: Record<number, string> = { [-1]: 'not set', 0: 'gray', 1: 'yellow', 2: 'green' }
</script>
<template>
  <div class="flex flex-col gap-5">
    <UiCard title="How to use the solver while playing real Wordle" :icon="Lightbulb">
      <template #actions>
        <UiButton :icon="Play" label="Show me an example" @click="demo" />
      </template>
      <ol class="grid sm:grid-cols-3 gap-3">
        <li v-for="(h, i) in howto" :key="i" class="flex gap-3 bg-surface-2 rounded-xl p-3">
          <span class="grid place-items-center size-6 shrink-0 rounded-full bg-brand-600 text-white text-caption font-bold">{{ i + 1 }}</span><span>{{ h }}</span>
        </li>
      </ol>
      <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-caption text-muted mt-3">
        <UiIcon :icon="Keyboard" size="xs" />
        <span>letters = edit word</span><span><kbd>1</kbd>–<kbd>5</kbd> cycle tile</span><span><kbd>Enter</kbd> apply</span><span><kbd>Ctrl</kbd>+<kbd>Z</kbd> undo</span><span><kbd>Esc</kbd> reset</span>
      </div>
      <div class="flex flex-wrap gap-2 items-center mt-4 pt-4 border-t border-line">
        <span class="text-body font-medium">Strategy</span>
        <Select v-model="stratId" :options="allStrategies" optionLabel="name" optionValue="id" class="w-full sm:w-80" />
        <InfoTip :text="allStrategies.find(s => s.id === stratId)?.desc ?? ''" />
        <div class="flex-1"></div>
        <UiButton :icon="Undo2" label="Undo" variant="secondary" @click="undo" :disabled="!steps.length" />
        <UiButton :icon="RotateCcw" label="Reset" variant="secondary" @click="reset" />
      </div>
    </UiCard>
    <Transition name="tab"><div v-if="demoMsg" class="flex gap-2 items-start rounded-xl border border-brand-500/30 bg-brand-500/10 p-3 text-body"><UiIcon :icon="Info" class="mt-0.5 text-brand-600" />{{ demoMsg }}</div></Transition>

    <div class="grid lg:grid-cols-5 gap-5">
      <UiCard class="lg:col-span-3">
        <div v-if="steps.length" class="mb-5">
          <div class="flex items-center gap-2 text-caption text-muted mb-2"><UiIcon :icon="History" size="xs" />Your guesses so far</div>
          <TransitionGroup name="list" tag="div" class="flex flex-col gap-2">
            <div v-for="(s, i) in steps" :key="i + s.w" class="flex items-center gap-3 flex-wrap">
              <div class="flex gap-1"><div v-for="j in 5" :key="j" class="tile tile-sm reveal" :style="{ '--i': j - 1 }" :class="'s' + s.d[j - 1]">{{ s.w[j - 1] }}</div></div>
              <div class="flex items-center gap-1.5">{{ s.sizeBefore }}<UiIcon :icon="ArrowRight" size="xs" class="text-muted" /><b>{{ s.sizeAfter }}</b> words</div>
              <UiBadge :tone="s.sizeAfter / s.sizeBefore < 0.1 ? 'correct' : s.sizeAfter / s.sizeBefore < 0.4 ? 'present' : 'neutral'">kept {{ Math.round((100 * s.sizeAfter) / s.sizeBefore) }}%</UiBadge>
            </div>
          </TransitionGroup>
        </div>

        <div v-if="solved" class="text-center py-8">
          <PartyPopper :size="44" class="mx-auto text-brand-500 animate-bounce-win" />
          <div class="text-2xl font-extrabold mt-3">Solved in {{ steps.length }}!</div>
          <UiButton class="mt-4" :icon="RotateCcw" label="New game" @click="reset" />
        </div>
        <template v-else>
          <div class="rounded-2xl bg-surface-2 p-5 text-center">
            <div class="text-caption uppercase tracking-wider text-muted font-semibold">Suggested next guess</div>
            <div v-if="busy" class="text-display font-black my-3 text-muted animate-pulse">· · ·</div>
            <div v-else-if="sug" :key="sug.guess" class="text-display font-black tracking-[0.25em] uppercase text-brand-600 dark:text-brand-400 my-3 animate-fade-up">{{ sug.guess }}</div>
            <p v-if="sug && !busy" class="text-body text-muted max-w-xl mx-auto">{{ sug.why }}</p>
          </div>
          <div class="flex flex-col items-center gap-3 mt-5">
            <label class="text-body font-semibold" for="guess-in"><span class="text-brand-600">1</span> · Word you entered in Wordle</label>
            <InputText id="guess-in" v-model="guess" maxlength="5" class="w-44 !text-center uppercase !tracking-[0.3em] !text-lg !font-bold" @update:modelValue="digits = [-1, -1, -1, -1, -1]; err = ''; errHint = []" />
            <div class="text-body font-semibold mt-1"><span class="text-brand-600">2</span> · Click tiles to match Wordle's colours</div>
            <div class="flex gap-2">
              <button v-for="j in 5" :key="j + guess" data-tile="1" class="tile cursor-pointer transition-transform duration-150 hover:-translate-y-0.5 active:scale-95" :class="digits[j - 1] < 0 ? 'border-dashed !border-line-strong' : 's' + digits[j - 1]" :aria-label="`Tile ${j}: ${colourNames[digits[j - 1]]}`" v-tooltip.bottom="`${colourNames[digits[j - 1]]} · click or press ${j}`" @click="cycle(j - 1)">{{ guess[j - 1] }}</button>
            </div>
            <div class="flex gap-3 text-caption text-muted"><span class="flex items-center gap-1"><i class="size-3 rounded-sm bg-absent"></i>not in word</span><span class="flex items-center gap-1"><i class="size-3 rounded-sm bg-present"></i>wrong spot</span><span class="flex items-center gap-1"><i class="size-3 rounded-sm bg-correct"></i>right spot</span></div>
            <UiButton class="mt-1" size="lg" :icon="Check" label="3 · Apply feedback" @click="userApply" />
            <UiButton v-if="isCandidate" :icon="PartyPopper" label="Solved (all green)" variant="secondary" @click="solvedAllGreen" />
            <Transition name="tab"><div v-if="err" class="flex flex-col items-center gap-1.5 text-body text-red-600 dark:text-red-400" role="alert">
              <div class="flex items-center gap-2"><UiIcon :icon="CircleAlert" />{{ err }}</div>
              <div v-if="errHint.length" class="text-caption text-muted text-center">Hint: for the words still possible, Wordle would show
                <span v-for="h in errHint" :key="h.w" class="inline-flex items-center gap-1 mx-1"><b class="font-mono uppercase">{{ h.w }}</b><PatternSquares :p="h.p" :size="10" /></span>
                — one of these should match your screen. A common slip: a yellow letter marked gray, or a letter that appears twice.</div>
            </div></Transition>
          </div>
        </template>
      </UiCard>

      <UiCard class="lg:col-span-2" title="Possible answers left" :icon="ListFilter" :subtitle="`${Math.log2(Math.max(1, cands.length)).toFixed(2)} bits of uncertainty`">
        <template #actions><UiBadge tone="brand"><CountUp :value="cands.length" /></UiBadge><InfoTip :text="ANSWERS_HELP" /></template>
        <div v-if="alts.length" class="mb-4"><div class="text-caption text-muted mb-2">Most informative of these (entropy)</div>
          <TransitionGroup name="list" tag="div" class="flex flex-col gap-1">
            <div v-for="a in alts" :key="a.w" class="flex gap-2 items-center font-mono text-caption"><span class="w-14 uppercase font-semibold">{{ a.w }}</span><div class="h-2.5 rounded-full bg-brand-500 transition-all duration-500" :style="{ width: a.h * 28 + 'px' }"></div><span class="text-muted">{{ a.h.toFixed(2) }} bits</span></div>
          </TransitionGroup></div>
        <div v-if="cands.length <= 150" class="font-mono text-muted break-words uppercase text-caption leading-6"><template v-for="w in cands" :key="w"><WordLink :word="w" /> </template></div>
        <p v-else class="text-muted">Too many to list — apply a guess first.</p>
      </UiCard>
    </div>
    <BitsPanel :rows="steps" />
  </div>
</template>
