<script setup lang="ts">
// Site footer. The default is the current pill layout; variants a–d are design candidates for issue #2,
// previewable with ?footer=a|b|c|d (e.g. https://wordle.fundsflow.fun/?footer=b#tab=play). Remove the losers once one is picked.
import { Scale, Send, Github, Tag, History, ScrollText } from 'lucide-vue-next'
import { isUA } from '../lib/lang'
const version = __APP_VERSION__, commit = __COMMIT__
const REPO = 'https://github.com/Loafer19/wordle-lab'
const releaseUrl = `${REPO}/releases/tag/v${version}`
const changelogUrl = `${REPO}/blob/main/CHANGELOG.md`
const authorUrl = 'https://t.me/Loafer19'
const commitUrl = commit && commit !== 'dev' ? `${REPO}/commit/${commit}` : changelogUrl
const built = new Date(__BUILD_DATE__).toLocaleDateString(isUA ? 'uk-UA' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
const variant = typeof location !== 'undefined' ? new URLSearchParams(location.search).get('footer') : null
const v = (['a', 'b', 'c', 'd'] as const).find(x => x === variant) ?? 'default'
const pill = 'inline-flex items-center gap-1.5 h-8 px-3 rounded-full border border-line bg-surface hover:bg-surface-2 hover:text-fg transition-colors'
const link = 'hover:text-fg underline-offset-2 hover:underline transition-colors'
const iconBtn = 'grid place-items-center h-8 w-8 rounded-full text-muted hover:text-fg hover:bg-surface-2 transition-colors focus-visible:outline-2 focus-visible:outline-brand-500'
</script>
<template>
  <!-- (a) minimal: version · GitHub -->
  <footer v-if="v === 'a'" class="mt-10 pt-6 border-t border-line flex items-center justify-center gap-2 text-caption text-muted" data-footer data-footer-variant="a">
    <a :href="releaseUrl" target="_blank" rel="noopener" class="font-mono" :class="link" v-tooltip.top="$t('Release notes')" data-version>v{{ version }}</a>
    <span aria-hidden="true">·</span>
    <a :href="REPO" target="_blank" rel="noopener" :class="link">GitHub</a>
  </footer>

  <!-- (b) version + updated date on the left, GitHub icon on the right -->
  <footer v-else-if="v === 'b'" class="mt-10 pt-6 border-t border-line flex items-center justify-between gap-3 text-caption text-muted" data-footer data-footer-variant="b">
    <span class="flex flex-wrap items-center gap-x-2 gap-y-1">
      <a :href="releaseUrl" target="_blank" rel="noopener" class="font-mono font-semibold text-brand-700 dark:text-brand-400" :class="link" v-tooltip.top="$t('Release notes')" data-version>v{{ version }}</a>
      <span aria-hidden="true">·</span>
      <a :href="commitUrl" target="_blank" rel="noopener" :class="link" v-tooltip.top="commit && commit !== 'dev' ? $t('Commit {c}', { c: commit }) : $t('Changelog')" data-updated>{{ $t('updated {d}', { d: built }) }}</a>
    </span>
    <a :href="REPO" target="_blank" rel="noopener" :class="iconBtn" :aria-label="$t('Source on GitHub')" v-tooltip.top="$t('Source on GitHub')"><Github :size="16" /></a>
  </footer>

  <!-- (c) one muted line: version (release notes) · GitHub · author, licence as fine print -->
  <footer v-else-if="v === 'c'" class="mt-10 pt-6 border-t border-line flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-caption text-muted text-center" data-footer data-footer-variant="c">
    <a :href="releaseUrl" target="_blank" rel="noopener" class="font-mono" :class="link" v-tooltip.top="$t('Release notes')" data-version>v{{ version }}</a>
    <span aria-hidden="true">·</span>
    <a :href="REPO" target="_blank" rel="noopener" :class="link">GitHub</a>
    <span aria-hidden="true">·</span>
    <a :href="authorUrl" target="_blank" rel="noopener" :class="link">@Loafer19</a>
    <span aria-hidden="true">·</span>
    <span>{{ $t('MIT · not affiliated with NYT') }}</span>
  </footer>

  <!-- (d) icon-only row: version tag (tooltip), GitHub, changelog -->
  <footer v-else-if="v === 'd'" class="mt-10 pt-4 border-t border-line flex items-center justify-center gap-1 text-muted" data-footer data-footer-variant="d">
    <a :href="releaseUrl" target="_blank" rel="noopener" :class="iconBtn" :aria-label="$t('Version {v}', { v: version })" v-tooltip.top="$t('Version {v}', { v: version })" data-version><Tag :size="16" /></a>
    <a :href="REPO" target="_blank" rel="noopener" :class="iconBtn" :aria-label="$t('Source on GitHub')" v-tooltip.top="$t('Source on GitHub')"><Github :size="16" /></a>
    <a :href="changelogUrl" target="_blank" rel="noopener" :class="iconBtn" :aria-label="$t('Changelog')" v-tooltip.top="$t('Changelog')"><ScrollText :size="16" /></a>
  </footer>

  <!-- default (current): info pills left, version + updated pills right -->
  <footer v-else class="mt-10 pt-6 border-t border-line flex flex-wrap items-center justify-between gap-3 text-caption text-muted" data-footer>
    <span class="flex flex-wrap items-center gap-2" data-footer-left>
      <span class="inline-flex items-center gap-1.5 h-8 px-3 rounded-full border border-line bg-surface"><Scale :size="13" />{{ $t('Wordle Lab · MIT · not affiliated with NYT') }}</span>
      <a :href="authorUrl" target="_blank" rel="noopener" :class="pill"><Send :size="13" class="text-brand" />{{ $t('Made by @Loafer19') }}</a>
      <a :href="REPO" target="_blank" rel="noopener" :class="pill"><Github :size="13" />{{ $t('Source on GitHub') }}</a>
    </span>
    <span class="flex flex-wrap items-center gap-2" data-footer-right>
      <a :href="releaseUrl" target="_blank" rel="noopener" :class="pill" class="font-mono font-semibold !text-brand-700 dark:!text-brand-400 !border-brand-500/30" v-tooltip.top="$t('Release notes')" data-version><Tag :size="13" />v{{ version }}</a>
      <a :href="commitUrl" target="_blank" rel="noopener" :class="pill" v-tooltip.top="commit && commit !== 'dev' ? $t('Commit {c}', { c: commit }) : $t('Changelog')" data-updated><History :size="13" />{{ $t('updated {d}', { d: built }) }}</a>
    </span>
  </footer>
</template>
