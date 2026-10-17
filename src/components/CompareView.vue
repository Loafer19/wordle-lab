<script setup lang="ts">
import { NA } from '../lib/lang'
import { customs } from '../lib/custom'
import { t } from '../lib/i18n'
import { ref, computed, watch, toRef } from 'vue'
import { compareSel } from '../lib/shared'
import { href } from '../lib/route'
import { shortName } from '../lib/names'
import UiStat from './ui/UiStat.vue'; import UiAdvanced from './ui/UiAdvanced.vue'
import VChart from 'vue-echarts'
import { GitCompare, Trophy, ArrowLeftRight, ArrowLeft } from 'lucide-vue-next'
import { baseC } from '../lib/charts'
import { tile, otherColor, ruslanColor, guessScale, danger } from '../lib/tokens'
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
const diffs = computed(() => [...rows.value].filter(r => r.d !== 0).sort((x, y) => Math.abs(y.d) - Math.abs(x.d) || x.w.localeCompare(y.w)))
const deltaOpt = computed(() => {
  const ks = [-4, -3, -2, -1, 0, 1, 2, 3, 4]
  return { ...baseC.value, grid: { left: 50, right: 20, top: 20, bottom: 40 }, tooltip: { trigger: 'axis' }, xAxis: { type: 'category', data: ks.map(k => (k > 0 ? '+' + k : String(k))), name: 'A − B' },
    yAxis: { type: 'log', min: 1 }, series: [{ type: 'bar', data: ks.map(k => ({ value: Math.max(rows.value.filter(r => (k === -4 ? r.d <= -4 : k === 4 ? r.d >= 4 : r.d === k)).length, 0.9), itemStyle: { color: k < 0 ? tile.correct : k > 0 ? danger : tile.absent, borderRadius: [4, 4, 0, 0] } })) }] }
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
    <div class="grid grid-cols-2 md:grid-cols-5 gap-3" data-compare-kpis>
      <UiStat :label="$t('A avg')" :value="rows.length ? avgA.toFixed(3) : null" :sub="nameOf(a, hardA)" />
      <UiStat :label="$t('B avg')" :value="rows.length ? avgB.toFixed(3) : null" :sub="nameOf(b, hardB)" />
      <UiStat :label="$t('A wins')" :icon="Trophy" :value="rows.length ? wins : null" tone="correct" />
      <UiStat :label="$t('B wins')" :value="rows.length ? losses : null" tone="danger" />
      <UiStat :label="$t('Ties')" :value="rows.length ? ties : null" />
    </div>
    <UiCard data-compare-diffs-card :title="$t('Biggest differences')" :subtitle="$t('Words where the two strategies disagree most')">
      <template #actions><UiBadge>{{ diffs.length }}</UiBadge></template>
      <p v-if="rows.length && !diffs.length" class="text-muted">{{ $t('Both strategies need the same number of guesses for every word.') }}</p>
      <table v-else class="text-caption w-full" data-diffs>
        <thead><tr class="text-muted text-left"><th class="py-1 pr-3 font-medium">{{ $t('word') }}</th><th class="pr-3 font-medium">A</th><th class="pr-3 font-medium">B</th><th class="font-medium">Δ</th></tr></thead>
        <tbody>
          <tr v-for="r in (showAll ? diffs : diffs.slice(0, 15))" :key="r.w" class="border-t border-line hover:bg-surface-2 transition-colors">
            <td class="py-1 pr-3 font-mono uppercase font-semibold">{{ r.w }}</td>
            <td class="pr-3"><span class="inline-block size-3 rounded-sm align-middle mr-1" :style="{ background: guessScale[Math.min(7, r.ga)] }"></span>{{ r.ga }}</td>
            <td class="pr-3"><span class="inline-block size-3 rounded-sm align-middle mr-1" :style="{ background: guessScale[Math.min(7, r.gb)] }"></span>{{ r.gb }}</td>
            <td><UiBadge :tone="r.d < 0 ? 'correct' : 'danger'">{{ r.d > 0 ? '+' : '' }}{{ r.d }}</UiBadge></td>
          </tr>
        </tbody>
      </table>
      <UiButton v-if="diffs.length > 15" class="mt-3" variant="secondary" :label="showAll ? $t('Show top 15') : $t('Show all {n}', { n: diffs.length })" @click="showAll = !showAll" data-diffs-all />
    </UiCard>
    <UiCard data-compare-dist :title="$t('Guess distributions')"><VChart :option="distOpt" style="height: 280px" autoresize /></UiCard>
    <UiAdvanced :subtitle="$t('Per-word difference histogram')">
      <UiCard :title="$t('Per-word difference (A − B)')" :subtitle="$t('Green = A faster, red = B faster (log scale)')"><VChart :option="deltaOpt" style="height: 280px" autoresize /></UiCard>
    </UiAdvanced>
  </div>
</template>
