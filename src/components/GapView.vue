<script setup lang="ts">
import { computed } from 'vue'
import VChart from 'vue-echarts'
import { Target } from 'lucide-vue-next'
import { baseC } from '../lib/charts'
import { tile, otherColor, ruslanColor } from '../lib/tokens'
import { simIndex } from '../lib/simdata'
import { OPTIMUM } from '../lib/advanced'
import UiCard from './ui/UiCard.vue'; import UiBadge from './ui/UiBadge.vue'
const rows = computed(() => {
  const normal = simIndex.value.filter(s => s.mode === 'normal').sort((a, b) => a.avg - b.avg)
  return normal.map(n => ({ ...n, hard: simIndex.value.find(h => h.id === n.id + '@hard') }))
})
const opt = computed(() => ({
  ...baseC.value, legend: { ...baseC.value.legend, top: 0 }, grid: { left: 10, right: 40, top: 40, bottom: 20, containLabel: true },
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  xAxis: { type: 'value', name: 'gap to optimum (guesses)' }, yAxis: { type: 'category', data: rows.value.map(r => r.name).reverse() },
  series: [
    { type: 'bar', name: `Normal (optimum ${OPTIMUM.normal.toFixed(4)})`, data: rows.value.map(r => +r.gap.toFixed(4)).reverse(), itemStyle: { color: otherColor, borderRadius: [0, 4, 4, 0] } },
    { type: 'bar', name: `Hard (optimum ${OPTIMUM.hard.toFixed(4)})`, data: rows.value.map(r => +(r.hard?.gap ?? 0).toFixed(4)).reverse(), itemStyle: { color: ruslanColor, borderRadius: [0, 4, 4, 0] } },
  ],
}))
const tone = (g: number) => (g < 0.001 ? 'correct' : g < 0.1 ? 'brand' : g < 0.25 ? 'present' : 'danger') as any
</script>
<template>
  <UiCard title="Gap to the proven optimum · normal vs hard mode" :icon="Target" :subtitle="`Optimal decision trees: ${OPTIMUM.normal.toFixed(4)} normal, ${OPTIMUM.hard.toFixed(4)} hard (SALET; Selby, Bertsimas & Paskov). Hard mode: revealed hints must be reused.`">
    <div class="overflow-x-auto mb-4"><table class="text-caption w-full">
      <thead><tr class="text-muted text-left"><th class="py-1 pr-3 font-medium">Strategy</th><th class="pr-3 font-medium">Normal avg</th><th class="pr-3 font-medium">gap</th><th class="pr-3 font-medium">fail</th><th class="pr-3 font-medium">worst</th><th class="pr-3 font-medium">Hard avg</th><th class="pr-3 font-medium">gap</th><th class="pr-3 font-medium">fail</th><th class="font-medium">worst</th></tr></thead>
      <tbody><tr v-for="r in rows" :key="r.id" class="border-t border-line hover:bg-surface-2 transition-colors">
        <td class="py-1.5 pr-3 font-medium">{{ r.name }}</td>
        <td class="pr-3 tabular-nums">{{ r.avg.toFixed(3) }}</td><td class="pr-3"><UiBadge :tone="tone(r.gap)">+{{ r.gap.toFixed(3) }}</UiBadge></td><td class="pr-3 tabular-nums">{{ (r.failRate * 100).toFixed(2) }}%</td><td class="pr-3">{{ r.worst }}</td>
        <template v-if="r.hard"><td class="pr-3 tabular-nums">{{ r.hard.avg.toFixed(3) }}</td><td class="pr-3"><UiBadge :tone="tone(r.hard.gap)">+{{ r.hard.gap.toFixed(3) }}</UiBadge></td><td class="pr-3 tabular-nums">{{ (r.hard.failRate * 100).toFixed(2) }}%</td><td>{{ r.hard.worst }}</td></template>
        <td v-else colspan="4" class="text-muted">—</td>
      </tr></tbody>
    </table></div>
    <VChart :option="opt" style="height: 520px" autoresize />
    <p class="text-caption text-muted mt-2">Candidate-only strategies are automatically hard-mode legal, so their hard numbers equal normal ones. <span class="inline-block size-2 rounded-full align-middle" :style="{ background: tile.correct }"></span> = optimal.</p>
  </UiCard>
</template>
