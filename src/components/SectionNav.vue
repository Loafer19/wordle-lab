<script setup lang="ts">
// Segmented sub-navigation for a section; each option is a real link (#tab=..&view=..).
import { computed } from 'vue'
import { route, href } from '../lib/route'
const p = defineProps<{ tab: string; views: { id: string; label: string; icon: any; hidden?: boolean }[] }>()
const shown = computed(() => p.views.filter(x => !x.hidden || route.view === x.id))
</script>
<template>
  <nav class="flex sm:inline-flex gap-1 p-1 rounded-xl bg-surface-2 border border-line mb-5 max-w-full overflow-x-auto [scrollbar-width:none]" :aria-label="$t('Section views')" data-subnav>
    <a v-for="v in shown" :key="v.id" :href="href(tab, v.id)" :aria-current="route.view === v.id ? 'page' : undefined" data-view-link
      class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-body font-medium transition-colors duration-200 whitespace-nowrap shrink-0"
      :class="route.view === v.id ? 'bg-surface text-fg shadow-sm' : 'text-muted hover:text-fg'">
      <component :is="v.icon" :size="15" />{{ v.label }}
    </a>
  </nav>
</template>
