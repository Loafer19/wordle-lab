<script setup lang="ts">
import type { Component } from 'vue'
import Button from 'primevue/button'
import UiIcon from './UiIcon.vue'
const p = withDefaults(defineProps<{ label?: string; icon?: Component; variant?: 'primary' | 'secondary' | 'ghost'; size?: 'sm' | 'md' | 'lg'; disabled?: boolean; loading?: boolean; ariaLabel?: string }>(), { variant: 'primary', size: 'sm' })
const sev = { primary: undefined, secondary: 'secondary', ghost: 'secondary' } as const
</script>
<template>
  <Button :label="p.label" :severity="sev[p.variant]" :text="p.variant === 'ghost'" :size="p.size === 'md' ? undefined : p.size === 'sm' ? 'small' : 'large'" :disabled="p.disabled" :loading="p.loading" :aria-label="p.ariaLabel ?? p.label"
    class="!transition !duration-200 enabled:hover:!-translate-y-px enabled:active:!translate-y-0 enabled:active:!scale-[.98] disabled:!opacity-45">
    <template v-if="p.icon" #icon><UiIcon :icon="p.icon" :size="p.size === 'lg' ? 'md' : 'sm'" /></template>
  </Button>
</template>
