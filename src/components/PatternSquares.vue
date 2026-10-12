<script setup lang="ts">
import { patternDigits } from '../lib/wordle'
defineProps<{ p: number; size?: number }>()
</script>
<template><span class="inline-flex gap-px align-middle"><i v-for="(d, i) in patternDigits(p)" :key="i" class="rounded-[2px]" :class="['bg-absent', 'bg-present', 'bg-correct'][d]" :style="{ width: (size ?? 10) + 'px', height: (size ?? 10) + 'px' }"></i></span></template>
