<script setup lang="ts">
import { computed, ref } from 'vue'
import VChart from 'vue-echarts'
import SelectButton from 'primevue/selectbutton'
import { baseC } from '../lib/charts'
import { fg } from '../lib/theme'
import { answers, allowed } from '../lib/words'
import { letterFreq } from '../lib/wordle'
import { ANSWERS_HELP, ALLOWED_HELP, ANSWERS_LABEL, ALLOWED_LABEL } from '../lib/labels'
const src = ref('answers')
const opts = [{ label: ANSWERS_LABEL, value: 'answers' }, { label: ALLOWED_LABEL, value: 'allowed' }]
const words = computed(() => (src.value === 'answers' ? answers.value : allowed.value))
const f = computed(() => letterFreq(words.value))
const letters = 'abcdefghijklmnopqrstuvwxyz'.split('')
const order = computed(() => letters.map((l, i) => ({ l, v: f.value.overall[i] })).sort((a, b) => b.v - a.v))
const overallOpt = computed(() => ({ ...baseC.value, title: { text: `% of words containing letter in ${src.value === 'answers' ? 'possible answers' : 'all valid guesses'} (${words.value.length} words) — Ruslan's top-7 highlighted`, textStyle: { color: fg.value, fontSize: 14 } },
  xAxis: { type: 'category', data: order.value.map(o => o.l.toUpperCase()) }, yAxis: { type: 'value', axisLabel: { formatter: '{value}%' } },
  series: [{ type: 'bar', data: order.value.map((o, i) => ({ value: +(100 * o.v / words.value.length).toFixed(1), itemStyle: { color: i < 7 ? '#f59e0b' : '#64748b' } })) }] }))
const heatOpt = computed(() => { const data: number[][] = []; let max = 0
  f.value.pos.forEach((row, p) => row.forEach((v, c) => { data.push([p, c, v]); max = Math.max(max, v) }))
  return { ...baseC.value, tooltip: {}, title: { text: 'Positional frequency (count of words with letter at position)', textStyle: { color: fg.value, fontSize: 14 } }, grid: { left: 40, right: 80 },
    xAxis: { type: 'category', data: ['1', '2', '3', '4', '5'] }, yAxis: { type: 'category', data: letters.map(l => l.toUpperCase()), inverse: true },
    visualMap: { min: 0, max, calculable: true, orient: 'vertical', right: 0, top: 'center', textStyle: { color: fg.value }, inRange: { color: ['#0f172a', '#0ea5e9', '#facc15'] } },
    series: [{ type: 'heatmap', data, label: { show: true, fontSize: 9, color: fg.value } }] } })
</script>
<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-center gap-3 flex-wrap"><SelectButton v-model="src" :options="opts" optionLabel="label" optionValue="value" :allowEmpty="false" /><span class="text-xs muted max-w-xl">{{ src === 'answers' ? ANSWERS_HELP : ALLOWED_HELP }}</span></div>
    <div class="card"><VChart :option="overallOpt" style="height: 340px" autoresize /></div>
    <div class="card"><VChart :option="heatOpt" style="height: 720px" autoresize /></div>
  </div>
</template>
