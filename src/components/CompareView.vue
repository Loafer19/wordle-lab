<script setup lang="ts">
import { NA } from '../lib/lang'
import { customs } from '../lib/custom'
import { t } from '../lib/i18n'
import { ref, computed, watch, toRef } from 'vue'
import { compareSel } from '../lib/shared'
import { href } from '../lib/route'
import { shortName, blurb } from '../lib/names'
import UiAdvanced from './ui/UiAdvanced.vue'
import VChart from 'vue-echarts'
import { GitCompare, ArrowLeftRight, ArrowLeft } from 'lucide-vue-next'
import Skeleton from 'primevue/skeleton'
import { baseC } from '../lib/charts'
import { tile, otherColor, ruslanColor, guessScale } from '../lib/tokens'
import { answers } from '../lib/words'
import { loadFull, simReady, fullId, simIndex, type Full } from '../lib/simdata'
import UiCard from './ui/UiCard.vue'; import UiBadge from './ui/UiBadge.vue'; import UiButton from './ui/UiButton.vue'
import StrategyPicker from './StrategyPicker.vue'
const a = toRef(() => compareSel.value.a), b = toRef(() => compareSel.value.b), hardA = toRef(() => compareSel.value.hardA), hardB = toRef(() => compareSel.value.hardB)
const set = (k: 'a' | 'b' | 'hardA' | 'hardB', v: any) => (compareSel.value = { ...compareSel.value, [k]: v })
const showAll = ref(false)
const fa = ref<Full | null>(null), fb = ref<Full | null>(null)
watch([a, hardA], async () => { await simReady; fa.value = await loadFull(fullId(a.value, hardA.value)) }, { immediate: true })
watch([b, hardB], async () => { await simReady; fb.value = await loadFull(fullId(b.value, hardB.value)) }, { immediate: true })
const nameOf = (id: string, h: boolean) => (customs.value.find(c => c.id === id)?.name ?? shortName(id, t(simIndex.value.find(s => s.id === fullId(id, h))?.name ?? id))) + (h ? ' · ' + t('hard') : '')
const swap = () => { const c = compareSel.value; compareSel.value = { a: c.b, b: c.a, hardA: c.hardB, hardB: c.hardA } }
const rows = computed(() => (fa.value && fb.value ? answers.value.map((w, i) => ({ w, ga: fa.value!.guesses[i], gb: fb.value!.guesses[i], d: fa.value!.guesses[i] - fb.value!.guesses[i] })) : []))
const wins = computed(() => rows.value.filter(r => r.d < 0).length), losses = computed(() => rows.value.filter(r => r.d > 0).length), ties = computed(() => rows.value.filter(r => r.d === 0).length)
const avgA = computed(() => rows.value.reduce((s, r) => s + r.ga, 0) / Math.max(1, rows.value.length)), avgB = computed(() => rows.value.reduce((s, r) => s + r.gb, 0) / Math.max(1, rows.value.length))
// head-to-head panel: A is always amber, B always blue (the same colours as the charts below), whoever wins
const pct = (k: number) => (rows.value.length ? (100 * k) / rows.value.length : 0)
const fmtPct = (k: number) => { const v = pct(k); return (v > 0 && v < 1 ? v.toFixed(1) : Math.round(v)) + '%' }
const side = (id: string, h: boolean, f: Full | null, key: 'ga' | 'gb') => {
  const g = rows.value.map(r => r[key]), s = simIndex.value.find(x => x.id === fullId(id, h))
  return { name: nameOf(id, h), opener: s?.opener ?? f?.tree?.g ?? '', blurb: blurb(id), avg: g.reduce((x, y) => x + y, 0) / Math.max(1, g.length), worst: g.length ? Math.max(...g) : 0, fails: g.filter(v => v > 6).length, le4: pct(g.filter(v => v <= 4).length) }
}
const sides = computed(() => [{ k: 'A', c: ruslanColor, ...side(a.value, hardA.value, fa.value, 'ga') }, { k: 'B', c: otherColor, ...side(b.value, hardB.value, fb.value, 'gb') }])
const delta = computed(() => avgA.value - avgB.value)
const verdict = computed(() => Math.abs(delta.value) < 5e-5 ? null : delta.value < 0 ? sides.value[0] : sides.value[1])
const stack = computed(() => [{ k: 'a', label: t('A better'), n: wins.value, c: ruslanColor }, { k: 'd', label: t('Same'), n: ties.value, c: tile.absent }, { k: 'b', label: t('B better'), n: losses.value, c: otherColor }])
const diffs = computed(() => [...rows.value].filter(r => r.d !== 0).sort((x, y) => Math.abs(y.d) - Math.abs(x.d) || x.w.localeCompare(y.w)))
const deltaOpt = computed(() => {
  const ks = [-4, -3, -2, -1, 0, 1, 2, 3, 4]
  return { ...baseC.value, grid: { left: 50, right: 20, top: 20, bottom: 40 }, tooltip: { trigger: 'axis' }, xAxis: { type: 'category', data: ks.map(k => (k > 0 ? '+' + k : String(k))), name: 'A − B' },
    yAxis: { type: 'log', min: 1 }, series: [{ type: 'bar', data: ks.map(k => ({ value: Math.max(rows.value.filter(r => (k === -4 ? r.d <= -4 : k === 4 ? r.d >= 4 : r.d === k)).length, 0.9), itemStyle: { color: k < 0 ? ruslanColor : k > 0 ? otherColor : tile.absent, borderRadius: [4, 4, 0, 0] } })) }] }
})
const distOpt = computed(() => ({ ...baseC.value, grid: { left: 50, right: 20, top: 40, bottom: 30 }, legend: { ...baseC.value.legend, top: 0 }, xAxis: { type: 'category', data: ['1', '2', '3', '4', '5', '6', '7+'] }, yAxis: { type: 'value' },
  series: [['A', 'ga', ruslanColor], ['B', 'gb', otherColor]].map(([n, k, c]) => ({ type: 'bar', name: n, itemStyle: { color: c }, data: [1, 2, 3, 4, 5, 6, 7].map(g => rows.value.filter(r => (g === 7 ? (r as any)[k] >= 7 : (r as any)[k] === g)).length) })) }))
