<script setup lang="ts">
import { ref } from 'vue'
import { useEventListener } from '@vueuse/core'
import { Gamepad2, Brain, BarChart3, GitBranch, CaseSensitive, Rocket, Sun, Moon, BookOpen, Sparkles, SlidersHorizontal, Network, Waves, Grid2x2, Map as MapIcon, GitCompare, Send, Github } from 'lucide-vue-next'
import { ready } from './lib/words'
import { isDark, toggleDark } from './lib/theme'
import { ANSWERS_HELP, ALLOWED_HELP, ANSWERS_LABEL, ALLOWED_LABEL } from './lib/labels'
import UiButton from './components/ui/UiButton.vue'
import UiIcon from './components/ui/UiIcon.vue'
import PlayView from './components/PlayView.vue'
import AssistantView from './components/AssistantView.vue'
import SimView from './components/SimView.vue'
import PathView from './components/PathView.vue'
import LettersView from './components/LettersView.vue'
import OpenersView from './components/OpenersView.vue'
import CompareView from './components/CompareView.vue'
import AnswerMapView from './components/AnswerMapView.vue'
import PatternView from './components/PatternView.vue'
import SankeyView from './components/SankeyView.vue'
import TreeView from './components/TreeView.vue'
import TunerView from './components/TunerView.vue'
const tabs = [
  { id: 'play', label: 'Play', icon: Gamepad2, comp: PlayView },
  { id: 'assist', label: 'Solver', icon: Brain, comp: AssistantView },
  { id: 'sim', label: 'Simulation', icon: BarChart3, comp: SimView },
  { id: 'path', label: 'Decision paths', icon: GitBranch, comp: PathView },
  { id: 'letters', label: 'Letters', icon: CaseSensitive, comp: LettersView },
  { id: 'tuner', label: 'Tuner', icon: SlidersHorizontal, comp: TunerView },
  { id: 'tree', label: 'Tree', icon: Network, comp: TreeView },
  { id: 'flow', label: 'Flow', icon: Waves, comp: SankeyView },
  { id: 'patterns', label: 'Patterns', icon: Grid2x2, comp: PatternView },
  { id: 'map', label: 'Answer map', icon: MapIcon, comp: AnswerMapView },
  { id: 'compare', label: 'Compare', icon: GitCompare, comp: CompareView },
  { id: 'openers', label: 'Openers', icon: Rocket, comp: OpenersView },
]
const loaded = ref(false); ready.then(() => (loaded.value = true))
const fromHash = () => { const t = location.hash.match(/tab=(\w+)/)?.[1]; return tabs.some(x => x.id === t) ? t! : 'play' }
const tab = ref(fromHash())
useEventListener(window, 'hashchange', () => (tab.value = fromHash()))
const setTab = (v: string) => { tab.value = v; history.replaceState(null, '', '#tab=' + v) }
const showWords = ref(false)
</script>
<template>
  <div class="max-w-6xl mx-auto px-3 sm:px-6 pb-10">
    <header class="flex items-center gap-2 py-4">
      <div class="flex gap-0.5" aria-hidden="true"><span class="size-5 rounded bg-correct"></span><span class="size-5 rounded bg-present"></span><span class="size-5 rounded bg-absent"></span></div>
      <h1 class="text-xl sm:text-2xl font-extrabold tracking-tight ml-1">Wordle Lab</h1>
      <div class="flex-1"></div>
      <UiButton variant="ghost" :icon="BookOpen" :label="showWords ? 'Hide' : 'Word lists'" ariaLabel="What are the word lists?" @click="showWords = !showWords" />
      <UiButton variant="secondary" :icon="isDark ? Sun : Moon" :ariaLabel="isDark ? 'Switch to light theme' : 'Switch to dark theme'" v-tooltip.bottom="isDark ? 'Light theme' : 'Dark theme'" @click="toggleDark()" />
    </header>
    <Transition name="tab">
      <div v-if="showWords" class="mb-4 grid sm:grid-cols-2 gap-3 text-body">
        <div class="bg-surface border border-line rounded-card p-4"><b>{{ ANSWERS_LABEL }}</b><p class="text-muted mt-1">{{ ANSWERS_HELP }}</p></div>
        <div class="bg-surface border border-line rounded-card p-4"><b>{{ ALLOWED_LABEL }}</b><p class="text-muted mt-1">{{ ALLOWED_HELP }}</p></div>
      </div>
    </Transition>
    <nav class="sticky top-0 z-10 -mx-3 sm:mx-0 px-3 sm:px-1 py-1.5 bg-bg/85 backdrop-blur border-b border-line mb-5 overflow-x-auto [scrollbar-width:none]" role="tablist">
      <div class="flex gap-1 min-w-max">
        <button v-for="t in tabs" :key="t.id" role="tab" :aria-selected="tab === t.id" @click="setTab(t.id)"
          class="relative flex items-center gap-2 px-3 py-2 rounded-lg text-body font-medium transition-colors duration-200"
          :class="tab === t.id ? 'text-brand-700 dark:text-brand-400 bg-brand-500/10' : 'text-muted hover:text-fg hover:bg-surface-2'">
          <UiIcon :icon="t.icon" />{{ t.label }}
        </button>
      </div>
    </nav>
    <div v-if="!loaded" class="flex items-center gap-2 text-muted"><Sparkles class="animate-spin" :size="16" /> Loading dictionaries…</div>
    <main v-else>
      <Transition name="tab" mode="out-in"><component :is="tabs.find(t => t.id === tab)!.comp" :key="tab" /></Transition>
    </main>
    <footer class="max-w-6xl mx-auto px-4 py-8 mt-6 border-t border-line flex flex-wrap items-center justify-between gap-3 text-caption text-muted">
      <span>Wordle Lab · open source, MIT · not affiliated with NYT</span>
      <span class="flex items-center gap-2">
        <a href="https://t.me/Loafer19" target="_blank" rel="noopener" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line hover:bg-surface-2 hover:text-fg transition-colors"><Send :size="14" class="text-brand" />Made by @Loafer19</a>
        <a href="https://github.com/Loafer19/wordle-lab" target="_blank" rel="noopener" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line hover:bg-surface-2 hover:text-fg transition-colors"><Github :size="14" />Source on GitHub</a>
      </span>
    </footer>
  </div>
</template>
