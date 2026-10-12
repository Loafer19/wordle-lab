<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import VChart from 'vue-echarts'
import { GitCompare, Trophy, ArrowLeftRight } from 'lucide-vue-next'
import { baseC } from '../lib/charts'
import { tile, otherColor, ruslanColor, guessScale, danger } from '../lib/tokens'
import { answers } from '../lib/words'
import { loadFull, simReady, fullId, simIndex, type Full } from '../lib/simdata'
import UiCard from './ui/UiCard.vue'; import UiBadge from './ui/UiBadge.vue'; import UiButton from './ui/UiButton.vue'; import CountUp from './ui/CountUp.vue'
import StrategyPicker from './StrategyPicker.vue'
const a = ref('freqbal-cand'), b = ref('optimal'), hardA = ref(false), hardB = ref(false)
const fa = ref<Full | null>(null), fb = ref<Full | null>(null)
watch([a, hardA], async () => { await simReady; fa.value = await loadFull(fullId(a.value, hardA.value)) }, { immediate: true })
watch([b, hardB], async () => { await simReady; fb.value = await loadFull(fullId(b.value, hardB.value)) }, { immediate: true })
const nameOf = (id: string, h: boolean) => (simIndex.value.find(s => s.id === fullId(id, h))?.name ?? id)
const swap = () => { [a.value, b.value] = [b.value, a.value]; [hardA.value, hardB.value] = [hardB.value, hardA.value] }
const rows = computed(() => (fa.value && fb.value ? answers.value.map((w, i) => ({ w, ga: fa.value!.guesses[i], gb: fb.value!.guesses[i], d: fa.value!.guesses[i] - fb.value!.guesses[i] })) : []))
const wins = computed(() => rows.value.filter(r => r.d < 0).length), losses = computed(() => rows.value.filter(r => r.d > 0).length), ties = computed(() => rows.value.filter(r => r.d === 0).length)
const avgA = computed(() => rows.value.reduce((s, r) => s + r.ga, 0) / Math.max(1, rows.value.length)), avgB = computed(() => rows.value.reduce((s, r) => s + r.gb, 0) / Math.max(1, rows.value.length))
const diffs = computed(() => [...rows.value].filter(r => r.d !== 0).sort((x, y) => Math.abs(y.d) - Math.abs(x.d) || x.w.localeCompare(y.w)).slice(0, 60))
const deltaOpt = computed(() => {
  const ks = [-4, -3, -2, -1, 0, 1, 2, 3, 4]
  return { ...baseC.value, grid: { left: 50, right: 20, top: 20, bottom: 40 }, tooltip: { trigger: 'axis' }, xAxis: { type: 'category', data: ks.map(k => (k > 0 ? '+' + k : String(k))), name: 'A − B' },
    yAxis: { type: 'log', min: 1 }, series: [{ type: 'bar', data: ks.map(k => ({ value: Math.max(rows.value.filter(r => (k === -4 ? r.d <= -4 : k === 4 ? r.d >= 4 : r.d === k)).length, 0.9), itemStyle: { color: k < 0 ? tile.correct : k > 0 ? danger : tile.absent, borderRadius: [4, 4, 0, 0] } })) }] }
})
const distOpt = computed(() => ({ ...baseC.value, grid: { left: 50, right: 20, top: 40, bottom: 30 }, legend: { ...baseC.value.legend, top: 0 }, xAxis: { type: 'category', data: ['1', '2', '3', '4', '5', '6', '7+'] }, yAxis: { type: 'value' },
  series: [['A', 'ga', ruslanColor], ['B', 'gb', otherColor]].map(([n, k, c]) => ({ type: 'bar', name: n, itemStyle: { color: c }, data: [1, 2, 3, 4, 5, 6, 7].map(g => rows.value.filter(r => (g === 7 ? (r as any)[k] >= 7 : (r as any)[k] === g)).length) })) }))
</script>
<template>
  <div class="flex flex-col gap-5">
    <UiCard title="Side-by-side comparison" :icon="GitCompare" subtitle="Both strategies play the same 2,315 answers. A 'win' means A needed fewer guesses than B for that word.">
      <div class="grid md:grid-cols-[1fr_auto_1fr] gap-3 items-center">
        <div><div class="text-caption text-muted mb-1">Strategy A</div><StrategyPicker v-model:id="a" v-model:hard="hardA" /></div>
        <UiButton :icon="ArrowLeftRight" variant="secondary" ariaLabel="Swap A and B" @click="swap" />
        <div><div class="text-caption text-muted mb-1">Strategy B</div><StrategyPicker v-model:id="b" v-model:hard="hardB" /></div>
      </div>
    </UiCard>
    <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
      <UiCard interactive><div class="text-caption text-muted">A avg</div><div class="text-2xl font-extrabold"><CountUp :value="avgA" :decimals="3" /></div><div class="text-caption truncate">{{ nameOf(a, hardA) }}</div></UiCard>
      <UiCard interactive><div class="text-caption text-muted">B avg</div><div class="text-2xl font-extrabold"><CountUp :value="avgB" :decimals="3" /></div><div class="text-caption truncate">{{ nameOf(b, hardB) }}</div></UiCard>
      <UiCard interactive><div class="text-caption text-muted flex items-center gap-1"><Trophy :size="12" />A wins</div><div class="text-2xl font-extrabold text-correct"><CountUp :value="wins" /></div></UiCard>
      <UiCard interactive><div class="text-caption text-muted">B wins</div><div class="text-2xl font-extrabold text-red-500"><CountUp :value="losses" /></div></UiCard>
      <UiCard interactive><div class="text-caption text-muted">Ties</div><div class="text-2xl font-extrabold"><CountUp :value="ties" /></div></UiCard>
    </div>
    <div class="grid lg:grid-cols-2 gap-5">
      <UiCard title="Per-word difference (A − B)" subtitle="Green = A faster, red = B faster (log scale)"><VChart :option="deltaOpt" style="height: 280px" autoresize /></UiCard>
      <UiCard title="Guess distributions"><VChart :option="distOpt" style="height: 280px" autoresize /></UiCard>
    </div>
    <UiCard title="Biggest differences" subtitle="Words where the two strategies disagree most">
      <div class="overflow-x-auto"><table class="text-caption w-full">
        <thead><tr class="text-muted text-left"><th class="py-1 pr-3 font-medium">word</th><th class="pr-3 font-medium">A</th><th class="pr-3 font-medium">B</th><th class="font-medium">Δ</th></tr></thead>
        <TransitionGroup name="list" tag="tbody">
          <tr v-for="r in diffs" :key="r.w" class="border-t border-line hover:bg-surface-2 transition-colors">
            <td class="py-1 pr-3 font-mono uppercase font-semibold">{{ r.w }}</td>
            <td class="pr-3"><span class="inline-block size-3 rounded-sm align-middle mr-1" :style="{ background: guessScale[Math.min(7, r.ga)] }"></span>{{ r.ga }}</td>
            <td class="pr-3"><span class="inline-block size-3 rounded-sm align-middle mr-1" :style="{ background: guessScale[Math.min(7, r.gb)] }"></span>{{ r.gb }}</td>
            <td><UiBadge :tone="r.d < 0 ? 'correct' : 'danger'">{{ r.d > 0 ? '+' : '' }}{{ r.d }}</UiBadge></td>
          </tr>
        </TransitionGroup>
      </table></div>
    </UiCard>
  </div>
</template>
