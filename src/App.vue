<script setup lang="ts">
import { t } from './lib/i18n'
import { ref, computed } from 'vue'
import { Gamepad2, Brain, BarChart3, GitBranch, CaseSensitive, Rocket, Sun, Moon, Sparkles, Network, Waves, Grid2x2, Map as MapIcon, GitCompare, Blocks, Send, Github, FlaskConical, Compass, Tag, Scale, History, GraduationCap } from 'lucide-vue-next'
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
import LabView from './components/LabView.vue'
import CoachView from './components/CoachView.vue'
const sub = {
  strategies: [{ id: 'simulation', label: t('Simulation'), icon: BarChart3, comp: SimView }, { id: 'compare', label: t('Compare'), icon: GitCompare, comp: CompareView }, { id: 'lab', label: t('Strategy Lab'), icon: Blocks, comp: LabView }],
  explore: [{ id: 'paths', label: t('Decision paths'), icon: GitBranch, comp: PathView }, { id: 'tree', label: t('Tree'), icon: Network, comp: TreeView }, { id: 'flow', label: t('Flow'), icon: Waves, comp: SankeyView }, { id: 'map', label: t('Answer map'), icon: MapIcon, comp: AnswerMapView }],
  analytics: [{ id: 'letters', label: t('Letters'), icon: CaseSensitive, comp: LettersView }, { id: 'patterns', label: t('Patterns'), icon: Grid2x2, comp: PatternView }, { id: 'openers', label: t('Openers'), icon: Rocket, comp: OpenersView }],
}
const tabs = [
  { id: 'play', label: t('Play'), icon: Gamepad2 },
  { id: 'solver', label: t('Solver'), icon: Brain },
  { id: 'coach', label: t('Coach'), icon: GraduationCap },
  { id: 'strategies', label: t('Strategies'), icon: FlaskConical },
  { id: 'explore', label: t('Explore'), icon: Compass },
  { id: 'analytics', label: t('Analytics'), icon: CaseSensitive },
]
const loaded = ref(false); ready.then(() => (loaded.value = true))
const version = __APP_VERSION__, commit = __COMMIT__
const commitUrl = commit && commit !== 'dev' ? `https://github.com/Loafer19/wordle-lab/commit/${commit}` : 'https://github.com/Loafer19/wordle-lab/blob/main/CHANGELOG.md'
const built = new Date(__BUILD_DATE__).toLocaleDateString(isUA ? 'uk-UA' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
const current = computed(() => route.tab)
</script>
<template>
  <div class="max-w-6xl mx-auto px-3 sm:px-6 pb-10">
    <header class="flex items-center gap-2 py-4">
      <a :href="href('play')" class="flex items-center gap-2 rounded-lg -mx-1 px-1 focus-visible:outline-2 focus-visible:outline-brand-500" :aria-label="$t('Wordle Lab home')" data-home>
        <AppLogo />
        <span class="text-xl sm:text-2xl font-extrabold tracking-tight ml-1">{{ $t('Wordle Lab') }}</span>
      </a>
      <span v-if="isUA" class="text-caption font-bold px-1.5 py-0.5 rounded bg-brand-500/15 text-brand-700 dark:text-brand-400" v-tooltip.bottom="$t('Ukrainian word lists')">UA</span>
      <div class="flex-1"></div>
      <UiButton variant="ghost" :icon="isDark ? Sun : Moon" :ariaLabel="isDark ? t('Switch to light theme') : t('Switch to dark theme')" v-tooltip.bottom="isDark ? t('Light theme') : t('Dark theme')" @click="toggleDark()" />
      <SettingsPopover />
    </header>
    <nav class="sticky top-0 z-10 -mx-3 sm:mx-0 px-3 sm:px-1 py-1.5 bg-bg/85 backdrop-blur border-b border-line mb-5 overflow-x-auto [scrollbar-width:none]" :aria-label="$t('Main')">
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
        <CoachView v-else-if="current === 'coach'" key="coach" />
        <SectionView v-else :key="current" :tab="current" :views="sub[current as keyof typeof sub]" />
      </Transition>
    </main>
    <footer class="mt-10 pt-6 border-t border-line flex flex-wrap items-center justify-between gap-3 text-caption text-muted" data-footer>
      <span class="flex flex-wrap items-center gap-2" data-footer-left>
        <span class="inline-flex items-center gap-1.5 h-8 px-3 rounded-full border border-line bg-surface"><Scale :size="13" />{{ $t('Wordle Lab · MIT · not affiliated with NYT') }}</span>
        <a href="https://t.me/Loafer19" target="_blank" rel="noopener" class="inline-flex items-center gap-1.5 h-8 px-3 rounded-full border border-line bg-surface hover:bg-surface-2 hover:text-fg transition-colors"><Send :size="13" class="text-brand" />{{ $t('Made by @Loafer19') }}</a>
        <a href="https://github.com/Loafer19/wordle-lab" target="_blank" rel="noopener" class="inline-flex items-center gap-1.5 h-8 px-3 rounded-full border border-line bg-surface hover:bg-surface-2 hover:text-fg transition-colors"><Github :size="13" />{{ $t('Source on GitHub') }}</a>
      </span>
      <span class="flex flex-wrap items-center gap-2" data-footer-right>
        <a :href="`https://github.com/Loafer19/wordle-lab/releases/tag/v${version}`" target="_blank" rel="noopener" class="inline-flex items-center gap-1.5 h-8 px-3 rounded-full border border-line bg-surface hover:bg-surface-2 hover:text-fg transition-colors font-mono font-semibold !text-brand-700 dark:!text-brand-400 !border-brand-500/30" v-tooltip.top="$t('Release notes')" data-version><Tag :size="13" />v{{ version }}</a>
        <a :href="commitUrl" target="_blank" rel="noopener" class="inline-flex items-center gap-1.5 h-8 px-3 rounded-full border border-line bg-surface hover:bg-surface-2 hover:text-fg transition-colors" v-tooltip.top="commit && commit !== 'dev' ? $t('Commit {c}', { c: commit }) : $t('Changelog')" data-updated><History :size="13" />{{ $t('updated {d}', { d: built }) }}</a>
      </span>
    </footer>
  </div>
</template>
