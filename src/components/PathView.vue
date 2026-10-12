<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import AutoComplete from 'primevue/autocomplete'; import Button from 'primevue/button'; import MultiSelect from 'primevue/multiselect'
import VChart from 'vue-echarts'
import { baseC, title } from '../lib/charts'
import { answers, allowed } from '../lib/words'
import { precomputed } from '../lib/results'
import { STRATEGIES, playOne, patternDigits } from '../lib/wordle'
const answer = ref('knoll'), sugg = ref<string[]>([])
const sel = ref(['freq-cand', 'freqbal-cand', 'entropy-all', 'minimax-all'])
const paths = ref<{ id: string; name: string; steps: ReturnType<typeof playOne> }[]>([]), busy = ref(false)
function search(e: { query: string }) { sugg.value = answers.value.filter(w => w.startsWith(e.query.toLowerCase())).slice(0, 20) }
function run() {
  if (!answers.value.includes(answer.value)) return
  busy.value = true
  setTimeout(() => {
    paths.value = sel.value.map(id => { const s = STRATEGIES.find(x => x.id === id)!; return { id, name: s.name, steps: playOne(s, { answers: answers.value, allowed: allowed.value }, answer.value, precomputed.value.find(r => r.id === id)?.opener) } })
    busy.value = false
  }, 10)
}
watch(precomputed, run, { immediate: true })
const rand = () => { answer.value = answers.value[Math.floor(Math.random() * answers.value.length)]; run() }
const opt = computed(() => ({ ...baseC.value, title: title(`Possible answers left after each guess (answer: ${answer.value.toUpperCase()})`), legend: { ...baseC.value.legend, top: 25 }, grid: { top: 70 },
  xAxis: { type: 'category', data: ['start', 'g1', 'g2', 'g3', 'g4', 'g5', 'g6', 'g7', 'g8'] }, yAxis: { type: 'log', min: 1 },
  series: paths.value.map(p => ({ type: 'line', name: p.name, data: [2315, ...p.steps.map(s => Math.max(1, s.after))] })) }))
</script>
<template>
  <div class="flex flex-col gap-4">
    <div class="card flex flex-wrap gap-2 items-center">
      <span class="text-sm">Secret word:</span>
      <AutoComplete v-model="answer" :suggestions="sugg" @complete="search" @item-select="run" class="w-36" />
      <Button label="Random" size="small" severity="secondary" @click="rand" />
      <MultiSelect v-model="sel" :options="STRATEGIES" optionLabel="name" optionValue="id" class="w-80" :maxSelectedLabels="2" />
      <Button label="Show paths" size="small" @click="run" :loading="busy" />
      <span class="text-xs muted w-full">See exactly how each strategy would play against one secret word: its guesses, the colours it gets, and how many possible answers remain.</span>
    </div>
    <div class="card"><VChart :option="opt" style="height: 320px" autoresize /></div>
    <div class="grid md:grid-cols-2 gap-4">
      <div v-for="p in paths" :key="p.id" class="card">
        <div class="font-semibold mb-2">{{ p.name }} — <span :class="p.steps.length > 6 ? 'text-red-500' : 'text-green-500'">{{ p.steps.length }} guesses</span></div>
        <div v-for="(s, i) in p.steps" :key="i" class="flex gap-3 items-start mb-2">
          <div class="flex gap-0.5 shrink-0"><div v-for="(d, j) in patternDigits(s.pattern)" :key="j" class="tile !w-8 !h-8 !text-sm" :class="'t' + d">{{ s.guess[j] }}</div></div>
          <div class="text-xs"><b>{{ s.before }} → {{ s.after }}</b> <span class="muted">{{ s.why }}</span></div>
        </div>
      </div>
    </div>
  </div>
</template>
