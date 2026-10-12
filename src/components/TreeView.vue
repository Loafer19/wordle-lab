<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useWindowSize } from '@vueuse/core'
import VChart from 'vue-echarts'
import SelectButton from 'primevue/selectbutton'
import Slider from 'primevue/slider'
import { Network, Maximize2 } from 'lucide-vue-next'
import '../lib/charts2'
import { baseC } from '../lib/charts'
import { fg } from '../lib/theme'
import { tile } from '../lib/tokens'
import { loadFull, simReady, fullId } from '../lib/simdata'
import { patternDigits } from '../lib/wordle'
import type { TreeNode } from '../lib/advanced'
import UiCard from './ui/UiCard.vue'; import UiBadge from './ui/UiBadge.vue'
import StrategyPicker from './StrategyPicker.vue'
const id = ref('optimal'), hard = ref(false), layout = ref<'orthogonal' | 'radial'>('orthogonal')
const tree = ref<TreeNode | null>(null)
watch([id, hard], async () => { await simReady; tree.value = (await loadFull(fullId(id.value, hard.value))).tree }, { immediate: true })
const sq = (p: number) => patternDigits(p).map(d => `{${'apc'[d]}|}`).join('')
const { width: vw } = useWindowSize()
const topN = ref(vw.value < 640 ? 16 : 24)
function conv(n: TreeNode, p: number | null, depth: number): any {
  const kids = Object.entries(n.c ?? {}).map(([k, v]) => [+k, v] as const).sort((a, b) => b[1].n - a[1].n)
  let children = kids.map(([k, v]) => conv(v, k, depth + 1))
  // Level 1 has ~150 branches: keep the biggest topN, fold the rest into one expandable "smaller branches" node (labels would overlap otherwise).
  if (depth === 0 && kids.length > topN.value) {
    const rest = kids.slice(topN.value), m = rest.reduce((t, [, v]) => t + v.n, 0)
    children = children.slice(0, topN.value)
    children.push({ name: `+${rest.length} smaller`, value: m, pattern: null, other: rest.map(([k, v]) => `${patternDigits(k).map(d => '⬛🟨🟩'[d]).join('')} ${v.g.toUpperCase()} (${v.n})`),
      symbol: 'roundRect', symbolSize: 10, itemStyle: { color: tile.present, borderColor: tile.present }, 
      label: { formatter: () => (vw.value < 640 ? `{w|+${rest.length} more}` : `{w|+${rest.length} smaller branches}  ${m}  (click to show all)`) } })
  }
  return {
    name: n.g, value: n.n, pattern: p, symbolSize: depth === 0 ? 26 : Math.min(24, 5 + Math.sqrt(n.n) * 1.3),
    label: { ...(depth === 0 && vw.value < 640 ? { position: 'top', align: 'center', distance: 8 } : {}), formatter: () => (p === null ? `{w|${n.g.toUpperCase()}}  ${n.n}` : `${sq(p)} {w|${n.g.toUpperCase()}} ${n.n}`) },
    children,
  }
}
const data = computed(() => (tree.value ? conv(tree.value, null, 0) : null))
const rich = computed(() => ({ a: { width: 7, height: 9, backgroundColor: tile.absent, borderRadius: 1 }, p: { width: 7, height: 9, backgroundColor: tile.present, borderRadius: 1 }, c: { width: 7, height: 9, backgroundColor: tile.correct, borderRadius: 1 }, w: { fontWeight: 'bold', color: fg.value, fontFamily: 'monospace' } }))
const opt = computed(() => data.value && ({
  ...baseC.value, tooltip: { trigger: 'item', formatter: (i: any) => i.data.other ? `<b>${i.data.other.length} smaller branches</b> (${i.value} answers) — click to list them all<br/><span style="font-size:11px">${i.data.other.slice(0, 40).join('<br/>')}${i.data.other.length > 40 ? '<br/>…' : ''}</span>` : `<b>${i.name.toUpperCase()}</b><br/>${i.value} possible answers reach this node` },
  series: [{ type: 'tree', data: [data.value], layout: layout.value, top: 20, bottom: 20, left: layout.value === 'radial' ? 20 : vw.value < 640 ? 46 : 110, right: layout.value === 'radial' ? 20 : vw.value < 640 ? 118 : 220, roam: true, initialTreeDepth: 1,
    expandAndCollapse: true, animationDurationUpdate: 450, itemStyle: { color: tile.correct, borderColor: tile.correct }, lineStyle: { color: fg.value, opacity: 0.25, curveness: 0.5 },
    label: { position: 'left', verticalAlign: 'middle', align: 'right', fontSize: vw.value < 640 ? 9 : 11, color: fg.value, rich: rich.value }, leaves: { label: { position: 'right', align: 'left' } }, emphasis: { focus: 'descendant' } }],
}))
function onClick(e: any) { if (e.data?.other) topN.value = 200 }
const height = computed(() => (layout.value === 'radial' ? 800 : Math.max(560, (Math.min(topN.value, children.value) + 1) * 22)))
const children = computed((): number => Object.keys(tree.value?.c ?? {}).length)
</script>
<template>
  <div class="flex flex-col gap-5">
    <UiCard title="Interactive decision tree" :icon="Network" subtitle="Click a node to expand/collapse. Branches are colour patterns, node size = number of possible answers reaching it. Scroll to zoom, drag to pan.">
      <div class="flex flex-wrap items-center gap-3">
        <StrategyPicker v-model:id="id" v-model:hard="hard" />
        <SelectButton v-model="layout" :options="['orthogonal', 'radial']" :allowEmpty="false" size="small" />
        <UiBadge v-if="tree" tone="brand">opener {{ tree.g.toUpperCase() }} · {{ children }} branches</UiBadge>
        <label class="flex items-center gap-2 text-caption text-muted">Label top {{ Math.min(topN, children) }}<Slider v-model="topN" :min="8" :max="160" class="w-28" /></label>
        <span class="text-caption text-muted flex items-center gap-1"><Maximize2 :size="12" />roam enabled</span>
      </div>
    </UiCard>
    <UiCard><VChart v-if="opt" :option="opt" @click="onClick" :style="{ height: height + 'px' }" autoresize /></UiCard>
  </div>
</template>
