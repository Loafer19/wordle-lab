<script setup lang="ts">
// Segmented sub-navigation for a section; each option is a real link (#tab=..&view=..).
import { route, href } from '../lib/route'
defineProps<{ tab: string; views: { id: string; label: string; icon: any }[] }>()
</script>
<template>
  <nav class="inline-flex flex-wrap gap-1 p-1 rounded-xl bg-surface-2 border border-line mb-5" aria-label="Section views">
    <a v-for="v in views" :key="v.id" :href="href(tab, v.id)" :aria-current="route.view === v.id ? 'page' : undefined" data-view-link
      class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-body font-medium transition-colors duration-200"
      :class="route.view === v.id ? 'bg-surface text-fg shadow-sm' : 'text-muted hover:text-fg'">
      <component :is="v.icon" :size="15" />{{ v.label }}
    </a>
  </nav>
</template>
