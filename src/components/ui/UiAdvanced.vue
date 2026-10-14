<script setup lang="ts">
// Collapsed "Advanced" section: content renders only after it is opened (keeps heavy charts off the first paint).
import { ref } from 'vue'
import { ChevronRight, Microscope } from 'lucide-vue-next'
const p = withDefaults(defineProps<{ title?: string; subtitle?: string; open?: boolean }>(), { open: false })
const isOpen = ref(!!p.open), seen = ref(!!p.open)
const toggle = () => { isOpen.value = !isOpen.value; seen.value = true }
</script>
<template>
  <section class="rounded-card border border-dashed border-line-strong/60 bg-surface/60" data-advanced>
    <button type="button" class="w-full flex items-center gap-2 px-4 py-3 text-left cursor-pointer rounded-card hover:bg-surface-2 transition-colors" :aria-expanded="isOpen" @click="toggle" data-advanced-toggle>
      <ChevronRight :size="16" class="transition-transform duration-200 shrink-0" :class="isOpen && 'rotate-90'" /><Microscope :size="16" class="text-muted shrink-0" />
      <span class="flex-1 min-w-0"><span class="font-semibold">{{ title ?? $t('Advanced') }}</span><span v-if="subtitle" class="block text-caption text-muted">{{ subtitle }}</span></span>
    </button>
    <div v-if="seen" v-show="isOpen" class="flex flex-col gap-5 p-3 sm:p-4 pt-0 sm:pt-0"><slot /></div>
  </section>
</template>
