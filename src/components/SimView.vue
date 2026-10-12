<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import VChart from 'vue-echarts'
import Button from 'primevue/button'; import DataTable from 'primevue/datatable'; import Column from 'primevue/column'; import ProgressBar from 'primevue/progressbar'; import MultiSelect from 'primevue/multiselect'
import { base } from '../lib/charts'
import { answers, allowed } from '../lib/words'
import { precomputed } from '../lib/results'
import { STRATEGIES, type SimResult } from '../lib/wordle'
const results = ref<Record<string, SimResult>>({}), progress = ref<Record<string, number>>({})
watch(precomputed, p => { for (const r of p) results.value[r.id] = r }, { immediate: true })
const selected = ref(STRATEGIES.map(s => s.id))
function run() {
  for (const id of selected.value) {
    const w = new Worker(new URL('../lib/sim.worker.ts', import.meta.url), { type: 'module' })
    progress.value[id] = 0
    w.onmessage = e => { if (e.data.type === 'progress') progress.value[id] = e.data.p; else { results.value[id] = e.data.result; delete progress.value[id]; w.terminate() } }
    w.postMessage({ id, answers: answers.value.slice(), allowed: allowed.value.slice() })
  }
}
const list = computed(() => Object.values(results.value).filter(r => selected.value.includes(r.id)).sort((a, b) => a.avg - b.avg))
const rows = computed(() => list.value.map(r => ({ ...r, fail: (r.failRate * 100).toFixed(2) + '%', avgS: r.avg.toFixed(3) })))
const labels = ['1', '2', '3', '4', '5', '6', '7+']
const d7 = (r: SimResult) => [1, 2, 3, 4, 5, 6].map(i => r.dist[i] ?? 0).concat(r.dist.slice(7).reduce((a, b) => a + b, 0))
const distOpt = computed(() => ({ ...base, title: { text: 'Guess-count distribution', textStyle: { color: '#ddd', fontSize: 14 } }, legend: { ...base.legend, top: 25 }, grid: { top: 80 }, xAxis: { type: 'category', data: labels, name: 'guesses' }, yAxis: { type: 'value', name: 'games' }, series: list.value.map(r => ({ type: 'bar', name: r.name, data: d7(r) })) }))
const avgOpt = computed(() => ({ ...base, title: { text: 'Average guesses (lower is better). Dashed = proven optimum 3.4212', textStyle: { color: '#ddd', fontSize: 14 } }, grid: { left: 200 }, xAxis: { type: 'value', min: 3, max: Math.max(4.4, ...list.value.map(r => r.avg)) }, yAxis: { type: 'category', data: list.value.map(r => r.name).reverse() },
  series: [{ type: 'bar', data: list.value.map(r => +r.avg.toFixed(3)).reverse(), label: { show: true, position: 'right', color: '#ddd' }, itemStyle: { color: (p: any) => (p.name.startsWith('Ruslan') ? '#f59e0b' : '#38bdf8') }, markLine: { symbol: 'none', lineStyle: { type: 'dashed', color: '#22c55e' }, data: [{ xAxis: 3.4212 }] } }] }))
const shrinkOpt = computed(() => ({ ...base, title: { text: 'Avg candidates remaining before each guess (solved games count as 0)', textStyle: { color: '#ddd', fontSize: 14 } }, legend: { ...base.legend, top: 25 }, grid: { top: 80 }, xAxis: { type: 'category', data: [1, 2, 3, 4, 5, 6].map(i => 'turn ' + i) }, yAxis: { type: 'log', name: 'candidates', min: 0.01 },
  series: list.value.map(r => ({ type: 'line', name: r.name, data: r.avgSizes.slice(0, 6).map(v => +Math.max(v, 0.01).toFixed(2)) })) }))
</script>
<template>
  <div class="flex flex-col gap-4">
    <div class="card flex flex-wrap items-center gap-3">
      <MultiSelect v-model="selected" :options="STRATEGIES" optionLabel="name" optionValue="id" class="w-96" :maxSelectedLabels="3" />
      <Button label="Re-run in Web Workers" @click="run" />
      <span class="text-xs text-zinc-400">Loaded from <code>public/results.json</code> (made by <code>bun run simulate</code>). Entropy/minimax over all 12,972 words take ~10–30 s.</span>
      <div v-for="(p, id) in progress" :key="id" class="w-full flex items-center gap-2 text-xs"><span class="w-40">{{ id }}</span><ProgressBar :value="Math.round(p * 100)" class="flex-1 !h-3" /></div>
    </div>
    <div class="card"><DataTable :value="rows" size="small" stripedRows>
      <Column field="name" header="Strategy" /><Column field="opener" header="Opener" /><Column field="avgS" header="Avg" /><Column field="fail" header="Fail >6" /><Column field="worst" header="Worst" />
      <Column header="Hardest words"><template #body="{ data }"><span class="font-mono text-xs">{{ data.worstWords.slice(0, 5).join(' ') }}</span></template></Column>
    </DataTable></div>
    <div class="card"><VChart :option="avgOpt" style="height: 360px" autoresize /></div>
    <div class="card"><VChart :option="distOpt" style="height: 400px" autoresize /></div>
    <div class="card"><VChart :option="shrinkOpt" style="height: 380px" autoresize /></div>
  </div>
</template>
