<script setup lang="ts">
import { ref, computed } from 'vue'
import VChart from 'vue-echarts'
import InputText from 'primevue/inputtext'
import { baseC } from '../lib/charts'
import UiCard from './ui/UiCard.vue'; import UiButton from './ui/UiButton.vue'; import UiBadge from './ui/UiBadge.vue'
import { Rocket, Plus, ChartColumn, Sigma } from 'lucide-vue-next'
import { otherColor, tile } from '../lib/tokens'
import { fg } from '../lib/theme'
import { answers } from '../lib/words'
import { entropy, buckets, patternDigits } from '../lib/wordle'
const famous = ['soare', 'salet', 'roate', 'raise', 'arise', 'crane', 'slate', 'trace', 'crate', 'tares', 'adieu', 'audio', 'irate', 'stare', 'arose', 'later', 'alert', 'tears', 'least', 'fuzzy']
const custom = ref('')
const words = ref([...famous])
function add() { const w = custom.value.toLowerCase(); if (w.length === 5 && !words.value.includes(w)) words.value.push(w); custom.value = '' }
const data = computed(() => words.value.map(w => { const b = buckets(w, answers.value); let mx = 0, nz = 0; b.forEach(c => { if (c) nz++; if (c > mx) mx = c })
  return { w, h: entropy(w, answers.value), mx, nz } }).sort((a, b) => b.h - a.h))
const opt = computed(() => ({ ...baseC.value, title: { show: false }, grid: { left: 10, right: 50, top: 10, bottom: 20, containLabel: true },
  xAxis: { type: 'value', min: 2 }, yAxis: { type: 'category', data: data.value.map(d => d.w.toUpperCase()).reverse() },
  series: [{ type: 'bar', data: data.value.map(d => +d.h.toFixed(3)).reverse(), label: { show: true, position: 'right', color: fg.value }, itemStyle: { color: otherColor, borderRadius: [0, 4, 4, 0] } }] }))
const pick = ref('soare')
const bucketOpt = computed(() => { const b = buckets(pick.value, answers.value); const arr = [...b].map((c, p) => ({ p, c })).filter(x => x.c).sort((a, b) => b.c - a.c)
  return { ...baseC.value, title: { show: false }, tooltip: { trigger: 'axis', formatter: (ps: any) => `${patternDigits(arr[ps[0].dataIndex].p).map(d => `<span style="display:inline-block;width:12px;height:12px;margin-right:2px;border-radius:2px;background:${[tile.absent, tile.present, tile.correct][d]}"></span>`).join('')}<br/>${ps[0].value} words` },
    xAxis: { type: 'category', data: arr.map(x => x.p), axisLabel: { show: false } }, yAxis: { type: 'value' }, series: [{ type: 'bar', data: arr.map(x => x.c), itemStyle: { color: tile.present } }] } })
</script>
<template>
  <div class="flex flex-col gap-5">
    <UiCard title="Opening words by expected information" :icon="Rocket" subtitle="Bits gained on average over the 2,315 possible answers · click a bar to inspect it">
      <template #actions>
        <InputText v-model="custom" maxlength="5" placeholder="add word" size="small" class="w-28 uppercase" @keyup.enter="add" /><UiButton :icon="Plus" ariaLabel="Add word" variant="secondary" @click="add" />
      </template>
      <VChart :option="opt" style="height: 560px" autoresize @click="(e: any) => (pick = e.name.toLowerCase())" />
    </UiCard>
    <UiCard :title="`Feedback patterns for ${pick.toUpperCase()}`" :icon="ChartColumn" subtitle="How the 2,315 answers split into colour patterns; flatter = more informative"><VChart :option="bucketOpt" style="height: 320px" autoresize /></UiCard>
    <UiCard title="What the numbers mean" :icon="Sigma">
      <p class="text-muted">Entropy H = −Σ p(pattern)·log₂ p(pattern). Each bit halves the candidate set on average; log₂(2315) ≈ 11.18 bits must be gained in total. A good opener yields ~5.9 bits, leaving ≈ 2315/2^5.9 ≈ 39 words.</p>
      <div class="overflow-x-auto mt-3"><table class="font-mono text-caption w-full max-w-md">
        <thead><tr class="text-muted text-left"><th class="py-1 pr-4 font-medium">word</th><th class="pr-4 font-medium">bits</th><th class="pr-4 font-medium">patterns</th><th class="font-medium">worst bucket</th></tr></thead>
        <tbody><tr v-for="d in data" :key="d.w" class="border-t border-line hover:bg-surface-2 transition-colors cursor-pointer" @click="pick = d.w"><td class="py-1 pr-4 uppercase font-semibold">{{ d.w }}</td><td class="pr-4">{{ d.h.toFixed(3) }}</td><td class="pr-4">{{ d.nz }}</td><td>{{ d.mx }}</td></tr></tbody>
      </table></div>
    </UiCard>
  </div>
</template>
