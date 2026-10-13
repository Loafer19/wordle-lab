<script setup lang="ts">
import { NA, NV, isUA, lang } from '../lib/lang'
import { OPTIMA } from '../lib/optimum'
import { ref, computed, watch } from 'vue'
import VChart from 'vue-echarts'
import GapView from './GapView.vue'
import { simReady } from '../lib/simdata'
void simReady
import DataTable from 'primevue/datatable'; import Column from 'primevue/column'; import ProgressBar from 'primevue/progressbar'; import MultiSelect from 'primevue/multiselect'
import { baseC } from '../lib/charts'
import UiCard from './ui/UiCard.vue'; import UiButton from './ui/UiButton.vue'; import UiBadge from './ui/UiBadge.vue'
import { FlaskConical, Cpu, Table2, BarChart3, ChartColumn, TrendingDown } from 'lucide-vue-next'
import { ruslanColor, ruslanBestColor, otherColor, tile } from '../lib/tokens'
const colorFor = (n: string) => { const id = list.value.find(r => r.name === n)?.id ?? ''; return id.startsWith('freqbal') ? ruslanBestColor : id.startsWith('freq') ? ruslanColor : id.startsWith('random') ? tile.absent : otherColor }
import { fg } from '../lib/theme'
import { answers, allowed } from '../lib/words'
import { precomputed } from '../lib/results'
import { STRATEGIES, type SimResult } from '../lib/wordle'
import { t } from '../lib/i18n'
import { STAGED_STRATEGIES } from '../lib/staged'
const SIM_STRATS = [...STAGED_STRATEGIES, ...STRATEGIES].map(s => ({ ...s, name: t(s.name) }))
const results = ref<Record<string, SimResult>>({}), progress = ref<Record<string, number>>({})
watch(precomputed, p => { for (const r of p) results.value[r.id] = r }, { immediate: true })
const selected = ref(SIM_STRATS.map(s => s.id))
function run() {
  for (const id of selected.value) {
    const w = new Worker(new URL('../lib/sim.worker.ts', import.meta.url), { type: 'module' })
    progress.value[id] = 0
    w.onmessage = e => { if (e.data.type === 'progress') progress.value[id] = e.data.p; else { results.value[id] = e.data.result; delete progress.value[id]; w.terminate() } }
    w.postMessage({ id, answers: [...answers.value], allowed: [...allowed.value] })
  }
}
const list = computed(() => Object.values(results.value).filter(r => selected.value.includes(r.id)).sort((a, b) => a.avg - b.avg).map(r => ({ ...r, name: t(r.name) })))
const rows = computed(() => list.value.map(r => ({ ...r, fail: (r.failRate * 100).toFixed(2) + '%', avgS: r.avg.toFixed(3) })))
const labels = ['1', '2', '3', '4', '5', '6', '7+']
const d7 = (r: SimResult) => [1, 2, 3, 4, 5, 6].map(i => r.dist[i] ?? 0).concat(r.dist.slice(7).reduce((a, b) => a + b, 0))
const distOpt = computed(() => ({ ...baseC.value, title: { show: false }, legend: { ...baseC.value.legend, top: 0 }, grid: { top: 50, left: 50, right: 20 }, xAxis: { type: 'category', data: labels }, yAxis: { type: 'value' }, series: list.value.map(r => ({ type: 'bar', name: r.name, data: d7(r) })) }))
const avgOpt = computed(() => ({ ...baseC.value, title: { show: false }, grid: { left: 10, right: 50, top: 10, bottom: 20, containLabel: true }, xAxis: { type: 'value', min: 3, max: Math.max(4.4, ...list.value.map(r => r.avg)) }, yAxis: { type: 'category', data: list.value.map(r => r.name).reverse() },
  series: [{ type: 'bar', data: list.value.map(r => +r.avg.toFixed(3)).reverse(), label: { show: true, position: 'right', color: fg.value }, itemStyle: { color: (p: any) => colorFor(p.name), borderRadius: [0, 4, 4, 0] }, markLine: { symbol: 'none', lineStyle: { type: 'dashed', color: tile.correct }, data: [{ xAxis: +OPTIMA[lang].normal.toFixed(4) }] } }] }))
