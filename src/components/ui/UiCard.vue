<script setup lang="ts">
import type { Component } from 'vue'
import SectionHeader from './SectionHeader.vue'
defineProps<{ title?: string; icon?: Component; subtitle?: string; interactive?: boolean }>()
</script>
<template>
  <section class="bg-surface border border-line rounded-card shadow-card p-4 sm:p-5 text-body" :class="interactive && 'lift'">
    <SectionHeader v-if="title" :title="title" :icon="icon" :subtitle="subtitle"><template #actions><slot name="actions" /></template></SectionHeader>
    <slot />
  </section>
</template>
