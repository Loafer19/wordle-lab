<script setup lang="ts">
import { META } from '../lib/lang'
import { CI } from '../lib/alpha'
import { computed, ref } from 'vue'
import VChart from 'vue-echarts'
import SelectButton from 'primevue/selectbutton'
import { baseC } from '../lib/charts'
import UiCard from './ui/UiCard.vue'
import { BookOpen, CaseSensitive, Grid3x3 } from 'lucide-vue-next'
import { ruslanColor, tile } from '../lib/tokens'
import { fg } from '../lib/theme'
import { answers, allowed } from '../lib/words'
import { letterFreq } from '../lib/wordle'
import { ANSWERS_HELP, ALLOWED_HELP, ANSWERS_LABEL, ALLOWED_LABEL } from '../lib/labels'
const src = ref('answers')
const opts = [{ label: ANSWERS_LABEL, value: 'answers' }, { label: ALLOWED_LABEL, value: 'allowed' }]
const words = computed(() => (src.value === 'answers' ? answers.value : allowed.value))
const f = computed(() => letterFreq(words.value))
const letters = META.letters.split('')
const order = computed(() => letters.map(l => ({ l, v: f.value.overall[CI[l.charCodeAt(0)]] })).sort((a, b) => b.v - a.v))
const overallOpt = computed(() => ({ ...baseC.value, title: { show: false },
  xAxis: { type: 'category', data: order.value.map(o => o.l.toUpperCase()) }, yAxis: { type: 'value', axisLabel: { formatter: '{value}%' } },
  series: [{ type: 'bar', data: order.value.map((o, i) => ({ value: +(100 * o.v / words.value.length).toFixed(1), itemStyle: { color: i < 7 ? ruslanColor : tile.absent } })) }] }))
const heatOpt = computed(() => { const data: number[][] = []; let max = 0
  f.value.pos.forEach((row, p) => letters.forEach((l, c) => { const v = row[CI[l.charCodeAt(0)]]; data.push([p, c, v]); max = Math.max(max, v) }))
  return { ...baseC.value, tooltip: {}, title: { show: false }, grid: { left: 40, right: 80 },
    xAxis: { type: 'category', data: ['1', '2', '3', '4', '5'] }, yAxis: { type: 'category', data: letters.map(l => l.toUpperCase()), inverse: true },
    visualMap: { min: 0, max, calculable: true, orient: 'vertical', right: 0, top: 'center', textStyle: { color: fg.value }, inRange: { color: ['#0f172a', '#0ea5e9', '#facc15'] } },
    series: [{ type: 'heatmap', data, label: { show: true, fontSize: 9, color: fg.value } }] } })
</script>
<template>
  <div class="flex flex-col gap-5">
    <UiCard :title="$t('Word list')" :icon="BookOpen">
      <div class="flex items-center gap-3 flex-wrap"><SelectButton v-model="src" :options="opts" optionLabel="label" optionValue="value" :allowEmpty="false" size="small" /><span class="text-caption text-muted max-w-xl">{{ src === 'answers' ? ANSWERS_HELP : ALLOWED_HELP }}</span></div>
    </UiCard>
    <UiCard data-letters-chart :data-nonzero="order.filter(o => o.v > 0).length" :data-total="letters.length" :title="$t('Letter frequency')" :icon="CaseSensitive" :subtitle="$t('% of words containing each letter · Ruslan\'s top-7 highlighted')"><VChart :option="overallOpt" style="height: 340px" autoresize /></UiCard>
    <UiCard :title="$t('Positional frequency')" :icon="Grid3x3" :subtitle="$t('Number of words with the letter at each position')"><VChart :option="heatOpt" style="height: 720px" autoresize /></UiCard>
  </div>
</template>