const shrinkOpt = computed(() => ({ ...baseC.value, title: { show: false }, legend: { ...baseC.value.legend, top: 0 }, grid: { top: 50, left: 50, right: 20 }, xAxis: { type: 'category', data: [1, 2, 3, 4, 5, 6].map(i => t('turn {n}', { n: i })) }, yAxis: { type: 'log', min: 0.01 },
  series: list.value.map(r => ({ type: 'line', name: r.name, data: r.avgSizes.slice(0, 6).map(v => +Math.max(v, 0.01).toFixed(2)) })) }))
</script>
<template>
  <div class="flex flex-col gap-5">
    <GapView />
    <UiCard :title="$t('Strategy simulation')" :icon="FlaskConical" :subtitle="$t('Each strategy plays all {n} possible answers. “Any word” variants may guess from all {v} valid guesses.', { n: NA, v: NV })">
      <div class="flex flex-wrap items-center gap-3">
        <MultiSelect v-model="selected" :options="SIM_STRATS" optionLabel="name" optionValue="id" class="w-full sm:w-96" :maxSelectedLabels="3" />
        <UiButton :icon="Cpu" :label="$t('Re-run in Web Workers')" @click="run" :loading="Object.keys(progress).length > 0" />
        <span class="text-caption text-muted">{{ $t('Preloaded from') }} <code>public/results.json</code> (<code>bun run simulate</code>{{ $t('). Two-step entropy (~16 s CPU) and the optimal SALET tree (a loaded proof, not a search) are precomputed only — see the gap table above.') }}</span>
      </div>
      <TransitionGroup name="list" tag="div" class="flex flex-col gap-1.5 mt-3">
        <div v-for="(p, id) in progress" :key="id" class="flex items-center gap-2 text-caption"><span class="w-36 truncate">{{ id }}</span><ProgressBar :value="Math.round(p * 100)" class="flex-1 !h-2" :showValue="false" /></div>
      </TransitionGroup>
    </UiCard>
    <UiCard :title="$t('Results')" :icon="Table2">
      <DataTable :value="rows" size="small" stripedRows scrollable class="text-body">
        <Column field="name" :header="$t('Strategy')"><template #body="{ data }"><span class="flex items-center gap-2"><i class="size-2.5 rounded-full shrink-0" :style="{ background: colorFor(data.name) }"></i>{{ data.name }}</span></template></Column>
        <Column field="opener" :header="$t('Opener')"><template #body="{ data }"><span class="font-mono uppercase font-semibold">{{ data.opener }}</span></template></Column>
        <Column field="avgS" :header="$t('Avg')" /><Column :header="$t('Fail >6')"><template #body="{ data }"><UiBadge :tone="data.failRate === 0 ? 'correct' : 'danger'">{{ data.fail }}</UiBadge></template></Column><Column field="worst" :header="$t('Worst')" />
        <Column :header="$t('Hardest words')"><template #body="{ data }"><span class="font-mono text-caption uppercase text-muted">{{ data.worstWords.slice(0, 4).join(' ') }}</span></template></Column>
      </DataTable>
    </UiCard>
    <UiCard :title="$t('Average guesses')" :icon="BarChart3" :subtitle="isUA ? $t('Lower is better · dashed line = proven UA optimum 3.3809 (КОТРА)') : $t('Lower is better · dashed line = proven optimum 3.4212 (SALET)')"><VChart :option="avgOpt" style="height: 380px" autoresize /></UiCard>
    <UiCard :title="$t('Guess-count distribution')" :icon="ChartColumn"><VChart :option="distOpt" style="height: 400px" autoresize /></UiCard>
    <UiCard :title="$t('Candidate set shrinking per turn')" :icon="TrendingDown" :subtitle="$t('Average possible answers left before each guess (solved games count as 0, log scale)')"><VChart :option="shrinkOpt" style="height: 380px" autoresize /></UiCard>
  </div>
</template>
