<script setup lang="ts">
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
import UiCard from './ui/UiCard.vue'
import StrategyPicker from './StrategyPicker.vue'
const id = ref(BEST_ID), hard = ref(false), full = ref<Full | null>(null)
watch([id, hard], async () => { await simReady; full.value = await loadFull(fullId(id.value, hard.value)) }, { immediate: true })
const cls = (n: number) => (n === 1 ? '1 left' : n <= 5 ? '2–5' : n <= 20 ? '6–20' : n <= 100 ? '21–100' : '101+')
const order = ['101+', '21–100', '6–20', '2–5', '1 left']
const opt = computed(() => {
  if (!full.value) return null
  const links = new Map<string, number>(), nodes = new Set<string>()
  full.value.sizes.forEach((sz, i) => {
    const k = full.value!.guesses[i]
    const steps = sz.map((n, t) => `G${t + 1} · ${cls(n)}`)
    const end = `Solved in ${k > 6 ? '7+' : k}`
    const seq = [...steps, end]
    seq.forEach(s => nodes.add(s))
    for (let t = 0; t + 1 < seq.length; t++) { const key = seq[t] + '>' + seq[t + 1]; links.set(key, (links.get(key) ?? 0) + 1) }
  })
  const color = (n: string) => n.startsWith('Solved') ? (n.endsWith('7+') ? danger : tile.correct) : chartPalette[order.indexOf(n.split(' · ')[1]) + 2] ?? tile.absent
  const sortKey = (n: string) => n.startsWith('Solved') ? 100 + parseInt(n.slice(10)) : parseInt(n.slice(1)) * 10 + order.indexOf(n.split(' · ')[1])
  return {
    ...baseC.value, tooltip: { trigger: 'item', formatter: (i: any) => i.dataType === 'edge' ? `${i.data.source} → ${i.data.target}<br/><b>${i.data.value}</b> answers` : `${i.name}<br/><b>${i.value}</b> answers` },
    series: [{ type: 'sankey', left: 10, right: vw.value < 640 ? 64 : 110, top: 10, bottom: 10, nodeGap: 10, nodeAlign: 'justify', layoutIterations: 0, emphasis: { focus: 'adjacency' },
      data: [...nodes].sort((a, b) => sortKey(a) - sortKey(b)).map(n => ({ name: n, itemStyle: { color: color(n), borderWidth: 0 } })),
      links: [...links].map(([k, v]) => { const [source, target] = k.split('>'); return { source, target, value: v } }),
      lineStyle: { color: 'gradient', opacity: 0.35, curveness: 0.5 }, label: { color: fg.value, fontSize: vw.value < 640 ? 9 : 11, ...(vw.value < 640 ? { formatter: (x: any) => (x.value >= 60 || /Solved/.test(x.name) ? x.name.replace(/^G(\d) · /, 'G$1 ').replace('Solved in ', '✓') : '') } : {}) } }],
  }
})
</script>
<template>
  <div class="flex flex-col gap-5">
    <UiCard :title="`Flow of ${NA} answers through the guesses`" :icon="Waves" subtitle="Each band is a group of answers. Columns = guess number; nodes = how many possible answers were left before that guess; right side = the guess that solved it.">
      <StrategyPicker v-model:id="id" v-model:hard="hard" />
    </UiCard>
    <UiCard><VChart v-if="opt" :option="opt" style="height: 640px" autoresize /></UiCard>
  </div>
</template>
