<script setup lang="ts">
// Strategy Lab: compose a strategy from blocks, see live results vs the best known strategy, save it for Solver/Compare/Tree.
import { ref, reactive, computed, onUnmounted } from 'vue'
import { watchDebounced } from '@vueuse/core'
import VChart from 'vue-echarts'
import Select from 'primevue/select'; import SelectButton from 'primevue/selectbutton'; import InputText from 'primevue/inputtext'; import ToggleSwitch from 'primevue/toggleswitch'; import ProgressBar from 'primevue/progressbar'
import { FlaskConical, Play, Save, Trash2, Upload, Gauge, Trophy, TriangleAlert, Skull, Blocks } from 'lucide-vue-next'
import { baseC } from '../lib/charts'
import { ruslanColor, otherColor } from '../lib/tokens'
import { answers, allowed } from '../lib/words'
import { simIndex } from '../lib/simdata'
import { PRESETS, SCORE_LABEL, type Spec, type Score } from '../lib/compose'
import { customs } from '../lib/custom'
import { NA, FAMOUS_OPENERS } from '../lib/lang'
import { t } from '../lib/i18n'
import UiCard from './ui/UiCard.vue'; import UiButton from './ui/UiButton.vue'; import UiBadge from './ui/UiBadge.vue'; import InfoTip from './InfoTip.vue'
import WordChips from './WordChips.vue'
import UiStat from './ui/UiStat.vue'
import Skeleton from 'primevue/skeleton'
import { shortName } from '../lib/names'

const spec = reactive<Spec>({ ...PRESETS[1], id: 'lab', name: '' })
const hard = ref(false), openerMode = ref<'computed' | 'fixed'>('computed'), fixedOpener = ref(FAMOUS_OPENERS[0])
const scores = (Object.keys(SCORE_LABEL) as Score[]).map(v => ({ v, l: t(SCORE_LABEL[v]) }))
const turnOpts = [0, 1, 2, 3].map(v => ({ v, l: String(v) }))
const tieOpts = [{ v: 'candidate', l: t('Prefer possible answers') }, { v: 'alpha', l: t('Alphabetical') }]
const presets: { l: string; s: Partial<Spec> }[] = [
  { l: t('Explore 1 → candidates'), s: PRESETS[0] }, { l: t('Explore 2 → Ruslan balanced'), s: PRESETS[1] },
  { l: t('Ruslan balanced only'), s: { exploreTurns: 0, exploit: 'freqbal', explore: 'entropy', opener: '' } },
  { l: t('Max entropy every turn'), s: { exploreTurns: 6, explore: 'entropy', exploit: 'entropy', opener: '' } },
]
function load(s: Partial<Spec>) { Object.assign(spec, { opener: '', tie: 'candidate', ...s, id: 'lab', name: spec.name }); openerMode.value = s.opener ? 'fixed' : 'computed'; if (s.opener) fixedOpener.value = s.opener }
const allowedSet = computed(() => new Set(allowed.value))
const openerOk = computed(() => openerMode.value === 'computed' || allowedSet.value.has(fixedOpener.value.toLowerCase()))
const current = computed<Spec>(() => ({ ...spec, opener: openerMode.value === 'fixed' && openerOk.value ? fixedOpener.value.toLowerCase() : '' }))

interface Res { avg: number; dist: number[]; failRate: number; worst: number; opener: string; ms: number; n: number; worstWords: string[] }
const res = ref<Res | null>(null), running = ref(false), progress = ref(0), full = ref(false)
const sample = computed(() => answers.value.filter((_, i) => i % 6 === 0))
let worker: Worker | null = null, job = 0
function run(isFull: boolean) {
  if (!openerOk.value) return
  worker?.terminate(); worker = new Worker(new URL('../lib/lab.worker.ts', import.meta.url), { type: 'module' })
  const my = ++job; running.value = true; progress.value = 0; full.value = isFull
  worker.onmessage = e => { if (e.data.job !== my) return; if (e.data.type === 'progress') progress.value = e.data.p; else { res.value = e.data.result; running.value = false; worker?.terminate(); worker = null } }
  worker.postMessage({ spec: { ...current.value }, answers: [...answers.value], allowed: [...allowed.value], subset: isFull ? null : [...sample.value], hard: hard.value, job: my })
}
watchDebounced(() => [JSON.stringify(current.value), hard.value], () => run(false), { debounce: 350, immediate: true })
onUnmounted(() => worker?.terminate())

