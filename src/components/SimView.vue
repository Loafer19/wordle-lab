<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import VChart from 'vue-echarts'
import DataTable from 'primevue/datatable'; import Column from 'primevue/column'; import ProgressBar from 'primevue/progressbar'; import MultiSelect from 'primevue/multiselect'
import { baseC } from '../lib/charts'
import UiCard from './ui/UiCard.vue'; import UiButton from './ui/UiButton.vue'; import UiBadge from './ui/UiBadge.vue'
import { FlaskConical, Cpu, Table2, BarChart3, ChartColumn, TrendingDown } from 'lucide-vue-next'
import { ruslanColor, ruslanBestColor, otherColor, tile } from '../lib/tokens'
const colorFor = (n: string) => (n.includes('balanced') ? ruslanBestColor : n.startsWith('Ruslan') ? ruslanColor : n.startsWith('Random') ? tile.absent : otherColor)
import { fg } from '../lib/theme'
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
    w.postMessage({ id, answers: [...answers.value], allowed: [...allowed.value] })
  }
}
const list = computed(() => Object.values(results.value).filter(r => selected.value.includes(r.id)).sort((a, b) => a.avg - b.avg))
const rows = computed(() => list.value.map(r => ({ ...r, fail: (r.failRate * 100).toFixed(2) + '%', avgS: r.avg.toFixed(3) })))
const labels = ['1', '2', '3', '4', '5', '6', '7+']
const d7 = (r: SimResult) => [1, 2, 3, 4, 5, 6].map(i => r.dist[i] ?? 0).concat(r.dist.slice(7).reduce((a, b) => a + b, 0))
const distOpt = computed(() => ({ ...baseC.value, title: { show: false }, legend: { ...baseC.value.legend, top: 0 }, grid: { top: 50, left: 50, right: 20 }, xAxis: { type: 'category', data: labels }, yAxis: { type: 'value' }, series: list.value.map(r => ({ type: 'bar', name: r.name, data: d7(r) })) }))
const avgOpt = computed(() => ({ ...baseC.value, title: { show: false }, grid: { left: 10, right: 50, top: 10, bottom: 20, containLabel: true }, xAxis: { type: 'value', min: 3, max: Math.max(4.4, ...list.value.map(r => r.avg)) }, yAxis: { type: 'category', data: list.value.map(r => r.name).reverse() },
  series: [{ type: 'bar', data: list.value.map(r => +r.avg.toFixed(3)).reverse(), label: { show: true, position: 'right', color: fg.value }, itemStyle: { color: (p: any) => colorFor(p.name), borderRadius: [0, 4, 4, 0] }, markLine: { symbol: 'none', lineStyle: { type: 'dashed', color: tile.correct }, data: [{ xAxis: 3.4212 }] } }] }))
const shrinkOpt = computed(() => ({ ...baseC.value, title: { show: false }, legend: { ...baseC.value.legend, top: 0 }, grid: { top: 50, left: 50, right: 20 }, xAxis: { type: 'category', data: [1, 2, 3, 4, 5, 6].map(i => 'turn ' + i) }, yAxis: { type: 'log', min: 0.01 },
  series: list.value.map(r => ({ type: 'line', name: r.name, data: r.avgSizes.slice(0, 6).map(v => +Math.max(v, 0.01).toFixed(2)) })) }))
</script>
<template>
  <div class="flex flex-col gap-5">
    <UiCard title="Strategy simulation" :icon="FlaskConical" subtitle="Each strategy plays all 2,315 possible answers. 'Any word' variants may guess from all 12,972 valid guesses.">
      <div class="flex flex-wrap items-center gap-3">
        <MultiSelect v-model="selected" :options="STRATEGIES" optionLabel="name" optionValue="id" class="w-full sm:w-96" :maxSelectedLabels="3" />
        <UiButton :icon="Cpu" label="Re-run in Web Workers" @click="run" :loading="Object.keys(progress).length > 0" />
        <span class="text-caption text-muted">Preloaded from <code>public/results.json</code> (<code>bun run simulate</code>).</span>
      </div>
      <TransitionGroup name="list" tag="div" class="flex flex-col gap-1.5 mt-3">
        <div v-for="(p, id) in progress" :key="id" class="flex items-center gap-2 text-caption"><span class="w-36 truncate">{{ id }}</span><ProgressBar :value="Math.round(p * 100)" class="flex-1 !h-2" :showValue="false" /></div>
      </TransitionGroup>
    </UiCard>
    <UiCard title="Results" :icon="Table2">
      <DataTable :value="rows" size="small" stripedRows scrollable class="text-body">
        <Column field="name" header="Strategy"><template #body="{ data }"><span class="flex items-center gap-2"><i class="size-2.5 rounded-full shrink-0" :style="{ background: colorFor(data.name) }"></i>{{ data.name }}</span></template></Column>
        <Column field="opener" header="Opener"><template #body="{ data }"><span class="font-mono uppercase font-semibold">{{ data.opener }}</span></template></Column>
        <Column field="avgS" header="Avg" /><Column header="Fail >6"><template #body="{ data }"><UiBadge :tone="data.failRate === 0 ? 'correct' : 'danger'">{{ data.fail }}</UiBadge></template></Column><Column field="worst" header="Worst" />
        <Column header="Hardest words"><template #body="{ data }"><span class="font-mono text-caption uppercase text-muted">{{ data.worstWords.slice(0, 4).join(' ') }}</span></template></Column>
      </DataTable>
    </UiCard>
    <UiCard title="Average guesses" :icon="BarChart3" subtitle="Lower is better · dashed line = proven optimum 3.4212 (SALET)"><VChart :option="avgOpt" style="height: 380px" autoresize /></UiCard>
    <UiCard title="Guess-count distribution" :icon="ChartColumn"><VChart :option="distOpt" style="height: 400px" autoresize /></UiCard>
    <UiCard title="Candidate set shrinking per turn" :icon="TrendingDown" subtitle="Average possible answers left before each guess (solved games count as 0, log scale)"><VChart :option="shrinkOpt" style="height: 380px" autoresize /></UiCard>
  </div>
</template>
