<script setup lang="ts">
import { computed, ref } from 'vue'
import VChart from 'vue-echarts'
import SelectButton from 'primevue/selectbutton'
import { base } from '../lib/charts'
import { answers, allowed } from '../lib/words'
import { letterFreq } from '../lib/wordle'
const src = ref('answers')
const words = computed(() => (src.value === 'answers' ? answers.value : allowed.value))
const f = computed(() => letterFreq(words.value))
const letters = 'abcdefghijklmnopqrstuvwxyz'.split('')
const order = computed(() => letters.map((l, i) => ({ l, v: f.value.overall[i] })).sort((a, b) => b.v - a.v))
const overallOpt = computed(() => ({ ...base, title: { text: `% of words containing letter (${words.value.length} words) — Ruslan's top-7 highlighted`, textStyle: { color: '#ddd', fontSize: 14 } },
  xAxis: { type: 'category', data: order.value.map(o => o.l.toUpperCase()) }, yAxis: { type: 'value', axisLabel: { formatter: '{value}%' } },
  series: [{ type: 'bar', data: order.value.map((o, i) => ({ value: +(100 * o.v / words.value.length).toFixed(1), itemStyle: { color: i < 7 ? '#f59e0b' : '#64748b' } })) }] }))
const heatOpt = computed(() => { const data: number[][] = []; let max = 0
  f.value.pos.forEach((row, p) => row.forEach((v, c) => { data.push([p, c, v]); max = Math.max(max, v) }))
  return { ...base, tooltip: {}, title: { text: 'Positional frequency (count of words with letter at position)', textStyle: { color: '#ddd', fontSize: 14 } }, grid: { left: 40, right: 80 },
    xAxis: { type: 'category', data: ['1', '2', '3', '4', '5'] }, yAxis: { type: 'category', data: letters.map(l => l.toUpperCase()), inverse: true },
    visualMap: { min: 0, max, calculable: true, orient: 'vertical', right: 0, top: 'center', textStyle: { color: '#ddd' }, inRange: { color: ['#0f172a', '#0ea5e9', '#facc15'] } },
    series: [{ type: 'heatmap', data, label: { show: true, fontSize: 9, color: '#fff' } }] } })
</script>
<template>
  <div class="flex flex-col gap-4">
    <SelectButton v-model="src" :options="['answers', 'allowed']" />
    <div class="card"><VChart :option="overallOpt" style="height: 340px" autoresize /></div>
    <div class="card"><VChart :option="heatOpt" style="height: 720px" autoresize /></div>
  </div>
</template>
