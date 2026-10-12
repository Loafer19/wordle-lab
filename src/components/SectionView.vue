<script setup lang="ts">
import { computed } from 'vue'
import { route } from '../lib/route'
import SectionNav from './SectionNav.vue'
const p = defineProps<{ tab: string; views: { id: string; label: string; icon: any; comp: any }[] }>()
const cur = computed(() => p.views.find(v => v.id === route.view) ?? p.views[0])
</script>
<template>
  <div>
    <SectionNav :tab="tab" :views="views" />
    <Transition name="tab" mode="out-in"><component :is="cur.comp" :key="cur.id" /></Transition>
  </div>
</template>
