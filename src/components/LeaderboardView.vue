<script setup lang="ts">
// Strategies › Leaderboard: one table for every strategy (avg, gap to the proven optimum, fail rate, worst case) with a
// normal / hard / both toggle. Tick two rows → Compare. More charts and re-running simulations live in collapsed sections.
import { ref, computed, watch } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import VChart from 'vue-echarts'
import SelectButton from 'primevue/selectbutton'; import MultiSelect from 'primevue/multiselect'; import ProgressBar from 'primevue/progressbar'; import Skeleton from 'primevue/skeleton'
import { Trophy, GitCompare, Cpu, X } from 'lucide-vue-next'
import { lang, isUA, NA, NV } from '../lib/lang'
import { OPTIMA, gapTo } from '../lib/optimum'
import { simIndex, type Summary } from '../lib/simdata'
import { allStrategies } from '../lib/allStrategies'
import { shortName, baseId, GROUPS, groupOf, blurb, type Group } from '../lib/names'
import { compareSel } from '../lib/shared'
import { go } from '../lib/route'
import { idbGet, idbSet } from '../lib/idbcache'
import { baseC } from '../lib/charts'
import { tile, otherColor, ruslanColor } from '../lib/tokens'
import { answers, allowed } from '../lib/words'
import { STRATEGIES, type SimResult } from '../lib/wordle'
import { STAGED_STRATEGIES } from '../lib/staged'
import { t } from '../lib/i18n'
import UiCard from './ui/UiCard.vue'; import UiButton from './ui/UiButton.vue'; import UiBadge from './ui/UiBadge.vue'; import UiAdvanced from './ui/UiAdvanced.vue'
const O = OPTIMA[lang]
const mode = useLocalStorage<'normal' | 'hard' | 'both'>('wl-board-mode', 'normal')
const grouped = useLocalStorage('wl-board-grouped', true)
const layouts = [{ v: true, l: t('By type') }, { v: false, l: t('Ranked') }]
const modes = [{ v: 'normal', l: t('Normal') }, { v: 'hard', l: t('Hard') }, { v: 'both', l: t('Both') }]
// re-run results (Web Workers) override the precomputed normal-mode numbers; cached in IndexedDB per language + word list size
const reruns = ref<Record<string, SimResult>>({}), progress = ref<Record<string, number>>({})
const cacheKey = (id: string) => `sim:${lang}:${answers.value.length}:${id}`
const SIM_STRATS = [...STAGED_STRATEGIES, ...STRATEGIES].map(s => ({ id: s.id, name: shortName(s.id, t(s.name)) }))
const selected = ref(SIM_STRATS.map(s => s.id))
watch(() => answers.value.length, async n => { if (!n) return; for (const s of SIM_STRATS) { const r = await idbGet<SimResult>(cacheKey(s.id)); if (r) reruns.value[s.id] = r } }, { immediate: true })
function rerun() {
  for (const id of selected.value) {
    const w = new Worker(new URL('../lib/sim.worker.ts', import.meta.url), { type: 'module' })
    progress.value[id] = 0
    w.onmessage = e => { if (e.data.type === 'progress') progress.value[id] = e.data.p; else { reruns.value[id] = e.data.result; idbSet(cacheKey(id), JSON.parse(JSON.stringify(e.data.result))); delete progress.value[id]; w.terminate() } }
    w.postMessage({ id, answers: [...answers.value], allowed: [...allowed.value] })
  }
}
const descOf = (id: string) => { const s = allStrategies.value.find(x => x.id === baseId(id)); return s ? `${s.name} — ${s.desc}` : '' }
interface Row { id: string; name: string; full: string; blurb: string; group: Group; rank: number; opener: string; n: Summary; h?: Summary; cached: boolean }
const rows = computed<Row[]>(() => {
  const norm = simIndex.value.filter(s => s.mode === 'normal').map(s => { const r = reruns.value[s.id]; return r ? { ...s, avg: r.avg, failRate: r.failRate, worst: r.worst, dist: r.dist } : s })
  const out = norm.map(n => ({ id: n.id, name: shortName(n.id, n.name), full: descOf(n.id), blurb: blurb(n.id), group: groupOf(n.id), rank: 0, opener: n.opener, n, h: simIndex.value.find(x => x.id === n.id + '@hard'), cached: !!reruns.value[n.id] }))
  const key = (r: Row) => (mode.value === 'hard' ? r.h?.avg ?? 99 : r.n.avg)
  const gi = (r: Row) => GROUPS.findIndex(g => g.id === r.group)
  // equal averages share a rank (the 2-ply lookahead ties the optimal tree); ties list in group order
  const sorted = out.sort((a, b) => key(a) - key(b) || gi(a) - gi(b) || a.name.localeCompare(b.name))
  return sorted.map(r => ({ ...r, rank: 1 + sorted.filter(x => key(x) < key(r) - 1e-9).length }))
})
// grouped by type (Optimal trees / Lookahead / Greedy / …), each group sorted by the same key; or one ranked list
const sections = computed(() => grouped.value ? GROUPS.map(g => ({ id: g.id, label: t(g.label), rows: rows.value.filter(r => r.group === g.id) })).filter(g => g.rows.length) : [{ id: 'all', label: '', rows: rows.value }])
const cols = computed(() => 3 + (mode.value === 'both' ? 8 : 4))
const gap = (s: Summary | undefined, hard: boolean) => (s ? gapTo(s.avg, lang, hard) : NaN)
const maxGap = computed(() => Math.max(0.05, ...rows.value.map(r => gap(mode.value === 'hard' ? r.h : r.n, mode.value === 'hard')).filter(Number.isFinite)))
const tone = (g: number) => (g < 0.001 ? 'correct' : g < 0.1 ? 'brand' : g < 0.25 ? 'present' : 'danger') as any
const primary = (r: Row) => (mode.value === 'hard' ? r.h : r.n)
// selection → compare
const picked = ref<string[]>([])
const toggle = (id: string) => { const p = picked.value; picked.value = p.includes(id) ? p.filter(x => x !== id) : [...p, id].slice(-2) }
function compare() {
  if (picked.value.length !== 2) return
  const h = mode.value === 'hard'
  compareSel.value = { a: picked.value[0], b: picked.value[1], hardA: h, hardB: h }
  go('strategies', 'compare')
}
// more charts (collapsed)
const chartRows = computed(() => (picked.value.length ? rows.value.filter(r => picked.value.includes(r.id)) : rows.value.slice(0, 5)))
const d7 = (d: number[]) => [1, 2, 3, 4, 5, 6].map(i => d[i] ?? 0).concat(d.slice(7).reduce((a, b) => a + b, 0))
const distOpt = computed(() => ({ ...baseC.value, legend: { ...baseC.value.legend, top: 0 }, grid: { top: 50, left: 50, right: 20 }, xAxis: { type: 'category', data: ['1', '2', '3', '4', '5', '6', '7+'] }, yAxis: { type: 'value' }, series: chartRows.value.map(r => ({ type: 'bar', name: r.name, data: d7(r.n.dist) })) }))
const shrinkOpt = computed(() => ({ ...baseC.value, legend: { ...baseC.value.legend, top: 0 }, grid: { top: 50, left: 50, right: 20 }, xAxis: { type: 'category', data: [1, 2, 3, 4, 5, 6].map(i => t('turn {n}', { n: i })) }, yAxis: { type: 'log', min: 0.01 },
  series: chartRows.value.map(r => ({ type: 'line', name: r.name, data: r.n.avgSizes.slice(0, 6).map(v => +Math.max(v, 0.01).toFixed(2)) })) }))
