<script setup lang="ts">
import { t } from '../lib/i18n'
import { BEST_ID, META, lang } from '../lib/lang'
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { useWindowSize, useLocalStorage } from '@vueuse/core'
import InputText from 'primevue/inputtext'
import ProgressBar from 'primevue/progressbar'
import { RotateCcw, Play } from 'lucide-vue-next'
import { allowed, answers, ready } from '../lib/words'
import { customs } from '../lib/custom'
import { workerStrategies } from '../lib/watchAll'
import { validateOpener, followId, OPENER_ERROR_TEXT, FALLBACK_FOLLOW, type OpenerTree } from '../lib/opener'
import { shortName } from '../lib/names'
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
import UiCard from './ui/UiCard.vue'; import UiBadge from './ui/UiBadge.vue'; import UiButton from './ui/UiButton.vue'
import TreeBranch from './TreeBranch.vue'
import Skeleton from 'primevue/skeleton'
import { MonitorSmartphone } from 'lucide-vue-next'
import StrategyPicker from './StrategyPicker.vue'
import { isTreeId } from '../lib/lookahead'
const id = ref(BEST_ID), hard = ref(false), layout = ref<'orthogonal' | 'radial'>('orthogonal')
const defaultTree = ref<TreeNode | null>(null), defaultGuesses = ref<number[]>([])
watch([id, hard], async () => { await simReady; const f = await loadFull(fullId(id.value, hard.value)); defaultTree.value = f.tree; defaultGuesses.value = f.guesses ?? [] }, { immediate: true })

