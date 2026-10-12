<script setup lang="ts">
import { computed } from 'vue'
import { Activity, Sparkles, TrendingDown } from 'lucide-vue-next'
import { answers } from '../lib/words'
import { entropy, filter, digitsToPattern } from '../lib/wordle'
import UiCard from './ui/UiCard.vue'; import UiBadge from './ui/UiBadge.vue'
const props = defineProps<{ rows: { w: string; d: number[] }[] }>()
const stats = computed(() => {
  let cands = answers.value
  return props.rows.map(r => {
    const before = cands.length, exp = entropy(r.w, cands)
    cands = filter(cands, r.w, digitsToPattern(r.d))
    const after = Math.max(1, cands.length), act = Math.log2(before / after)
    return { w: r.w, before, after: cands.length, exp, act, luck: act - exp }
  })
})
const total = computed(() => stats.value.reduce((a, s) => a + s.act, 0))
const maxBits = computed(() => Math.max(6, ...stats.value.flatMap(s => [s.exp, s.act])))
</script>
<template>
  <UiCard title="Information per guess" :icon="Activity" :subtitle="`Expected vs actual bits · total ${total.toFixed(2)} of ${Math.log2(answers.length).toFixed(2)} bits needed`">
    <p v-if="!stats.length" class="text-muted">Make a guess to see how much information it gave.</p>
    <TransitionGroup name="list" tag="div" class="flex flex-col gap-3">
      <div v-for="(s, i) in stats" :key="i + s.w" class="text-caption">
        <div class="flex items-center gap-2 mb-1">
          <b class="font-mono uppercase">{{ s.w }}</b><span class="text-muted">{{ s.before }} → {{ s.after }}</span><div class="flex-1"></div>
          <UiBadge v-if="s.luck > 0.5" tone="correct"><Sparkles :size="11" />lucky +{{ s.luck.toFixed(2) }}</UiBadge>
          <UiBadge v-else-if="s.luck < -0.5" tone="danger"><TrendingDown :size="11" />unlucky {{ s.luck.toFixed(2) }}</UiBadge>
          <UiBadge v-else>as expected</UiBadge>
        </div>
        <div class="flex items-center gap-2"><span class="w-14 text-muted">expected</span><div class="flex-1 h-2 rounded-full bg-surface-2 overflow-hidden"><div class="h-full rounded-full bg-absent transition-all duration-700 ease-out" :style="{ width: (100 * s.exp) / maxBits + '%' }"></div></div><span class="w-16 text-right tabular-nums">{{ s.exp.toFixed(2) }} bits</span></div>
        <div class="flex items-center gap-2"><span class="w-14 text-muted">actual</span><div class="flex-1 h-2 rounded-full bg-surface-2 overflow-hidden"><div class="h-full rounded-full transition-all duration-700 ease-out" :class="s.luck >= 0 ? 'bg-correct' : 'bg-present'" :style="{ width: (100 * s.act) / maxBits + '%' }"></div></div><span class="w-16 text-right tabular-nums">{{ s.act.toFixed(2) }} bits</span></div>
      </div>
    </TransitionGroup>
  </UiCard>
</template>
