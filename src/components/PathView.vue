<script setup lang="ts">
import { t } from '../lib/i18n'
import { DEMO_WORD } from '../lib/lang'
import { ref, computed, watch } from 'vue'
import AutoComplete from 'primevue/autocomplete'; import MultiSelect from 'primevue/multiselect'
import VChart from 'vue-echarts'
import { baseC } from '../lib/charts'
import { allStrategies } from '../lib/allStrategies'
import WordLink from './WordLink.vue'
import UiCard from './ui/UiCard.vue'; import UiButton from './ui/UiButton.vue'; import UiBadge from './ui/UiBadge.vue'
import { GitBranch, Shuffle, Route, TrendingDown, ArrowRight } from 'lucide-vue-next'
import { answers, allowed } from '../lib/words'
import { precomputed } from '../lib/results'
import { playOne, patternDigits } from '../lib/wordle'
const answer = ref(DEMO_WORD), sugg = ref<string[]>([])
const sel = ref(['freq-cand', 'freqbal-cand', 'entropy-all', 'minimax-all'])
const paths = ref<{ id: string; name: string; steps: ReturnType<typeof playOne> }[]>([]), busy = ref(false)
function search(e: { query: string }) { sugg.value = answers.value.filter(w => w.startsWith(e.query.toLowerCase())).slice(0, 20) }
function run() {
  if (!answers.value.includes(answer.value)) return
  busy.value = true
  setTimeout(() => {
    paths.value = sel.value.map(id => { const s = allStrategies.value.find(x => x.id === id)!; return { id, name: s.name, steps: playOne(s, { answers: answers.value, allowed: allowed.value }, answer.value, precomputed.value.find(r => r.id === id)?.opener) } })
    busy.value = false
  }, 10)
}
watch(precomputed, run, { immediate: true })
const rand = () => { answer.value = answers.value[Math.floor(Math.random() * answers.value.length)]; run() }
const opt = computed(() => ({ ...baseC.value, title: { show: false }, legend: { ...baseC.value.legend, top: 0 }, grid: { top: 50, left: 50, right: 20 },
  xAxis: { type: 'category', data: [t('start'), ...[1, 2, 3, 4, 5, 6, 7, 8].map(i => t('G') + i)] }, yAxis: { type: 'log', min: 1 },
  series: paths.value.map(p => ({ type: 'line', name: p.name, data: [answers.value.length, ...p.steps.map(s => Math.max(1, s.after))] })) }))
</script>
<template>
  <div class="flex flex-col gap-5">
    <UiCard :title="$t('Decision paths')" :icon="GitBranch" :subtitle="$t('How each strategy plays against one secret word: guesses, colours, and possible answers left')">
      <div class="flex flex-wrap gap-2 items-center">
        <AutoComplete v-model="answer" :suggestions="sugg" @complete="search" @item-select="run" inputClass="w-32 uppercase" :placeholder="$t('secret')" />
        <UiButton :icon="Shuffle" :label="$t('Random')" variant="secondary" @click="rand" />
        <MultiSelect v-model="sel" :options="allStrategies" optionLabel="name" optionValue="id" class="w-full sm:w-80" :maxSelectedLabels="2" />
        <UiButton :icon="Route" :label="$t('Show paths')" @click="run" :loading="busy" />
      </div>
    </UiCard>
    <UiCard :title="t('Possible answers left after each guess') + ' · ' + answer.toUpperCase()" :icon="TrendingDown"><VChart :option="opt" style="height: 320px" autoresize /></UiCard>
    <TransitionGroup name="list" tag="div" class="grid md:grid-cols-2 gap-5">
      <UiCard v-for="p in paths" :key="p.id + answer" interactive :title="p.name">
        <template #actions><UiBadge :tone="p.steps.length > 6 ? 'danger' : p.steps.length <= 3 ? 'correct' : 'present'">{{ p.steps.length }} {{ $t('guesses') }}</UiBadge></template>
        <div v-for="(s, i) in p.steps" :key="i" class="flex gap-3 items-start mb-2.5">
          <div class="flex gap-0.5 shrink-0"><div v-for="(d, j) in patternDigits(s.pattern)" :key="j" class="tile tile-xs reveal" :style="{ '--i': j }" :class="'s' + d">{{ s.guess[j] }}</div></div>
          <div class="text-caption"><WordLink :word="s.guess" class="font-mono font-bold mr-1.5" /><b class="inline-flex items-center gap-1">{{ s.before }}<ArrowRight :size="12" />{{ s.after }}</b> <span class="text-muted">{{ s.why }}</span></div>
        </div>
      </UiCard>
    </TransitionGroup>
  </div>
</template>
