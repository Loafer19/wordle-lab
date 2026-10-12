<script setup lang="ts">
import { ref, watch } from 'vue'
import { BookOpen, Volume2, ExternalLink, Loader2 } from 'lucide-vue-next'
import { define, type Def } from '../lib/dictionary'
import UiBadge from './ui/UiBadge.vue'
const props = defineProps<{ word: string; compact?: boolean }>()
const def = ref<Def | null>(null), loading = ref(true)
watch(() => props.word, async w => { loading.value = true; def.value = null; def.value = await define(w); loading.value = false }, { immediate: true })
const play = () => def.value?.au && new Audio(def.value.au).play().catch(() => {})
</script>
<template>
  <div class="flex flex-col gap-2" :class="compact ? 'w-72 max-w-[80vw]' : ''" data-meaning>
    <div class="flex items-center gap-2">
      <BookOpen :size="16" class="text-brand shrink-0" />
      <span class="font-mono font-bold tracking-widest text-lg">{{ word.toUpperCase() }}</span>
      <span v-if="def?.ph" class="text-caption text-muted">{{ def.ph }}</span>
      <button v-if="def?.au" class="ml-auto p-1 rounded-md hover:bg-surface-2 text-muted hover:text-fg" aria-label="Play pronunciation" @click="play"><Volume2 :size="16" /></button>
    </div>
    <div v-if="loading" class="flex items-center gap-2 text-caption text-muted"><Loader2 :size="14" class="animate-spin" />Looking up…</div>
    <template v-else-if="def">
      <div v-for="m in def.m.slice(0, compact ? 2 : 3)" :key="m.p" class="flex flex-col gap-1">
        <div class="flex items-start gap-2"><UiBadge tone="neutral">{{ m.p }}</UiBadge><span class="text-body leading-snug">{{ m.d }}</span></div>
        <p v-if="m.e" class="text-caption text-muted italic pl-1 border-l-2 border-[var(--c-border)] ml-1">“{{ m.e }}”</p>
      </div>
    </template>
    <p v-else class="text-caption text-muted">No dictionary entry found for this word (many valid Wordle guesses are rare or plural forms).</p>
    <a :href="`https://www.merriam-webster.com/dictionary/${word}`" target="_blank" rel="noopener" class="text-caption text-brand inline-flex items-center gap-1 hover:underline">More on Merriam-Webster <ExternalLink :size="12" /></a>
  </div>
</template>
