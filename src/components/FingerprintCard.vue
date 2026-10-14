<script setup lang="ts">
// Player fingerprint: skill & luck over time from this browser's Play history (localStorage).
import { computed } from 'vue'
import { Fingerprint as FpIcon, Trash2 } from 'lucide-vue-next'
import { history, fingerprint, nearest } from '../lib/history'
import { simIndex } from '../lib/simdata'
import { shortName } from '../lib/names'
import { t } from '../lib/i18n'
import UiCard from './ui/UiCard.vue'; import UiStat from './ui/UiStat.vue'; import UiButton from './ui/UiButton.vue'
const fp = computed(() => fingerprint(history.value))
const like = computed(() => fp.value && fp.value.avgGuesses ? nearest(fp.value.avgGuesses, simIndex.value.filter(s => s.mode === 'normal')) : undefined)
const last = computed(() => history.value.slice(-30))
const W = 300, H = 64
const skillPath = computed(() => { const g = last.value; if (g.length < 2) return ''; return g.map((x, i) => `${i ? 'L' : 'M'}${(i * W) / (g.length - 1)},${(H - 4 - x.skill * (H - 8)).toFixed(1)}`).join(' ') })
const luckMax = computed(() => Math.max(1, ...last.value.map(g => Math.abs(g.luck))))
const clear = () => { if (confirm(t('Delete your saved game history from this browser?'))) history.value = [] }
</script>
<template>
  <UiCard :title="$t('Your fingerprint')" :icon="FpIcon" :subtitle="$t('Skill and luck over your games in this browser')" data-fingerprint>
    <template v-if="fp" #actions><UiButton :icon="Trash2" variant="ghost" :ariaLabel="$t('Clear history')" v-tooltip.top="$t('Clear history')" @click="clear" /></template>
    <p v-if="!fp" class="text-muted" data-fingerprint-empty>{{ $t('Finish a game to start your fingerprint: each game adds your skill (how close your guesses were to the best move) and luck (how kind the colours were).') }}</p>
    <template v-else>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <UiStat :label="$t('Games')" :value="fp.games" />
        <UiStat :label="$t('Avg skill')" :value="Math.round(fp.skill * 100) + '%'" :sub="fp.trend ? (fp.trend > 0 ? '▲ ' : '▼ ') + Math.abs(Math.round(fp.trend * 100)) + ' ' + $t('pts, last 10') : undefined" :tone="fp.skill >= 0.9 ? 'correct' : fp.skill >= 0.75 ? 'brand' : 'present'" />
        <UiStat :label="$t('Avg luck')" :value="(fp.luck >= 0 ? '+' : '') + fp.luck.toFixed(2)" :sub="$t('bits per game')" :tone="fp.luck >= 0 ? 'correct' : 'danger'" />
        <UiStat :label="$t('Avg guesses')" :value="fp.avgGuesses ? fp.avgGuesses.toFixed(2) : '—'" :sub="$t('win rate {p}%', { p: Math.round(fp.winRate * 100) })" />
      </div>
      <div v-if="last.length >= 2" class="mt-4 grid gap-3 sm:grid-cols-2 text-caption">
        <div><div class="text-muted mb-1">{{ $t('Skill, last {n} games', { n: last.length }) }}</div>
          <svg :viewBox="`0 0 ${W} ${H}`" class="w-full h-16 rounded-lg bg-surface-2" preserveAspectRatio="none" role="img" :aria-label="$t('Skill over time')"><path :d="skillPath" fill="none" stroke="var(--color-brand-500)" stroke-width="2" vector-effect="non-scaling-stroke" /></svg></div>
        <div><div class="text-muted mb-1">{{ $t('Luck, last {n} games', { n: last.length }) }}</div>
          <div class="h-16 rounded-lg bg-surface-2 flex items-center gap-px px-1" role="img" :aria-label="$t('Luck over time')">
            <div v-for="g in last" :key="g.id" class="flex-1 relative h-full"><div class="absolute inset-x-0 rounded-sm" :class="g.luck >= 0 ? 'bg-correct bottom-1/2' : 'bg-present top-1/2'" :style="{ height: Math.max(2, (Math.abs(g.luck) / luckMax) * 28) + 'px' }" :title="g.word.toUpperCase() + ': ' + g.luck.toFixed(2)"></div></div>
          </div></div>
      </div>
      <p v-if="like" class="mt-3 text-caption text-muted" data-fingerprint-like>{{ $t('Your average is closest to the strategy “{s}” ({a} guesses).', { s: shortName(like.id, like.name), a: like.avg.toFixed(2) }) }}</p>
    </template>
  </UiCard>
</template>