</script>
<template>
  <div class="flex flex-col gap-5" data-compare>
    <a :href="href('strategies', 'leaderboard')" class="self-start inline-flex items-center gap-1.5 text-caption text-muted hover:text-fg"><ArrowLeft :size="14" />{{ $t('Back to the leaderboard') }}</a>
    <UiCard :title="$t('Side-by-side comparison')" :icon="GitCompare" :subtitle="$t('Both strategies play the same {n} answers. A “win” means A needed fewer guesses than B for that word.', { n: NA })">
      <div class="grid md:grid-cols-[1fr_auto_1fr] gap-3 items-center">
        <div class="min-w-0"><div class="text-caption text-muted mb-1">{{ $t('Strategy A') }}</div><StrategyPicker :id="a" :hard="hardA" @update:id="v => set('a', v)" @update:hard="v => set('hardA', v)" /></div>
        <UiButton :icon="ArrowLeftRight" variant="secondary" :ariaLabel="$t('Swap A and B')" @click="swap" />
        <div class="min-w-0"><div class="text-caption text-muted mb-1">{{ $t('Strategy B') }}</div><StrategyPicker :id="b" :hard="hardB" @update:id="v => set('b', v)" @update:hard="v => set('hardB', v)" /></div>
      </div>
    </UiCard>
    <section class="rounded-card border border-line bg-surface shadow-card p-4 sm:p-5 flex flex-col gap-4" data-compare-kpis :aria-label="$t('Head-to-head')">
      <div class="grid md:grid-cols-[1fr_auto_1fr] gap-3 md:gap-5 items-stretch">
        <template v-for="(sd, i) in sides" :key="sd.k">
          <div v-if="i === 1" class="flex md:flex-col items-center justify-center gap-2 md:px-2 text-center" data-compare-delta>
            <span class="text-caption font-semibold uppercase tracking-wide text-muted">vs</span>
            <template v-if="rows.length">
              <span v-if="verdict" class="text-caption leading-snug max-w-44"><b class="tabular-nums text-title" :style="{ color: verdict.c }">{{ Math.abs(delta).toFixed(3) }}</b><br class="hidden md:block" /> {{ $t('fewer guesses per game for {s}', { s: verdict.k }) }}</span>
              <span v-else class="text-caption text-muted">{{ $t('Same average') }}</span>
            </template>
          </div>
          <div class="min-w-0 rounded-card border-2 p-3 sm:p-4 flex flex-col gap-1.5" :style="{ borderColor: sd.c + '66', background: sd.c + '0d' }" :class="i === 1 && 'md:text-right md:items-end'" :data-compare-side="sd.k">
            <div class="flex items-center gap-2" :class="i === 1 && 'md:flex-row-reverse'">
              <span class="inline-flex items-center justify-center size-6 rounded-full text-white text-caption font-bold shrink-0" :style="{ background: sd.c }">{{ sd.k }}</span>
              <b class="text-title leading-tight min-w-0 break-words" data-compare-name>{{ sd.name }}</b>
            </div>
            <p v-if="sd.blurb" class="text-caption text-muted leading-snug" data-compare-blurb>{{ sd.blurb }}</p>
            <div v-if="sd.opener" class="text-caption text-muted">{{ $t('Opener') }} <span class="font-mono uppercase font-semibold text-fg">{{ sd.opener }}</span></div>
            <Skeleton v-if="!rows.length" width="6rem" height="2.25rem" />
            <div v-else class="flex items-baseline gap-1.5 mt-1" :class="i === 1 && 'md:flex-row-reverse'"><span class="text-3xl font-extrabold tabular-nums" :style="{ color: sd.c }">{{ sd.avg.toFixed(3) }}</span><span class="text-caption text-muted">{{ $t('avg guesses') }}</span></div>
            <dl v-if="rows.length" class="grid grid-cols-3 gap-2 text-caption mt-1 w-full max-w-sm" :class="i === 1 && 'md:ml-auto'">
              <div><dt class="text-muted">{{ $t('worst') }}</dt><dd class="font-semibold tabular-nums">{{ sd.worst }}</dd></div>
              <div><dt class="text-muted">{{ $t('fail') }}</dt><dd class="font-semibold tabular-nums" :class="sd.fails ? 'text-red-600 dark:text-red-400' : ''">{{ sd.fails }}</dd></div>
              <div><dt class="text-muted">{{ $t('in ≤4') }}</dt><dd class="font-semibold tabular-nums">{{ sd.le4.toFixed(1) }}%</dd></div>
            </dl>
          </div>
        </template>
      </div>
      <div v-if="rows.length" class="flex flex-col gap-2" data-compare-wdl>
        <div class="text-caption text-muted">{{ $t('Word by word ({n} answers): who needs fewer guesses', { n: rows.length }) }}</div>
        <div class="flex h-4 rounded-full overflow-hidden bg-surface-2" role="img" :aria-label="stack.map(x => `${x.label}: ${x.n}`).join(', ')">
          <span v-for="x in stack" :key="x.k" class="h-full transition-all" :style="{ width: pct(x.n) + '%', background: x.c }" v-tooltip.top="`${x.label}: ${x.n} (${fmtPct(x.n)})`"></span>
        </div>
        <div class="flex flex-wrap justify-between gap-x-4 gap-y-1 text-caption">
          <span v-for="x in stack" :key="x.k" class="inline-flex items-center gap-1.5" :data-wdl="x.k"><span class="size-2.5 rounded-sm" :style="{ background: x.c }"></span>{{ x.label }} <b class="tabular-nums">{{ x.n }}</b> <span class="text-muted tabular-nums">{{ fmtPct(x.n) }}</span></span>
        </div>
      </div>
    </section>
    <UiCard data-compare-diffs-card :title="$t('Biggest differences')" :subtitle="$t('Words where the two strategies disagree most')">
      <template #actions><UiBadge>{{ diffs.length }}</UiBadge></template>
      <p v-if="rows.length && !diffs.length" class="text-muted">{{ $t('Both strategies need the same number of guesses for every word.') }}</p>
      <table v-else class="text-caption w-full" data-diffs>
        <thead><tr class="text-muted text-left"><th class="py-1 pr-3 font-medium">{{ $t('word') }}</th><th class="pr-3 font-medium" :style="{ color: ruslanColor }">A</th><th class="pr-3 font-medium" :style="{ color: otherColor }">B</th><th class="font-medium">Δ</th></tr></thead>
        <tbody>
          <tr v-for="r in (showAll ? diffs : diffs.slice(0, 15))" :key="r.w" class="border-t border-line hover:bg-surface-2 transition-colors">
            <td class="py-1 pr-3 font-mono uppercase font-semibold">{{ r.w }}</td>
            <td class="pr-3"><span class="inline-block size-3 rounded-sm align-middle mr-1" :style="{ background: guessScale[Math.min(7, r.ga)] }"></span>{{ r.ga }}</td>
            <td class="pr-3"><span class="inline-block size-3 rounded-sm align-middle mr-1" :style="{ background: guessScale[Math.min(7, r.gb)] }"></span>{{ r.gb }}</td>
            <td><span class="inline-flex items-center rounded-full px-2 py-0.5 text-caption font-semibold text-white tabular-nums" :style="{ background: r.d < 0 ? ruslanColor : otherColor }" v-tooltip.top="r.d < 0 ? $t('A better') : $t('B better')">{{ r.d > 0 ? '+' : '' }}{{ r.d }}</span></td>
          </tr>
        </tbody>
      </table>
      <UiButton v-if="diffs.length > 15" class="mt-3" variant="secondary" :label="showAll ? $t('Show top 15') : $t('Show all {n}', { n: diffs.length })" @click="showAll = !showAll" data-diffs-all />
    </UiCard>
    <UiCard data-compare-dist :title="$t('Guess distributions')"><VChart :option="distOpt" style="height: 280px" autoresize /></UiCard>
    <UiAdvanced :subtitle="$t('Per-word difference histogram')">
      <UiCard :title="$t('Per-word difference (A − B)')" :subtitle="$t('Amber = A faster, blue = B faster (log scale)')"><VChart :option="deltaOpt" style="height: 280px" autoresize /></UiCard>
    </UiAdvanced>
  </div>
</template>
