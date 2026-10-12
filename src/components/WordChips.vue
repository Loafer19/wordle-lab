<script setup lang="ts">
// Wrapped, clickable word chips (click → meaning popover).
import WordLink from './WordLink.vue'
withDefaults(defineProps<{ words: string[]; max?: number; highlight?: string }>(), { max: 150 })
</script>
<template>
  <TransitionGroup tag="ul" name="list" class="flex flex-wrap gap-1.5" data-chips>
    <li v-for="w in words.slice(0, max)" :key="w">
      <WordLink :word="w" class="chip" :class="w === highlight && 'chip-hi'" />
    </li>
    <li v-if="words.length > max" key="__more" class="chip chip-more">+{{ (words.length - max).toLocaleString() }} more</li>
  </TransitionGroup>
</template>
<style scoped>
:deep(.chip), .chip { display: inline-flex; align-items: center; padding: 0.15rem 0.5rem; border-radius: 0.5rem; border: 1px solid var(--color-line); background: var(--color-surface-2); font-family: ui-monospace, monospace; font-size: 0.8rem; font-weight: 600; letter-spacing: 0.05em; line-height: 1.4; }
:deep(.chip .word-link) { text-decoration: none; }
:deep(.chip):hover { border-color: var(--color-brand-500); }
:deep(.chip-hi) { background: color-mix(in oklab, var(--color-correct) 18%, transparent); border-color: var(--color-correct); }
.chip-more { color: var(--color-muted); font-family: inherit; font-weight: 500; }
</style>
