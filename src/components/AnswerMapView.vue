<script setup lang="ts">
import { isUA } from '../lib/lang'
import WordLink from './WordLink.vue'
import { ref, computed, watch } from 'vue'
import InputText from 'primevue/inputtext'
import { Map as MapIcon, Search } from 'lucide-vue-next'
import { answers } from '../lib/words'
import { guessScale } from '../lib/tokens'
import { loadFull, simReady, fullId, type Full } from '../lib/simdata'
import UiCard from './ui/UiCard.vue'; import UiBadge from './ui/UiBadge.vue'; import UiButton from './ui/UiButton.vue'
import StrategyPicker from './StrategyPicker.vue'
const id = ref('freqbal-cand'), hard = ref(false), full = ref<Full | null>(null)
watch([id, hard], async () => { await simReady; full.value = await loadFull(fullId(id.value, hard.value)) }, { immediate: true })
const q = ref(''), minG = ref(0), hover = ref<{ w: string; g: number } | null>(null)
const pinned = ref<{ w: string; g: number } | null>(null)
const colors = guessScale
const re = computed(() => { const t = q.value.trim().toLowerCase(); if (!t) return null; try { return new RegExp('^' + t.replace(/[?_]/g, '.').replace(/\*/g, '.*') + (t.length === 5 && !t.includes('*') ? '$' : '')) } catch { return null } })
const cells = computed(() => (full.value ? answers.value.map((w, i) => ({ w, g: full.value!.guesses[i] })) : []))
const match = (c: { w: string; g: number }) => (!re.value || re.value.test(c.w)) && c.g >= minG.value
const matched = computed(() => cells.value.filter(match))
const counts = computed(() => [1, 2, 3, 4, 5, 6, 7].map(k => cells.value.filter(c => (k === 7 ? c.g >= 7 : c.g === k)).length))
const avgMatched = computed(() => (matched.value.length ? matched.value.reduce((a, c) => a + c.g, 0) / matched.value.length : 0))
const presets = isUA ? ['с*', 'к*', '*ка', '*ня', '?ора'] : ['?ight', '?ills', '?atch', '?ound', '?aker', 's*', '*er']
</script>
<template>
  <div class="flex flex-col gap-5">
    <UiCard :title="$t('Answer map')" :icon="MapIcon" :subtitle="$t('Every possible answer as one cell, coloured by how many guesses the strategy needs. Hover a cell to see the word, click to pin it, click the word for its meaning.')">
      <div class="flex flex-wrap items-center gap-3">
        <StrategyPicker v-model:id="id" v-model:hard="hard" />
        <span class="relative"><Search :size="14" class="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" /><InputText v-model="q" :placeholder="isUA ? 'фільтр: с*, *ка, ?ора' : 'filter: ?ight, s*, *er'" size="small" class="!pl-8 w-48 max-w-full" /></span>
        <UiButton v-for="p in presets" :key="p" :label="p" variant="ghost" @click="q = p" />
      </div>
      <div class="flex flex-wrap items-center gap-2 mt-3">
        <button v-for="k in 7" :key="k" class="flex items-center gap-1.5 px-2 py-1 rounded-lg border text-caption transition-colors" :class="minG === k ? 'border-brand-500 bg-brand-500/10' : 'border-line hover:bg-surface-2'" @click="minG = minG === k ? 0 : k">
          <i class="size-3 rounded-sm" :style="{ background: colors[k] }"></i>{{ k === 7 ? '7+ (' + $t('fail') + ')' : k }} · {{ counts[k - 1] }}
        </button>
        <span class="text-caption text-muted">{{ $t('click = show only ≥ that many') }}</span>
      </div>
    </UiCard>
    <UiCard>
      <div class="flex flex-wrap items-center gap-2 mb-3 min-h-6 text-body">
        <template v-if="hover"><b class="font-mono uppercase"><WordLink :word="hover.w" /></b><UiBadge :tone="hover.g <= 3 ? 'correct' : hover.g <= 5 ? 'present' : 'danger'">{{ $t('{n} guesses', { n: hover.g }) }}</UiBadge></template>
        <span v-else class="text-caption text-muted" data-map-hint>{{ $t('Hover or tap a cell to see the word') }}</span>
        <div class="flex-1"></div>
        <UiBadge tone="brand">{{ $t('{n} shown · avg {a}', { n: matched.length, a: avgMatched.toFixed(2) }) }}</UiBadge>
      </div>
      <div v-if="!full" class="grid gap-[2px]" style="grid-template-columns: repeat(auto-fill, minmax(11px, 1fr))" data-skeleton><div v-for="i in 400" :key="i" class="aspect-square rounded-[2px] bg-surface-2 animate-pulse"></div></div>
      <div v-else class="grid gap-[2px] overflow-hidden p-1 -m-1" style="grid-template-columns: repeat(auto-fill, minmax(11px, 1fr))" @mouseleave="hover = pinned" data-map-grid>
        <div v-for="c in cells" :key="c.w" @click="pinned = c; hover = c" class="aspect-square rounded-[2px] transition-[opacity,transform] duration-200 hover:scale-150 hover:z-10 cursor-pointer" :style="{ background: colors[Math.min(7, c.g)], opacity: match(c) ? 1 : 0.12 }" :title="`${c.w.toUpperCase()}: ${c.g}`" @mouseenter="hover = c"></div>
      </div>
      <div v-if="re && matched.length <= 80" class="mt-4 flex flex-wrap gap-1.5">
        <UiBadge v-for="c in [...matched].sort((a, b) => b.g - a.g)" :key="c.w" :tone="c.g <= 3 ? 'correct' : c.g <= 5 ? 'present' : 'danger'"><WordLink :word="c.w" class="font-mono uppercase" /> {{ c.g }}</UiBadge>
      </div>
    </UiCard>
  </div>
</template>
