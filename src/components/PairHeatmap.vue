<script setup lang="ts">
import { ref, computed } from 'vue'
import VChart from 'vue-echarts'
import { Grid3x3 } from 'lucide-vue-next'
import { baseC } from '../lib/charts'
import { fg } from '../lib/theme'
import { brand, tile, danger } from '../lib/tokens'
import UiCard from './ui/UiCard.vue'; import UiBadge from './ui/UiBadge.vue'
const data = ref<{ first: string[]; second: string[]; follow: string; cells: number[][] } | null>(null)
fetch(import.meta.env.BASE_URL + 'opener-pairs.json').then(r => (r.ok ? r.json() : null)).then(j => (data.value = j)).catch(() => {})
const best = computed(() => data.value && [...data.value.cells].sort((a, b) => a[2] - b[2])[0])
const opt = computed(() => data.value && ({
  ...baseC.value, tooltip: { trigger: 'item', formatter: (i: any) => `${data.value!.first[i.value[1]].toUpperCase()} → ${data.value!.second[i.value[0]].toUpperCase()}<br/>avg <b>${i.value[2]}</b> guesses · ${i.value[3]} fails` },
  grid: { left: 70, right: 90, top: 10, bottom: 60 },
  xAxis: { type: 'category', data: data.value.second.map(w => w.toUpperCase()), name: 'second word', nameLocation: 'middle', nameGap: 40, axisLabel: { fontFamily: 'monospace' } },
  yAxis: { type: 'category', data: data.value.first.map(w => w.toUpperCase()), name: 'first', axisLabel: { fontFamily: 'monospace' } },
  visualMap: { min: Math.min(...data.value.cells.map(c => c[2])), max: Math.max(...data.value.cells.map(c => c[2])), calculable: true, orient: 'vertical', right: 0, top: 'center', textStyle: { color: fg.value }, inRange: { color: [brand[500], tile.present, danger] } },
  series: [{ type: 'heatmap', data: data.value.cells, label: { show: true, fontSize: 10, color: '#fff', formatter: (i: any) => i.value[2].toFixed(2) }, emphasis: { itemStyle: { borderColor: fg.value, borderWidth: 2 } } }],
}))
</script>
<template>
  <UiCard title="Opener pairs: first × second word" :icon="Grid3x3" :subtitle="data ? `Fixed two-word start (second word played whatever the first showed), then ${data.follow}. Average guesses over all 2,315 answers.` : 'Run bun run simulate to generate opener-pairs.json'">
    <template #actions><UiBadge v-if="best" tone="brand">best {{ data!.first[best[1]].toUpperCase() }} + {{ data!.second[best[0]].toUpperCase() }} = {{ best[2].toFixed(3) }}</UiBadge></template>
    <VChart v-if="opt" :option="opt" style="height: 460px" autoresize />
  </UiCard>
</template>
