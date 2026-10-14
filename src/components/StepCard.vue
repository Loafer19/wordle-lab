<script setup lang="ts">
// One analysed guess (tiles, candidates before→after, luck, actual/expected/best bits, best moves, tips).
// Shared by Play's post-game review, the live Assistant, "Review a game" and "Watch a strategy".
import { computed } from 'vue'
import { Sparkles, TrendingDown, Target, Ban, Repeat2, MoveHorizontal, Layers, Compass, CircleCheck, Trophy, Network, Gauge } from 'lucide-vue-next'
import { t } from '../lib/i18n'
import type { StepAnalysis, Tip } from '../lib/coach'
import UiBadge from './ui/UiBadge.vue'
import WordLink from './WordLink.vue'
const p = defineProps<{ s: StepAnalysis; maxBits: number; note?: string }>()
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
const tip = (x: Tip) => t(TEXT[x.kind] ?? x.kind, x.v)
const luck = computed(() => (p.s.luck >= 0.5 ? { tone: 'correct' as const, text: t('lucky'), icon: Sparkles } : p.s.luck <= -0.5 ? { tone: 'danger' as const, text: t('unlucky'), icon: TrendingDown } : { tone: 'neutral' as const, text: t('as expected'), icon: Gauge }))
const pct = (v: number) => (100 * Math.max(0, v)) / p.maxBits + '%'
const f2 = (v: number) => v.toFixed(2)
const bars = computed(() => [
  { l: t('actual'), v: p.s.bits, c: p.s.luck >= 0 ? 'bg-correct' : 'bg-present' },
  { l: t('expected'), v: p.s.expBits, c: 'bg-absent' },
  { l: t('best'), v: p.s.best.bits, c: 'bg-brand-500' },
])
</script>
<template>
  <li class="rounded-card border border-line p-3 flex flex-col gap-2 min-w-0" data-coach-step>
    <div class="flex flex-wrap items-center gap-2">
      <span class="text-caption text-muted w-5">{{ s.i + 1 }}</span>
      <span class="flex gap-1"><span v-for="(c, j) in s.w" :key="j" class="tile tile-xs" :class="'s' + s.d[j]">{{ c }}</span></span>
      <span class="text-caption tabular-nums"><b>{{ s.before }}</b> → <b>{{ s.after }}</b> {{ $t('candidates') }}</span>
      <UiBadge v-if="!s.isCandidate" tone="neutral" v-tooltip.top="$t('This word could not be the answer at that point (a probe)')">{{ $t('probe') }}</UiBadge>
      <div class="flex-1"></div>
      <UiBadge :tone="luck.tone" v-tooltip.top="$t('{p}% of possible answers would have left more candidates', { p: Math.round(s.luckPct * 100) })"><component :is="luck.icon" :size="11" />{{ luck.text }} {{ s.luck >= 0 ? '+' : '' }}{{ f2(s.luck) }}</UiBadge>
    </div>
    <p v-if="note" class="text-caption text-muted" data-step-note>{{ note }}</p>
    <div class="grid gap-1 text-caption">
      <div v-for="b in bars" :key="b.l" class="flex items-center gap-2"><span class="w-16 sm:w-20 text-muted truncate">{{ b.l }}</span><div class="flex-1 h-2 rounded-full bg-surface-2 overflow-hidden"><div class="h-full rounded-full transition-all duration-700 ease-out" :class="b.c" :style="{ width: pct(b.v) }"></div></div><span class="w-16 sm:w-20 text-right tabular-nums" :title="String(b.v)">{{ f2(b.v) }} {{ $t('bits') }}</span></div>
    </div>
    <div v-if="s.before > 1" class="flex flex-wrap gap-x-4 gap-y-1 text-caption">
      <span class="flex flex-wrap items-center gap-1"><Target :size="12" class="text-brand" />{{ $t('Best by entropy') }}: <WordLink :word="s.best.guess" class="font-mono font-semibold" /> · {{ $t('{b} bits, ≈{r} left', { b: f2(s.best.bits), r: s.best.expRemaining.toFixed(1) }) }}</span>
      <span v-if="s.tree" class="flex flex-wrap items-center gap-1" data-coach-tree><Network :size="12" class="text-correct" />{{ $t('Optimal tree') }}: <WordLink :word="s.tree.guess" class="font-mono font-semibold" /> · {{ $t('{b} bits, ≈{r} left', { b: f2(s.tree.bits), r: s.tree.expRemaining.toFixed(1) }) }}</span>
      <span class="text-muted">{{ $t('Yours') }}: {{ $t('{b} bits, ≈{r} left', { b: f2(s.expBits), r: s.expRemaining.toFixed(1) }) }}</span>
    </div>
    <ul v-if="s.tips.length" class="flex flex-col gap-1">
      <li v-for="x in s.tips" :key="x.kind" class="flex items-start gap-2 text-caption" :data-tip="x.kind"><UiBadge :tone="TONE[x.kind]" class="shrink-0"><component :is="ICON[x.kind]" :size="11" /></UiBadge><span>{{ tip(x) }}</span></li>
    </ul>
    <div v-if="s.after > 0 && s.after <= 8" class="text-caption text-muted">{{ $t('Still possible') }}: <span class="font-mono uppercase">{{ s.sample.join(' ') }}</span></div>
  </li>
</template>
