<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import Select from 'primevue/select'; import Button from 'primevue/button'; import InputText from 'primevue/inputtext'
import { answers, allowed } from '../lib/words'
import { precomputed } from '../lib/results'
import { STRATEGIES, filter, digitsToPattern, entropy, feedback, patternDigits, type Suggestion } from '../lib/wordle'
const stratId = ref('freq-cand')
const steps = ref<{ w: string; d: number[]; sizeBefore: number; sug: Suggestion }[]>([])
const guess = ref(''), digits = ref([0, 0, 0, 0, 0]), secret = ref('')
const cands = computed(() => steps.value.reduce((c, s) => filter(c, s.w, digitsToPattern(s.d)), answers.value))
const sug = ref<Suggestion | null>(null), busy = ref(false)
function compute() {
  busy.value = true; sug.value = null
  setTimeout(() => {
    const s = STRATEGIES.find(x => x.id === stratId.value)!
    const pre = precomputed.value.find(r => r.id === s.id)
    if (steps.value.length === 0 && pre && s.id !== 'random') sug.value = { guess: pre.opener, score: entropy(pre.opener, answers.value), why: `Precomputed opener for this strategy ("${pre.opener.toUpperCase()}" = ${entropy(pre.opener, answers.value).toFixed(2)} bits over all 2,315 answers).` }
    else sug.value = s.pick(cands.value, { answers: answers.value, allowed: allowed.value }, steps.value.length + 1)
    guess.value = sug.value.guess; busy.value = false; autoColor()
  }, 10)
}
watch([stratId, () => steps.value.length], compute, { immediate: true })
function autoColor() { if (secret.value.length === 5 && guess.value.length === 5) digits.value = patternDigits(feedback(guess.value, secret.value)) }
watch([secret, guess], autoColor)
function commit() { if (guess.value.length !== 5) return; steps.value.push({ w: guess.value.toLowerCase(), d: [...digits.value], sizeBefore: cands.value.length, sug: sug.value! }); digits.value = [0, 0, 0, 0, 0] }
const alts = computed(() => { const c = cands.value; if (c.length > 400) return []; return c.map(w => ({ w, h: entropy(w, c) })).sort((a, b) => b.h - a.h).slice(0, 8) })
</script>
<template>
  <div class="grid md:grid-cols-2 gap-4">
    <div class="card flex flex-col gap-3">
      <div class="flex gap-2 items-center flex-wrap"><span class="text-sm">Strategy</span><Select v-model="stratId" :options="STRATEGIES" optionLabel="name" optionValue="id" class="w-64" /><Button label="Reset" size="small" severity="secondary" @click="steps = []" /></div>
      <div class="text-xs text-zinc-400">{{ STRATEGIES.find(s => s.id === stratId)?.desc }}</div>
      <div class="flex gap-2 items-center"><span class="text-sm">Secret (optional, auto-colours):</span><InputText v-model="secret" maxlength="5" class="w-28" size="small" /></div>
      <div v-for="(s, i) in steps" :key="i" class="flex items-center gap-3">
        <div class="flex gap-1"><div v-for="j in 5" :key="j" class="tile !w-10 !h-10 !text-lg" :class="'t' + s.d[j - 1]">{{ s.w[j - 1] }}</div></div>
        <div class="text-xs text-zinc-400">{{ s.sizeBefore }} → {{ steps[i + 1]?.sizeBefore ?? cands.length }} candidates</div>
      </div>
      <div class="p-3 rounded bg-zinc-800">
        <div v-if="busy">Thinking…</div>
        <template v-else-if="sug">
          <div class="mb-2">Suggestion: <b class="text-green-400 text-lg uppercase">{{ sug.guess }}</b></div>
          <div class="text-sm text-zinc-300 mb-3">{{ sug.why }}</div>
          <div class="flex items-center gap-2">
            <InputText v-model="guess" maxlength="5" class="w-24 uppercase" size="small" />
            <div class="flex gap-1"><div v-for="j in 5" :key="j" class="tile !w-10 !h-10 !text-lg cursor-pointer" :class="'t' + digits[j - 1]" @click="digits[j - 1] = (digits[j - 1] + 1) % 3">{{ guess[j - 1] }}</div></div>
            <Button label="Apply feedback" size="small" @click="commit" :disabled="cands.length <= 1 && steps.length > 0 && digits.every(d => d === 2)" />
          </div>
          <div class="text-xs text-zinc-500 mt-1">Click tiles to cycle gray → yellow → green.</div>
        </template>
      </div>
    </div>
    <div class="card text-sm">
      <div class="font-semibold">Candidates: {{ cands.length }} ({{ Math.log2(Math.max(1, cands.length)).toFixed(2) }} bits)</div>
      <div v-if="alts.length" class="mt-2"><div class="text-zinc-400 mb-1">Best candidate words by entropy:</div>
        <div v-for="a in alts" :key="a.w" class="flex gap-2 font-mono"><span class="w-16 uppercase">{{ a.w }}</span><div class="bg-sky-600 h-4" :style="{ width: a.h * 40 + 'px' }"></div><span>{{ a.h.toFixed(2) }} bits</span></div></div>
      <div v-if="cands.length <= 80" class="font-mono text-zinc-400 mt-3 break-words">{{ cands.join(' ') }}</div>
    </div>
  </div>
</template>
