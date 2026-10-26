<script setup lang="ts">
import { t } from './lib/i18n'
import { ref, computed, defineAsyncComponent } from 'vue'
import { Gamepad2, Brain, CaseSensitive, Rocket, Sun, Moon, Sparkles, Network, Waves, Map as MapIcon, GitCompare, Blocks, Send, Github, FlaskConical, Compass, Tag, Scale, History, GraduationCap, Eye, Footprints, ScanSearch, Trophy, Users, Telescope } from 'lucide-vue-next'
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
// every non-Play view is its own chunk (ECharts and the heavier views load only when opened)
const loaders: (() => Promise<any>)[] = []
const lazy = (l: () => Promise<any>) => (loaders.push(l), defineAsyncComponent(l))
const sub = {
  assistant: [{ id: 'solve', label: t('Help me now'), icon: Brain, comp: lazy(() => import('./components/SolverView.vue')) }, { id: 'review', label: t('Review a game'), icon: GraduationCap, comp: lazy(() => import('./components/CoachView.vue')) }, { id: 'watch', label: t('Watch a strategy'), icon: Eye, comp: lazy(() => import('./components/WatchView.vue')) }],
  learn: [{ id: 'guide', label: t('Start here'), icon: Footprints, comp: lazy(() => import('./components/GuideView.vue')) }, { id: 'letters', label: t('Letters'), icon: CaseSensitive, comp: lazy(() => import('./components/LettersView.vue')) }, { id: 'openers', label: t('Top openers'), icon: Rocket, comp: lazy(() => import('./components/OpenersView.vue')) }, { id: 'inspector', label: t('Word inspector'), icon: ScanSearch, comp: lazy(() => import('./components/InspectorView.vue')) }],
  strategies: [{ id: 'leaderboard', label: t('Leaderboard'), icon: Trophy, comp: lazy(() => import('./components/LeaderboardView.vue')) }, { id: 'compare', label: t('Compare'), icon: GitCompare, comp: lazy(() => import('./components/CompareView.vue')), hidden: true }, { id: 'lab', label: t('Strategy Lab'), icon: Blocks, comp: lazy(() => import('./components/LabView.vue')) }, { id: 'lookahead', label: t('Lookahead'), icon: Telescope, comp: lazy(() => import('./components/LookaheadView.vue')) }],
  explore: [{ id: 'tree', label: t('Tree'), icon: Network, comp: lazy(() => import('./components/TreeView.vue')) }, { id: 'flow', label: t('Flow'), icon: Waves, comp: lazy(() => import('./components/SankeyView.vue')) }, { id: 'map', label: t('Answer map'), icon: MapIcon, comp: lazy(() => import('./components/AnswerMapView.vue')) }],
}
const CommunityView = lazy(() => import('./components/CommunityView.vue'))
const tabs = [
  { id: 'play', label: t('Play'), icon: Gamepad2 },
  { id: 'assistant', label: t('Assistant'), icon: Brain },
  { id: 'learn', label: t('Learn'), icon: GraduationCap },
  { id: 'strategies', label: t('Strategies'), icon: FlaskConical },
  { id: 'explore', label: t('Explore'), icon: Compass },
  { id: 'community', label: t('Community'), icon: Users },
]
const loaded = ref(false); ready.then(() => (loaded.value = true))
// pre-warm: once the first view is up and the browser is idle, fetch the other views' chunks so tab switches are instant
const idle = (f: () => void) => ('requestIdleCallback' in window ? (window as any).requestIdleCallback(f, { timeout: 4000 }) : setTimeout(f, 2500))
ready.then(() => setTimeout(() => idle(() => loaders.forEach(l => l().catch(() => {}))), 1500))
const version = __APP_VERSION__, commit = __COMMIT__
const commitUrl = commit && commit !== 'dev' ? `https://github.com/Loafer19/wordle-lab/commit/${commit}` : 'https://github.com/Loafer19/wordle-lab/blob/main/CHANGELOG.md'
const built = new Date(__BUILD_DATE__).toLocaleDateString(isUA ? 'uk-UA' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
const current = computed(() => route.tab)
</script>
<template>
  <div class="max-w-6xl mx-auto px-3 sm:px-6 pb-24 sm:pb-10">
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
    <nav class="hidden sm:block sticky top-0 z-10 px-1 py-1.5 bg-bg/85 backdrop-blur border-b border-line mb-5 overflow-x-auto [scrollbar-width:none]" :aria-label="$t('Main')" data-topnav>
      <div class="flex gap-1 min-w-max">
        <a v-for="t in tabs" :key="t.id" :href="href(t.id)" :aria-current="current === t.id ? 'page' : undefined" data-tab-link :data-tab="t.id"
          class="relative flex items-center gap-2 px-3 py-2 rounded-lg text-body font-medium transition-colors duration-200"
          :class="current === t.id ? 'text-brand-700 dark:text-brand-400 bg-brand-500/10' : 'text-muted hover:text-fg hover:bg-surface-2'">
          <UiIcon :icon="t.icon" />{{ t.label }}
        </a>
      </div>
    </nav>
    <!-- phones: fixed bottom tab bar -->
    <nav class="sm:hidden fixed bottom-0 inset-x-0 z-20 bg-surface/95 backdrop-blur border-t border-line pb-[env(safe-area-inset-bottom)]" :aria-label="$t('Main')" data-bottomnav>
      <div class="grid grid-cols-6">
        <a v-for="t in tabs" :key="t.id" :href="href(t.id)" :aria-current="current === t.id ? 'page' : undefined" data-tab-link-mobile :data-tab="t.id"
          class="flex flex-col items-center gap-0.5 pt-2 pb-1.5 text-[11px] font-medium min-w-0 transition-colors" :class="current === t.id ? 'text-brand-700 dark:text-brand-400' : 'text-muted'">
          <span class="grid place-items-center h-7 w-12 rounded-full transition-colors" :class="current === t.id && 'bg-brand-500/15'"><UiIcon :icon="t.icon" /></span><span class="truncate max-w-full px-0.5">{{ t.label }}</span>
        </a>
      </div>
    </nav>
    <div v-if="!loaded" class="flex items-center gap-2 text-muted"><Sparkles class="animate-spin" :size="16" /> {{ $t('Loading {n} dictionaries…', { n: META.name }) }}</div>
    <main v-else>
      <Transition name="tab" mode="out-in">
        <PlayView v-if="current === 'play'" key="play" />
        <CommunityView v-else-if="current === 'community'" key="community" />
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
