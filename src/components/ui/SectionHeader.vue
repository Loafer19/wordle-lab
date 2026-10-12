<script setup lang="ts">
import type { Component } from 'vue'
import UiIcon from './UiIcon.vue'
defineProps<{ title: string; icon?: Component; subtitle?: string }>()
</script>
<template>
  <div class="flex items-start gap-3 mb-3">
    <div v-if="icon" class="mt-0.5 grid place-items-center size-8 rounded-lg bg-brand-500/12 text-brand-600 dark:text-brand-400"><UiIcon :icon="icon" /></div>
    <div class="flex-1 min-w-0"><h2 class="text-title font-semibold">{{ title }}</h2><p v-if="subtitle" class="text-caption text-muted">{{ subtitle }}</p></div>
    <div class="flex items-center gap-2"><slot name="actions" /></div>
  </div>
</template>
