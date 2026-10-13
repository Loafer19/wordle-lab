<script setup lang="ts">
// Per-guess coach analysis (Play post-game and the Coach tab).
import { computed } from 'vue'
import { GraduationCap, Sparkles, TrendingDown, Target, Ban, Repeat2, MoveHorizontal, Layers, Compass, CircleCheck, Lightbulb, Trophy, Network, CircleAlert, Gauge } from 'lucide-vue-next'
import ProgressBar from 'primevue/progressbar'
import { t } from '../lib/i18n'
import type { GameAnalysis, Tip } from '../lib/coach'
import UiCard from './ui/UiCard.vue'; import UiBadge from './ui/UiBadge.vue'
import WordLink from './WordLink.vue'
const p = defineProps<{ result: GameAnalysis | null; busy?: boolean; progress?: number; title?: string }>()
const ICON: Record<string, any> = { 'grey-reuse': Ban, 'yellow-same-spot': Repeat2, 'green-moved': MoveHorizontal, 'cluster-trap': Layers, 'outside-better': Compass, 'pick-candidate': Target, great: CircleCheck, solved: Trophy, lucky: Sparkles, unlucky: TrendingDown }
const TONE: Record<string, 'neutral' | 'brand' | 'correct' | 'present' | 'danger'> = { 'grey-reuse': 'danger', 'yellow-same-spot': 'present', 'green-moved': 'present', 'cluster-trap': 'present', 'outside-better': 'brand', 'pick-candidate': 'present', great: 'correct', solved: 'correct', lucky: 'correct', unlucky: 'neutral' }
const TEXT: Record<string, string> = {
  'grey-reuse': 'Reused grey letter(s) {l}: they are known to be absent, so those slots taught you nothing.',
  'yellow-same-spot': 'Put {l} back in a spot where it was already yellow — that position is known to be wrong for it.',
  'green-moved': 'Moved away from a known green (position {k}). Fine only if you deliberately probe new letters.',
  'cluster-trap': 'Cluster trap: {n} candidates share {f} letters in place. Guessing them one by one can take many turns — a probe like {b} that tests several differing letters at once splits them better.',
  'outside-better': 'A word that cannot be the answer would have helped: {b} gives {x} more bits than your guess.',
  'pick-candidate': 'Only {n} candidate(s) left — guess one of them; a non-candidate cannot win this turn.',
  great: 'Excellent choice: {p}% of the best possible expected information.',
  solved: 'Solved in {k}!',
  lucky: 'Lucky: the colours gave {x} bits more than expected.',
  unlucky: 'Unlucky: the colours gave {x} bits less than expected — not your fault.',
}
const SUMMARY: Record<string, string> = {
  'grey-reuse': 'Avoid known-grey letters: {k} guess(es) reused them.',
  'cluster-trap': 'When many candidates differ in one spot, spend a guess on a probe word covering their differing letters.',
  'outside-better': 'Guessing a non-candidate early often narrows the field faster than hoping to hit the answer.',
}
const tip = (x: Tip) => t(TEXT[x.kind] ?? x.kind, x.v)
const tile = (d: number) => ['s0', 's1', 's2'][d]
const luckLabel = (l: number) => (l >= 0.5 ? { tone: 'correct' as const, text: t('lucky'), icon: Sparkles } : l <= -0.5 ? { tone: 'danger' as const, text: t('unlucky'), icon: TrendingDown } : { tone: 'neutral' as const, text: t('as expected'), icon: Gauge })
const maxBits = computed(() => Math.max(6, ...(p.result?.steps ?? []).flatMap(s => [s.bits, s.expBits, s.best.bits])))
const pct = (v: number) => (100 * Math.max(0, v)) / maxBits.value + '%'
</script>
<template>
  <UiCard :title="title ?? $t('Coach')" :icon="GraduationCap" :subtitle="$t('Each guess compared with the best move by expected information (and the optimal tree where available)')" data-coach>
    <div v-if="busy && !result" class="flex flex-col gap-2 text-caption text-muted"><span>{{ $t('Analysing every possible guess…') }}</span><ProgressBar :value="Math.round((progress ?? 0) * 100)" class="!h-2" :showValue="false" /></div>
    <template v-if="result">
      <div v-if="result.error" class="flex items-center gap-2 text-caption text-red-600 dark:text-red-400 mb-3" data-coach-error><CircleAlert :size="14" />
        {{ result.error.kind === 'invalid-word' ? $t('Guess {i} is not in the word list — analysis stops there.', { i: result.error.i + 1 }) : $t('No answer matches the colours of guess {i} — check the tiles.', { i: result.error.i + 1 }) }}</div>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4" data-coach-summary>
        <div class="rounded-card border border-line bg-surface-2 p-3"><div class="text-caption text-muted">{{ $t('Result') }}</div><div class="text-title font-bold">{{ result.solved ? $t('Solved in {k}', { k: result.steps.length }) : $t('Not solved') }}</div></div>
        <div class="rounded-card border border-line bg-surface-2 p-3"><div class="text-caption text-muted">{{ $t('Information') }}</div><div class="text-title font-bold tabular-nums">{{ result.totalBits.toFixed(1) }} / {{ result.neededBits.toFixed(1) }} {{ $t('bits') }}</div></div>
        <div class="rounded-card border border-line bg-surface-2 p-3"><div class="text-caption text-muted">{{ $t('Skill') }}</div><div class="text-title font-bold tabular-nums" v-tooltip.top="$t('Average share of the best expected information your guesses achieved (guesses with 3+ candidates left)')">{{ Math.round(result.efficiency * 100) }}%</div></div>
        <div class="rounded-card border border-line bg-surface-2 p-3"><div class="text-caption text-muted">{{ $t('Luck') }}</div><div class="text-title font-bold tabular-nums" :class="result.luck >= 0 ? 'text-correct' : 'text-red-600 dark:text-red-400'">{{ result.luck >= 0 ? '+' : '' }}{{ result.luck.toFixed(2) }} {{ $t('bits') }}</div></div>
      </div>
      <ul v-if="result.summary.length" class="flex flex-col gap-1.5 mb-4 text-caption">
        <li v-for="s in result.summary" :key="s.kind" class="flex items-start gap-2"><Lightbulb :size="14" class="text-brand shrink-0 mt-0.5" />{{ t(SUMMARY[s.kind], s.v) }}</li>
      </ul>
      <TransitionGroup name="list" tag="ol" class="flex flex-col gap-3">
        <li v-for="s in result.steps" :key="s.i + s.w" class="rounded-card border border-line p-3 flex flex-col gap-2" data-coach-step>
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-caption text-muted w-5">{{ s.i + 1 }}</span>
            <span class="flex gap-1"><span v-for="(c, j) in s.w" :key="j" class="tile tile-xs" :class="tile(s.d[j])">{{ c }}</span></span>
            <span class="text-caption tabular-nums"><b>{{ s.before }}</b> → <b>{{ s.after }}</b> {{ $t('candidates') }}</span>
            <UiBadge v-if="!s.isCandidate" tone="neutral" v-tooltip.top="$t('This word could not be the answer at that point (a probe)')">{{ $t('probe') }}</UiBadge>
            <div class="flex-1"></div>
            <UiBadge :tone="luckLabel(s.luck).tone" v-tooltip.top="$t('{p}% of possible answers would have left more candidates', { p: Math.round(s.luckPct * 100) })"><component :is="luckLabel(s.luck).icon" :size="11" />{{ luckLabel(s.luck).text }} {{ s.luck >= 0 ? '+' : '' }}{{ s.luck.toFixed(2) }}</UiBadge>
          </div>
          <div class="grid gap-1 text-caption">
            <div class="flex items-center gap-2"><span class="w-20 text-muted">{{ $t('actual') }}</span><div class="flex-1 h-2 rounded-full bg-surface-2 overflow-hidden"><div class="h-full rounded-full transition-all duration-700 ease-out" :class="s.luck >= 0 ? 'bg-correct' : 'bg-present'" :style="{ width: pct(s.bits) }"></div></div><span class="w-20 text-right tabular-nums">{{ s.bits.toFixed(2) }} {{ $t('bits') }}</span></div>
            <div class="flex items-center gap-2"><span class="w-20 text-muted">{{ $t('expected') }}</span><div class="flex-1 h-2 rounded-full bg-surface-2 overflow-hidden"><div class="h-full rounded-full bg-absent transition-all duration-700 ease-out" :style="{ width: pct(s.expBits) }"></div></div><span class="w-20 text-right tabular-nums">{{ s.expBits.toFixed(2) }} {{ $t('bits') }}</span></div>
            <div class="flex items-center gap-2"><span class="w-20 text-muted">{{ $t('best') }}</span><div class="flex-1 h-2 rounded-full bg-surface-2 overflow-hidden"><div class="h-full rounded-full bg-brand-500 transition-all duration-700 ease-out" :style="{ width: pct(s.best.bits) }"></div></div><span class="w-20 text-right tabular-nums">{{ s.best.bits.toFixed(2) }} {{ $t('bits') }}</span></div>
          </div>
          <div v-if="s.before > 1" class="flex flex-wrap gap-x-4 gap-y-1 text-caption">
            <span class="flex items-center gap-1"><Target :size="12" class="text-brand" />{{ $t('Best by entropy') }}: <WordLink :word="s.best.guess" class="font-mono font-semibold" /> · {{ $t('{b} bits, ≈{r} left', { b: s.best.bits.toFixed(2), r: s.best.expRemaining.toFixed(1) }) }}</span>
            <span v-if="s.tree" class="flex items-center gap-1" data-coach-tree><Network :size="12" class="text-correct" />{{ $t('Optimal tree') }}: <WordLink :word="s.tree.guess" class="font-mono font-semibold" /> · {{ $t('{b} bits, ≈{r} left', { b: s.tree.bits.toFixed(2), r: s.tree.expRemaining.toFixed(1) }) }}</span>
            <span class="text-muted">{{ $t('Yours') }}: {{ $t('{b} bits, ≈{r} left', { b: s.expBits.toFixed(2), r: s.expRemaining.toFixed(1) }) }}</span>
          </div>
          <ul v-if="s.tips.length" class="flex flex-col gap-1">
            <li v-for="x in s.tips" :key="x.kind" class="flex items-start gap-2 text-caption" :data-tip="x.kind"><UiBadge :tone="TONE[x.kind]" class="shrink-0"><component :is="ICON[x.kind]" :size="11" /></UiBadge><span>{{ tip(x) }}</span></li>
          </ul>
          <div v-if="s.after > 0 && s.after <= 8" class="text-caption text-muted">{{ $t('Still possible') }}: <span class="font-mono uppercase">{{ s.sample.join(' ') }}</span></div>
        </li>
      </TransitionGroup>
    </template>
  </UiCard>
</template>
