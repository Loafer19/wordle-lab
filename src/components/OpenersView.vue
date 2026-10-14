<script setup lang="ts">
import { FAMOUS_OPENERS, NA, isUA } from '../lib/lang'
import { ref, computed } from 'vue'
import VChart from 'vue-echarts'
import PairHeatmap from './PairHeatmap.vue'
import UiAdvanced from './ui/UiAdvanced.vue'
import { inspectWord } from '../lib/shared'
import { go } from '../lib/route'
import InputText from 'primevue/inputtext'
import { baseC } from '../lib/charts'
import UiCard from './ui/UiCard.vue'; import UiButton from './ui/UiButton.vue'
import { Rocket, Plus, Table2 } from 'lucide-vue-next'
import { otherColor } from '../lib/tokens'
import { fg } from '../lib/theme'
import { answers } from '../lib/words'
import { entropy, buckets } from '../lib/wordle'
const famous = FAMOUS_OPENERS
const custom = ref('')
const words = ref([...famous])
function add() { const w = custom.value.toLowerCase(); if (w.length === 5 && !words.value.includes(w)) words.value.push(w); custom.value = '' }
const data = computed(() => words.value.map(w => { const b = buckets(w, answers.value); let mx = 0, nz = 0; b.forEach(c => { if (c) nz++; if (c > mx) mx = c })
  return { w, h: entropy(w, answers.value), mx, nz } }).sort((a, b) => b.h - a.h))
const opt = computed(() => ({ ...baseC.value, title: { show: false }, grid: { left: 10, right: 50, top: 10, bottom: 20, containLabel: true },
  xAxis: { type: 'value', min: 2 }, yAxis: { type: 'category', data: data.value.map(d => d.w.toUpperCase()).reverse() },
  series: [{ type: 'bar', data: data.value.map(d => +d.h.toFixed(2)).reverse(), label: { show: true, position: 'right', color: fg.value }, itemStyle: { color: otherColor, borderRadius: [0, 4, 4, 0] } }] }))
const inspect = (w: string) => { inspectWord.value = w.toLowerCase(); go('learn', 'inspector') }
</script>
<template>
  <div class="flex flex-col gap-5">
    <UiCard :title="$t('Opening words by expected information')" :icon="Rocket" :subtitle="$t('Bits gained on average over the {n} possible answers · click a bar to inspect it', { n: NA })">
      <template #actions>
        <InputText v-model="custom" maxlength="5" :placeholder="$t('add word')" size="small" class="w-28 uppercase" @keyup.enter="add" /><UiButton :icon="Plus" :ariaLabel="$t('Add word')" variant="secondary" @click="add" />
      </template>
      <VChart :option="opt" style="height: 560px" autoresize @click="(e: any) => inspect(e.name)" class="echarts-clickable" />
    </UiCard>
    <UiCard :title="$t('Openers at a glance')" :icon="Table2" :subtitle="$t('Click a row to open it in the Word inspector')">
      <div class="overflow-x-auto"><table class="font-mono text-caption w-full max-w-md">
        <thead><tr class="text-muted text-left"><th class="py-1 pr-4 font-medium">{{ $t('word') }}</th><th class="pr-4 font-medium">{{ $t('bits') }}</th><th class="pr-4 font-medium">{{ $t('patterns') }}</th><th class="font-medium">{{ $t('worst bucket') }}</th></tr></thead>
        <tbody><tr v-for="d in data" :key="d.w" class="border-t border-line hover:bg-surface-2 transition-colors cursor-pointer" @click="inspect(d.w)" data-opener-row><td class="py-1 pr-4 uppercase font-semibold">{{ d.w }}</td><td class="pr-4" :title="d.h.toFixed(4)">{{ d.h.toFixed(2) }}</td><td class="pr-4">{{ d.nz }}</td><td>{{ d.mx }}</td></tr></tbody>
      </table></div>
    </UiCard>
    <UiAdvanced v-if="!isUA" :subtitle="$t('Opener pairs heatmap: first × second word')"><PairHeatmap /></UiAdvanced>
  </div>
</template>