const gapOpt = computed(() => ({ ...baseC.value, legend: { ...baseC.value.legend, top: 0 }, grid: { left: 10, right: 40, top: 40, bottom: 20, containLabel: true }, tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  xAxis: { type: 'value', name: t('gap to optimum (guesses)') }, yAxis: { type: 'category', data: rows.value.map(r => r.name).reverse() },
  series: [
    { type: 'bar', name: t('Normal (optimum {v})', { v: O.normal.toFixed(4) }), data: rows.value.map(r => +gap(r.n, false).toFixed(4)).reverse(), itemStyle: { color: otherColor, borderRadius: [0, 4, 4, 0] } },
    { type: 'bar', name: t('Hard (optimum {v})', { v: O.hard.toFixed(4) }), data: rows.value.map(r => +(gap(r.h, true) || 0).toFixed(4)).reverse(), itemStyle: { color: ruslanColor, borderRadius: [0, 4, 4, 0] } },
  ] }))
const f3 = (v?: number) => (v === undefined ? '—' : v.toFixed(3))
const fail = (s?: Summary) => (s ? (s.failRate * 100).toFixed(2) + '%' : '—')
</script>
<template>
  <div class="flex flex-col gap-5" data-leaderboard>
    <UiCard :title="$t('Strategy leaderboard')" :icon="Trophy" :subtitle="isUA ? $t('UA optimal decision trees from our exact search: {a} normal (КОТРА), {b} hard ({h}). Hard mode: revealed hints must be reused.', { a: O.normal.toFixed(4), b: O.hard.toFixed(4), h: O.hardOpener }) : $t('Optimal decision trees: {a} normal, {b} hard (SALET; Selby, Bertsimas & Paskov). Hard mode: revealed hints must be reused.', { a: O.normal.toFixed(4), b: O.hard.toFixed(4) })">
      <div class="flex flex-wrap items-center gap-2 mb-4">
        <SelectButton v-model="mode" :options="modes" optionLabel="l" optionValue="v" :allowEmpty="false" size="small" data-board-mode />
        <SelectButton v-model="grouped" :options="layouts" optionLabel="l" optionValue="v" :allowEmpty="false" size="small" data-board-layout />
        <div class="flex-1"></div>
        <span class="text-caption text-muted" data-compare-hint>{{ picked.length === 2 ? picked.map(id => rows.find(r => r.id === id)?.name).join(' vs ') : $t('Tick two rows to compare them') }}</span>
        <UiButton v-if="picked.length" :icon="X" variant="ghost" :ariaLabel="$t('Clear selection')" @click="picked = []" />
        <UiButton :icon="GitCompare" :label="$t('Compare')" :disabled="picked.length !== 2" @click="compare" data-compare-open />
      </div>
      <div v-if="!rows.length" class="flex flex-col gap-2" data-skeleton><Skeleton v-for="i in 8" :key="i" height="1.6rem" /></div>
      <template v-else>
        <!-- desktop / tablet: table -->
        <div class="hidden sm:block overflow-x-auto"><table class="text-caption w-full" data-board-table>
          <thead><tr class="text-muted text-left">
            <th class="w-12"></th><th class="py-1 pr-3 font-medium">{{ $t('Strategy') }}</th><th class="pr-3 font-medium">{{ $t('Opener') }}</th>
            <template v-if="mode !== 'hard'"><th class="pr-3 font-medium">{{ mode === 'both' ? $t('Normal avg') : $t('Avg') }}</th><th class="pr-3 font-medium min-w-32">{{ $t('gap') }}</th><th class="pr-3 font-medium">{{ $t('fail') }}</th><th class="pr-3 font-medium">{{ $t('worst') }}</th></template>
            <template v-if="mode !== 'normal'"><th class="pr-3 font-medium">{{ $t('Hard avg') }}</th><th class="pr-3 font-medium" :class="mode === 'hard' && 'min-w-32'">{{ $t('gap') }}</th><th class="pr-3 font-medium">{{ $t('fail') }}</th><th class="font-medium">{{ $t('worst') }}</th></template>
          </tr></thead>
          <tbody v-for="sec in sections" :key="sec.id" :data-board-group="sec.id">
            <tr v-if="sec.label" class="border-t border-line"><td :colspan="cols" class="pt-3 pb-1 text-caption font-semibold uppercase tracking-wide text-muted" data-board-group-title>{{ sec.label }}</td></tr>
            <tr v-for="r in sec.rows" :key="r.id" class="border-t border-line hover:bg-surface-2 transition-colors cursor-pointer" :class="picked.includes(r.id) && 'bg-brand-500/8'" @click="toggle(r.id)" data-board-row :data-id="r.id">
            <td class="py-1.5 pr-2 whitespace-nowrap"><input type="checkbox" class="accent-brand-600 size-4 align-middle" :checked="picked.includes(r.id)" :aria-label="$t('Select {s} for comparison', { s: r.name })" @click.stop="toggle(r.id)" /><span class="inline-block w-6 text-right text-muted tabular-nums align-middle" v-tooltip.top="$t('Rank by average')">{{ r.rank }}</span></td>
            <td class="py-1.5 pr-3"><span v-tooltip.top="r.full" class="cursor-help font-medium">{{ r.name }}</span><UiBadge v-if="r.cached" tone="neutral" class="ml-1.5" v-tooltip.top="$t('Re-run in this browser (cached)')">↻</UiBadge><div v-if="r.blurb" class="text-muted leading-snug max-w-md" data-board-blurb>{{ r.blurb }}</div></td>
            <td class="pr-3 font-mono uppercase font-semibold">{{ r.opener }}</td>
            <template v-if="mode !== 'hard'">
              <td class="pr-3 tabular-nums font-semibold">{{ f3(r.n.avg) }}</td>
              <td class="pr-3"><span class="flex items-center gap-2"><span class="h-1.5 rounded-full bg-surface-2 w-16 overflow-hidden"><span class="block h-full rounded-full" :class="gap(r.n, false) < 0.001 ? 'bg-correct' : 'bg-brand-500'" :style="{ width: Math.min(100, (100 * gap(r.n, false)) / maxGap) + '%' }"></span></span><UiBadge :tone="tone(gap(r.n, false))">+{{ gap(r.n, false).toFixed(3) }}</UiBadge></span></td>
              <td class="pr-3 tabular-nums">{{ fail(r.n) }}</td><td class="pr-3">{{ r.n.worst }}</td>
            </template>
            <template v-if="mode !== 'normal'">
              <template v-if="r.h"><td class="pr-3 tabular-nums font-semibold">{{ f3(r.h.avg) }}</td><td class="pr-3"><UiBadge :tone="tone(gap(r.h, true))">+{{ gap(r.h, true).toFixed(3) }}</UiBadge></td><td class="pr-3 tabular-nums">{{ fail(r.h) }}</td><td>{{ r.h.worst }}</td></template>
              <td v-else colspan="4" class="text-muted">—</td>
            </template>
          </tr></tbody>
        </table></div>
        <!-- phone: cards -->
        <div class="sm:hidden flex flex-col gap-2" data-board-cards>
          <template v-for="sec in sections" :key="sec.id"><h4 v-if="sec.label" class="text-caption font-semibold uppercase tracking-wide text-muted mt-2">{{ sec.label }}</h4>
          <ul class="flex flex-col gap-2"><li v-for="r in sec.rows" :key="r.id" class="rounded-card border p-3 flex flex-col gap-1.5 cursor-pointer transition-colors" :class="picked.includes(r.id) ? 'border-brand-500 bg-brand-500/8' : 'border-line'" @click="toggle(r.id)" data-board-card>
            <div class="flex items-center gap-2"><input type="checkbox" class="accent-brand-600 size-4 shrink-0" :checked="picked.includes(r.id)" :aria-label="$t('Select {s} for comparison', { s: r.name })" @click.stop="toggle(r.id)" />
              <span class="text-caption text-muted w-5">{{ r.rank }}</span><b class="flex-1 min-w-0 truncate">{{ r.name }}</b><span class="font-mono uppercase text-caption font-semibold">{{ r.opener }}</span></div>
            <div v-if="primary(r)" class="flex flex-wrap items-center gap-x-3 gap-y-1 text-caption pl-6">
              <span class="text-title font-extrabold tabular-nums">{{ f3(primary(r)!.avg) }}</span>
              <UiBadge :tone="tone(gap(primary(r), mode === 'hard'))">+{{ gap(primary(r), mode === 'hard').toFixed(3) }}</UiBadge>
              <span class="text-muted">{{ $t('fail') }} {{ fail(primary(r)) }}</span><span class="text-muted">{{ $t('worst') }} {{ primary(r)!.worst }}</span>
            </div>
            <div v-if="mode === 'both' && r.h" class="text-caption text-muted pl-6">{{ $t('Hard avg') }} <b class="text-fg tabular-nums">{{ f3(r.h.avg) }}</b> · +{{ gap(r.h, true).toFixed(3) }}</div>
            <p class="text-caption text-muted pl-6 line-clamp-2">{{ r.blurb || r.full }}</p>
          </li></ul>
          </template>
        </div>
      </template>
      <p class="text-caption text-muted mt-3">{{ $t('Hover a strategy name for its full description.') }} {{ $t('The opener column is the first word each strategy plays; fixed-opener rows (SALET / КОТРА) make like-for-like comparisons.') }} {{ $t('Candidate-only strategies are automatically hard-mode legal, so their hard numbers equal normal ones.') }} <span class="inline-block size-2 rounded-full align-middle" :style="{ background: tile.correct }"></span> {{ $t('= optimal.') }}</p>
    </UiCard>
    <UiAdvanced :title="$t('More charts')" :subtitle="$t('Gap chart, guess-count distribution and candidates per turn (ticked rows, or the top 5)')">
      <UiCard :title="$t('Gap to the proven optimum · normal vs hard mode')"><VChart :option="gapOpt" style="height: 480px" autoresize /></UiCard>
      <UiCard :title="$t('Guess-count distribution')"><VChart :option="distOpt" style="height: 340px" autoresize /></UiCard>
      <UiCard :title="$t('Candidate set shrinking per turn')" :subtitle="$t('Average possible answers left before each guess (solved games count as 0, log scale)')"><VChart :option="shrinkOpt" style="height: 340px" autoresize /></UiCard>
    </UiAdvanced>
    <UiAdvanced :title="$t('Re-run simulations')" :subtitle="$t('Each strategy plays all {n} possible answers. “Any word” variants may guess from all {v} valid guesses.', { n: NA, v: NV })">
      <div class="flex flex-wrap items-center gap-3">
        <MultiSelect v-model="selected" :options="SIM_STRATS" optionLabel="name" optionValue="id" class="w-full sm:w-96" :maxSelectedLabels="3" />
        <UiButton :icon="Cpu" :label="$t('Re-run in Web Workers')" @click="rerun" :loading="Object.keys(progress).length > 0" data-rerun />
      </div>
      <p class="text-caption text-muted">{{ $t('Results are cached in this browser (IndexedDB) and replace the precomputed normal-mode numbers in the leaderboard. Two-step entropy and the optimal trees are precomputed only.') }}</p>
      <TransitionGroup name="list" tag="div" class="flex flex-col gap-1.5">
        <div v-for="(p, id) in progress" :key="id" class="flex items-center gap-2 text-caption"><span class="w-36 truncate">{{ shortName(String(id)) }}</span><ProgressBar :value="Math.round(p * 100)" class="flex-1 !h-2" :showValue="false" /></div>
      </TransitionGroup>
    </UiAdvanced>
  </div>
</template>