const mode = computed(() => (hard.value ? 'hard' : 'normal'))
const best = computed(() => [...simIndex.value].filter(s => s.mode === mode.value).sort((a, b) => a.avg - b.avg)[0])
const ruslan = computed(() => simIndex.value.find(s => s.id === (hard.value ? 'freqbal-cand@hard' : 'freqbal-cand')))
const pct = (d: number[], n: number) => [1, 2, 3, 4, 5, 6].map(i => +((100 * (d[i] ?? 0)) / n).toFixed(1)).concat(+((100 * d.slice(7).reduce((a, b) => a + b, 0)) / n).toFixed(1))
const opt = computed(() => res.value && ({ ...baseC.value, legend: { ...baseC.value.legend, top: 0 }, grid: { left: 40, right: 16, top: 40, bottom: 30 }, tooltip: { trigger: 'axis', valueFormatter: (v: number) => v + '%' },
  xAxis: { type: 'category', data: ['1', '2', '3', '4', '5', '6', '7+'], name: t('guesses') }, yAxis: { type: 'value', axisLabel: { formatter: '{value}%' } },
  series: [{ type: 'bar', name: t('Your strategy'), itemStyle: { color: ruslanColor, borderRadius: [4, 4, 0, 0] }, data: pct(res.value.dist, res.value.n) },
    ...(best.value ? [{ type: 'bar', name: t(best.value.name), itemStyle: { color: otherColor, borderRadius: [4, 4, 0, 0] }, data: pct(best.value.dist, answers.value.length) }] : [])] }))

