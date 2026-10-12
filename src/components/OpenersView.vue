<script setup lang="ts">
import { ref, computed } from 'vue'
import VChart from 'vue-echarts'
import Button from 'primevue/button'; import InputText from 'primevue/inputtext'
import { baseC } from '../lib/charts'
import { fg } from '../lib/theme'
import { answers } from '../lib/words'
import { entropy, buckets, patternEmoji } from '../lib/wordle'
const famous = ['soare', 'salet', 'roate', 'raise', 'arise', 'crane', 'slate', 'trace', 'crate', 'tares', 'adieu', 'audio', 'irate', 'stare', 'arose', 'later', 'alert', 'tears', 'least', 'fuzzy']
const custom = ref('')
const words = ref([...famous])
function add() { const w = custom.value.toLowerCase(); if (w.length === 5 && !words.value.includes(w)) words.value.push(w); custom.value = '' }
const data = computed(() => words.value.map(w => { const b = buckets(w, answers.value); let mx = 0, nz = 0; b.forEach(c => { if (c) nz++; if (c > mx) mx = c })
  return { w, h: entropy(w, answers.value), mx, nz } }).sort((a, b) => b.h - a.h))
const opt = computed(() => ({ ...baseC.value, title: { text: 'Expected information of opening guesses (bits, over the 2,315 possible answers)', textStyle: { color: fg.value, fontSize: 14 } }, grid: { left: 70 },
  xAxis: { type: 'value', min: 2 }, yAxis: { type: 'category', data: data.value.map(d => d.w.toUpperCase()).reverse() },
  series: [{ type: 'bar', data: data.value.map(d => +d.h.toFixed(3)).reverse(), label: { show: true, position: 'right', color: fg.value }, itemStyle: { color: '#38bdf8' } }] }))
const pick = ref('soare')
const bucketOpt = computed(() => { const b = buckets(pick.value, answers.value); const arr = [...b].map((c, p) => ({ p, c })).filter(x => x.c).sort((a, b) => b.c - a.c)
  return { ...baseC.value, title: { text: `Feedback pattern distribution for ${pick.value.toUpperCase()} (${arr.length} patterns)`, textStyle: { color: fg.value, fontSize: 14 } }, tooltip: { trigger: 'axis', formatter: (ps: any) => `${patternEmoji(arr[ps[0].dataIndex].p)}<br/>${ps[0].value} words` },
    xAxis: { type: 'category', data: arr.map(x => x.p), axisLabel: { show: false } }, yAxis: { type: 'value' }, series: [{ type: 'bar', data: arr.map(x => x.c), itemStyle: { color: '#f59e0b' } }] } })
</script>
<template>
  <div class="flex flex-col gap-4">
    <div class="card flex gap-2 items-center"><InputText v-model="custom" maxlength="5" placeholder="add word" size="small" @keyup.enter="add" /><Button label="Add" size="small" @click="add" /><span class="text-xs muted">Click a bar to see its feedback buckets.</span></div>
    <div class="card"><VChart :option="opt" style="height: 560px" autoresize @click="(e: any) => (pick = e.name.toLowerCase())" /></div>
    <div class="card"><VChart :option="bucketOpt" style="height: 320px" autoresize /></div>
    <div class="card text-sm ">Entropy H = −Σ p(pattern)·log2 p(pattern). Each bit halves the candidate set on average; log2(2315) ≈ 11.18 bits must be gained in total. A good opener yields ~5.9 bits, leaving ≈ 2315/2^5.9 ≈ 39 words.
      <table class="mt-2 font-mono text-xs"><tr class="muted"><td class="pr-4">word</td><td class="pr-4">bits</td><td class="pr-4">patterns</td><td>worst bucket</td></tr><tr v-for="d in data" :key="d.w"><td class="pr-4 uppercase">{{ d.w }}</td><td class="pr-4">{{ d.h.toFixed(3) }}</td><td class="pr-4">{{ d.nz }}</td><td>{{ d.mx }}</td></tr></table></div>
  </div>
</template>
