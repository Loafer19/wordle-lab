<script setup lang="ts">
import type { Component } from 'vue'
withDefaults(defineProps<{ icon: Component; size?: 'xs' | 'sm' | 'md' | 'lg' }>(), { size: 'sm' })
const px = { xs: 14, sm: 16, md: 20, lg: 28 }
</script>
<template><component :is="icon" :size="px[size]" :stroke-width="2" class="shrink-0" aria-hidden="true" /></template>