const saveName = ref('')
function save() {
  const name = saveName.value.trim() || `${t('Custom')} ${customs.value.length + 1}`
  customs.value = [...customs.value, { ...current.value, id: 'custom:' + Date.now().toString(36), name }]
  saveName.value = ''
}
const remove = (id: string) => (customs.value = customs.value.filter(c => c.id !== id))
const describe = (s: Spec) => [s.opener ? s.opener.toUpperCase() : t('computed opener'), s.exploreTurns ? t('explore {k} × {s}', { k: s.exploreTurns, s: t(SCORE_LABEL[s.explore]) }) : '', t('then {s}', { s: t(SCORE_LABEL[s.exploit]) })].filter(Boolean).join(' · ')
</script>
<template>
  <div class="flex flex-col gap-5" data-lab>
    <UiCard :title="t('Strategy Lab')" :icon="FlaskConical" :subtitle="t('Build a strategy from blocks. It re-simulates instantly on a {n}-word sample; run all {N} for exact numbers.', { n: sample.length, N: NA })">
      <template #actions>
        <UiButton :icon="Play" :label="t('Run all {N}', { N: NA })" @click="run(true)" :loading="running && full" data-lab-full />
      </template>
      <div class="flex flex-wrap gap-2 mb-5"><span class="text-caption text-muted self-center">{{ t('Presets') }}:</span>
        <UiButton v-for="p in presets" :key="p.l" :label="p.l" variant="ghost" @click="load(p.s)" />
      </div>
      <div class="grid md:grid-cols-2 gap-x-8 gap-y-5 text-body">
        <div class="flex flex-col gap-2"><span class="font-semibold flex items-center gap-1.5">1 · {{ t('Opener') }}<InfoTip :text="t('The first guess. Computed = chosen by the explore score (or the exploit score if K = 0).')" /></span>
          <div class="flex flex-wrap items-center gap-2"><SelectButton v-model="openerMode" :options="[{ v: 'computed', l: t('Computed') }, { v: 'fixed', l: t('Fixed word') }]" optionLabel="l" optionValue="v" :allowEmpty="false" size="small" />
            <InputText v-if="openerMode === 'fixed'" v-model="fixedOpener" maxlength="5" size="small" class="w-28 uppercase font-mono tracking-widest" :invalid="!openerOk" data-lab-opener /></div>
          <span v-if="!openerOk" class="text-caption text-red-500">{{ t('Not a valid 5-letter word') }}</span></div>
        <div class="flex flex-col gap-2"><span class="font-semibold flex items-center gap-1.5">2 · {{ t('Explore turns (K)') }}<InfoTip :text="t('For the first K turns the strategy may guess ANY valid word to eliminate as many candidates as possible; afterwards it only guesses possible answers.')" /></span>
          <SelectButton v-model="spec.exploreTurns" :options="turnOpts" optionLabel="l" optionValue="v" :allowEmpty="false" size="small" /></div>
        <div class="flex flex-col gap-2"><span class="font-semibold">3 · {{ t('Explore score (any word)') }}</span>
          <Select v-model="spec.explore" :options="scores" optionLabel="l" optionValue="v" :disabled="!spec.exploreTurns" class="w-full sm:w-72" /></div>
        <div class="flex flex-col gap-2"><span class="font-semibold">4 · {{ t('Exploit score (possible answers only)') }}</span>
          <Select v-model="spec.exploit" :options="scores" optionLabel="l" optionValue="v" class="w-full sm:w-72" data-lab-exploit /></div>
        <div class="flex flex-col gap-2"><span class="font-semibold">5 · {{ t('Tie-breaker') }}</span>
          <SelectButton v-model="spec.tie" :options="tieOpts" optionLabel="l" optionValue="v" :allowEmpty="false" size="small" /></div>
        <label class="flex items-center gap-3 cursor-pointer self-end"><ToggleSwitch v-model="hard" />{{ t('Hard mode') }}</label>
      </div>
      <ProgressBar v-if="running" :value="Math.round(progress * 100)" class="mt-4 !h-1.5" :showValue="false" />
    </UiCard>

    <UiCard data-lab-save-card :title="t('Save as custom strategy')" :icon="Blocks" :subtitle="t('Saved strategies appear in the Assistant, Compare, Tree, Flow and Answer map (stored in this browser).')">
      <div class="flex flex-wrap items-center gap-2 mb-4">
        <InputText v-model="saveName" :placeholder="t('Name, e.g. My explorer')" size="small" class="w-64" data-lab-name @keydown.enter="save" />
        <UiButton :icon="Save" :label="t('Save')" @click="save" :disabled="!openerOk" data-lab-save />
        <span class="text-caption text-muted">{{ describe(current) }}</span>
      </div>
      <TransitionGroup name="list" tag="ul" class="flex flex-col gap-1.5">
        <li v-for="c in customs" :key="c.id" class="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-surface-2" data-custom>
          <UiBadge tone="brand">★</UiBadge><b class="text-body">{{ c.name }}</b><span class="text-caption text-muted truncate flex-1">{{ describe(c) }}</span>
          <UiButton :icon="Upload" variant="ghost" :ariaLabel="t('Load into lab')" v-tooltip.top="t('Load into lab')" @click="load(c)" />
          <UiButton :icon="Trash2" variant="ghost" :ariaLabel="t('Delete')" v-tooltip.top="t('Delete')" @click="remove(c.id)" />
        </li>
        <li v-if="!customs.length" key="none" class="text-caption text-muted">{{ t('No saved strategies yet.') }}</li>
      </TransitionGroup>
    </UiCard>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-3" data-lab-kpis>
      <UiStat :label="res ? t('Average ({n} words)', { n: res.n }) : t('Average')" :icon="Gauge" :value="res ? res.avg.toFixed(3) : null" :sub="res ? t('opener') + ' ' + res.opener.toUpperCase() : t('Simulating…')" data-lab-avg />
      <UiStat :label="t('vs best known')" :icon="Trophy" :value="res && best ? (res.avg - best.avg >= 0 ? '+' : '') + (res.avg - best.avg).toFixed(3) : null" :tone="res && best && res.avg - best.avg <= 0.0005 ? 'correct' : 'present'" :sub="best ? shortName(best.id, t(best.name)) + ' ' + best.avg.toFixed(3) : undefined" />
      <UiStat :label="t('Fail rate (>6)')" :icon="TriangleAlert" :value="res ? (res.failRate * 100).toFixed(2) + '%' : null" :sub="res ? t('worst') + ': ' + res.worst + ' ' + t('guesses') : undefined" />
      <UiStat :label="t('vs Ruslan balanced')" :value="res && ruslan ? (res.avg - ruslan.avg >= 0 ? '+' : '') + (res.avg - ruslan.avg).toFixed(3) : null" :tone="res && ruslan && res.avg < ruslan.avg ? 'correct' : 'neutral'" :sub="ruslan?.avg.toFixed(3)" />
    </div>
    <p v-if="res && !full" class="text-caption text-muted -mt-2">{{ t('Sample of {n} answers: numbers are approximate. "vs" columns compare against full-list results.', { n: res.n }) }}</p>

    <div class="grid lg:grid-cols-[2fr_1fr] gap-5">
      <UiCard :title="t('Guess distribution (% of games)')"><VChart v-if="opt" :option="opt" style="height: 280px" autoresize /><Skeleton v-else height="280px" /></UiCard>
      <UiCard :title="t('Hardest words')" :icon="Skull" :subtitle="t('Answers that needed the most guesses')"><WordChips v-if="res" :words="res.worstWords" /><div v-else class="flex flex-wrap gap-1.5" data-skeleton><Skeleton v-for="i in 8" :key="i" width="3.5rem" height="1.4rem" /></div></UiCard>
    </div>
  </div>
</template>
