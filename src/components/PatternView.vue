<script setup lang="ts">
import { useWindowSize } from '@vueuse/core'
const { width: vw } = useWindowSize()
import { ref, computed } from 'vue'
import VChart from 'vue-echarts'
import AutoComplete from 'primevue/autocomplete'; import SelectButton from 'primevue/selectbutton'
import { Grid2x2, Sigma } from 'lucide-vue-next'
import { baseC } from '../lib/charts'
import { tile, otherColor } from '../lib/tokens'
import { answers, allowed } from '../lib/words'
import { feedback, patternDigits } from '../lib/wordle'
import UiCard from './ui/UiCard.vue'; import UiBadge from './ui/UiBadge.vue'; import CountUp from './ui/CountUp.vue'
import PatternSquares from './PatternSquares.vue'
const word = ref('salet'), sugg = ref<string[]>([]), sort = ref<'by size' | 'by pattern'>('by size')
const search = (e: { query: string }) => (sugg.value = allowed.value.filter(w => w.startsWith(e.query.toLowerCase())).slice(0, 20))
const valid = computed(() => allowed.value.includes(word.value.toLowerCase()))
const rows = computed(() => {
  if (!valid.value) return []
  const g = word.value.toLowerCase(), n = answers.value.length
  const ex: string[][] = Array.from({ length: 243 }, () => [])
  for (const a of answers.value) ex[feedback(g, a)].push(a)
  return ex.map((ws, p) => ({ p, c: ws.length, ex: ws.slice(0, 6), prob: ws.length / n, info: ws.length ? Math.log2(n / ws.length) : 0, contrib: ws.length ? -(ws.length / n) * Math.log2(ws.length / n) : 0 }))
})
const H = computed(() => rows.value.reduce((a, r) => a + r.contrib, 0))
const used = computed(() => rows.value.filter(r => r.c).length)
const biggest = computed(() => Math.max(0, ...rows.value.map(r => r.c)))
const shown = computed(() => sort.value === 'by size' ? [...rows.value].sort((a, b) => b.c - a.c) : rows.value)
const dominant = (p: number) => { const d = patternDigits(p); return d.includes(2) ? tile.correct : d.includes(1) ? tile.present : tile.absent }
const opt = computed(() => ({
  ...baseC.value, grid: { left: vw.value < 640 ? 36 : 50, right: vw.value < 640 ? 36 : 50, top: vw.value < 640 ? 48 : 30, bottom: 30 }, legend: { ...baseC.value.legend, top: 0, ...(vw.value < 640 ? { itemGap: 8, textStyle: { ...(baseC.value.legend as any)?.textStyle, fontSize: 10 } } : {}) },
  tooltip: { trigger: 'axis', formatter: (ps: any) => { const r = shown.value[ps[0].dataIndex]; return `${patternDigits(r.p).map(d => `<span style="display:inline-block;width:11px;height:11px;margin-right:2px;border-radius:2px;background:${[tile.absent, tile.present, tile.correct][d]}"></span>`).join('')}<br/>${r.c} words (${(100 * r.prob).toFixed(2)}%)<br/>info if seen: ${r.info.toFixed(2)} bits<br/>contribution to H: ${r.contrib.toFixed(3)} bits` } },
  xAxis: { type: 'category', data: shown.value.map(r => r.p), axisLabel: { show: false }, axisTick: { show: false } },
  yAxis: [{ type: 'value', name: 'words' }, { type: 'value', name: 'bits', splitLine: { show: false } }],
  series: [
    { type: 'bar', name: 'bucket size', data: shown.value.map(r => ({ value: r.c, itemStyle: { color: dominant(r.p) } })), barCategoryGap: '10%' },
    { type: 'line', name: '−p·log₂p (contribution)', yAxisIndex: 1, data: shown.value.map(r => +r.contrib.toFixed(4)), showSymbol: false, lineStyle: { color: otherColor, width: 2 }, itemStyle: { color: otherColor } },
  ],
}))
</script>
<template>
  <div class="flex flex-col gap-5">
    <UiCard title="All 243 feedback patterns for one guess" :icon="Grid2x2" subtitle="How the 2,315 possible answers split into colour patterns if you guess this word first.">
      <div class="flex flex-wrap items-center gap-3">
        <AutoComplete v-model="word" :suggestions="sugg" @complete="search" inputClass="w-32 uppercase" placeholder="word" />
        <SelectButton v-model="sort" :options="['by size', 'by pattern']" :allowEmpty="false" size="small" />
        <template v-if="valid">
          <UiBadge tone="brand">H = <CountUp :value="H" :decimals="3" /> bits</UiBadge>
          <UiBadge>{{ used }} / 243 patterns possible</UiBadge>
          <UiBadge tone="present">worst bucket {{ biggest }}</UiBadge>
          <UiBadge>expected left ≈ {{ (answers.length / 2 ** H).toFixed(1) }}</UiBadge>
        </template>
        <UiBadge v-else tone="danger">not a valid guess</UiBadge>
      </div>
    </UiCard>
    <UiCard v-if="valid"><VChart :option="opt" style="height: 380px" autoresize /></UiCard>
    <UiCard v-if="valid" title="Entropy, explained" :icon="Sigma">
      <p class="text-muted mb-3">Each pattern p happens with probability P(p) = bucket size / 2,315. Seeing it gives log₂(1/P) bits. Entropy H = Σ −P·log₂P is the <i>expected</i> information: big when many patterns are possible and none dominates. A perfect split into 243 equal buckets would give log₂243 ≈ 7.92 bits.</p>
      <div class="overflow-x-auto"><table class="text-caption font-mono w-full">
        <thead><tr class="text-muted text-left"><th class="py-1 pr-3 font-medium">pattern</th><th class="pr-3 font-medium">words</th><th class="pr-3 font-medium">P</th><th class="pr-3 font-medium">bits if seen</th><th class="pr-3 font-medium">−P·log₂P</th><th class="font-medium">examples</th></tr></thead>
        <TransitionGroup name="list" tag="tbody">
          <tr v-for="r in [...rows].sort((a, b) => b.c - a.c).slice(0, 15)" :key="r.p" class="border-t border-line hover:bg-surface-2 transition-colors">
            <td class="py-1 pr-3"><PatternSquares :p="r.p" :size="12" /></td><td class="pr-3">{{ r.c }}</td><td class="pr-3">{{ (r.prob * 100).toFixed(1) }}%</td><td class="pr-3">{{ r.info.toFixed(2) }}</td><td class="pr-3">{{ r.contrib.toFixed(3) }}</td>
            <td class="uppercase text-muted">{{ r.ex.join(' ') }}{{ r.c > 6 ? ' …' : '' }}</td>
          </tr>
        </TransitionGroup>
      </table></div>
    </UiCard>
  </div>
</template>
