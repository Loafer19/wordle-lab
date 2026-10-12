<script setup lang="ts">defineProps<{ text: string }>()</script>
<template><span v-tooltip.top="text" class="inline-flex items-center justify-center w-4 h-4 rounded-full border text-[10px] cursor-help muted align-middle ml-1" style="border-color: var(--muted)">i</span></template>
