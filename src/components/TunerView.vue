<script setup lang="ts">
import { ref, reactive, computed, onUnmounted } from 'vue'
import { watchDebounced, useLocalStorage } from '@vueuse/core'
import VChart from 'vue-echarts'
import Slider from 'primevue/slider'; import ToggleSwitch from 'primevue/toggleswitch'; import ProgressBar from 'primevue/progressbar'
import { SlidersHorizontal, Play, RotateCcw, Gauge, History } from 'lucide-vue-next'
import { baseC } from '../lib/charts'
import { ruslanColor, otherColor } from '../lib/tokens'
import { answers, allowed } from '../lib/words'
import { OPTIMUM, type TuneParams } from '../lib/advanced'
import { simIndex } from '../lib/simdata'
import UiCard from './ui/UiCard.vue'; import UiButton from './ui/UiButton.vue'; import UiBadge from './ui/UiBadge.vue'; import CountUp from './ui/CountUp.vue'; import InfoTip from './InfoTip.vue'
const defaults: TuneParams = { wPlain: 1, wPos: 1, balanced: true, topN: 26, fromAll: false }
const p = reactive<TuneParams>({ ...defaults })
interface Res { avg: number; dist: number[]; failRate: number; worst: number; opener: string; ms: number; n: number; worstWords: string[] }
const res = ref<Res | null>(null), progress = ref(0), running = ref(false), full = ref(false)
const history = useLocalStorage<{ p: TuneParams; avg: number; n: number }[]>('wl-tune-history', [])
const subset = computed(() => answers.value.filter((_, i) => i % 6 === 0)) // 386 words, deterministic
let worker: Worker | null = null, job = 0
function run(isFull: boolean) {
  worker?.terminate(); worker = new Worker(new URL('../lib/tune.worker.ts', import.meta.url), { type: 'module' })
  const my = ++job; running.value = true; progress.value = 0; full.value = isFull
  worker.onmessage = e => {
    if (e.data.job !== my) return
    if (e.data.type === 'progress') progress.value = e.data.p
    else { res.value = e.data.result; running.value = false; history.value = [{ p: { ...p }, avg: e.data.result.avg, n: e.data.result.n }, ...history.value].slice(0, 12); worker?.terminate(); worker = null }
  }
  worker.postMessage({ params: { ...p }, answers: [...answers.value], allowed: [...allowed.value], subset: isFull ? null : [...subset.value], job: my })
}
watchDebounced(() => ({ ...p }), () => run(false), { debounce: 400, deep: true, immediate: true })
onUnmounted(() => worker?.terminate())
const reset = () => Object.assign(p, defaults)
const ref1 = computed(() => simIndex.value.find(s => s.id === 'freqbal-cand'))
const opt = computed(() => res.value && ({ ...baseC.value, legend: { ...baseC.value.legend, top: 0 }, grid: { left: 40, right: 20, top: 40, bottom: 30 }, xAxis: { type: 'category', data: ['1', '2', '3', '4', '5', '6', '7+'] }, yAxis: { type: 'value', axisLabel: { formatter: '{value}%' } },
  series: [{ type: 'bar', name: 'tuned', itemStyle: { color: ruslanColor, borderRadius: [4, 4, 0, 0] }, data: [1, 2, 3, 4, 5, 6].map(i => +((100 * (res.value!.dist[i] ?? 0)) / res.value!.n).toFixed(1)).concat(+((100 * res.value!.dist.slice(7).reduce((a, b) => a + b, 0)) / res.value!.n).toFixed(1)) },
    ...(ref1.value ? [{ type: 'bar', name: 'balanced (preset)', itemStyle: { color: otherColor, borderRadius: [4, 4, 0, 0] }, data: [1, 2, 3, 4, 5, 6].map(i => +((100 * (ref1.value!.dist[i] ?? 0)) / 2315).toFixed(1)).concat(+((100 * ref1.value!.dist.slice(7).reduce((a, b) => a + b, 0)) / 2315).toFixed(1)) }] : [])] }))
