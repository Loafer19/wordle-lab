<script setup lang="ts">
import { computed, toRef } from 'vue'
import { useTransition, usePreferredReducedMotion } from '@vueuse/core'
const p = withDefaults(defineProps<{ value: number; decimals?: number }>(), { decimals: 0 })
const reduced = usePreferredReducedMotion()
const v = useTransition(toRef(p, 'value'), { duration: computed(() => (reduced.value === 'reduce' ? 0 : 700)), transition: [0.22, 1, 0.36, 1] })
</script>
<template><span class="tabular-nums">{{ v.toFixed(decimals) }}</span></template>
