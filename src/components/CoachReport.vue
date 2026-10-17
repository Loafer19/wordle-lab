<script setup lang="ts">
// Per-guess analysis: summary tiles + one StepCard per guess. Used by Play, Assistant (live / review / watch).
import { computed } from 'vue'
import { GraduationCap, Lightbulb, CircleAlert } from 'lucide-vue-next'
import ProgressBar from 'primevue/progressbar'
import { t } from '../lib/i18n'
import type { GameAnalysis } from '../lib/coach'
import UiCard from './ui/UiCard.vue'; import UiStat from './ui/UiStat.vue'
import StepCard from './StepCard.vue'
const p = defineProps<{ result: GameAnalysis | null; busy?: boolean; progress?: number; title?: string; subtitle?: string; notes?: string[]; compact?: boolean }>()
const SUMMARY: Record<string, string> = {
  'grey-reuse': 'Avoid known-grey letters: {k} guess(es) reused them.',
  'cluster-trap': 'When many candidates differ in one spot, spend a guess on a probe word covering their differing letters.',
  'outside-better': 'Guessing a non-candidate early often narrows the field faster than hoping to hit the answer.',
}
const maxBits = computed(() => Math.max(6, ...(p.result?.steps ?? []).flatMap(s => [s.bits, s.expBits, s.best.bits])))
</script>
<template>
  <UiCard :title="title ?? $t('Game review')" :icon="GraduationCap" :subtitle="subtitle ?? $t('Each guess compared with the best move by expected information (and the optimal tree where available)')" data-coach>
    <div v-if="busy && !result" class="flex flex-col gap-2 text-caption text-muted"><span>{{ $t('Analysing every possible guess…') }}</span><ProgressBar :value="Math.round((progress ?? 0) * 100)" class="!h-2" :showValue="false" /></div>
    <template v-if="result">
      <div v-if="result.error" class="flex items-center gap-2 text-caption text-red-600 dark:text-red-400 mb-3" data-coach-error><CircleAlert :size="14" />
        {{ result.error.kind === 'invalid-word' ? $t('Guess {i} is not in the word list — analysis stops there.', { i: result.error.i + 1 }) : $t('No answer matches the colours of guess {i} — check the tiles.', { i: result.error.i + 1 }) }}</div>
      <div v-if="!compact" class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4" data-coach-summary>
        <UiStat text :label="$t('Result')" :value="result.solved ? $t('Solved in {k}', { k: result.steps.length }) : $t('Not solved')" />
        <UiStat :label="$t('Information')" :value="`${result.totalBits.toFixed(1)} / ${result.neededBits.toFixed(1)}`" :sub="$t('bits')" />
        <UiStat :label="$t('Skill')" :value="Math.round(result.efficiency * 100) + '%'" :tip="$t('Average share of the best expected information your guesses achieved (guesses with 3+ candidates left)')" />
        <UiStat :label="$t('Luck')" :value="(result.luck >= 0 ? '+' : '') + result.luck.toFixed(2)" :sub="$t('bits')" :tone="result.luck >= 0 ? 'correct' : 'danger'" :tip="$t('Actual minus expected information, summed over your guesses')" />
      </div>
      <ul v-if="result.summary.length" class="flex flex-col gap-1.5 mb-4 text-caption">
        <li v-for="s in result.summary" :key="s.kind" class="flex items-start gap-2"><Lightbulb :size="14" class="text-brand shrink-0 mt-0.5" />{{ t(SUMMARY[s.kind], s.v) }}</li>
      </ul>
      <TransitionGroup name="list" tag="ol" class="flex flex-col gap-3">
        <StepCard v-for="s in result.steps" :key="s.i + s.w" :s="s" :maxBits="maxBits" :note="notes?.[s.i]" />
      </TransitionGroup>
    </template>
  </UiCard>
</template>
