<script setup lang="ts">
import { CornerDownLeft, Delete } from 'lucide-vue-next'
import { META } from '../lib/lang'
const p = defineProps<{ states: Record<string, number>; active?: string }>()
const emit = defineEmits<{ press: [key: string] }>()
const rows = META.rows
const stateCls = (c: string) => {
  const s = p.states[c]
  return s === undefined ? 'bg-key text-key-fg border-black/15 dark:border-black/40 hover:brightness-95 dark:hover:brightness-125'
    : ['bg-absent text-white/70 border-black/30', 'bg-present text-white border-black/25', 'bg-correct text-white border-black/25'][s]
}
const base = 'h-12 sm:h-14 rounded-key border-b-[3px] font-bold uppercase select-none grid place-items-center transition-[transform,filter,background-color] duration-150 ease-out active:translate-y-px active:border-b active:scale-95 focus-visible:outline-2 focus-visible:outline-brand-500'
</script>
<template>
  <div class="flex flex-col gap-1.5 w-full max-w-[500px] select-none" role="group" aria-label="Keyboard">
    <div v-for="(row, ri) in rows" :key="row" class="flex gap-1 sm:gap-1.5 justify-center">
      <div v-if="ri === 1 && rows[1].length < rows[0].length" class="flex-[0.5]"></div>
      <button v-if="ri === 2" :class="[base, 'flex-[1.6] bg-key text-key-fg border-black/15 dark:border-black/40 hover:brightness-95 dark:hover:brightness-125', active === 'enter' && 'scale-95 translate-y-px']" aria-label="Enter" @click="emit('press', 'enter')"><CornerDownLeft :size="20" /></button>
      <button v-for="c in row" :key="c" :class="[base, 'flex-1 text-sm sm:text-base', stateCls(c), active === c && 'scale-95 translate-y-px']" :aria-label="c" @click="emit('press', c)">{{ c }}</button>
      <button v-if="ri === 2" :class="[base, 'flex-[1.6] bg-key text-key-fg border-black/15 dark:border-black/40 hover:brightness-95 dark:hover:brightness-125', active === 'back' && 'scale-95 translate-y-px']" aria-label="Backspace" @click="emit('press', 'back')"><Delete :size="20" /></button>
      <div v-if="ri === 1 && rows[1].length < rows[0].length" class="flex-[0.5]"></div>
    </div>
  </div>
</template>
