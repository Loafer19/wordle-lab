<script setup lang="ts">
// One KPI tile (label / big value / small note). Same look everywhere: Coach summary, Compare, Lab, fingerprint.
// `text`: the value is words (e.g. "Solved in 2"), not a number: a slightly smaller size that wraps instead of being cut off.
import type { Component } from 'vue'
import Skeleton from 'primevue/skeleton'
withDefaults(defineProps<{ label: string; value?: string | number | null; sub?: string; icon?: Component; tone?: 'neutral' | 'correct' | 'present' | 'danger' | 'brand'; tip?: string; loading?: boolean; text?: boolean }>(), { tone: 'neutral' })
const tones = { neutral: '', correct: 'text-correct', present: 'text-present', danger: 'text-red-600 dark:text-red-400', brand: 'text-brand-700 dark:text-brand-400' }
</script>
<template>
  <div class="rounded-card border border-line bg-surface p-3 sm:p-4 min-w-0 shadow-card" data-stat>
    <div class="text-caption text-muted flex items-center gap-1 truncate"><component v-if="icon" :is="icon" :size="12" class="shrink-0" />{{ label }}</div>
    <Skeleton v-if="loading || value === null || value === undefined" width="5rem" height="1.75rem" class="my-1" data-skeleton />
    <div v-else class="font-extrabold" :class="[tones[tone], text ? 'text-lg sm:text-xl leading-tight py-0.5 break-words text-balance' : 'text-2xl tabular-nums truncate']" v-tooltip.top="tip" :data-stat-text="text || undefined"><slot>{{ value }}</slot></div>
    <div v-if="sub" class="text-caption text-muted truncate" :title="sub">{{ sub }}</div>
  </div>
</template>
