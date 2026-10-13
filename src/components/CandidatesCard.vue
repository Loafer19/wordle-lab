<script setup lang="ts">
// Shared "possible answers left" card (Play + Solver): count badge, bits of uncertainty, wrapped clickable chips.
import { computed } from 'vue'
import { ListFilter } from 'lucide-vue-next'
import UiCard from './ui/UiCard.vue'; import UiBadge from './ui/UiBadge.vue'; import CountUp from './ui/CountUp.vue'
import InfoTip from './InfoTip.vue'
import WordChips from './WordChips.vue'
import { ANSWERS_HELP } from '../lib/labels'
const p = withDefaults(defineProps<{ words: string[]; title?: string; started?: boolean; max?: number; highlight?: string }>(), { title: '', started: true, max: 150 })
const bits = computed(() => Math.log2(Math.max(1, p.words.length)).toFixed(2))
</script>
<template>
  <UiCard :title="title || $t('Possible answers left')" :icon="ListFilter" :subtitle="$t('{b} bits of uncertainty left', { b: bits })" data-candidates>
    <template #actions><UiBadge tone="brand"><CountUp :value="words.length" /></UiBadge><InfoTip :text="ANSWERS_HELP" /></template>
    <WordChips v-if="started && words.length" :words="words" :max="max" :highlight="highlight" />
    <slot v-else name="empty"><p class="text-muted">{{ $t('Make a guess to narrow it down.') }}</p></slot>
    <slot />
  </UiCard>
</template>
