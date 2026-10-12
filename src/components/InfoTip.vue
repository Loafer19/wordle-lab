<script setup lang="ts">
import { Info } from 'lucide-vue-next'
defineProps<{ text: string }>()
</script>
<template><span v-tooltip.top="text" tabindex="0" class="inline-flex align-middle ml-1 text-muted hover:text-brand-500 cursor-help transition-colors" :aria-label="text"><Info :size="14" /></span></template>
