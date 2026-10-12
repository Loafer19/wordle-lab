<script setup lang="ts">
withDefaults(defineProps<{ tone?: 'neutral' | 'brand' | 'correct' | 'present' | 'danger' }>(), { tone: 'neutral' })
const tones = { neutral: 'bg-surface-2 text-muted border-line', brand: 'bg-brand-500/12 text-brand-700 dark:text-brand-400 border-brand-500/30', correct: 'bg-correct/15 text-correct border-correct/30', present: 'bg-present/15 text-present border-present/30', danger: 'bg-red-500/12 text-red-600 dark:text-red-400 border-red-500/30' }
</script>
<template><span class="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-caption font-medium" :class="tones[tone]"><slot /></span></template>
