<script setup lang="ts">
import { ref, computed } from 'vue'
import { Gamepad2, Brain, BarChart3, GitBranch, CaseSensitive, Rocket, Sun, Moon, Sparkles, SlidersHorizontal, Network, Waves, Grid2x2, Map as MapIcon, GitCompare, Send, Github, FlaskConical, Compass, Tag } from 'lucide-vue-next'
import { ready } from './lib/words'
import { isDark, toggleDark } from './lib/theme'
import { route, href } from './lib/route'
import { META, isUA } from './lib/lang'
import UiButton from './components/ui/UiButton.vue'
import UiIcon from './components/ui/UiIcon.vue'
import AppLogo from './components/AppLogo.vue'
import SettingsPopover from './components/SettingsPopover.vue'
import SectionView from './components/SectionView.vue'
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
const sub = {
  strategies: [{ id: 'simulation', label: 'Simulation', icon: BarChart3, comp: SimView }, { id: 'compare', label: 'Compare', icon: GitCompare, comp: CompareView }, { id: 'tuner', label: 'Tuner', icon: SlidersHorizontal, comp: TunerView }],
  explore: [{ id: 'paths', label: 'Decision paths', icon: GitBranch, comp: PathView }, { id: 'tree', label: 'Tree', icon: Network, comp: TreeView }, { id: 'flow', label: 'Flow', icon: Waves, comp: SankeyView }, { id: 'map', label: 'Answer map', icon: MapIcon, comp: AnswerMapView }],
  letters: [{ id: 'letters', label: 'Letters', icon: CaseSensitive, comp: LettersView }, { id: 'patterns', label: 'Patterns', icon: Grid2x2, comp: PatternView }, { id: 'openers', label: 'Openers', icon: Rocket, comp: OpenersView }],
}
const tabs = [
  { id: 'play', label: 'Play', icon: Gamepad2 },
  { id: 'solver', label: 'Solver', icon: Brain },
  { id: 'strategies', label: 'Strategies', icon: FlaskConical },
  { id: 'explore', label: 'Explore', icon: Compass },
  { id: 'letters', label: 'Letters & Patterns', icon: CaseSensitive },
]
const loaded = ref(false); ready.then(() => (loaded.value = true))
const version = __APP_VERSION__, commit = __COMMIT__
const built = new Date(__BUILD_DATE__).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
const current = computed(() => route.tab)
</script>
<template>
  <div class="max-w-6xl mx-auto px-3 sm:px-6 pb-10">
    <header class="flex items-center gap-2 py-4">
      <a :href="href('play')" class="flex items-center gap-2 rounded-lg -mx-1 px-1 focus-visible:outline-2 focus-visible:outline-brand-500" aria-label="Wordle Lab home" data-home>
        <AppLogo />
        <span class="text-xl sm:text-2xl font-extrabold tracking-tight ml-1">Wordle Lab</span>
      </a>
      <span v-if="isUA" class="text-caption font-bold px-1.5 py-0.5 rounded bg-brand-500/15 text-brand-700 dark:text-brand-400" v-tooltip.bottom="'Ukrainian word lists'">UA</span>
      <div class="flex-1"></div>
      <UiButton variant="ghost" :icon="isDark ? Sun : Moon" :ariaLabel="isDark ? 'Switch to light theme' : 'Switch to dark theme'" v-tooltip.bottom="isDark ? 'Light theme' : 'Dark theme'" @click="toggleDark()" />
      <SettingsPopover />
    </header>
    <nav class="sticky top-0 z-10 -mx-3 sm:mx-0 px-3 sm:px-1 py-1.5 bg-bg/85 backdrop-blur border-b border-line mb-5 overflow-x-auto [scrollbar-width:none]" aria-label="Main">
      <div class="flex gap-1 min-w-max">
        <a v-for="t in tabs" :key="t.id" :href="href(t.id)" :aria-current="current === t.id ? 'page' : undefined" data-tab-link :data-tab="t.id"
          class="relative flex items-center gap-2 px-3 py-2 rounded-lg text-body font-medium transition-colors duration-200"
          :class="current === t.id ? 'text-brand-700 dark:text-brand-400 bg-brand-500/10' : 'text-muted hover:text-fg hover:bg-surface-2'">
          <UiIcon :icon="t.icon" />{{ t.label }}
        </a>
      </div>
    </nav>
    <div v-if="!loaded" class="flex items-center gap-2 text-muted"><Sparkles class="animate-spin" :size="16" /> Loading {{ META.name }} dictionaries…</div>
    <main v-else>
      <Transition name="tab" mode="out-in">
        <PlayView v-if="current === 'play'" key="play" />
        <AssistantView v-else-if="current === 'solver'" key="solver" />
        <SectionView v-else :key="current" :tab="current" :views="sub[current as keyof typeof sub]" />
      </Transition>
    </main>
    <footer class="mt-10 pt-6 border-t border-line flex flex-wrap items-center justify-between gap-3 text-caption text-muted">
      <span class="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span>Wordle Lab · MIT · not affiliated with NYT</span>
        <a :href="`https://github.com/Loafer19/wordle-lab/releases/tag/v${version}`" target="_blank" rel="noopener" class="inline-flex items-center gap-1 hover:text-fg" data-version><Tag :size="12" />v{{ version }} · updated {{ built }}</a>
        <a :href="`https://github.com/Loafer19/wordle-lab/commit/${commit}`" target="_blank" rel="noopener" class="font-mono hover:text-fg">{{ commit }}</a>
      </span>
      <span class="flex items-center gap-2">
        <a href="https://t.me/Loafer19" target="_blank" rel="noopener" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line hover:bg-surface-2 hover:text-fg transition-colors"><Send :size="14" class="text-brand" />Made by @Loafer19</a>
        <a href="https://github.com/Loafer19/wordle-lab" target="_blank" rel="noopener" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line hover:bg-surface-2 hover:text-fg transition-colors"><Github :size="14" />Source on GitHub</a>
      </span>
    </footer>
  </div>
</template>
