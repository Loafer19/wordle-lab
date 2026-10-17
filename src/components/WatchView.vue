<script setup lang="ts">
// Assistant › Watch a strategy: pick a secret word and a strategy, watch it play, with the same per-guess review as your own games.
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import AutoComplete from 'primevue/autocomplete'; import Select from 'primevue/select'
import { Eye, Shuffle, ListOrdered, Columns2, X } from 'lucide-vue-next'
import { DEMO_WORD, BEST_ID, lang } from '../lib/lang'
import { allStrategies } from '../lib/allStrategies'
import { answers, allowed } from '../lib/words'
import { precomputed } from '../lib/results'
import { simIndex, simReady, loadFull } from '../lib/simdata'
import { planAll, fromSim, type Job, type Source } from '../lib/watchAll'
import ProgressBar from 'primevue/progressbar'
import { playOne } from '../lib/wordle'
import { useCoach } from '../lib/useCoach'
import { shortName } from '../lib/names'
import type { CoachStep } from '../lib/coach'
import UiCard from './ui/UiCard.vue'; import UiButton from './ui/UiButton.vue'; import UiBadge from './ui/UiBadge.vue'
import InfoTip from './InfoTip.vue'
import StrategyReplay from './StrategyReplay.vue'
import CoachReport from './CoachReport.vue'
const word = useLocalStorage('wl-watch-word-' + lang, DEMO_WORD), stratId = useLocalStorage('wl-watch-strat-' + lang, BEST_ID), sugg = ref<string[]>([])
const valid = computed(() => answers.value.includes(word.value.toLowerCase()))
const searched = ref(false)
const search = (e: { query: string }) => (searched.value = true, sugg.value = answers.value.filter(w => w.startsWith(e.query.toLowerCase())).slice(0, 20))
const rand = () => (word.value = answers.value[Math.floor(Math.random() * answers.value.length)])
const strats = computed(() => allStrategies.value.filter(s => s.id !== 'random').map(s => ({ id: s.id, name: s.id.startsWith('custom:') ? s.name : shortName(s.id, s.name), desc: s.name + ' — ' + s.desc })))
const game = ref<CoachStep[] | null>(null), notes = ref<string[]>([])
const onSteps = (s: { w: string; d: number[]; why: string }[]) => { game.value = s.map(x => ({ w: x.w, d: x.d })); notes.value = s.map(x => x.why) }
watch([word, stratId], () => (game.value = null))
const { result, busy, progress } = useCoach(game, computed(() => stratId.value.endsWith('hard')))
// everyone on this word: precomputed sim lookups first, the rest (incl. two-step entropy) in a Web Worker with progress + cancel
type Row = { id: string; name: string; n: number; src: Source }
const all = ref<Row[] | null>(null), allBusy = ref(false), allDone = ref(0), allTotal = ref(0)
let worker: Worker | null = null, runSeq = 0
function stopAll() { worker?.terminate(); worker = null; runSeq++; allBusy.value = false }
async function runAll() {
  stopAll(); const my = runSeq, w = word.value.toLowerCase(), list = allStrategies.value.filter(s => !s.id.startsWith('custom:'))
  allBusy.value = true; all.value = []; allDone.value = 0; allTotal.value = list.length
  const name = (id: string) => { const s = list.find(x => x.id === id)!; return shortName(s.id, s.name) }
  const add = (r: Row) => { if (my !== runSeq) return; all.value = [...all.value!, r].sort((a, b) => a.n - b.n); allDone.value++ }
  await simReady
  const plan = planAll(list.map(s => s.id), new Set(simIndex.value.filter(s => s.mode === 'normal').map(s => s.id)))
  const jobs: Job[] = plan.worker.map(id => ({ id, opener: id === 'random' ? undefined : precomputed.value.find(r => r.id === id)?.opener }))
  if (jobs.length) {
    worker = new Worker(new URL('../lib/watch.worker.ts', import.meta.url), { type: 'module' })
    worker.onmessage = e => { if (e.data.type === 'one') add({ id: e.data.id, name: name(e.data.id), n: e.data.n, src: 'worker' }); else if (e.data.type === 'done') { worker?.terminate(); worker = null; if (allDone.value >= allTotal.value) allBusy.value = false } }
    worker.postMessage({ jobs, answers: [...answers.value], allowed: [...allowed.value], word: w })
  }
  for (const id of plan.tree) { const s = list.find(x => x.id === id)!; add({ id, name: name(id), n: playOne(s, { answers: answers.value, allowed: allowed.value }, w).length, src: 'tree' }) }
  await Promise.all(plan.sim.map(id => loadFull(id).then(f => { const n = fromSim(f.guesses, answers.value, w); if (n !== undefined) add({ id, name: name(id), n, src: 'sim' }); else allTotal.value-- }).catch(() => { if (my === runSeq) allTotal.value-- })))
  if (my === runSeq && allDone.value >= allTotal.value) allBusy.value = false
}
onBeforeUnmount(stopAll)
watch(word, () => { stopAll(); all.value = null })
// optional side-by-side replay of a second strategy
const stratB = useLocalStorage('wl-watch-strat-b-' + lang, '')