</script>
<template>
  <div class="flex flex-col gap-5">
    <UiCard title="Tune Ruslan's letter-frequency strategy" :icon="SlidersHorizontal" subtitle="Changes re-simulate instantly on a 386-word sample (every 6th answer). Run the full 2,315 for exact numbers.">
      <template #actions><UiButton :icon="RotateCcw" label="Defaults" variant="secondary" @click="reset" /><UiButton :icon="Play" label="Run full 2,315" @click="run(true)" :loading="running && full" /></template>
      <div class="grid md:grid-cols-2 gap-x-8 gap-y-5">
        <div><div class="flex justify-between mb-2"><span>Plain letter weight<InfoTip text="How much the letters a word contains count (each distinct letter once)." /></span><b class="tabular-nums">{{ p.wPlain.toFixed(2) }}</b></div><Slider v-model="p.wPlain" :min="0" :max="2" :step="0.05" /></div>
        <div><div class="flex justify-between mb-2"><span>Positional weight<InfoTip text="How much a letter in a likely position (e.g. S first, E last) counts." /></span><b class="tabular-nums">{{ p.wPos.toFixed(2) }}</b></div><Slider v-model="p.wPos" :min="0" :max="2" :step="0.05" /></div>
        <div><div class="flex justify-between mb-2"><span>Top-N letters counted<InfoTip text="Only the N highest-scoring letters contribute (Ruslan's idea: top 5–7)." /></span><b class="tabular-nums">{{ p.topN }}</b></div><Slider v-model="p.topN" :min="3" :max="26" :step="1" /></div>
        <div class="flex flex-col gap-3">
          <label class="flex items-center gap-3 cursor-pointer"><ToggleSwitch v-model="p.balanced" />Balanced score f·(n−f)<InfoTip text="Score letters by f·(n−f): letters in about half of the remaining words split them best." /></label>
          <label class="flex items-center gap-3 cursor-pointer"><ToggleSwitch v-model="p.fromAll" />Guess any valid word (not only possible answers)<InfoTip text="Slower: scores all 12,972 valid guesses." /></label>
        </div>
      </div>
      <ProgressBar v-if="running" :value="Math.round(progress * 100)" :showValue="false" class="!h-1.5 mt-4" />
    </UiCard>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
      <UiCard interactive><div class="text-caption text-muted flex items-center gap-1"><Gauge :size="12" />Average ({{ res?.n ?? '…' }} words)</div><div class="text-3xl font-extrabold"><CountUp :value="res?.avg ?? 0" :decimals="3" /></div></UiCard>
      <UiCard interactive><div class="text-caption text-muted">Gap to optimum 3.4212</div><div class="text-3xl font-extrabold text-present">+<CountUp :value="res ? res.avg - OPTIMUM.normal : 0" :decimals="3" /></div></UiCard>
      <UiCard interactive><div class="text-caption text-muted">Fail rate (&gt;6)</div><div class="text-3xl font-extrabold" :class="res?.failRate ? 'text-red-500' : 'text-correct'"><CountUp :value="(res?.failRate ?? 0) * 100" :decimals="2" />%</div></UiCard>
      <UiCard interactive><div class="text-caption text-muted">Opener · worst</div><div class="text-3xl font-extrabold font-mono uppercase">{{ res?.opener ?? '…' }}</div><div class="text-caption text-muted">worst {{ res?.worst }} · {{ res?.worstWords?.slice(0, 3).join(' ') }}</div></UiCard>
    </div>
    <div class="grid lg:grid-cols-[2fr_1fr] gap-5">
      <UiCard title="Guess distribution (% of games)" subtitle="Orange = your tuning, blue = 'Ruslan balanced (candidates)' preset on all 2,315"><VChart v-if="opt" :option="opt" style="height: 300px" autoresize /></UiCard>
      <UiCard title="Recent runs" :icon="History">
        <TransitionGroup name="list" tag="div" class="flex flex-col gap-1.5 text-caption">
          <button v-for="(h, i) in history" :key="i + JSON.stringify(h.p) + h.n" class="flex items-center gap-2 text-left rounded-lg px-2 py-1 hover:bg-surface-2 transition-colors" @click="Object.assign(p, h.p)">
            <UiBadge :tone="h.n === 2315 ? 'brand' : 'neutral'">{{ h.avg.toFixed(3) }}</UiBadge>
            <span class="text-muted truncate">pl {{ h.p.wPlain }} · pos {{ h.p.wPos }} · top {{ h.p.topN }} · {{ h.p.balanced ? 'bal' : 'raw' }} · {{ h.p.fromAll ? 'any' : 'cand' }} · {{ h.n }}w</span>
          </button>
        </TransitionGroup>
        <div class="text-caption text-muted mt-2">Click a run to restore its settings.</div>
      </UiCard>
    </div>
  </div>
</template>
