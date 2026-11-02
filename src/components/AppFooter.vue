<script setup lang="ts">
// Site footer: info pills on the left, version + updated pills on the right
import { Scale, Send, Tag, History } from 'lucide-vue-next'
import { isUA } from '../lib/lang'
const version = __APP_VERSION__, commit = __COMMIT__
const REPO = 'https://github.com/Loafer19/wordle-lab'
const releaseUrl = `${REPO}/releases/tag/v${version}`
const changelogUrl = `${REPO}/blob/main/CHANGELOG.md`
const authorUrl = 'https://t.me/Loafer19'
const commitUrl = commit && commit !== 'dev' ? `${REPO}/commit/${commit}` : changelogUrl
const built = new Date(__BUILD_DATE__).toLocaleDateString(isUA ? 'uk-UA' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
const pill = 'inline-flex items-center gap-1.5 h-8 px-3 rounded-full border border-line bg-surface hover:bg-surface-2 hover:text-fg transition-colors'
</script>
<template>
  <footer class="mt-10 pt-6 border-t border-line flex flex-wrap items-center justify-between gap-3 text-caption text-muted" data-footer>
    <span class="flex flex-wrap items-center gap-2" data-footer-left>
      <span class="inline-flex items-center gap-1.5 h-8 px-3 rounded-full border border-line bg-surface"><Scale :size="13" />{{ $t('Wordle Lab · MIT · not affiliated with NYT') }}</span>
      <a :href="authorUrl" target="_blank" rel="noopener" :class="pill"><Send :size="13" class="text-brand" />{{ $t('Made by @Loafer19') }}</a>
    </span>
    <span class="flex flex-wrap items-center gap-2" data-footer-right>
      <a :href="releaseUrl" target="_blank" rel="noopener" :class="pill" class="font-mono font-semibold !text-brand-700 dark:!text-brand-400 !border-brand-500/30" v-tooltip.top="$t('Release notes')" data-version><Tag :size="13" />v{{ version }}</a>
      <a :href="commitUrl" target="_blank" rel="noopener" :class="pill" v-tooltip.top="commit && commit !== 'dev' ? $t('Commit {c}', { c: commit }) : $t('Changelog')" data-updated><History :size="13" />{{ $t('updated {d}', { d: built }) }}</a>
    </span>
  </footer>
</template>