</script>
<template>
  <div class="flex flex-col gap-5">
    <UiCard :title="$t('Watch a strategy solve a word')" :icon="Eye" :subtitle="$t('Pick any possible answer and a strategy: see every guess it makes, why, and how good each guess was.')">
      <div class="flex flex-wrap gap-2 items-center">
        <AutoComplete v-model="word" :suggestions="sugg" @complete="search" inputClass="w-32 uppercase font-mono" :placeholder="$t('secret word')" :showEmptyMessage="false" :emptySearchMessage="searched ? undefined : ' '" :invalid="!valid" data-watch-word />
        <UiButton :icon="Shuffle" :label="$t('Random')" variant="secondary" @click="rand" />
        <Select v-model="stratId" :options="strats" optionLabel="name" optionValue="id" class="w-full sm:w-72" data-watch-strategy />
        <InfoTip :text="strats.find(s => s.id === stratId)?.desc ?? ''" />
        <Select v-model="stratB" :options="strats.filter(s => s.id !== stratId)" optionLabel="name" optionValue="id" :placeholder="$t('Compare with…')" showClear class="w-full sm:w-60" data-watch-strategy-b>
          <template #dropdownicon><Columns2 :size="16" /></template>
        </Select>
      </div>
      <p v-if="!valid" class="text-caption text-muted mt-2">{{ $t('Type a word from the possible answers list.') }}</p>
    </UiCard>
    <template v-if="valid">
      <div :class="stratB ? 'grid md:grid-cols-2 gap-5 items-start' : ''" data-watch-replays>
        <StrategyReplay :word="word" :stratId="stratId" @steps="onSteps" />
        <StrategyReplay v-if="stratB" :word="word" :stratId="stratB" :showWhy="false" data-watch-replay-b />
      </div>
      <UiCard :title="$t('Every strategy on this word')" :icon="ListOrdered" :subtitle="$t('Number of guesses each built-in strategy needs for {w}', { w: word.toUpperCase() })">
        <template #actions>
          <UiButton v-if="allBusy" :icon="X" :label="$t('Cancel')" variant="ghost" @click="stopAll" data-watch-cancel />
          <UiButton v-else :label="all ? $t('Recompute') : $t('Compute')" variant="secondary" @click="runAll" data-watch-all />
        </template>
        <div v-if="allBusy" class="flex items-center gap-3 mb-3" data-watch-progress><ProgressBar :value="Math.round((100 * allDone) / Math.max(1, allTotal))" :showValue="false" class="flex-1 h-2" /><span class="text-caption text-muted tabular-nums">{{ allDone }}/{{ allTotal }}</span></div>
        <TransitionGroup v-if="all && all.length" tag="ul" name="list" class="grid sm:grid-cols-2 gap-x-6 gap-y-1 text-body" data-watch-all-list>
          <li v-for="r in all" :key="r.id" class="flex items-center gap-2 border-b border-line py-1" :data-src="r.src" :data-id="r.id"><span class="flex-1 truncate">{{ r.name }}</span><span v-if="r.src === 'worker'" class="text-caption text-muted" v-tooltip.top="$t('Computed live in your browser (no precomputed simulation for this strategy)')">{{ $t('live') }}</span><UiBadge :tone="r.n > 6 ? 'danger' : r.n <= 3 ? 'correct' : 'present'">{{ r.n }}</UiBadge></li>
        </TransitionGroup>
        <p v-if="!all" class="text-caption text-muted">{{ $t('Press Compute to play {w} with every strategy: precomputed results are looked up instantly, the rest (including two-step entropy) run in the background.', { w: word.toUpperCase() }) }}</p>
        <p v-else-if="!allBusy && allDone < allTotal" class="text-caption text-muted mt-2" data-watch-cancelled>{{ $t('Cancelled — {d} of {n} strategies computed.', { d: allDone, n: allTotal }) }}</p>
      </UiCard>
      <CoachReport v-if="game" data-watch-review :result="result" :busy="busy" :progress="progress" :title="$t('Guess-by-guess review')" :notes="notes" />
    </template>
  </div>
</template>
