<script setup lang="ts">
import { t } from '../lib/i18n'
import { BEST_ID, NA } from '../lib/lang'
import { useWindowSize } from '@vueuse/core'
const { width: vw } = useWindowSize()
import { ref, computed, watch } from 'vue'
import VChart from 'vue-echarts'
import { Waves } from 'lucide-vue-next'
import '../lib/charts2'
import { baseC } from '../lib/charts'
import { fg } from '../lib/theme'
import { tile, chartPalette, danger } from '../lib/tokens'
import { loadFull, simReady, fullId, type Full } from '../lib/simdata'
import UiCard from './ui/UiCard.vue'; import UiButton from './ui/UiButton.vue'
import Skeleton from 'primevue/skeleton'
import { MonitorSmartphone } from 'lucide-vue-next'
import StrategyPicker from './StrategyPicker.vue'
const id = ref(BEST_ID), hard = ref(false), full = ref<Full | null>(null)
watch([id, hard], async () => { await simReady; full.value = await loadFull(fullId(id.value, hard.value)) }, { immediate: true })
const forceChart = ref(false)
const mobile = computed(() => vw.value < 640 && !forceChart.value)
// phone fallback: per guess number, how many answers are still open in each size class, plus where games end
const turns = computed(() => {
  if (!full.value) return []
  const out: { turn: number; total: number; groups: { k: string; n: number }[] }[] = []
  for (let i = 0; i < 6; i++) {
    const m = new Map<string, number>(); let total = 0
    full.value.sizes.forEach(sz => { if (sz[i] !== undefined) { const k = cls(sz[i]); m.set(k, (m.get(k) ?? 0) + 1); total++ } })
    if (total) out.push({ turn: i + 1, total, groups: order.filter(k => m.has(k)).map(k => ({ k, n: m.get(k)! })) })
  }
  return out
})
const ends = computed(() => (full.value ? [1, 2, 3, 4, 5, 6, 7].map(k => ({ k, n: full.value!.guesses.filter(g => (k === 7 ? g >= 7 : g === k)).length })).filter(x => x.n) : []))
const cls = (n: number) => (n === 1 ? '1 left' : n <= 5 ? '2–5' : n <= 20 ? '6–20' : n <= 100 ? '21–100' : '101+')
const order = ['101+', '21–100', '6–20', '2–5', '1 left']
const NA_N = computed(() => full.value?.guesses.length ?? 1)
const opt = computed(() => {
  if (!full.value || mobile.value) return null
  const SOLVED = t('Solved in')
  const links = new Map<string, number>(), nodes = new Set<string>()
  full.value.sizes.forEach((sz, i) => {
    const k = full.value!.guesses[i]
    const steps = sz.map((n, i2) => `${t('G')}${i2 + 1} · ${cls(n)}`)
    const end = `${SOLVED} ${k > 6 ? '7+' : k}`
    const seq = [...steps, end]
    seq.forEach(s => nodes.add(s))
    for (let t = 0; t + 1 < seq.length; t++) { const key = seq[t] + '>' + seq[t + 1]; links.set(key, (links.get(key) ?? 0) + 1) }
  })
  const color = (n: string) => n.startsWith(SOLVED) ? (n.endsWith('7+') ? danger : tile.correct) : chartPalette[order.indexOf(n.split(' · ')[1]) + 2] ?? tile.absent
  const sortKey = (n: string) => n.startsWith(SOLVED) ? 100 + parseInt(n.slice(SOLVED.length + 1)) : parseInt(n.slice(1)) * 10 + order.indexOf(n.split(' · ')[1])
  return {
    ...baseC.value, tooltip: { trigger: 'item', formatter: (i: any) => i.dataType === 'edge' ? `${i.data.source} → ${i.data.target}<br/><b>${i.data.value}</b> ${t('answers')}` : `${i.name}<br/><b>${i.value}</b> ${t('answers')}` },
    series: [{ type: 'sankey', left: 10, right: vw.value < 640 ? 64 : 110, top: 10, bottom: 10, nodeGap: 10, nodeAlign: 'justify', layoutIterations: 0, emphasis: { focus: 'adjacency' },
      data: [...nodes].sort((a, b) => sortKey(a) - sortKey(b)).map(n => ({ name: n, itemStyle: { color: color(n), borderWidth: 0 } })),
      links: [...links].map(([k, v]) => { const [source, target] = k.split('>'); return { source, target, value: v } }),
      lineStyle: { color: 'gradient', opacity: 0.35, curveness: 0.5 }, label: { color: fg.value, fontSize: vw.value < 640 ? 9 : 11, ...(vw.value < 640 ? { formatter: (x: any) => (x.value >= 60 || x.name.startsWith(SOLVED) ? x.name.replace(/^G(\d) · /, 'G$1 ').replace(SOLVED + ' ', '✓') : '') } : {}) } }],
  }
})
</script>
<template>
  <div class="flex flex-col gap-5">
    <UiCard :title="$t('Flow of {n} answers through the guesses', { n: NA })" :icon="Waves" :subtitle="$t('Each band is a group of answers. Columns = guess number; nodes = how many possible answers were left before that guess; right side = the guess that solved it.')">
      <StrategyPicker v-model:id="id" v-model:hard="hard" />
    </UiCard>
    <UiCard v-if="mobile" :title="$t('Flow as a list')" :subtitle="$t('The flow diagram works best on a wider screen. Here: before each guess, how many answers were still open, grouped by how many candidates were left.')" data-flow-list>
      <template #actions><UiButton :icon="MonitorSmartphone" variant="ghost" :label="$t('Chart')" @click="forceChart = true" /></template>
      <div v-if="full" class="flex flex-col gap-4 text-caption">
        <div v-for="tt in turns" :key="tt.turn"><div class="font-semibold mb-1">{{ $t('Guess {n}', { n: tt.turn }) }} · {{ $t('{n} answers', { n: tt.total }) }}</div>
          <div v-for="g in tt.groups" :key="g.k" class="flex items-center gap-2"><span class="w-16 text-muted">{{ g.k === '1 left' ? $t('1 left') : g.k }}</span><div class="flex-1 h-2 rounded-full bg-surface-2 overflow-hidden"><div class="h-full rounded-full bg-brand-500" :style="{ width: (100 * g.n) / NA_N + '%' }"></div></div><span class="w-10 text-right tabular-nums">{{ g.n }}</span></div></div>
        <div><div class="font-semibold mb-1">{{ $t('Solved in') }}</div>
          <div v-for="e in ends" :key="e.k" class="flex items-center gap-2"><span class="w-16 text-muted">{{ e.k === 7 ? '7+' : e.k }}</span><div class="flex-1 h-2 rounded-full bg-surface-2 overflow-hidden"><div class="h-full rounded-full" :class="e.k >= 7 ? 'bg-red-500' : 'bg-correct'" :style="{ width: (100 * e.n) / NA_N + '%' }"></div></div><span class="w-10 text-right tabular-nums">{{ e.n }}</span></div></div>
      </div>
      <div v-else class="flex flex-col gap-2" data-skeleton><Skeleton v-for="i in 6" :key="i" height="1.2rem" /></div>
    </UiCard>
    <UiCard v-else><VChart v-if="opt" :option="opt" style="height: 640px" autoresize /><Skeleton v-else height="640px" /></UiCard>
  </div>
</template>
