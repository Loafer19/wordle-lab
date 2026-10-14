<script setup lang="ts">
// Assistant › Watch a strategy: pick a secret word and a strategy, watch it play, with the same per-guess review as your own games.
import { ref, computed, watch } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import AutoComplete from 'primevue/autocomplete'; import Select from 'primevue/select'
import { Eye, Shuffle, ListOrdered } from 'lucide-vue-next'
import { DEMO_WORD, BEST_ID, lang } from '../lib/lang'
import { allStrategies } from '../lib/allStrategies'
import { answers, allowed } from '../lib/words'
import { precomputed } from '../lib/results'
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
// everyone on this word (computed on demand: some strategies scan all valid guesses each turn)
const all = ref<{ id: string; name: string; n: number }[] | null>(null), allBusy = ref(false)
function runAll() {
  allBusy.value = true; all.value = null
  setTimeout(() => {
    const w = word.value.toLowerCase(), ctx = { answers: answers.value, allowed: allowed.value }
    all.value = allStrategies.value.filter(s => !s.id.startsWith('custom:') && s.id !== 'entropy2-all').map(s => ({ id: s.id, name: shortName(s.id, s.name), n: playOne(s, ctx, w, s.id.startsWith('optimal') || s.id === 'random' ? undefined : precomputed.value.find(r => r.id === s.id)?.opener).length })).sort((a, b) => a.n - b.n)
    allBusy.value = false
  }, 30)
}
watch(word, () => (all.value = null))
</script>
<template>
  <div class="flex flex-col gap-5">
    <UiCard :title="$t('Watch a strategy solve a word')" :icon="Eye" :subtitle="$t('Pick any possible answer and a strategy: see every guess it makes, why, and how good each guess was.')">
      <div class="flex flex-wrap gap-2 items-center">
        <AutoComplete v-model="word" :suggestions="sugg" @complete="search" inputClass="w-32 uppercase font-mono" :placeholder="$t('secret word')" :showEmptyMessage="false" :emptySearchMessage="searched ? undefined : ' '" :invalid="!valid" data-watch-word />
        <UiButton :icon="Shuffle" :label="$t('Random')" variant="secondary" @click="rand" />
        <Select v-model="stratId" :options="strats" optionLabel="name" optionValue="id" class="w-full sm:w-72" data-watch-strategy />
        <InfoTip :text="strats.find(s => s.id === stratId)?.desc ?? ''" />
      </div>
      <p v-if="!valid" class="text-caption text-muted mt-2">{{ $t('Type a word from the possible answers list.') }}</p>
    </UiCard>
    <template v-if="valid">
      <StrategyReplay :word="word" :stratId="stratId" @steps="onSteps" />
      <CoachReport v-if="game" :result="result" :busy="busy" :progress="progress" :title="$t('Guess-by-guess review')" :notes="notes" />
      <UiCard :title="$t('Every strategy on this word')" :icon="ListOrdered" :subtitle="$t('Number of guesses each built-in strategy needs for {w}', { w: word.toUpperCase() })">
        <template #actions><UiButton v-if="!all" :label="$t('Compute')" :loading="allBusy" variant="secondary" @click="runAll" data-watch-all /></template>
        <ul v-if="all" class="grid sm:grid-cols-2 gap-x-6 gap-y-1 text-body">
          <li v-for="r in all" :key="r.id" class="flex items-center gap-2 border-b border-line py-1"><span class="flex-1 truncate">{{ r.name }}</span><UiBadge :tone="r.n > 6 ? 'danger' : r.n <= 3 ? 'correct' : 'present'">{{ r.n }}</UiBadge></li>
        </ul>
        <p v-else class="text-caption text-muted">{{ $t('Press Compute to play {w} with every strategy (takes a few seconds).', { w: word.toUpperCase() }) }}</p>
      </UiCard>
    </template>
  </div>
</template>