// ---- custom opener: the precomputed tree only covers the strategy's own opener, so "opener X, then strategy S" is simulated in a worker ----
const savedOpener = useLocalStorage(`wl-tree-opener-${lang}`, '')
const openerInput = ref(savedOpener.value.toUpperCase())
const allowedSet = computed(() => new Set(allowed.value))
const check = computed(() => validateOpener(openerInput.value, allowedSet.value, META.letters))
const openerErr = computed(() => (openerInput.value && !check.value.ok && allowed.value.length ? t(OPENER_ERROR_TEXT[check.value.error!], { w: check.value.word.toUpperCase() }) : ''))
const follow = computed(() => followId(id.value, k => workerStrategies().some(s => s.id === k)))
const followName = computed(() => (follow.value.startsWith('custom:') ? customs.value.find(c => c.id === follow.value)?.name ?? follow.value : shortName(follow.value)))
/** the saved opener is used only when it is valid and differs from the strategy's own opener */
const opener = computed(() => { const c = validateOpener(savedOpener.value, allowedSet.value, META.letters); return c.ok && defaultTree.value && c.word !== defaultTree.value.g ? c.word : '' })
const custom = ref<OpenerTree | null>(null), busy = ref(false), progress = ref(0)
const results = new Map<string, OpenerTree>()
let worker: Worker | null = null, job = 0
function stop() { worker?.terminate(); worker = null; busy.value = false }
watch([opener, follow, hard], async () => {
  stop(); custom.value = null
  if (!opener.value) return
  const key = `${opener.value}|${follow.value}|${hard.value}`
  if (results.has(key)) { custom.value = results.get(key)!; return }
  await ready
  const my = ++job, spec = customs.value.find(c => c.id === follow.value)
  busy.value = true; progress.value = 0
  worker = new Worker(new URL('../lib/opener.worker.ts', import.meta.url), { type: 'module' })
  worker.onmessage = e => {
    if (e.data.job !== my) return
    if (e.data.type === 'progress') progress.value = e.data.p
    else { results.set(key, e.data.result); custom.value = e.data.result; stop() }
  }
  worker.postMessage({ job: my, opener: opener.value, follow: follow.value, spec: spec ? JSON.parse(JSON.stringify(spec)) : undefined, answers: [...answers.value], allowed: [...allowed.value], hard: hard.value })
}, { immediate: true })
onBeforeUnmount(stop)
function applyOpener() { if (check.value.ok) { savedOpener.value = check.value.word; openerInput.value = check.value.word.toUpperCase() } }
function resetOpener() { savedOpener.value = ''; openerInput.value = '' }
const tree = computed<TreeNode | null>(() => (opener.value ? custom.value?.tree ?? null : defaultTree.value))
// stats: default (from the precomputed per-answer guesses) vs custom opener
const statsOf = (g: number[]) => { if (!g.length) return null; const dist = [1, 2, 3, 4, 5, 6].map(k => g.filter(x => x === k).length); return { avg: g.reduce((a, b) => a + b, 0) / g.length, worst: Math.max(...g), dist, fail: g.length - dist.reduce((a, b) => a + b, 0) } }
const defStats = computed(() => statsOf(defaultGuesses.value))
const cusStats = computed(() => custom.value && { avg: custom.value.avg, worst: custom.value.worst, dist: [1, 2, 3, 4, 5, 6].map(k => custom.value!.dist[k] ?? 0), fail: custom.value.dist.slice(7).reduce((a, b) => a + b, 0) })
const statRows = computed(() => [
  ...(defStats.value && defaultTree.value ? [{ k: 'def', label: t('Default'), w: defaultTree.value.g, s: defStats.value }] : []),
  ...(cusStats.value ? [{ k: 'cus', label: t('Your opener'), w: opener.value, s: cusStats.value }] : []),
])
const delta = computed(() => (defStats.value && cusStats.value ? cusStats.value.avg - defStats.value.avg : null))
const sq = (p: number) => patternDigits(p).map(d => `{${'apc'[d]}|}`).join('')
const { width: vw } = useWindowSize()
const topN = ref(vw.value < 640 ? 16 : 24)
const forceChart = ref(false)
const mobile = computed(() => vw.value < 640 && !forceChart.value)
function conv(n: TreeNode, p: number | null, depth: number): any {
  const kids = Object.entries(n.c ?? {}).map(([k, v]) => [+k, v] as const).sort((a, b) => b[1].n - a[1].n)
  let children = kids.map(([k, v]) => conv(v, k, depth + 1))
  // Level 1 has ~150 branches: keep the biggest topN, fold the rest into one expandable "smaller branches" node (labels would overlap otherwise).
  if (depth === 0 && kids.length > topN.value) {
    const rest = kids.slice(topN.value), m = rest.reduce((t, [, v]) => t + v.n, 0)
    children = children.slice(0, topN.value)
    children.push({ name: `+${rest.length} smaller`, value: m, pattern: null, other: rest.map(([k, v]) => `${patternDigits(k).map(d => '⬛🟨🟩'[d]).join('')} ${v.g.toUpperCase()} (${v.n})`),
      symbol: 'roundRect', symbolSize: 10, itemStyle: { color: tile.present, borderColor: tile.present }, 
      label: { formatter: () => (vw.value < 640 ? `{w|${t('+{n} more', { n: rest.length })}}` : `{w|${t('+{n} smaller branches', { n: rest.length })}}  ${m}  ${t('(click to show all)')}`) } })
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
  ...baseC.value, tooltip: { trigger: 'item', formatter: (i: any) => i.data.other ? `<b>${t('{n} smaller branches', { n: i.data.other.length })}</b> (${i.value} ${t('answers')}) — ${t('click to list them all')}<br/><span style="font-size:11px">${i.data.other.slice(0, 40).join('<br/>')}${i.data.other.length > 40 ? '<br/>…' : ''}</span>` : `<b>${i.name.toUpperCase()}</b><br/>${t('{n} possible answers reach this node', { n: i.value })}` },
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
    <UiCard :title="$t('Interactive decision tree')" :icon="Network" :subtitle="$t('Click a node to expand/collapse. Branches are colour patterns, node size = number of possible answers reaching it. Scroll to zoom, drag to pan.')">
      <div class="flex flex-wrap items-center gap-3">
        <StrategyPicker v-model:id="id" v-model:hard="hard" />
        <SelectButton v-if="!mobile" v-model="layout" :options="[{ v: 'orthogonal', l: $t('orthogonal') }, { v: 'radial', l: $t('radial') }]" optionLabel="l" optionValue="v" :allowEmpty="false" size="small" />
        <UiBadge v-if="tree" tone="brand">{{ $t('opener') }} {{ tree.g.toUpperCase() }} · {{ $t('{n} branches', { n: children }) }}</UiBadge>
        <label v-if="!mobile" class="flex items-center gap-2 text-caption text-muted">{{ $t('Label top {n}', { n: Math.min(topN, children) }) }}<Slider v-model="topN" :min="8" :max="160" class="w-28" /></label>
        <span v-if="!mobile" class="text-caption text-muted flex items-center gap-1"><Maximize2 :size="12" />{{ $t('roam enabled') }}</span>
      </div>
      <div class="flex flex-col gap-2 mt-4 pt-4 border-t border-line" data-tree-opener-box>
        <form class="flex flex-wrap items-center gap-2" @submit.prevent="applyOpener">
          <label for="tree-opener" class="text-body font-medium">{{ $t('Starting word') }}</label>
          <InputText id="tree-opener" v-model="openerInput" maxlength="5" size="small" autocomplete="off" spellcheck="false" :placeholder="defaultTree?.g.toUpperCase()" :invalid="!!openerErr" class="w-28 uppercase font-mono tracking-widest" data-tree-opener />
          <UiButton :icon="Play" :label="$t('Build tree')" :disabled="!check.ok || check.word === opener" @click="applyOpener" data-tree-opener-apply />
          <UiButton :icon="RotateCcw" :label="$t('Reset to {w}', { w: defaultTree?.g.toUpperCase() ?? '…' })" variant="secondary" :disabled="!opener && !openerInput" @click="resetOpener" data-tree-opener-reset />
          <span v-if="openerErr" class="text-caption text-red-600 dark:text-red-400" role="alert" data-tree-opener-error>{{ openerErr }}</span>
        </form>
        <p class="text-caption text-muted">
          <template v-if="opener">{{ $t('Tree for your opener {w}; every next move is chosen by {s}.', { w: opener.toUpperCase(), s: followName }) }} <template v-if="follow === FALLBACK_FOLLOW && isTreeId(id)">{{ $t('The precomputed optimal tree only covers its own opener, so after a custom opener the next moves use max entropy (computed in your browser).') }}</template></template>
          <template v-else>{{ $t('Type any allowed 5-letter word to see the tree with your own first guess (computed in your browser).') }}</template>
        </p>
        <div v-if="busy" class="flex items-center gap-3" data-tree-opener-progress><ProgressBar :value="Math.round(progress * 100)" :showValue="false" class="flex-1 !h-2" /><span class="text-caption text-muted tabular-nums">{{ $t('Computing the tree…') }} {{ Math.round(progress * 100) }}%</span></div>
        <div v-if="opener && statRows.length" class="overflow-x-auto" data-tree-opener-stats>
          <table class="text-caption tabular-nums w-full max-w-2xl">
            <thead><tr class="text-muted text-left"><th class="font-medium pr-3 py-1"></th><th class="font-medium pr-3">{{ $t('opener') }}</th><th class="font-medium pr-3">{{ $t('Average guesses') }}</th><th class="font-medium pr-3">{{ $t('Worst') }}</th><th v-for="k in 6" :key="k" class="font-medium px-1 text-center">{{ k }}</th><th class="font-medium px-1 text-center">7+</th></tr></thead>
            <tbody>
              <tr v-for="r in statRows" :key="r.k" class="border-t border-line" :data-tree-stat-row="r.k">
                <td class="pr-3 py-1 text-muted">{{ r.label }}</td><td class="pr-3 font-mono font-bold uppercase">{{ r.w }}</td>
                <td class="pr-3 font-semibold">{{ r.s.avg.toFixed(4) }}<span v-if="r.k === 'cus' && delta !== null" class="ml-1.5" :class="delta > 1e-9 ? 'text-red-600 dark:text-red-400' : 'text-correct'">{{ delta > 0 ? '+' : delta < 0 ? '−' : '±' }}{{ Math.abs(delta).toFixed(4) }}</span></td>
                <td class="pr-3">{{ r.s.worst }}</td>
                <td v-for="(c, i) in r.s.dist" :key="i" class="px-1 text-center">{{ c }}</td><td class="px-1 text-center" :class="r.s.fail > 0 && 'text-red-600 dark:text-red-400'">{{ r.s.fail }}</td>
              </tr>
            </tbody>
          </table>
          <p v-if="custom" class="text-caption text-muted mt-1">{{ $t('Computed over all {n} answers in {s} s.', { n: answers.length, s: (custom.ms / 1000).toFixed(1) }) }}</p>
        </div>
      </div>
    </UiCard>
    <UiCard v-if="mobile" :title="$t('Tree as a list')" :subtitle="$t('The interactive tree works best on a wider screen. Tap a branch to see what the strategy plays next.')" data-tree-list>
      <template #actions><UiButton :icon="MonitorSmartphone" variant="ghost" :label="$t('Chart')" @click="forceChart = true" /></template>
      <ul v-if="tree" class="text-body"><TreeBranch :node="tree" :open="true" /></ul>
      <div v-else class="flex flex-col gap-2" data-skeleton><Skeleton v-for="i in 6" :key="i" height="1.8rem" /></div>
    </UiCard>
    <UiCard v-else><VChart v-if="opt" :key="tree?.g" :option="opt" @click="onClick" :style="{ height: height + 'px' }" autoresize /><Skeleton v-else height="560px" /></UiCard>
  </div>
</template>
