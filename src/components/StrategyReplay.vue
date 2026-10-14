<script setup lang="ts">
// "How would strategy X solve WORD": the strategy's guesses (tiles, candidates left, its reasoning).
// Used after every Play game (optimal strategy) and in Assistant › Watch a strategy.
import { ref, computed, watch } from 'vue'
import { Route, ArrowRight } from 'lucide-vue-next'
import Skeleton from 'primevue/skeleton'
import { allStrategies } from '../lib/allStrategies'
import { answers, allowed } from '../lib/words'
import { precomputed } from '../lib/results'
import { playOne, patternDigits } from '../lib/wordle'
import { t } from '../lib/i18n'
import UiCard from './ui/UiCard.vue'; import UiBadge from './ui/UiBadge.vue'
import WordLink from './WordLink.vue'
const p = withDefaults(defineProps<{ word: string; stratId: string; title?: string; subtitle?: string; yours?: number; showWhy?: boolean }>(), { showWhy: true })
const emit = defineEmits<{ steps: [{ w: string; d: number[]; why: string }[]] }>()
type Steps = ReturnType<typeof playOne>
const steps = ref<Steps | null>(null)
const strat = computed(() => allStrategies.value.find(s => s.id === p.stratId))
let seq = 0
function run() {
  const s = strat.value, w = p.word.toLowerCase()
  if (!s || !answers.value.includes(w)) { steps.value = null; return }
  const my = ++seq; steps.value = null
  setTimeout(() => {
    if (my !== seq) return
    const opener = s.id.startsWith('optimal') || s.id === 'random' ? undefined : precomputed.value.find(r => r.id === s.id)?.opener
    const r = playOne(s, { answers: answers.value, allowed: allowed.value }, w, opener)
    if (my !== seq) return
    steps.value = r
    emit('steps', r.map(x => ({ w: x.guess, d: patternDigits(x.pattern), why: x.why })))
  }, 20)
}
watch([() => p.word, () => p.stratId, strat, precomputed], run, { immediate: true })
const n = computed(() => steps.value?.length ?? 0)
</script>
<template>
  <UiCard :title="title ?? t('How {s} solves {w}', { s: strat?.name ?? '…', w: word.toUpperCase() })" :icon="Route" :subtitle="subtitle" data-replay>
    <template #actions>
      <UiBadge v-if="steps" :tone="n > 6 ? 'danger' : n <= 3 ? 'correct' : 'present'" data-replay-count>{{ $t('{n} guesses', { n }) }}</UiBadge>
      <UiBadge v-if="steps && yours !== undefined" :tone="yours <= n ? 'correct' : 'neutral'">{{ yours < n ? $t('you beat it') : yours === n ? $t('you tied') : $t('{d} fewer than you', { d: yours - n }) }}</UiBadge>
    </template>
    <div v-if="!steps" class="flex flex-col gap-2" data-skeleton><Skeleton v-for="i in 3" :key="i" height="2rem" /></div>
    <ol v-else class="flex flex-col gap-2.5">
      <li v-for="(s, i) in steps" :key="i" class="flex gap-3 items-start" data-replay-step>
        <div class="flex gap-0.5 shrink-0"><div v-for="(d, j) in patternDigits(s.pattern)" :key="j" class="tile tile-xs" :class="'s' + d">{{ s.guess[j] }}</div></div>
        <div class="text-caption min-w-0"><WordLink :word="s.guess" class="font-mono font-bold mr-1.5" /><b class="inline-flex items-center gap-1 tabular-nums">{{ s.before }}<ArrowRight :size="12" />{{ s.after }}</b> <span v-if="showWhy" class="text-muted">{{ s.why }}</span></div>
      </li>
    </ol>
  </UiCard>
</template>
