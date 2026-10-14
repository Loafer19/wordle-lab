<script setup lang="ts">
import { t } from '../lib/i18n'
import { FAMOUS_OPENERS, NA, META } from '../lib/lang'
import { useWindowSize } from '@vueuse/core'
const { width: vw } = useWindowSize()
import { ref, computed } from 'vue'
import VChart from 'vue-echarts'
import AutoComplete from 'primevue/autocomplete'; import SelectButton from 'primevue/selectbutton'
import { ScanSearch, Sigma } from 'lucide-vue-next'
import { baseC } from '../lib/charts'
import { tile, otherColor } from '../lib/tokens'
import { answers, allowed } from '../lib/words'
import { feedback, patternDigits } from '../lib/wordle'
import UiCard from './ui/UiCard.vue'; import UiBadge from './ui/UiBadge.vue'; import CountUp from './ui/CountUp.vue'
import PatternSquares from './PatternSquares.vue'
import { inspectWord } from '../lib/shared'
const word = inspectWord
import UiButton from './ui/UiButton.vue'
const sugg = ref<string[]>([]), sort = ref<'by size' | 'by pattern'>('by size')
const searched = ref(false)
const search = (e: { query: string }) => (searched.value = true, sugg.value = allowed.value.filter(w => w.startsWith(e.query.toLowerCase())).slice(0, 20))
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
  yAxis: [{ type: 'value', name: t('words') }, { type: 'value', name: t('bits'), splitLine: { show: false } }],
  series: [
    { type: 'bar', name: t('bucket size'), data: shown.value.map(r => ({ value: r.c, itemStyle: { color: dominant(r.p) } })), barCategoryGap: '10%' },
    { type: 'line', name: '−p·log₂p (contribution)', yAxisIndex: 1, data: shown.value.map(r => +r.contrib.toFixed(4)), showSymbol: false, lineStyle: { color: otherColor, width: 2 }, itemStyle: { color: otherColor } },
  ],
}))
</script>
<template>
  <div class="flex flex-col gap-5">
    <UiCard :title="$t('Word inspector')" :icon="ScanSearch" :subtitle="$t('Pick any guess: see how the {n} possible answers split into its 243 colour patterns, its entropy and its worst case.', { n: NA })" data-inspector>
      <div class="flex flex-wrap items-center gap-3">
        <AutoComplete v-model="word" :suggestions="sugg" @complete="search" inputClass="w-32 uppercase font-mono" :placeholder="$t('word')" :showEmptyMessage="false" :emptySearchMessage="searched ? undefined : ' '" data-inspector-word />
        <SelectButton v-model="sort" :options="[{ v: 'by size', l: $t('by size') }, { v: 'by pattern', l: $t('by pattern') }]" optionLabel="l" optionValue="v" :allowEmpty="false" size="small" />
        <template v-if="valid">
          <UiBadge tone="brand" v-tooltip.top="'H = ' + H.toFixed(4)" data-inspector-h>H = <CountUp :value="H" :decimals="2" /> {{ $t('bits') }}</UiBadge>
          <UiBadge>{{ $t('{n} / 243 patterns possible', { n: used }) }}</UiBadge>
          <UiBadge tone="present">{{ $t('worst bucket') }} {{ biggest }}</UiBadge>
          <UiBadge>{{ $t('expected left') }} ≈ {{ (answers.length / 2 ** H).toFixed(1) }}</UiBadge>
        </template>
        <UiBadge v-else tone="danger">{{ $t('not a valid guess') }}</UiBadge>
      </div>
      <div class="flex flex-wrap items-center gap-1.5 mt-3 text-caption text-muted">{{ $t('Try') }}:
        <UiButton v-for="w in FAMOUS_OPENERS.slice(0, 6)" :key="w" :label="w.toUpperCase()" variant="ghost" @click="word = w" />
      </div>
    </UiCard>
    <UiCard v-if="valid"><VChart :option="opt" style="height: 380px" autoresize /></UiCard>
    <UiCard v-if="valid" :title="$t('Entropy, explained')" :icon="Sigma" data-entropy-explainer>
      <p class="text-muted mb-2">{{ $t('Each pattern p happens with probability P(p) = bucket size / {n}. Seeing it gives log₂(1/P) bits. Entropy H = Σ −P·log₂P is the expected information: big when many patterns are possible and none dominates. A perfect split into 243 equal buckets would give log₂243 ≈ 7.92 bits.', { n: NA }) }}</p>
      <p class="text-muted mb-3">{{ t('Each bit halves the candidate set on average; log₂({n}) ≈ {b} bits must be gained in total. A good opener yields ~5.9 bits, leaving ≈ {n}/2^5.9 ≈ {r} words.', { n: NA, b: Math.log2(META.answers).toFixed(2), r: Math.round(META.answers / 2 ** 5.9) }) }}</p>
      <div class="overflow-x-auto"><table class="text-caption font-mono w-full">
        <thead><tr class="text-muted text-left"><th class="py-1 pr-3 font-medium">{{ $t('pattern') }}</th><th class="pr-3 font-medium">{{ $t('words') }}</th><th class="pr-3 font-medium hidden sm:table-cell">P</th><th class="pr-3 font-medium">{{ $t('bits if seen') }}</th><th class="pr-3 font-medium hidden sm:table-cell">−P·log₂P</th><th class="font-medium">{{ $t('examples') }}</th></tr></thead>
        <TransitionGroup name="list" tag="tbody">
          <tr v-for="r in [...rows].sort((a, b) => b.c - a.c).slice(0, 15)" :key="r.p" class="border-t border-line hover:bg-surface-2 transition-colors">
            <td class="py-1 pr-3"><PatternSquares :p="r.p" :size="12" /></td><td class="pr-3">{{ r.c }}</td><td class="pr-3 hidden sm:table-cell">{{ (r.prob * 100).toFixed(1) }}%</td><td class="pr-3">{{ r.info.toFixed(2) }}</td><td class="pr-3 hidden sm:table-cell">{{ r.contrib.toFixed(3) }}</td>
            <td class="uppercase text-muted break-words">{{ r.ex.join(' ') }}{{ r.c > 6 ? ' …' : '' }}</td>
          </tr>
        </TransitionGroup>
      </table></div>
    </UiCard>
  </div>
</template>
